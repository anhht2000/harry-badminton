# PRD — Chia Tiền Thể Thao

Phiên bản: 0.1
Ngày: 2026-06-29
Trạng thái: Draft (dựa trên design doc đã duyệt + implementation plan)
Tác giả: Product

---

## 1. Tổng quan

### 1.1. Vấn đề

Sau mỗi buổi chơi thể thao (cầu lông, bóng đá phong trào...), nhóm thường phải chia đều
chi phí (thuê sân, mua cầu, nước...) cho những người có mặt. Hiện tại nhóm dùng Excel thủ công:
mỗi lần phải tự gõ công thức, tự cộng dồn số nợ qua nhiều buổi, dễ sai sót, khó chia sẻ cho
cả nhóm xem, và bất tiện khi thao tác ngay trên điện thoại sau buổi tập.

### 1.2. Mục tiêu sản phẩm

Xây dựng một web app tiếng Việt, mobile-first, giúp:
- Ghi lại nhanh các khoản chi của mỗi buổi và chia đều tổng cho những người có mặt.
- Theo dõi số dư (đã trả / còn nợ) của từng thành viên, tích lũy qua nhiều buổi.
- Chia sẻ tình trạng nợ cho cả nhóm qua một đường link read-only mà không cần đăng nhập.
- Nhập lại lịch sử các buổi cũ từ file Excel/CSV theo template chuẩn.

### 1.3. Phạm vi

Trong phạm vi (greenfield, v1):
- Đăng nhập bằng Google.
- Quản lý nhiều board, mỗi board thuộc về một chủ sở hữu (owner).
- Quản lý thành viên (member) dạng tên, không cần account.
- Tạo/sửa/xóa buổi: chọn ngày, người tham gia, khoản chi, người ứng tiền.
- Chia đều chi phí cho người có mặt, làm tròn tới 1.000đ.
- Bảng số dư tích lũy + đánh dấu đã trả (settlement).
- Trang chia sẻ read-only theo share link.
- Import lịch sử từ file Excel/CSV theo template chuẩn (có nút tải file mẫu), preview trước khi ghi.

Ngoài phạm vi: xem chi tiết section 9.

### 1.4. Đối tượng người dùng

- Chủ board (owner): người tổ chức/giữ quỹ của nhóm thể thao, đăng nhập Google, tạo và quản lý dữ liệu.
- Thành viên (member): người chơi trong nhóm, chỉ là một tên do chủ board thêm. Không cần đăng nhập;
  xem số nợ của mình qua share link.
- Người xem chia sẻ: bất kỳ ai có share link, xem read-only.

---

## 2. Business Goals + Success Metrics

### 2.1. Business goals

- BG1: Thay thế hoàn toàn quy trình chia tiền bằng Excel thủ công cho nhóm thể thao.
- BG2: Rút ngắn thời gian chia tiền sau mỗi buổi xuống mức "vài thao tác trên điện thoại".
- BG3: Tăng tính minh bạch về số nợ trong nhóm qua share link công khai read-only.
- BG4: Giảm sai sót tính toán nhờ logic chia tiền và cộng dồn số dư tự động.

### 2.2. Success metrics (mức cao, chi tiết KPI ở section 10)

- Một buổi mới được nhập đầy đủ trong dưới 2 phút trên điện thoại.
- Số dư toàn board luôn cân bằng về 0 (tổng các net = 0), không lệch do làm tròn.
- Người dùng có thể nhập lịch sử cũ qua import mà không cần nhập tay lại từng buổi.

---

## 3. Personas & Use cases

### 3.1. Personas

Persona A — Chủ board (Tuấn, người giữ quỹ)
- Tổ chức buổi tập hàng tuần, hay là người ứng tiền sân/cầu.
- Muốn sau buổi tập ghi nhanh ai có mặt, chi bao nhiêu, ai ứng, rồi biết mỗi người phải trả bao nhiêu.
- Cần theo dõi ai còn nợ qua nhiều tuần và đánh dấu khi có người trả tiền.

Persona B — Thành viên (Nam, người chơi)
- Không muốn cài app hay tạo tài khoản.
- Chỉ cần mở một link để biết mình đang nợ hay được nhận lại bao nhiêu.

### 3.2. Use cases chính

