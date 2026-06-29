# Chia Tiền Thể Thao — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** App web tiếng Việt, mobile-first, giúp chia đều chi phí mỗi buổi thể thao cho người có mặt và theo dõi số nợ tích lũy, có import lịch sử từ Excel/CSV.

**Architecture:** Next.js 14 App Router. Mutations qua **Server Actions** + `revalidatePath`. Logic chia tiền là **hàm thuần** trong `lib/domain/` (test bằng vitest, không chạm DB). Dữ liệu trong Postgres qua Drizzle. Auth.js v5 (Google) với DrizzleAdapter, session DB. Mỗi board có `shareToken` cho trang public read-only.

**Tech Stack:** Next.js 14.2, TypeScript, Tailwind 3.4, Drizzle ORM 0.45 + @vercel/postgres, next-auth 5 beta, vitest, xlsx (SheetJS) cho import. Tiền lưu **số nguyên VND**.

**Quy ước chung:**
- Mọi UI string tiếng Việt. Tiền hiển thị `1.234.000đ` (`Intl.NumberFormat('vi-VN')`).
- ID = `crypto.randomUUID()` (text PK).
- Test: `npm test` (vitest run). Mỗi task TDD: viết test fail → chạy thấy fail → code → chạy pass → commit.
- Commit nhỏ, thường xuyên. Prefix: `feat:`, `test:`, `chore:`.

---

## Phase 0 — Scaffold & config

### Task 0.1: Khởi tạo Next.js + dependencies

**Files:** Create `package.json`, `next.config.mjs`, `tsconfig.json`, `postcss.config.mjs`, `.gitignore`, `.env.example`, `.env.local`

**Step 1:** Tạo `package.json`:
```json
{
  "name": "chia-tien-the-thao",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "node --env-file=.env.local node_modules/drizzle-kit/bin.cjs migrate",
    "db:push": "node --env-file=.env.local node_modules/drizzle-kit/bin.cjs push"
  },
  "dependencies": {
    "@auth/drizzle-adapter": "1.11.2",
    "@vercel/postgres": "0.10.0",
    "drizzle-orm": "0.45.2",
    "next": "14.2.30",
    "next-auth": "5.0.0-beta.31",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "xlsx": "0.18.5"
  },
  "devDependencies": {
    "@types/node": "20.14.10",
    "@types/react": "18.3.3",
    "@types/react-dom": "18.3.0",
    "autoprefixer": "10.4.19",
    "drizzle-kit": "0.31.10",
    "eslint": "8.57.0",
    "eslint-config-next": "14.2.30",
    "postcss": "8.4.39",
    "tailwindcss": "3.4.6",
    "typescript": "5.5.3",
    "vitest": "1.6.0"
  }
}
```

**Step 2:** `next.config.mjs`:
```javascript
export default {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" }
    ]
  }
};
```

