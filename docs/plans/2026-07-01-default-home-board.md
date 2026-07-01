# Board mặc định làm trang chủ — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Khi user đã đăng nhập vào `/`, tự động hiển thị inline board họ hay dùng nhất (theo half-life EMA của lượt truy cập), kèm nút "Tất cả nhóm" về danh sách.

**Architecture:** Bảng mới `board_visits(userId, boardId, score, lastVisitedAt)`. Mỗi lần vào `/b/[id]` (đã qua check quyền) cập nhật `score` bằng công thức decay `score = score * 0.5^(days/14) + 1`. Trang `/` query board top hợp lệ và render bằng component dùng chung `<BoardView>` (tách từ `/b/[id]/page.tsx`). Không có board top hoặc `?all=1` → dashboard cũ.

**Tech Stack:** Next.js App Router (server components), Drizzle ORM + `@vercel/postgres`, Vitest.

**Design ref:** [docs/plans/2026-07-01-default-home-board-design.md](2026-07-01-default-home-board-design.md)

---

### Task 1: Schema `board_visits` + migration

**Files:**
- Modify: `lib/db/schema.ts` (thêm import `real`, thêm bảng ở cuối)

**Step 1: Thêm `real` vào import dòng 1**

```ts
import { pgTable, text, integer, real, timestamp, primaryKey, boolean } from "drizzle-orm/pg-core";
```

**Step 2: Thêm bảng vào cuối `lib/db/schema.ts`**

```ts
// Trong so truy cap board theo tung user (EMA co decay). Dung de chon board top len trang chu.
export const boardVisits = pgTable("board_visits", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  boardId: text("board_id").notNull().references(() => boards.id, { onDelete: "cascade" }),
  score: real("score").notNull().default(0),
  lastVisitedAt: timestamp("last_visited_at", { withTimezone: true, mode: "date" }).notNull().defaultNow()
}, (t) => ({ pk: primaryKey({ columns: [t.userId, t.boardId] }) }));
```

**Step 3: Sinh migration**

Run: `npm run db:generate`
Expected: file mới trong `drizzle/` (vd `0002_*.sql`) chứa `CREATE TABLE "board_visits"`.

**Step 4: Áp migration vào DB local**

Run: `npm run db:push`
Expected: push thành công, không lỗi.

**Step 5: Commit**

```bash
git add lib/db/schema.ts drizzle/
git commit -m "feat: them bang board_visits"
```

---

### Task 2: Hàm tính score half-life (thuần, có test)

**Files:**
- Create: `lib/domain/board-rank.ts`
- Test: `lib/domain/board-rank.test.ts`

**Step 1: Viết test trước**

```ts
import { describe, test, expect } from "vitest";
import { nextVisitScore, VISIT_HALF_LIFE_DAYS } from "./board-rank";

describe("nextVisitScore", () => {
  const base = new Date("2026-01-01T00:00:00Z");

  test("lan vao dau tien tu score 0 = 1", () => {
    expect(nextVisitScore(0, base, base)).toBeCloseTo(1, 5);
  });

  test("vao lai ngay lap tuc cong don gan +1", () => {
    expect(nextVisitScore(1, base, base)).toBeCloseTo(2, 5);
  });

  test("sau 1 half-life, phan diem cu giam con nua roi +1", () => {
    const later = new Date(base.getTime() + VISIT_HALF_LIFE_DAYS * 86_400_000);
    // 4 * 0.5 + 1 = 3
    expect(nextVisitScore(4, base, later)).toBeCloseTo(3, 5);
  });

  test("khong am neu prevAt o tuong lai (clamp days >= 0)", () => {
    const earlier = new Date(base.getTime() - 86_400_000);
    expect(nextVisitScore(2, base, earlier)).toBeCloseTo(3, 5);
  });
});
```

**Step 2: Chạy test — phải FAIL**

Run: `npx vitest run lib/domain/board-rank.test.ts`
Expected: FAIL ("Cannot find module './board-rank'" hoặc export không tồn tại).

**Step 3: Implement tối thiểu**