- UC1: Chủ board đăng nhập và tạo board mới cho nhóm.
- UC2: Chủ board thêm danh sách thành viên của nhóm.
- UC3: Chủ board tạo một buổi mới: chọn ngày, tick người tham gia, nhập khoản chi, chọn người ứng tiền.
- UC4: Chủ board xem bảng số dư tích lũy và đánh dấu một thành viên đã trả nợ.
- UC5: Chủ board chia sẻ link read-only cho cả nhóm.
- UC6: Thành viên mở share link xem số dư hiện tại và lịch sử buổi mà không cần đăng nhập.
- UC7: Chủ board import lịch sử các buổi cũ từ file Excel/CSV.

---

## 4. User Stories theo module con

Định dạng: Epic -> Story (Là [role], tôi muốn [action] để [benefit]) -> Acceptance Criteria (AC).

### Epic A — Xác thực & quản lý board

Story A1
- Là chủ board, tôi muốn đăng nhập bằng tài khoản Google để truy cập dữ liệu board của mình một cách an toàn.
- AC:
  - AC1: Trang chủ khi chưa đăng nhập hiển thị nút "Đăng nhập với Google" và mô tả ngắn về app.
  - AC2: Sau khi đăng nhập thành công, người dùng được đưa về trang chủ và thấy danh sách board của mình.
  - AC3: Có nút "Đăng xuất"; sau khi đăng xuất, không truy cập được các trang board cần đăng nhập.
  - AC4: Mọi route ứng dụng (trừ trang chia sẻ và route auth) yêu cầu đăng nhập; truy cập khi chưa đăng nhập sẽ bị chặn/redirect.

Story A2
- Là chủ board, tôi muốn tạo nhiều board để quản lý chi phí cho từng nhóm/môn riêng biệt.
- AC:
  - AC1: Trang chủ có form tạo board với trường tên.
  - AC2: Không cho tạo board khi tên trống (sau khi trim); hiển thị thông báo lỗi tiếng Việt.
  - AC3: Sau khi tạo, board mới xuất hiện trong danh sách và mở được trang chi tiết.
  - AC4: Mỗi board chỉ hiển thị cho đúng owner; user khác không thấy và không truy cập được board không thuộc về mình.

Story A3
- Là chủ board, tôi muốn đổi tên hoặc xóa board để giữ danh sách gọn gàng.
- AC:
  - AC1: Owner đổi được tên board; tên mới hiển thị ngay sau khi lưu.
  - AC2: Owner xóa được board; sau khi xóa, board biến mất khỏi danh sách.
  - AC3: Xóa board xóa luôn toàn bộ dữ liệu con (member, buổi, khoản chi, settlement) thuộc board đó.
  - AC4: Chỉ owner mới thực hiện được rename/xóa; người không phải owner bị từ chối với thông báo "Không có quyền".

### Epic B — Quản lý thành viên

Story B1
- Là chủ board, tôi muốn thêm thành viên chỉ bằng tên để không phải bắt mọi người tạo tài khoản.
- AC:
  - AC1: Trang thành viên cho phép thêm member bằng tên.
  - AC2: Không cho thêm tên trống (sau khi trim).
  - AC3: Không cho thêm tên trùng (so sánh không phân biệt hoa/thường) trong cùng một board.
  - AC4: Member mới xuất hiện ngay trong danh sách và có thể được chọn khi tạo buổi.

Story B2
- Là chủ board, tôi muốn sửa hoặc xóa tên thành viên để xử lý nhập sai hoặc người rời nhóm.
- AC:
  - AC1: Owner sửa được tên member; tên mới áp dụng ở mọi nơi hiển thị.
  - AC2: Khi xóa một member đã từng tham gia buổi, hệ thống cảnh báo trước khi xóa.
  - AC3: Chỉ owner của board chứa member mới được sửa/xóa member đó.

### Epic C — Tạo và quản lý buổi (màn dùng nhiều nhất)