**Step 3:** `tsconfig.json` (chuẩn Next + path alias `@/*`):
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Step 4:** `postcss.config.mjs`:
```javascript
export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

**Step 5:** `.gitignore`: `node_modules`, `.next`, `.env*.local`, `.DS_Store`, `*.tsbuildinfo`, `next-env.d.ts`

**Step 6:** `.env.example`:
```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
AUTH_SECRET=
AUTH_URL=http://localhost:3000
DATABASE_URL=
```
Tạo `.env.local` copy từ example (giá trị thật điền sau, không commit).

**Step 7:** `npm install`. Expected: cài xong không lỗi.

**Step 8:** Commit: `chore: scaffold next.js + config`

### Task 0.2: Vitest config

**Files:** Create `vitest.config.ts`

**Step 1:** `vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";
import { resolve } from "node:path";
export default defineConfig({
  test: { environment: "node", include: ["**/*.test.ts"] },
  resolve: { alias: { "@": resolve(__dirname, ".") } }
});
```

**Step 2:** Tạo `lib/domain/smoke.test.ts` với `test("vitest works", () => expect(1).toBe(1))`. Run `npm test`. Expected: PASS. Xoá file.

**Step 3:** Commit: `chore: add vitest`

---

## Phase 1 — Design tokens & layout (style thể thao)

### Task 1.1: Tailwind + globals + fonts

**Files:** Create `tailwind.config.ts`, `app/globals.css`, `app/layout.tsx`

**Step 1:** `tailwind.config.ts` — map token → CSS vars:
```typescript
import type { Config } from "tailwindcss";
const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)", surface: "var(--surface)", ink: "var(--fg)",
        muted: "var(--fg-muted)", accent: "var(--accent)", "accent-2": "var(--accent-2)",
        money: "var(--money)", "on-accent": "var(--on-accent)", line: "var(--border)",
        ok: "var(--ok)", danger: "var(--danger)"
      },
      fontFamily: { sans: ["var(--font-inter)", "system-ui", "sans-serif"] },
      borderRadius: { sm: "var(--radius-sm)", md: "var(--radius-md)", lg: "var(--radius-lg)" },
      boxShadow: { card: "var(--shadow-card)" },
      transitionTimingFunction: { soft: "var(--ease)" }
    }
  },
  plugins: []
};
export default config;
```

**Step 2:** `app/globals.css` — tông thể thao (teal + cam cho tiền, nền sáng sạch):
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg: #f4f7f6; --surface: #ffffff; --fg: #0f1f1c; --fg-muted: #5b6b67;
  --accent: #0d9488;            /* teal */
  --accent-2: #0b7d73;
  --money: #ea580c;             /* cam cho số tiền */
  --on-accent: #ffffff;
  --border: #e2e8e6;
  --ok: #15803d; --danger: #b91c1c;
  --shadow-card: 0 10px 30px -18px rgba(13, 148, 136, 0.45);
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px; --space-5: 24px; --space-6: 40px;
  --radius-sm: 10px; --radius-md: 16px; --radius-lg: 24px;
  --ease: cubic-bezier(0.22, 1, 0.36, 1); --dur-fast: 160ms; --dur-base: 280ms;
}
.dark {
  --bg: #0c1413; --surface: #131e1c; --fg: #e6f0ee; --fg-muted: #9bb0ab;
  --accent: #2dd4bf; --accent-2: #5eead4; --money: #fb923c; --on-accent: #06201d;
  --border: #243531; --ok: #4ade80; --danger: #f87171;
  --shadow-card: 0 10px 30px -18px rgba(0,0,0,0.6);
}
@layer base {
  * { border-color: var(--border); }
  body {
    min-height: 100vh; background: var(--bg); color: var(--fg);
    font-family: var(--font-inter), system-ui, sans-serif; font-size: 16px; line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }
  h1, h2, h3 { font-weight: 700; line-height: 1.2; color: var(--fg); }
  a { color: var(--accent-2); }
  :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  .num { font-variant-numeric: tabular-nums; }      /* cột tiền thẳng hàng */
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition-duration: .001ms !important; animation-duration: .001ms !important; }
}
```

**Step 3:** `app/layout.tsx`:
```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Chia Tiền Thể Thao",
  description: "Chia đều chi phí mỗi buổi và theo dõi số nợ"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
```

**Step 4:** Tạo tạm `app/page.tsx` trả `<main className="p-6"><h1>Chia Tiền Thể Thao</h1></main>`. Run `npm run dev`, mở localhost:3000. Expected: trang hiện, font + nền teal nhạt OK.

**Step 5:** Commit: `feat: design tokens + layout tông thể thao`

---

## Phase 2 — Lõi domain: chia tiền & số dư (TDD)

> Đây là phần quan trọng nhất. Hàm thuần, không chạm DB/React.

### Task 2.1: Format & làm tròn tiền

**Files:** Create `lib/domain/money.ts`, Test `lib/domain/money.test.ts`

**Step 1:** Viết test fail `lib/domain/money.test.ts`:
```typescript
import { describe, test, expect } from "vitest";
import { roundTo1000, formatVnd } from "./money";

describe("roundTo1000", () => {
  test("làm tròn tới nghìn", () => {
    expect(roundTo1000(33333)).toBe(33000);
    expect(roundTo1000(33500)).toBe(34000);
    expect(roundTo1000(100000)).toBe(100000);
  });
});
describe("formatVnd", () => {
  test("định dạng VN có hậu tố đ", () => {
    expect(formatVnd(1234000)).toBe("1.234.000đ");
    expect(formatVnd(0)).toBe("0đ");
  });
});
```

**Step 2:** Run `npm test`. Expected: FAIL (module chưa có).

**Step 3:** `lib/domain/money.ts`:
```typescript
export function roundTo1000(n: number): number {
  return Math.round(n / 1000) * 1000;
}
export function formatVnd(n: number): string {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}
```

