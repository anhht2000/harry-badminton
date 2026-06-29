# Thiết kế: Chia Tiền Thể Thao

**Ngày:** 2026-06-29
**Trạng thái:** Đã duyệt (brainstorming)

## 1. Mục tiêu

Thay thế quy trình Excel thủ công để chia tiền các buổi thể thao. Sau mỗi buổi,
ghi lại các khoản chi (sân, cầu, nước...), chia đều tổng cho những người **có mặt**,
theo dõi ai đã trả / còn nợ qua nhiều buổi. UI **100% tiếng Việt**, mobile-first
(dùng ngay trên điện thoại sau buổi tập).

## 2. Quyết định đã chốt

- **Multi-user:** mỗi user (login Google) sở hữu nhiều **board**; share link read-only.
- **Chia tiền:** chia đều tổng chi cho người có mặt buổi đó.
- **Thanh toán:** theo dõi đã trả / còn nợ, số dư tích lũy qua nhiều buổi (kiểu Splitwise gọn, KHÔNG tối ưu "ai chuyển ai").
- **Thành viên:** chỉ là tên do chủ board thêm (không cần account); share link để họ tự xem số nợ.
- **Stack:** giống `mon-an-clone` (Next.js 14 App Router + TypeScript + Tailwind + Drizzle/Postgres + Auth.js Google), deploy Vercel.
- **Style:** mới, tông thể thao (teal/lá năng động, nền sáng sạch, accent cam/vàng cho số tiền), tái dùng kiến trúc design-token (CSS variables + Tailwind). Font sans rõ số (tabular-nums cho cột tiền).
- **Import:** nhập lịch sử các buổi cũ qua **template chuẩn** (phương án A), có nút **"Tải file mẫu"**.
- **Làm tròn:** tới 1.000đ, phần lẻ dồn vào người ứng tiền.
- **Khoản chi:** free-form + preset nhanh (Sân / Cầu / Nước).

## 3. Mô hình dữ liệu

```
User ──< Board ──< Member
                └─< Session ──< Expense (label, amount)
                              └─< SessionAttendee (member)
                              └─< Payment (member, amount)   // ai ứng tiền buổi đó
              └─< Settlement (member, amount, date)          // member trả nợ, cấn trừ số dư

Board: { id, ownerId, name, shareToken, createdAt }
Member: { id, boardId, name }
Session: { id, boardId, date, note }
Expense: { id, sessionId, label, amount }
SessionAttendee: { sessionId, memberId }
Payment: { id, sessionId, memberId, amount }
Settlement: { id, boardId, memberId, amount, date, note }
```

## 4. Toán chia & số dư (lõi)

Quy ước: **số dư dương = còn nợ quỹ**, âm = được nhận lại.

Mỗi buổi:
- `tổng = Σ expense`
- `mỗi người = round1000(tổng / số attendee)`; phần lẻ dồn vào (các) payer.
- Ghi vào sổ từng member: `+ phần phải gánh` (nếu có mặt), `− số đã ứng` (nếu là payer).

Số dư tích lũy 1 member = `Σ(phần gánh) − Σ(đã ứng) − Σ(settlement đã trả)`.
Tổng số dư toàn board luôn = 0. Settlement = member đưa tiền → ghi giảm số dư về 0.

## 5. Màn hình (mobile-first, tiếng Việt)

1. **Trang chủ** — danh sách board của tôi + nút tạo board.
2. **Chi tiết board** — tab *Buổi* (list session: ngày, tổng, số người, mỗi người Xđ) và tab *Số dư* (bảng từng member: nợ/được nhận, nút "Đánh dấu đã trả").
3. **Tạo/sửa buổi** — chọn ngày → tick người tham gia → thêm khoản chi (preset Sân/Cầu/Nước) → chọn người ứng tiền → xem ngay "mỗi người Xđ". Màn dùng nhiều nhất, tối ưu thao tác nhanh.
4. **Thành viên** — thêm/sửa tên.
5. **Trang chia sẻ** (`/s/[shareToken]`) — read-only, không cần login: số dư hiện tại + lịch sử buổi.
6. **Import** — tải file mẫu, upload `.xlsx`/`.csv`, preview + xác nhận, báo dòng lỗi.

## 6. Import lịch sử (phương án A)

Template **long format**, mỗi dòng một khoản chi:

| ngày | khoản | số tiền | người ứng | người tham gia |
|------|-------|---------|-----------|----------------|
| 2026-06-20 | Sân | 200000 | Tuấn | Tuấn, Nam, Hùng |
| 2026-06-20 | Cầu | 120000 | Tuấn | Tuấn, Nam, Hùng |

- Nút **"Tải file mẫu"** tải template `.xlsx` và `.csv`.
- App gom theo `ngày` thành từng buổi; tự tạo member nếu tên chưa có.
- Đọc Excel bằng **SheetJS (`xlsx`)**, CSV bằng parser nhẹ.
- Bước **preview + xác nhận** trước khi ghi DB; báo rõ dòng lỗi (thiếu cột, sai định dạng tiền/ngày).

## 7. Ngoài phạm vi (YAGNI)

Tối ưu "ai chuyển ai", push notification, app native, chia theo trọng số,
multi-currency, export Excel, map cột tự do khi import (phương án B).
