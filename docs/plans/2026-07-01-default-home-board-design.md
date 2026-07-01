# Design — Board mặc định làm trang chủ (auto theo tần suất truy cập)

Ngày: 2026-07-01

## Mục tiêu
Khi user đã đăng nhập vào `/`, thay vì luôn thấy danh sách nhóm, hiển thị ngay **board họ hay dùng nhất** — xác định **tự động** theo trọng số truy cập có yếu tố gần đây (recency), không cần chọn tay. Vẫn có nút quay về danh sách tất cả nhóm.

## Quyết định đã chốt
- **Phạm vi:** per-user (mỗi người 1 board top của riêng mình).
- **Hành vi ở `/`:** giữ URL `/`, render board top **inline** ngay trên trang chủ, kèm nút "Tất cả nhóm".
- **Lưu trữ:** DB, gắn với tài khoản (không dùng localStorage).
- **Xếp hạng:** tự động theo half-life decay (EMA), không chọn tay, không cần cron.

## 1. Schema — bảng mới `board_visits`
File: [lib/db/schema.ts](../../lib/db/schema.ts)
```ts
export const boardVisits = pgTable("board_visits", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  boardId: text("board_id").notNull().references(() => boards.id, { onDelete: "cascade" }),
  score: real("score").notNull().default(0),        // EMA có decay
  lastVisitedAt: timestamp("last_visited_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
}, (t) => ({ pk: primaryKey({ columns: [t.userId, t.boardId] }) }));
```
- Khóa chính kép `(userId, boardId)` → mỗi cặp 1 dòng.
- `onDelete: cascade` cho cả user và board → xóa là tự dọn dữ liệu visit.
- Cần 1 migration Drizzle.

## 2. Ghi visit khi vào `/b/[id]`
- Thêm hàm `recordBoardVisit(userId, boardId)` (đặt ở `lib/queries.ts` hoặc `lib/actions/`).
- Gọi trong [app/b/[id]/page.tsx](../../app/b/[id]/page.tsx) **sau khi qua toàn bộ check quyền** (chỉ đếm khi user thực sự có quyền vào board; không đếm redirect/notFound).
- Chạy server-side ngay trong render (`force-dynamic`), không cần client JS.
- Trang chủ `/` **không** đếm — chỉ `/b/[id]` mới đếm.

Logic upsert half-life (`HALF_LIFE = 14` ngày):
```
row = select board_visits where (userId, boardId)
if !row:
  insert { userId, boardId, score: 1, lastVisitedAt: now }
else:
  days = (now - row.lastVisitedAt) / 86400000
  score = row.score * Math.pow(0.5, days / HALF_LIFE) + 1
  update { score, lastVisitedAt: now }
```
Tách phần tính score ra hàm thuần để unit test.

## 3. Trang `/` render board top inline
File: [app/page.tsx](../../app/page.tsx) (nhánh đã đăng nhập)
- Query board top: `board_visits` của user `ORDER BY score DESC`, lấy board đầu tiên **còn `active` và user còn quyền** (owner hoặc member). Board top không hợp lệ → xét board kế.
- **Có board top hợp lệ** → render nội dung board đó inline trên `/`, kèm nút **"Tất cả nhóm"** → `/?all=1`.
- **`/?all=1`** hoặc **chưa có visit nào** (user mới) → render dashboard cũ (CreateBoardForm + BoardList + gợi ý + admin panel nếu super admin).

### Tái sử dụng render board
- Tách phần render board trong [app/b/[id]/page.tsx](../../app/b/[id]/page.tsx) (khối `<main>` với header + `<BoardTabs>`) thành server component dùng chung `<BoardView boardId userId superAdmin />`.
- Cả `/b/[id]` và `/` cùng gọi `<BoardView>` → không copy logic split/quyền.
- Nút back trong BoardView: mặc định trỏ `/` ("Danh sách nhóm"). Khi render ở `/`, đổi nhãn thành "Tất cả nhóm" → `/?all=1` (qua prop, để không tự trỏ về chính nó).

## 4. Fallback & edge cases
- User mới chưa vào board nào → dashboard như hiện tại.
- Board top bị xóa → cascade xóa dòng visit → tự hết.
- Board top bị deactivate / user mất quyền → query lọc ra, rớt xuống board kế hoặc dashboard.
- Không đụng public share `/s/[token]` và HomeHero (chưa đăng nhập).

## 5. Testing
- **Unit** cho hàm tính score half-life (thuần):
  - 1 lần vào lần đầu = score 1.
  - Vào lại ngay (days≈0) ≈ 2.
  - Sau 14 ngày, phần điểm cũ giảm còn nửa.
- **Manual:**
  - Vào board A 3 lần, B 1 lần → `/` hiện A.
  - Bấm "Tất cả nhóm" → ra danh sách; `/?all=1` giữ ở danh sách.
  - Vào B nhiều ngày liên tục → B vượt A, `/` chuyển sang B.