**Step 4:** Run `npm test`. Expected: PASS.

**Step 5:** Commit: `feat: money helpers + tests`

### Task 2.2: Chia 1 buổi

**Files:** Create `lib/domain/split.ts`, Test `lib/domain/split.test.ts`

Định nghĩa kiểu:
```typescript
export interface SessionInput {
  expenses: { amount: number }[];      // các khoản chi
  attendeeIds: string[];               // người có mặt
  payments: { memberId: string; amount: number }[]; // ai ứng tiền
}
export interface SessionResult {
  total: number;
  perHead: number;                     // mỗi người gánh (đã làm tròn)
  shares: Record<string, number>;      // memberId -> phần phải gánh
  paid: Record<string, number>;        // memberId -> đã ứng
  net: Record<string, number>;         // share - paid (dương = nợ)
}
```

**Quy tắc:** `total = Σ expense`. `perHead = roundTo1000(total / n)`. Tổng share phải bằng `total` để sổ cân — phần lệch `total - perHead*n` **dồn vào người ứng tiền** (nếu người ứng có mặt; nếu không, dồn vào attendee đầu tiên). `net = share - paid`. Tổng net toàn buổi = 0.

**Step 1:** Viết test fail:
```typescript
import { describe, test, expect } from "vitest";
import { splitSession } from "./split";

describe("splitSession", () => {
  test("chia đều khít", () => {
    const r = splitSession({
      expenses: [{ amount: 200000 }, { amount: 100000 }],
      attendeeIds: ["a", "b", "c"],
      payments: [{ memberId: "a", amount: 300000 }]
    });
    expect(r.total).toBe(300000);
    expect(r.perHead).toBe(100000);
    expect(r.shares).toEqual({ a: 100000, b: 100000, c: 100000 });
    expect(r.net).toEqual({ a: -200000, b: 100000, c: 100000 });
    expect(Object.values(r.net).reduce((s, x) => s + x, 0)).toBe(0);
  });

  test("lẻ dồn vào người ứng", () => {
    const r = splitSession({
      expenses: [{ amount: 100000 }],
      attendeeIds: ["a", "b", "c"],
      payments: [{ memberId: "a", amount: 100000 }]
    });
    expect(r.perHead).toBe(33000);
    // 100000 - 33000*3 = 1000 dồn vào a
    expect(r.shares).toEqual({ a: 34000, b: 33000, c: 33000 });
    expect(Object.values(r.shares).reduce((s, x) => s + x, 0)).toBe(100000);
    expect(r.net.a).toBe(34000 - 100000);
    expect(Object.values(r.net).reduce((s, x) => s + x, 0)).toBe(0);
  });

  test("người ứng không có mặt -> lẻ dồn attendee đầu", () => {
    const r = splitSession({
      expenses: [{ amount: 100000 }],
      attendeeIds: ["b", "c"],
      payments: [{ memberId: "a", amount: 100000 }]
    });
    expect(r.shares.b).toBe(50000);
    expect(r.shares.c).toBe(50000);
    expect(r.net.a).toBe(-100000);
  });

  test("không có người tham gia -> perHead 0, không chia", () => {
    const r = splitSession({ expenses: [{ amount: 100000 }], attendeeIds: [], payments: [] });
    expect(r.perHead).toBe(0);
    expect(r.shares).toEqual({});
  });
});
```

**Step 2:** Run `npm test`. Expected: FAIL.

**Step 3:** `lib/domain/split.ts`:
```typescript
import { roundTo1000 } from "./money";

export interface SessionInput {
  expenses: { amount: number }[];
  attendeeIds: string[];
  payments: { memberId: string; amount: number }[];
}
export interface SessionResult {
  total: number; perHead: number;
  shares: Record<string, number>;
  paid: Record<string, number>;
  net: Record<string, number>;
}

export function splitSession(input: SessionInput): SessionResult {
  const total = input.expenses.reduce((s, e) => s + e.amount, 0);
  const n = input.attendeeIds.length;
  const paid: Record<string, number> = {};
  for (const p of input.payments) paid[p.memberId] = (paid[p.memberId] ?? 0) + p.amount;

  if (n === 0) return { total, perHead: 0, shares: {}, paid, net: { ...paid && {} } as Record<string, number>, };

  const perHead = roundTo1000(total / n);
  const shares: Record<string, number> = {};
  for (const id of input.attendeeIds) shares[id] = perHead;

  const remainder = total - perHead * n;
  const payerIds = input.payments.map((p) => p.memberId);
  const bearer = payerIds.find((id) => input.attendeeIds.includes(id)) ?? input.attendeeIds[0];
  shares[bearer] += remainder;

  const net: Record<string, number> = {};
  const everyone = new Set([...input.attendeeIds, ...Object.keys(paid)]);
  for (const id of everyone) net[id] = (shares[id] ?? 0) - (paid[id] ?? 0);

  return { total, perHead, shares, paid, net };
}
```
> Lưu ý: với `n === 0`, trả `net = {}` (chỉnh lại nhánh early-return cho đúng test: `net: {}`). Sửa dòng early-return thành `return { total, perHead: 0, shares: {}, paid, net: {} };`