```ts
// lib/domain/board-rank.ts
export const VISIT_HALF_LIFE_DAYS = 14;

// EMA co decay: diem cu giam nua sau moi HALF_LIFE ngay, moi lan vao +1.
export function nextVisitScore(
  prevScore: number,
  prevAt: Date,
  now: Date,
  halfLifeDays = VISIT_HALF_LIFE_DAYS
): number {
  const days = Math.max(0, (now.getTime() - prevAt.getTime()) / 86_400_000);
  return prevScore * Math.pow(0.5, days / halfLifeDays) + 1;
}
```

**Step 4: Chạy test — phải PASS**

Run: `npx vitest run lib/domain/board-rank.test.ts`
Expected: PASS (4 tests).

**Step 5: Commit**

```bash
git add lib/domain/board-rank.ts lib/domain/board-rank.test.ts
git commit -m "feat: ham tinh score half-life cho board visit"
```

---

### Task 3: `recordBoardVisit` — ghi lượt truy cập

**Files:**
- Modify: `lib/queries.ts` (thêm export ở cuối; đảm bảo import có `boardVisits`, `and`, `eq`)

**Step 1: Đảm bảo import**

Ở đầu `lib/queries.ts` đã có `import { eq, ne, and, inArray, desc, count } from "drizzle-orm";`. Thêm `boardVisits` vào import schema, và `nextVisitScore`:

```ts
import { nextVisitScore } from "@/lib/domain/board-rank";
```
(schema đã import sẵn các bảng — thêm `boardVisits` vào danh sách import từ `@/lib/db/schema`).

**Step 2: Thêm hàm vào cuối `lib/queries.ts`**

```ts
// Ghi 1 luot truy cap board cho user (upsert co decay). Chi goi khi user da qua check quyen.
export async function recordBoardVisit(userId: string, boardId: string): Promise<void> {
  const now = new Date();
  const [row] = await db
    .select()
    .from(boardVisits)
    .where(and(eq(boardVisits.userId, userId), eq(boardVisits.boardId, boardId)))
    .limit(1);

  if (!row) {
    await db.insert(boardVisits).values({ userId, boardId, score: 1, lastVisitedAt: now });
    return;
  }

  const score = nextVisitScore(row.score, row.lastVisitedAt, now);
  await db
    .update(boardVisits)
    .set({ score, lastVisitedAt: now })
    .where(and(eq(boardVisits.userId, userId), eq(boardVisits.boardId, boardId)));
}
```

**Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: không lỗi liên quan `recordBoardVisit` / `boardVisits`.

**Step 4: Commit**

```bash
git add lib/queries.ts
git commit -m "feat: recordBoardVisit ghi luot truy cap board"
```

---

### Task 4: `getTopBoardIdForUser` — chọn board top hợp lệ

**Files:**
- Modify: `lib/queries.ts` (thêm export; import thêm `or`, `isNotNull`, `boards`, `members`, `boardVisits`)

**Step 1: Đảm bảo import drizzle-orm**

Cập nhật import: `import { eq, ne, and, or, isNotNull, inArray, desc, count } from "drizzle-orm";` (thêm `or`, `isNotNull`). `boards`, `members`, `boardVisits` lấy từ schema.

**Step 2: Thêm hàm vào cuối `lib/queries.ts`**

```ts
// Board co score cao nhat ma user van truy cap duoc (owner hoac member) va con active.
// Tra ve null neu user chua vao board nao hoac khong con board hop le.
export async function getTopBoardIdForUser(userId: string): Promise<string | null> {
  const rows = await db
    .select({ boardId: boardVisits.boardId })
    .from(boardVisits)
    .innerJoin(boards, eq(boards.id, boardVisits.boardId))
    .leftJoin(members, and(eq(members.boardId, boards.id), eq(members.userId, userId)))
    .where(
      and(
        eq(boardVisits.userId, userId),
        eq(boards.active, true),
        or(eq(boards.ownerId, userId), isNotNull(members.userId))
      )
    )
    .orderBy(desc(boardVisits.score))
    .limit(1);

  return rows[0]?.boardId ?? null;
}
```

**Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: không lỗi.

**Step 4: Commit**

```bash
git add lib/queries.ts
git commit -m "feat: getTopBoardIdForUser chon board top hop le"
```

---

### Task 5: Tách `<BoardView>` dùng chung + refactor `/b/[id]`

Mục tiêu: chuyển toàn bộ fetch + gate quyền + render board vào 1 server component, để `/` và `/b/[id]` cùng dùng. Ghi visit đặt trong BoardView (chỉ khi `recordVisit`), sau khi qua gate → không đếm truy cập trái phép, không đếm ở trang chủ.

**Files:**
- Create: `components/board-view.tsx`
- Modify: `app/b/[id]/page.tsx`

**Step 1: Tạo `components/board-view.tsx`**

Chuyển logic từ `app/b/[id]/page.tsx:13-85` vào đây, thêm props `backHref`, `backLabel`, `recordVisit`, và gọi `recordBoardVisit` sau gate:

```tsx
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getBoardData, recordBoardVisit } from "@/lib/queries";
import { roleFromMembers, canManageBooks, canManageMembers } from "@/lib/access";
import { splitSession } from "@/lib/domain/split";
import { BoardTabs } from "@/components/board-tabs";
import { BoardNameEditor } from "@/components/board-name-editor";
import { BoardStatusControl } from "@/components/board-status-control";

type BoardViewProps = {
  boardId: string;
  userId: string;
  superAdmin: boolean;
  backHref: string;
  backLabel: string;
  recordVisit: boolean;
};

export async function BoardView({
  boardId,
  userId,
  superAdmin,
  backHref,
  backLabel,
  recordVisit
}: BoardViewProps) {
  const data = await getBoardData(boardId);
  if (!data) notFound();

  const role = roleFromMembers(data.board.ownerId, data.members, userId);
  if (!role && !superAdmin) redirect(backHref);
  if (!data.board.active && role !== "leader" && !superAdmin) redirect(backHref);

  if (recordVisit) await recordBoardVisit(userId, boardId);

  const effectiveRole = superAdmin ? "leader" : role ?? "member";
  const manageBooks = canManageBooks(effectiveRole);
  const manageMembers = canManageMembers(effectiveRole);
  const canToggleActive = effectiveRole === "leader";

  const sessions = data.sessions
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((s) => {
      const { total, perHead } = splitSession({
        expenses: s.expenses.map((e) => ({ amount: e.amount })),
        attendeeIds: s.attendeeIds,
        attendeeCounts: s.attendeeCounts,
        payments: s.payments.map((p) => ({ memberId: p.memberId, amount: p.amount }))
      });
      return {
        id: s.id,
        date: s.date,
        attendeeCount: s.attendeeIds.reduce((n, id) => n + (s.attendeeCounts[id] ?? 1), 0),
        total,
        perHead
      };
    });

  const shareUrl = `/s/${data.board.shareToken}`;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <header className="flex flex-col gap-2">
        <Link
          href={backHref}
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted no-underline transition-colors duration-[var(--dur-fast)] ease-soft hover:text-accent-2"
        >
          <BackIcon />
          {backLabel}
        </Link>
        <p className="label-eyebrow">Nhóm</p>
        <BoardNameEditor boardId={data.board.id} name={data.board.name} canEdit={manageMembers} />
        {(!data.board.active || canToggleActive) && (
          <BoardStatusControl
            boardId={data.board.id}
            active={data.board.active}
            canToggle={canToggleActive}
          />
        )}
      </header>

      <BoardTabs
        boardId={data.board.id}
        shareUrl={shareUrl}
        members={data.members}
        sessions={sessions}
        balances={data.balances}
        sessionDebts={data.sessionDebts}
        photos={data.photos}
        canManageBooks={manageBooks}
        canManageMembers={manageMembers}
      />
    </main>
  );
}

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}
```

**Step 2: Rút gọn `app/b/[id]/page.tsx`**