Story C1
- Là chủ board, tôi muốn tạo một buổi mới bằng cách chọn ngày, tick người có mặt và nhập khoản chi để chia tiền nhanh ngay sau buổi tập.
- AC:
  - AC1: Form mặc định ngày là hôm nay và mặc định tick tất cả thành viên là có mặt.
  - AC2: Người tham gia được chọn dạng chip tick (bật/tắt từng người).
  - AC3: Có nút preset nhanh "Sân", "Cầu", "Nước" để thêm dòng khoản chi với label sẵn; ngoài ra cho phép nhập label free-form.
  - AC4: Mỗi khoản chi nhập số tiền dạng số nguyên VND; tiền hiển thị định dạng vi-VN (ví dụ 200.000đ).
  - AC5: Chọn người ứng tiền (payer) và số tiền ứng; mặc định một người ứng bằng tổng chi.
  - AC6: Form hiển thị live "Mỗi người: Xđ" cập nhật theo dữ liệu nhập, tính ngay phía client.
  - AC7: Không cho lưu buổi khi không có người tham gia nào, hoặc khi khoản chi có số tiền không hợp lệ (không phải số nguyên dương).
  - AC8: Sau khi lưu, buổi xuất hiện trong danh sách buổi của board và số dư được cập nhật.

Story C2
- Là chủ board, tôi muốn xem danh sách các buổi đã chia để theo dõi lịch sử chi tiêu của nhóm.
- AC:
  - AC1: Tab "Buổi" hiển thị mỗi dòng gồm: ngày, tổng chi, số người tham gia, mỗi người Xđ.
  - AC2: Số tiền hiển thị định dạng vi-VN và canh thẳng cột (tabular-nums).
  - AC3: Có nút "Thêm buổi" mở form tạo buổi.

Story C3
- Là chủ board, tôi muốn sửa hoặc xóa một buổi để khắc phục khi nhập sai.
- AC:
  - AC1: Owner sửa được thông tin buổi (ngày, người tham gia, khoản chi, người ứng).
  - AC2: Owner xóa được buổi; sau khi xóa, buổi biến mất và số dư được tính lại.
  - AC3: Mọi thay đổi buổi phản ánh đúng vào bảng số dư.

### Epic D — Số dư & thanh toán

Story D1
- Là chủ board, tôi muốn xem bảng số dư của từng thành viên để biết ai còn nợ và ai được nhận lại.
- AC:
  - AC1: Tab "Số dư" hiển thị bảng từng member kèm số dư tích lũy qua tất cả buổi và settlement.
  - AC2: Số dư dương hiển thị là "còn nợ" (màu cảnh báo), số dư âm hiển thị là "được nhận" (màu tích cực).
  - AC3: Tổng số dư của toàn board luôn bằng 0.
  - AC4: Số dư phản ánh đúng quy ước: balance(member) = tổng phần phải gánh − tổng đã ứng − tổng settlement đã trả.

Story D2
- Là chủ board, tôi muốn đánh dấu một thành viên đã trả nợ để cập nhật số dư của họ.
- AC:
  - AC1: Bảng số dư có nút "Đánh dấu đã trả" cho từng member, mở form nhập settlement (số tiền, ngày, ghi chú tùy chọn).
  - AC2: Sau khi ghi settlement, số dư của member giảm đúng bằng số tiền đã trả.
  - AC3: Chỉ owner mới ghi/xóa được settlement của board.
  - AC4: Theo dõi kiểu Splitwise gọn: hệ thống chỉ cấn trừ số dư tích lũy, KHÔNG gợi ý "ai chuyển cho ai".

### Epic E — Chia sẻ read-only

Story E1
- Là chủ board, tôi muốn chia sẻ một link read-only để cả nhóm tự xem số nợ mà không cần đăng nhập.
- AC:
  - AC1: Mỗi board có một share link cố định (dạng /s/[shareToken]).
  - AC2: Trang chi tiết board có nút "Chia sẻ" cho phép sao chép link.

Story E2
- Là thành viên, tôi muốn mở share link để xem số dư hiện tại và lịch sử buổi mà không cần tài khoản.
- AC:
  - AC1: Trang share hiển thị tên board, bảng số dư hiện tại và lịch sử buổi rút gọn.
  - AC2: Trang share là read-only: không có nút sửa/xóa và không yêu cầu đăng nhập.
  - AC3: Trang share không lộ thông tin nhạy cảm của owner (ví dụ email, ownerId).
  - AC4: Share token không hợp lệ trả về trang 404 với thông báo tiếng Việt.

### Epic F — Import lịch sử (Excel/CSV)