**Step 4:** Run `npm test`. Expected: PASS (sửa early-return nếu fail).

**Step 5:** Commit: `feat: splitSession + tests`

### Task 2.3: Số dư tích lũy qua nhiều buổi + settlement

**Files:** Modify `lib/domain/split.ts`, Test `lib/domain/balance.test.ts`

**Quy ước:** `balance(member) = Σ net mỗi buổi − Σ settlement đã trả`. Dương = còn nợ.

**Step 1:** Viết test fail `lib/domain/balance.test.ts`:
```typescript
import { describe, test, expect } from "vitest";
import { computeBalances } from "./split";

describe("computeBalances", () => {
  test("cộng dồn nhiều buổi", () => {
    const sessions = [
      { expenses: [{ amount: 300000 }], attendeeIds: ["a", "b", "c"], payments: [{ memberId: "a", amount: 300000 }] },
      { expenses: [{ amount: 200000 }], attendeeIds: ["a", "b"], payments: [{ memberId: "b", amount: 200000 }] }
    ];
    const bal = computeBalances(sessions, []);
    // buổi1: a -200k, b +100k, c +100k ; buổi2: a +100k, b -100k
    expect(bal.a).toBe(-100000);
    expect(bal.b).toBe(0);
    expect(bal.c).toBe(100000);
  });

  test("settlement giảm nợ", () => {
    const sessions = [
      { expenses: [{ amount: 300000 }], attendeeIds: ["a", "b", "c"], payments: [{ memberId: "a", amount: 300000 }] }
    ];
    const bal = computeBalances(sessions, [{ memberId: "c", amount: 100000 }]);
    expect(bal.c).toBe(0);        // c đã trả 100k
    expect(bal.a).toBe(-200000);
  });
});
```

**Step 2:** Run `npm test`. Expected: FAIL.

**Step 3:** Thêm vào `lib/domain/split.ts`:
```typescript
export function computeBalances(
  sessions: SessionInput[],
  settlements: { memberId: string; amount: number }[]
): Record<string, number> {
  const bal: Record<string, number> = {};
  for (const s of sessions) {
    const r = splitSession(s);
    for (const [id, v] of Object.entries(r.net)) bal[id] = (bal[id] ?? 0) + v;
  }
  for (const st of settlements) bal[st.memberId] = (bal[st.memberId] ?? 0) - st.amount;
  return bal;
}
```

**Step 4:** Run `npm test`. Expected: PASS.

**Step 5:** Commit: `feat: computeBalances + tests`

---

## Phase 3 — Database (Drizzle + Postgres)

### Task 3.1: Schema

**Files:** Create `lib/db/schema.ts`, `drizzle.config.ts`