```tsx
import { redirect } from "next/navigation";
import { getCurrentUserId, getCurrentUserEmail } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/access";
import { BoardView } from "@/components/board-view";

export const dynamic = "force-dynamic";

export default async function BoardPage({ params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/");
  const superAdmin = isSuperAdmin(await getCurrentUserEmail());

  return (
    <BoardView
      boardId={params.id}
      userId={userId}
      superAdmin={superAdmin}
      backHref="/"
      backLabel="Danh sách nhóm"
      recordVisit
    />
  );
}
```

**Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: không lỗi. `BackIcon` cũ trong page.tsx đã bị xóa cùng.

**Step 4: Manual smoke**

Run: `npm run dev`, mở 1 board `/b/<id>` — hiển thị y như cũ, nút back "Danh sách nhóm" về `/`.

**Step 5: Commit**

```bash
git add components/board-view.tsx app/b/[id]/page.tsx
git commit -m "refactor: tach BoardView dung chung, ghi visit khi vao board"
```

---

### Task 6: Trang `/` render board top inline

**Files:**
- Modify: `app/page.tsx`

**Step 1: Cập nhật signature + logic nhánh đã login**

Thêm import và đọc `searchParams`; trước phần dashboard, chèn nhánh board top:

```tsx
import { getTopBoardIdForUser } from "@/lib/queries";
import { BoardView } from "@/components/board-view";
// ...các import cũ giữ nguyên...

export default async function Home({
  searchParams
}: {
  searchParams: { all?: string };
}) {
  let userId: string | null = null;
  let superAdmin = false;
  try {
    userId = await getCurrentUserId();
    superAdmin = isSuperAdmin(await getCurrentUserEmail());
  } catch {
    userId = null;
  }

  if (!userId) {
    return <HomeHero />;
  }

  // Mac dinh hien board hay dung nhat; ?all=1 de xem toan bo danh sach.
  if (!searchParams?.all) {
    const topBoardId = await getTopBoardIdForUser(userId);
    if (topBoardId) {
      return (
        <BoardView
          boardId={topBoardId}
          userId={userId}
          superAdmin={superAdmin}
          backHref="/?all=1"
          backLabel="Tất cả nhóm"
          recordVisit={false}
        />
      );
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      {/* ...dashboard cũ giữ nguyên... */}
    </main>
  );
}
```

Giữ nguyên toàn bộ JSX dashboard cũ (header "Nhóm của bạn", CreateBoardForm, BoardList, gợi ý, super admin).

**Step 2: Typecheck + build**

Run: `npx tsc --noEmit` rồi `npm run build`
Expected: không lỗi.

**Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: trang chu hien board hay dung nhat, ?all=1 xem danh sach"
```

---

### Task 7: Verification cuối

**Step 1: Chạy toàn bộ test + typecheck + build**

Run: `npx vitest run && npx tsc --noEmit && npm run build`
Expected: tất cả PASS, build thành công.

**Step 2: Manual test matrix (`npm run dev`)**

- User mới (chưa vào board nào) → `/` hiện dashboard (form tạo + danh sách). Không lỗi.
- Vào board A vài lần → về `/` → hiện board A inline, nút "Tất cả nhóm".
- Bấm "Tất cả nhóm" → `/?all=1` → hiện danh sách nhóm.
- Vào board B → về `/` → vẫn A (A score cao hơn); vào B thêm cho tới khi vượt → `/` chuyển sang B.
- Deactivate board top (nếu là leader) → `/` rớt xuống board kế hoặc dashboard, không hiện board draft.
- Chưa đăng nhập → `/` vẫn là HomeHero, `/s/[token]` không đổi.

**Step 3: Commit (nếu có chỉnh)**

```bash
git add -A
git commit -m "test: verify board mac dinh trang chu"
```

---

## Ghi chú
- **Không** đếm visit ở trang `/` (recordVisit=false) — chỉ `/b/[id]`.
- Gate quyền nằm gọn trong `BoardView`; `getTopBoardIdForUser` đã lọc active + quyền nên nhánh `/` không bao giờ redirect.
- Race hai visit đồng thời có thể lệch nhẹ score — chấp nhận được cho use case này.
