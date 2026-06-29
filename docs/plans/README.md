# Chia Tiền Thể Thao

Brief module. Chi tiết xem [design doc](./2026-06-29-chia-tien-the-thao-design.md) và [implementation plan](./2026-06-29-chia-tien-the-thao-implementation.md).

## Vấn đề

Thay thế quy trình Excel thủ công để chia tiền các buổi thể thao. Sau mỗi buổi, ghi lại các khoản chi (sân, cầu, nước...), chia đều tổng cho những người có mặt, theo dõi ai đã trả / còn nợ qua nhiều buổi.

## Đối tượng

- Chủ board (login Google): tạo board, thêm member, ghi buổi, đánh dấu đã trả.
- Member: chỉ là tên do chủ board thêm (không cần account); xem số nợ qua share link.
- Người xem (ẩn danh): mở share link read-only.

## Core features

1. Multi-user: mỗi user sở hữu nhiều board; share link read-only.
2. Chia đều tổng chi cho người có mặt buổi đó; làm tròn 1.000đ, lẻ dồn người ứng.
3. Theo dõi số dư tích lũy qua nhiều buổi (kiểu Splitwise gọn, không tối ưu "ai chuyển ai").
4. Settlement: đánh dấu member đã trả, cấn trừ số dư.
5. Import lịch sử từ Excel/CSV theo template chuẩn, có nút tải file mẫu.

## Success criteria

Luồng E2E chạy được: đăng nhập → tạo board → thêm member → tạo buổi → xem số dư → đánh dấu đã trả → share link mở ẩn danh → import file mẫu.

## Constraints

- Stack: Next.js 14 App Router + TypeScript + Tailwind + Drizzle/Postgres + Auth.js Google, deploy Vercel.
- UI 100% tiếng Việt, mobile-first. Tiền lưu số nguyên VND, hiển thị `1.234.000đ`.
- Style tông thể thao (teal + cam cho số tiền), design tokens CSS variables + Tailwind.

## Out of scope (YAGNI)

Tối ưu "ai chuyển ai", push notification, app native, chia theo trọng số, multi-currency, export Excel, map cột tự do khi import (phương án B).