**Step 1:** `lib/db/schema.ts` — Auth.js tables + domain tables:
```typescript
import { pgTable, text, integer, timestamp, primaryKey, boolean } from "drizzle-orm/pg-core";

const uuid = () => text("id").primaryKey().$defaultFn(() => crypto.randomUUID());

// --- Auth.js ---
export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"), email: text("email").unique(), emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image")
});
export const accounts = pgTable("accounts", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"), access_token: text("access_token"),
  expires_at: integer("expires_at"), token_type: text("token_type"), scope: text("scope"),
  id_token: text("id_token"), session_state: text("session_state")
}, (t) => ({ pk: primaryKey({ columns: [t.provider, t.providerAccountId] }) }));
export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull()
});
export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(), token: text("token").notNull(),
  expires: timestamp("expires", { mode: "date" }).notNull()
}, (t) => ({ pk: primaryKey({ columns: [t.identifier, t.token] }) }));

// --- Domain ---
export const boards = pgTable("boards", {
  id: uuid(),
  ownerId: text("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  shareToken: text("share_token").notNull().$defaultFn(() => crypto.randomUUID()),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow()
});
export const members = pgTable("members", {
  id: uuid(),
  boardId: text("board_id").notNull().references(() => boards.id, { onDelete: "cascade" }),
  name: text("name").notNull()
});
export const gameSessions = pgTable("game_sessions", {
  id: uuid(),
  boardId: text("board_id").notNull().references(() => boards.id, { onDelete: "cascade" }),
  date: text("date").notNull(),            // YYYY-MM-DD
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow()
});
export const expenses = pgTable("expenses", {
  id: uuid(),
  sessionId: text("session_id").notNull().references(() => gameSessions.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  amount: integer("amount").notNull()      // VND nguyên
});
export const attendees = pgTable("attendees", {
  sessionId: text("session_id").notNull().references(() => gameSessions.id, { onDelete: "cascade" }),
  memberId: text("member_id").notNull().references(() => members.id, { onDelete: "cascade" })
}, (t) => ({ pk: primaryKey({ columns: [t.sessionId, t.memberId] }) }));
export const payments = pgTable("payments", {
  id: uuid(),
  sessionId: text("session_id").notNull().references(() => gameSessions.id, { onDelete: "cascade" }),
  memberId: text("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull()
});
export const settlements = pgTable("settlements", {
  id: uuid(),
  boardId: text("board_id").notNull().references(() => boards.id, { onDelete: "cascade" }),
  memberId: text("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  date: text("date").notNull(),
  note: text("note")
});
```

**Step 2:** `drizzle.config.ts`:
```typescript
import type { Config } from "drizzle-kit";
export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! }
} satisfies Config;
```

**Step 3:** `npm run db:generate`. Expected: tạo SQL trong `drizzle/`.

**Step 4:** Commit: `feat: drizzle schema`

### Task 3.2: DB client

**Files:** Create `lib/db/index.ts`

**Step 1:**
```typescript
import { sql } from "@vercel/postgres";
import { drizzle } from "drizzle-orm/vercel-postgres";
import * as schema from "./schema";

if (process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
  process.env.POSTGRES_URL = process.env.DATABASE_URL;
}
const globalForDb = globalThis as unknown as { __db?: ReturnType<typeof drizzle> };
export const db = globalForDb.__db ?? drizzle(sql, { schema });
if (process.env.NODE_ENV !== "production") globalForDb.__db = db;
```

**Step 2:** (Cần DATABASE_URL thật) `npm run db:push`. Expected: tạo bảng trên Postgres. Nếu chưa có DB, ghi chú lại và làm sau.

**Step 3:** Commit: `feat: db client`

---

## Phase 4 — Auth.js (Google)

### Task 4.1: Cấu hình auth

**Files:** Create `lib/auth.ts`, `app/api/auth/[...nextauth]/route.ts`, `middleware.ts`

**Step 1:** `lib/auth.ts`:
```typescript
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { users, accounts, sessions, verificationTokens } from "@/lib/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users, accountsTable: accounts,
    sessionsTable: sessions, verificationTokensTable: verificationTokens
  }),
  session: { strategy: "database", maxAge: 30 * 24 * 60 * 60 },
  providers: [Google({
    clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    authorization: { params: { scope: "openid email profile" } }
  })]
});

export class UnauthorizedError extends Error {}
export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}
export async function requireUserId(): Promise<string> {
  const id = await getCurrentUserId();
  if (!id) throw new UnauthorizedError("Chưa đăng nhập");
  return id;
}
```

**Step 2:** `app/api/auth/[...nextauth]/route.ts`:
```typescript
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

**Step 3:** `middleware.ts` — bảo vệ route app (trừ trang share & auth):
```typescript
export { auth as middleware } from "@/lib/auth";
export const config = { matcher: ["/((?!api/auth|s/|_next|favicon.ico).*)"] };
```

**Step 4:** Tạo `AUTH_SECRET` (`npx auth secret` hoặc `openssl rand -base64 32`) vào `.env.local`. Cấu hình Google OAuth client (redirect `http://localhost:3000/api/auth/callback/google`).