Story F1
- Là chủ board, tôi muốn tải file mẫu để biết đúng định dạng cần nhập.
- AC:
  - AC1: Trang import có nút "Tải file mẫu" cho cả định dạng CSV và Excel (.xlsx).
  - AC2: File mẫu chứa đúng các cột: ngày, khoản, số tiền, người ứng, người tham gia, kèm vài dòng ví dụ.

Story F2
- Là chủ board, tôi muốn upload file Excel/CSV theo template và xem preview trước khi ghi để tránh nhập sai dữ liệu.
- AC:
  - AC1: App đọc được file .xlsx và .csv theo template long-format (mỗi dòng một khoản chi).
  - AC2: App gom các dòng cùng ngày thành một buổi.
  - AC3: App tách "người tham gia" theo dấu phẩy, trim và loại trùng; tự tạo member mới nếu tên chưa tồn tại.
  - AC4: Preview hiển thị: danh sách buổi sẽ tạo, danh sách member mới sẽ thêm, và bảng các dòng lỗi.
  - AC5: Hệ thống báo lỗi rõ theo dòng khi: thiếu cột, ngày sai định dạng (không phải YYYY-MM-DD), hoặc số tiền không hợp lệ.
  - AC6: Số tiền dạng "200.000đ" được chuẩn hóa thành 200000.

Story F3
- Là chủ board, tôi muốn xác nhận nhập sau khi xem preview để ghi dữ liệu vào board.
- AC:
  - AC1: Nút "Xác nhận nhập" bị vô hiệu hóa khi preview còn dòng lỗi.
  - AC2: Khi xác nhận, hệ thống tạo member còn thiếu và tạo từng buổi tương ứng.
  - AC3: Sau khi nhập xong, hiển thị thông báo số buổi đã nhập (ví dụ "Đã nhập N buổi").
  - AC4: Dữ liệu nhập tuân theo cùng logic chia tiền như buổi tạo tay (chia đều, làm tròn 1.000đ).

---

## 5. Functional Requirements (high-level)

- FR1: Đăng nhập/đăng xuất bằng Google; phiên đăng nhập lưu ở DB.
- FR2: Quản lý board (tạo, đổi tên, xóa); mỗi board thuộc đúng một owner.
- FR3: Phân quyền: chỉ owner mới đọc/ghi dữ liệu board của mình; mọi thao tác ghi đều kiểm tra quyền sở hữu.
- FR4: Quản lý member theo tên trong phạm vi board; chống trùng tên (không phân biệt hoa/thường) và tên trống.
- FR5: Tạo/sửa/xóa buổi gồm: ngày, ghi chú tùy chọn, danh sách người tham gia, danh sách khoản chi (label + số tiền), danh sách người ứng tiền.
- FR6: Khoản chi hỗ trợ label free-form và preset nhanh (Sân/Cầu/Nước).
- FR7: Tính chia tiền mỗi buổi: tổng chi, mỗi người gánh (làm tròn 1.000đ), phần gánh từng người, phần lệch làm tròn dồn vào người ứng.
- FR8: Tính số dư tích lũy từng member qua nhiều buổi và trừ các settlement.
- FR9: Ghi/xóa settlement (member, số tiền, ngày, ghi chú tùy chọn) để cấn trừ số dư.
- FR10: Hiển thị trang chủ (danh sách board), trang chi tiết board (tab Buổi, tab Số dư), trang thành viên, form tạo/sửa buổi.
- FR11: Trang chia sẻ public read-only theo share token; không yêu cầu đăng nhập; không lộ dữ liệu owner.
- FR12: Import từ Excel/CSV theo template chuẩn (phương án A) với bước preview + xác nhận và báo lỗi theo dòng.
- FR13: Cung cấp nút tải file mẫu (CSV và Excel).
- FR14: Toàn bộ UI tiếng Việt; tiền hiển thị định dạng vi-VN với hậu tố đ.

---

## 6. Non-Functional Requirements