**Step 5:** `npm run dev`, thử `/api/auth/signin`. Expected: nút đăng nhập Google. (Bỏ qua nếu chưa có OAuth creds, làm khi deploy.)

**Step 6:** Commit: `feat: auth.js google`

### Task 4.2: Login button + header

**Files:** Create `components/auth-buttons.tsx`

**Step 1:** Server actions wrap signIn/signOut + nút. `components/auth-buttons.tsx`:
```typescript
import { signIn, signOut, auth } from "@/lib/auth";

export async function AuthButtons() {
  const session = await auth();
  if (!session?.user) {
    return (
      <form action={async () => { "use server"; await signIn("google", { redirectTo: "/" }); }}>
        <button className="rounded-md bg-accent px-4 py-2 text-on-accent">Đăng nhập với Google</button>
      </form>
    );
  }
  return (
    <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
      <span className="mr-3 text-muted">{session.user.name}</span>
      <button className="rounded-md border border-line px-3 py-1.5">Đăng xuất</button>
    </form>
  );
}
```

**Step 2:** `npm run typecheck`. Expected: PASS.

**Step 3:** Commit: `feat: auth buttons`

---

## Phase 5 — Server actions (CRUD)

> Mỗi file actions bắt đầu `"use server"`, validate input, gọi Drizzle, `revalidatePath`. Mọi action gọi `requireUserId()` và kiểm tra board thuộc về user (trừ trang share).

### Task 5.1: Board actions

**Files:** Create `lib/actions/boards.ts`, Test `lib/actions/boards.guard.test.ts` (test pure guard tách riêng)

**Step 1:** Tách hàm thuần kiểm quyền vào `lib/domain/guard.ts` + test:
```typescript
// lib/domain/guard.ts
export function assertOwner(board: { ownerId: string } | undefined, userId: string): asserts board {
  if (!board) throw new Error("Không tìm thấy board");
  if (board.ownerId !== userId) throw new Error("Không có quyền");
}
```
Test `lib/domain/guard.test.ts`: throw khi khác owner / khi undefined; pass khi đúng. Run → FAIL → code (trên) → PASS.

**Step 2:** `lib/actions/boards.ts`:
```typescript
"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { boards } from "@/lib/db/schema";
import { requireUserId } from "@/lib/auth";
import { assertOwner } from "@/lib/domain/guard";

export async function createBoard(name: string) {
  const userId = await requireUserId();
  const clean = name.trim();
  if (!clean) throw new Error("Tên board trống");
  const [b] = await db.insert(boards).values({ ownerId: userId, name: clean }).returning();
  revalidatePath("/");
  return b;
}
export async function renameBoard(boardId: string, name: string) {
  const userId = await requireUserId();
  const b = await db.query.boards.findFirst({ where: eq(boards.id, boardId) });
  assertOwner(b, userId);
  await db.update(boards).set({ name: name.trim() }).where(eq(boards.id, boardId));
  revalidatePath(`/b/${boardId}`);
}
export async function deleteBoard(boardId: string) {
  const userId = await requireUserId();
  const b = await db.query.boards.findFirst({ where: eq(boards.id, boardId) });
  assertOwner(b, userId);
  await db.delete(boards).where(eq(boards.id, boardId));
  revalidatePath("/");
}
```
> Lưu ý: cần khai báo `relations`/`query` — dùng `db.query` yêu cầu truyền schema vào drizzle (đã làm ở Task 3.2). Nếu `db.query.boards` chưa hoạt động, thay bằng `db.select().from(boards).where(eq(boards.id, boardId))`.

**Step 3:** `npm run typecheck`. Expected: PASS.

**Step 4:** Commit: `feat: board actions + guard tests`

### Task 5.2: Member actions

**Files:** Create `lib/actions/members.ts`

`addMember(boardId, name)`, `renameMember(memberId, name)`, `removeMember(memberId)`. Mỗi hàm: requireUserId, load board qua member→board, assertOwner, mutate, `revalidatePath(/b/{boardId})`. Validate tên không trống, không trùng (case-insensitive) trong board. `npm run typecheck` → PASS. Commit: `feat: member actions`.

### Task 5.3: Session actions

**Files:** Create `lib/actions/sessions.ts`

`createSession(boardId, { date, note, attendeeIds, expenses: [{label, amount}], payments: [{memberId, amount}] })`:
- requireUserId + assertOwner(board).
- Validate: date dạng YYYY-MM-DD, ít nhất 1 attendee, amount > 0 nguyên, payments.memberId ∈ members.
- Trong 1 transaction (`db.transaction`): insert gameSessions → expenses → attendees → payments.
- `revalidatePath(/b/{boardId})`.

`updateSession(sessionId, data)` (xoá con + insert lại cho đơn giản), `deleteSession(sessionId)`.
`npm run typecheck` → PASS. Commit: `feat: session actions`.

### Task 5.4: Settlement actions

**Files:** Create `lib/actions/settlements.ts`

`addSettlement(boardId, memberId, amount, date, note?)`, `removeSettlement(id)`. requireUserId + assertOwner. `revalidatePath`. Commit: `feat: settlement actions`.

### Task 5.5: Query helpers (đọc dữ liệu board)

**Files:** Create `lib/queries.ts`

`getBoardsByOwner(userId)`, `getBoardData(boardId)` → trả board + members + sessions (kèm expenses/attendees/payments) + settlements, đóng gói thành `SessionInput[]` để feed `computeBalances`. `getBoardByShareToken(token)` (không cần auth). Commit: `feat: query helpers`.

---

## Phase 6 — UI màn hình (tiếng Việt, mobile-first)

> Mỗi task: tạo page/component, `npm run typecheck` PASS, mở dev xem, commit. Dùng class Tailwind token (`bg-surface`, `text-money`, `.num`, `rounded-md`, `shadow-card`).

### Task 6.1: Trang chủ — danh sách board
**Files:** `app/page.tsx`, `components/board-list.tsx`, `components/create-board-form.tsx`
Server component: nếu chưa login → hiện `<AuthButtons/>` + mô tả. Nếu login → list board (link `/b/{id}`) + form tạo board (client, gọi `createBoard`). Commit: `feat: trang chủ + tạo board`.

### Task 6.2: Chi tiết board — tab Buổi & Số dư
**Files:** `app/b/[id]/page.tsx`, `components/session-list.tsx`, `components/balance-table.tsx`, `components/board-tabs.tsx`
- Load `getBoardData`, verify owner (redirect nếu không).
- Tab *Buổi*: mỗi dòng ngày, tổng (`text-money .num`), số người, mỗi người Xđ. Nút "Thêm buổi".
- Tab *Số dư*: bảng member + số dư (dương đỏ "còn nợ", âm xanh "được nhận"), nút "Đánh dấu đã trả" (mở form settlement).
- Nút "Chia sẻ" copy link `/s/{shareToken}`. Nút "Thành viên", "Nhập từ Excel".
Commit: `feat: trang chi tiết board`.

### Task 6.3: Form tạo/sửa buổi (màn quan trọng nhất)
**Files:** `app/b/[id]/buoi/page.tsx` (hoặc modal), `components/session-form.tsx` (client)
- Chọn ngày (mặc định hôm nay). Danh sách member dạng chip tick chọn người có mặt (mặc định tick hết).
- Khoản chi: list dòng (label + tiền), nút preset nhanh "Sân/Cầu/Nước" thêm dòng sẵn label. Nhập tiền dạng số, hiển thị format.
- Người ứng: chọn member + số tiền (mặc định 1 người ứng = tổng).
- Hiển thị **live** "Mỗi người: Xđ" tính bằng `splitSession` ngay client.
- Submit gọi `createSession`. Validate phía client + server.
Commit: `feat: form tạo buổi`.

### Task 6.4: Trang thành viên
**Files:** `app/b/[id]/thanh-vien/page.tsx`, `components/member-manager.tsx`
List + thêm/sửa/xoá tên (gọi member actions). Cảnh báo khi xoá member đã có trong buổi. Commit: `feat: trang thành viên`.

---

## Phase 7 — Trang chia sẻ (public read-only)

### Task 7.1: `/s/[token]`
**Files:** `app/s/[token]/page.tsx`
- `getBoardByShareToken(token)`; nếu không có → 404 tiếng Việt.
- Hiển thị tên board, bảng số dư hiện tại (read-only), lịch sử buổi rút gọn. Không nút sửa, không cần login.
- `export const dynamic = "force-dynamic"`.
Commit: `feat: trang chia sẻ read-only`.

---

## Phase 8 — Import lịch sử Excel/CSV (phương án A)