- NFR1 (Ngôn ngữ): 100% giao diện tiếng Việt; technical term có thể giữ tiếng Anh trong code, không hiển thị cho người dùng.
- NFR2 (Mobile-first): tối ưu thao tác trên điện thoại; màn tạo buổi ưu tiên thao tác nhanh, ít bước.
- NFR3 (Định dạng tiền): tiền lưu dưới dạng số nguyên VND; hiển thị theo Intl.NumberFormat vi-VN (ví dụ 1.234.000đ); cột số canh thẳng (tabular-nums).
- NFR4 (Chính xác): logic chia tiền và số dư là hàm thuần, có test tự động; tổng số dư board luôn cân bằng về 0.
- NFR5 (Bảo mật): mọi action ghi (trừ trang share) yêu cầu đăng nhập và kiểm tra quyền owner; trang share chỉ đọc và không lộ thông tin owner.
- NFR6 (Khả dụng/UX): hỗ trợ dark mode là tùy chọn; tôn trọng prefers-reduced-motion; có trạng thái focus rõ ràng.
- NFR7 (Tông thiết kế): tông thể thao (teal làm accent, cam/vàng cho số tiền, nền sáng sạch); dùng design token (CSS variables + Tailwind).
- NFR8 (Triển khai): chạy trên Vercel + Vercel Postgres.

---

## 7. Business Rules

- BR1: Quy ước số dư: dương = còn nợ quỹ, âm = được nhận lại.
- BR2: Mỗi buổi, tổng chi = tổng các khoản chi của buổi đó.
- BR3: Mỗi người gánh = round1000(tổng / số người có mặt). Làm tròn tới 1.000đ.
- BR4: Phần lệch do làm tròn (tổng − mỗi-người × số-người) được dồn vào người ứng tiền; nếu người ứng không có mặt thì dồn vào người tham gia đầu tiên. Tổng phần gánh luôn bằng tổng chi.
- BR5: Net mỗi member trong buổi = phần phải gánh − số đã ứng. Tổng net trong một buổi luôn bằng 0.
- BR6: Số dư tích lũy của một member = tổng net qua các buổi − tổng settlement đã trả. Tổng số dư toàn board luôn bằng 0.
- BR7: Settlement là việc member đưa tiền để giảm số dư về phía 0; chỉ cấn trừ số dư, không định tuyến "ai chuyển ai".
- BR8: Chỉ tính chia cho người có mặt buổi đó; người vắng không gánh chi phí buổi đó.
- BR9: Member là một tên trong phạm vi board, không gắn account; mỗi tên là duy nhất (không phân biệt hoa/thường) trong board.
- BR10: Khi không có người tham gia, buổi không hợp lệ để lưu (mỗi-người = 0, không chia).
- BR11: Import: gom theo ngày thành buổi; tên trong "người ứng" phải nằm trong "người tham gia" hoặc được tạo mới; số tiền và ngày phải đúng định dạng, ngược lại báo lỗi dòng.

---

## 8. Constraints & Assumptions

### 8.1. Constraints

- C1: Tech stack cố định theo plan: Next.js 14.2 App Router, TypeScript 5.5, Tailwind 3.4, Drizzle ORM 0.45 + @vercel/postgres, Auth.js v5 (next-auth 5 beta) với DrizzleAdapter (session DB), vitest, xlsx (SheetJS).
- C2: Deploy trên Vercel + Vercel Postgres.
- C3: Đăng nhập chỉ qua Google (không hỗ trợ provider khác ở v1).
- C4: Chỉ hỗ trợ một đơn vị tiền: VND, lưu số nguyên.
- C5: Import theo phương án A — template chuẩn cố định cột, không hỗ trợ map cột tự do.
- C6: Quy ước đặt tên: file kebab-case, function camelCase, bảng DB số nhiều, cột snake_case, ID = UUID text PK.

### 8.2. Assumptions

- A1: Mỗi nhóm có một người giữ quỹ làm chủ board; các thành viên khác không cần tài khoản.
- A2: Các buổi thường có một người ứng tiền; vẫn cho phép nhiều người ứng.
- A3: Người dùng chính thao tác trên điện thoại ngay sau buổi tập.
- A4: Dữ liệu lịch sử cũ tồn tại ở dạng Excel/CSV và có thể chuyển về template chuẩn.
- A5: Ngày buổi nhập theo định dạng YYYY-MM-DD.

---

## 9. Out of scope

Các hạng mục sau KHÔNG nằm trong v1 (theo design section 7 — YAGNI):