### Task 8.1: Parser thuần (TDD)
**Files:** Create `lib/domain/import-parse.ts`, Test `lib/domain/import-parse.test.ts`
Hàm `parseRows(rows: RawRow[])` nhận mảng object `{ "ngày", "khoản", "số tiền", "người ứng", "người tham gia" }` (đã đọc từ sheet) → trả `{ sessions: ParsedSession[], errors: { row: number, message: string }[] }`:
- Gom theo `ngày` thành buổi.
- Tách "người tham gia" theo dấu phẩy → trim → unique. Tên người ứng phải nằm trong danh sách tham gia hoặc tạo mới.
- Validate: ngày đúng YYYY-MM-DD; số tiền là số nguyên dương (loại bỏ dấu `.`/`đ`); thiếu cột → lỗi dòng.
- Trả về danh sách tên member duy nhất để tạo.

**Step 1:** Viết test fail: 2 dòng cùng ngày → 1 buổi 2 khoản; dòng thiếu số tiền → 1 error; tiền "200.000đ" → 200000.
**Step 2:** Run → FAIL. **Step 3:** code. **Step 4:** Run → PASS. **Step 5:** Commit `feat: import parser + tests`.

### Task 8.2: Đọc file (xlsx/csv) → rows
**Files:** Create `lib/import-read.ts`
Dùng `xlsx`: `XLSX.read(buf)` → `XLSX.utils.sheet_to_json(sheet, { defval: "" })`. CSV cũng đọc qua `xlsx` (hỗ trợ sẵn). Trả `RawRow[]`. Commit: `feat: đọc file import`.

### Task 8.3: Nút "Tải file mẫu"
**Files:** Create `public/templates/mau-nhap-lieu.csv`, `components/download-template.tsx`
- `public/templates/mau-nhap-lieu.csv` nội dung mẫu:
  ```
  ngày,khoản,số tiền,người ứng,người tham gia
  2026-06-20,Sân,200000,Tuấn,"Tuấn, Nam, Hùng"
  2026-06-20,Cầu,120000,Tuấn,"Tuấn, Nam, Hùng"
  ```
- `download-template.tsx` (client): nút "Tải file mẫu (CSV)" link tới file tĩnh; nút "Tải file mẫu (Excel)" sinh `.xlsx` ngay client bằng `XLSX.utils.json_to_sheet` rồi `XLSX.writeFile`.
Commit: `feat: nút tải file mẫu`.

### Task 8.4: Trang import + preview + xác nhận
**Files:** `app/b/[id]/import/page.tsx`, `components/import-wizard.tsx` (client), `lib/actions/import.ts`
- Upload file → đọc client bằng `import-read` → `parseRows` → hiển thị **preview**: bảng các buổi sẽ tạo + danh sách member mới + bảng lỗi (đỏ).
- Nút "Xác nhận nhập" (disabled nếu có lỗi) gọi server action `importSessions(boardId, parsed)`: tạo member còn thiếu, tạo từng buổi (tái dùng logic create). Transaction.
- Báo "Đã nhập N buổi".
Commit: `feat: wizard import + xác nhận`.

---

## Phase 9 — Hoàn thiện

### Task 9.1: Dark mode toggle (tùy chọn, nếu còn thời gian)
Nút toggle thêm/bỏ class `.dark` trên `<html>` + lưu localStorage. Commit: `feat: dark mode`.

### Task 9.2: Kiểm tra cuối
- `npm run typecheck` PASS, `npm test` PASS, `npm run build` PASS.
- Thử luồng E2E thủ công: đăng nhập → tạo board → thêm member → tạo buổi → xem số dư → đánh dấu đã trả → share link mở ẩn danh → import file mẫu.
- Commit: `chore: hoàn thiện v1`.

---

## Ghi chú triển khai
- **Tiền:** luôn số nguyên VND. Không dùng float khi lưu.
- **db.query vs db.select:** nếu `db.query.*` chưa hoạt động do thiếu `relations`, dùng `db.select().from(...)`. Có thể bổ sung `relations()` sau nếu cần join tiện hơn.
- **Bảo mật:** mọi action (trừ share) phải `requireUserId` + `assertOwner`. Trang `/s/[token]` chỉ đọc, không lộ ownerId/email.
- **Deploy:** Vercel + Vercel Postgres; set env `DATABASE_URL` (pooled), `AUTH_SECRET`, `AUTH_URL`, Google creds; chạy `db:migrate`.