- O1: Tối ưu "ai chuyển cho ai" (debt simplification).
- O2: Push notification.
- O3: App native (chỉ làm web mobile-first).
- O4: Chia theo trọng số (mọi người gánh đều nhau).
- O5: Multi-currency (chỉ VND).
- O6: Export Excel.
- O7: Map cột tự do khi import (phương án B); v1 chỉ dùng template chuẩn (phương án A).

---

## 10. Success Metrics & KPIs

- KPI1 (Hiệu quả nhập liệu): thời gian tạo một buổi mới đầy đủ trên điện thoại dưới 2 phút.
- KPI2 (Chính xác): 100% board có tổng số dư bằng 0 (không lệch do làm tròn).
- KPI3 (Độ tin cậy logic): toàn bộ test domain (chia tiền, số dư, parser import) pass.
- KPI4 (Chấp nhận): chủ board hoàn thành luồng E2E (đăng nhập -> tạo board -> thêm member -> tạo buổi -> xem số dư -> đánh dấu đã trả -> mở share link ẩn danh -> import file mẫu) mà không cần hướng dẫn ngoài.
- KPI5 (Chia sẻ): thành viên xem được số dư qua share link mà không cần đăng nhập trong 1 lần mở link.
- KPI6 (Import): import file mẫu chuẩn tạo đúng số buổi và đúng member mà không phát sinh lỗi.

---

## 11. Release Plan (phase)

Phase 0 — Scaffold & config: khởi tạo Next.js, cấu hình build, vitest.

Phase 1 — Design tokens & layout: thiết lập tông thể thao, design token, layout tiếng Việt mobile-first.

Phase 2 — Lõi domain (TDD): hàm chia tiền một buổi, làm tròn, số dư tích lũy, settlement (hàm thuần, có test).

Phase 3 — Database: schema Drizzle (Auth.js tables + domain tables), DB client.

Phase 4 — Auth.js (Google): cấu hình đăng nhập, nút login/logout, bảo vệ route.

Phase 5 — Server actions (CRUD): board, member, buổi, settlement, query helpers, guard quyền owner.

Phase 6 — UI màn hình: trang chủ, chi tiết board (tab Buổi & Số dư), form tạo/sửa buổi, trang thành viên.

Phase 7 — Trang chia sẻ: trang public read-only theo share token.

Phase 8 — Import lịch sử: parser thuần (TDD), đọc file xlsx/csv, nút tải file mẫu, wizard preview + xác nhận.

Phase 9 — Hoàn thiện: dark mode (tùy chọn), kiểm tra cuối (typecheck, test, build, luồng E2E thủ công).

Cột mốc bàn giao v1: hoàn tất Phase 0-8, qua Phase 9 kiểm tra cuối.

---

## 12. Open Questions

Các điểm chưa được làm rõ trong brief (design + implementation plan), cần quyết định trước hoặc trong quá trình triển khai:

- OQ1: Có cho phép chuyển/đổi owner của board hoặc nhiều owner cùng quản lý một board không? Brief chỉ nêu một owner sở hữu nhiều board.
- OQ2: Có cơ chế thu hồi/đổi mới share token (revoke link) khi link bị lộ không? Brief chỉ nêu share link cố định read-only.
- OQ3: Có cần phân trang/giới hạn số buổi hiển thị khi board có rất nhiều buổi không? Brief không đề cập.
- OQ4: Khi xóa member đã tham gia buổi, hành vi chính xác sau cảnh báo là gì (chặn xóa, hay xóa kèm cascade các bản ghi liên quan và tính lại số dư)? Brief chỉ nêu "cảnh báo".
- OQ5: Có giới hạn kích thước/định dạng file import, hoặc số dòng tối đa không? Brief không đề cập.
- OQ6: Khi import, nếu một dòng có lỗi trong khi các dòng khác hợp lệ thì chặn toàn bộ (xác nhận disabled) hay cho nhập các dòng hợp lệ? Plan nêu nút xác nhận disabled khi còn lỗi, ngụ ý chặn toàn bộ — cần xác nhận đây là hành vi mong muốn.
- OQ7: Có cần ghi chú (note) hiển thị ở UI buổi/settlement không, hay chỉ lưu trong DB? Schema có cột note nhưng UI không nêu rõ.
- OQ8: Dark mode là bắt buộc trong v1 hay chỉ làm nếu còn thời gian? Plan đánh dấu là tùy chọn.
