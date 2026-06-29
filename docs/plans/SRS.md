# SRS — Chia Tiền Thể Thao

Phiên bản: 0.1
Ngày: 2026-06-29
Trạng thái: Draft
Tác giả: Systems Analyst
Chuẩn: IEEE 830-1998

---

## 1. Introduction

### 1.1. Purpose (Mục đích)

Tài liệu này đặc tả yêu cầu phần mềm (Software Requirements Specification) cho sản phẩm "Chia Tiền Thể Thao" phiên bản 1 (v1). Tài liệu mô tả đầy đủ các yêu cầu chức năng (functional requirements), phi chức năng (non-functional requirements), yêu cầu dữ liệu, business rules và các luồng use case, làm cơ sở cho thiết kế chi tiết, hiện thực và kiểm thử.

Đối tượng đọc: kỹ sư phát triển, kỹ sư kiểm thử (QA), product owner và bên nghiệm thu. SRS này trace mọi yêu cầu chức năng về các user story trong PRD (docs/plans/PRD.md).

Tài liệu mô tả phần mềm phải làm gì (WHAT), không đi vào chi tiết hiện thực (HOW): không chứa schema SQL, không chứa chữ ký hàm (API signature). Chi tiết hiện thực tham chiếu ở implementation plan.

### 1.2. Scope (Phạm vi)

Sản phẩm là một web app tiếng Việt, mobile-first, thay thế quy trình chia tiền bằng Excel thủ công cho nhóm thể thao phong trào (cầu lông, bóng đá...).

Trong phạm vi v1:
- Đăng nhập bằng Google; phiên đăng nhập lưu ở cơ sở dữ liệu (database session).
- Quản lý nhiều board, mỗi board thuộc về một chủ sở hữu (owner).
- Quản lý thành viên (member) dạng tên, không cần tài khoản.
- Tạo/sửa/xóa buổi (session): ngày, người tham gia, khoản chi, người ứng tiền.
- Chia đều chi phí cho người có mặt, làm tròn tới 1.000đ.
- Bảng số dư tích lũy + đánh dấu đã trả (settlement).
- Trang chia sẻ public read-only theo share token.
- Import lịch sử từ file Excel/CSV theo template chuẩn, có preview trước khi ghi.

Ngoài phạm vi v1 (tham chiếu PRD section 9): tối ưu "ai chuyển cho ai" (debt simplification), push notification, app native, chia theo trọng số, multi-currency, export Excel, map cột tự do khi import.

### 1.3. Definitions, Acronyms, Glossary (Thuật ngữ)

- Board: không gian chia tiền của một nhóm/môn, thuộc về một owner; chứa member, session, settlement.
- Owner (chủ board): user đăng nhập Google, sở hữu và quản lý một board.
- Member (thành viên): một tên người chơi trong phạm vi board, không gắn tài khoản đăng nhập.
- Session (buổi): một buổi chơi thể thao gồm ngày, danh sách người tham gia, danh sách khoản chi, danh sách người ứng tiền. Trong DB là bảng game_sessions.
- Expense (khoản chi): một dòng chi tiêu của buổi gồm label và số tiền (amount).
- Attendee (người tham gia): member có mặt trong một buổi; chỉ người có mặt mới gánh chi phí buổi đó.
- Payment (ứng tiền): khoản tiền một member ứng ra cho buổi (người trả trước).
- Settlement (thanh toán nợ): việc member đưa tiền để cấn trừ số dư về phía 0.
- Share (phần phải gánh): số tiền một member phải chịu trong một buổi.
- Net: trong một buổi, net = share − paid; net dương = còn nợ, net âm = được nhận lại.
- Balance (số dư tích lũy): tổng net qua các buổi trừ tổng settlement; dương = còn nợ quỹ, âm = được nhận lại.
- perHead (mỗi người gánh): số tiền chia đều mỗi attendee, đã làm tròn tới 1.000đ.
- Remainder (phần lệch làm tròn): phần chênh giữa tổng chi và (perHead × số attendee), dồn vào người ứng.
- Share token: chuỗi định danh ngẫu nhiên gắn với board, dùng cho trang public read-only.
- round1000: hàm làm tròn tới bội số gần nhất của 1.000.
- vi-VN: định dạng số/tiền theo locale Việt Nam (ví dụ 1.234.000đ).
- Server Action: cơ chế mutation phía server của Next.js App Router (không phải REST API).
- VND: đồng Việt Nam, lưu dưới dạng số nguyên.

### 1.4. References (Tài liệu tham chiếu)

- PRD: docs/plans/PRD.md (nguồn chính cho user story và business rule).
- Design doc: docs/plans/2026-06-29-chia-tien-the-thao-design.md.
- Implementation plan: docs/plans/2026-06-29-chia-tien-the-thao-implementation.md (quy tắc chia tiền/làm tròn chính xác).
- Chuẩn IEEE 830-1998 Recommended Practice for Software Requirements Specifications.

### 1.5. Overview (Tổng quan cấu trúc)

- Section 2 mô tả tổng quan sản phẩm: bối cảnh, chức năng, người dùng, môi trường vận hành, ràng buộc, giả định.
- Section 3 đặc tả yêu cầu chi tiết: giao diện ngoài, yêu cầu chức năng (FR), phi chức năng (NFR), dữ liệu (DR), business rules (BR), use case flows (UC).
- Section 4 là ma trận truy vết (traceability matrix) PRD user story tới FR.

---

## 2. Overall Description

### 2.1. Product Perspective (Bối cảnh sản phẩm)

Sản phẩm là một ứng dụng greenfield, độc lập, không tích hợp với hệ thống có sẵn. Kiến trúc: Next.js 14.2 App Router, mọi mutation thực hiện qua Server Actions kèm revalidatePath (không dùng REST API trừ route xác thực). Domain logic (chia tiền, số dư, parser import) là các hàm thuần (pure functions) tách biệt khỏi database và UI. Dữ liệu lưu ở Postgres qua Drizzle ORM. Xác thực qua Auth.js v5 với Google provider, session lưu ở database. Mỗi board có một share token cho trang public read-only. Triển khai trên Vercel + Vercel Postgres.

Sản phẩm thay thế quy trình thủ công bằng Excel, đóng vai trò là nguồn dữ liệu duy nhất (single source of truth) về chi phí và số dư của nhóm.

### 2.2. Product Functions (Chức năng tổng quát)

- Xác thực Google và quản lý phiên đăng nhập.
- Quản lý board (tạo, đổi tên, xóa) gắn với owner.
- Quản lý member theo tên trong phạm vi board.
- Tạo/sửa/xóa buổi với khoản chi, người tham gia, người ứng.
- Tính chia tiền mỗi buổi (chia đều, làm tròn 1.000đ, dồn lẻ vào người ứng).
- Tính số dư tích lũy qua nhiều buổi và cấn trừ settlement.
- Ghi/xóa settlement.
- Trang chia sẻ public read-only theo share token.
- Import lịch sử từ Excel/CSV với preview và xác nhận.
- Cung cấp file mẫu để tải về.

### 2.3. User Classes and Characteristics (Phân lớp người dùng)

- Chủ board (owner): người tổ chức/giữ quỹ, đăng nhập Google, có toàn quyền đọc/ghi trên board của mình. Thao tác chủ yếu trên điện thoại sau buổi tập. Cần thao tác nhanh, ít bước.
- Thành viên (member): người chơi trong nhóm, không có tài khoản. Chỉ xem số nợ của mình qua share link. Không có quyền ghi.
- Người xem chia sẻ (share viewer): bất kỳ ai có share link; xem read-only, ẩn danh, không đăng nhập.

### 2.4. Operating Environment (Môi trường vận hành)

- Phía client: trình duyệt web hiện đại trên di động và desktop (ưu tiên di động). Hỗ trợ dark mode tùy chọn, tôn trọng prefers-reduced-motion.
- Phía server: Next.js 14.2 chạy trên Vercel; Postgres (Vercel Postgres).
- Ngôn ngữ giao diện: 100% tiếng Việt.
- Phụ thuộc bên ngoài: Google OAuth (xác thực), thư viện xlsx (SheetJS) cho đọc/ghi file import.

### 2.5. Design Constraints (Ràng buộc thiết kế)

- C1: Tech stack cố định: Next.js 14.2 App Router, TypeScript, Tailwind 3.4, Drizzle ORM 0.45 + @vercel/postgres, Auth.js v5 (next-auth 5 beta) với DrizzleAdapter (session DB), vitest, xlsx.
- C2: Deploy trên Vercel + Vercel Postgres.
- C3: Đăng nhập chỉ qua Google ở v1.
- C4: Một đơn vị tiền: VND, lưu số nguyên, làm tròn tới 1.000đ.
- C5: Import theo template chuẩn cố định cột (phương án A), không map cột tự do.
- C6: Quy ước đặt tên: bảng plural snake_case (boards, members, game_sessions, expenses, attendees, payments, settlements), cột snake_case, ID = crypto.randomUUID() dạng text PK.
- C7: Mutation qua Server Actions + revalidatePath, không REST API trừ route auth.
- C8: Domain logic là hàm thuần, có test tự động (vitest).

### 2.6. Assumptions and Dependencies (Giả định và phụ thuộc)

- A1: Mỗi nhóm có một người giữ quỹ làm owner; các member khác không cần tài khoản.
- A2: Các buổi thường có một người ứng tiền, nhưng cho phép nhiều người ứng.
- A3: Người dùng chính thao tác trên điện thoại ngay sau buổi tập.
- A4: Dữ liệu lịch sử cũ tồn tại ở dạng Excel/CSV và có thể chuyển về template chuẩn.
- A5: Ngày buổi theo định dạng YYYY-MM-DD.
- A6: Hệ thống phụ thuộc dịch vụ Google OAuth khả dụng để đăng nhập.

### 2.7. Apportioning of Requirements (Phân bổ yêu cầu)

Các hạng mục sau hoãn sang phiên bản sau v1 (không hiện thực ở v1): debt simplification, push notification, app native, chia theo trọng số, multi-currency, export Excel, map cột tự do khi import. Các open question OQ1–OQ8 trong PRD cần quyết định trong quá trình triển khai; nơi cần thiết tài liệu này nêu giả định mặc định và đánh dấu Priority phù hợp.

---

## 3. Specific Requirements

### 3.1. External Interface Requirements

#### 3.1.1. User Interfaces (Giao diện người dùng)

- UI-1: Toàn bộ giao diện tiếng Việt; tiền hiển thị định dạng vi-VN với hậu tố đ (ví dụ 1.234.000đ).
- UI-2: Mobile-first; màn tạo buổi tối ưu thao tác nhanh, ít bước.
- UI-3: Các màn hình: trang chủ (danh sách board), chi tiết board (tab Buổi, tab Số dư), form tạo/sửa buổi, trang thành viên, trang import, trang chia sẻ public.
- UI-4: Cột số tiền canh thẳng (tabular-nums).
- UI-5: Số dư dương hiển thị "còn nợ" (màu cảnh báo/đỏ), số dư âm hiển thị "được nhận" (màu tích cực/xanh).
- UI-6: Trạng thái focus rõ ràng; hỗ trợ dark mode tùy chọn; tôn trọng prefers-reduced-motion.
- UI-7: Thông báo lỗi hiển thị bằng tiếng Việt.

#### 3.1.2. Hardware Interfaces

Không có yêu cầu phần cứng đặc thù. Sản phẩm chạy trên trình duyệt của thiết bị người dùng (di động/desktop).

#### 3.1.3. Software Interfaces

- SI-1: Google OAuth 2.0 (qua Auth.js v5) cho xác thực; scope openid email profile.
- SI-2: Postgres (Vercel Postgres) cho lưu trữ dữ liệu, truy cập qua Drizzle ORM.
- SI-3: Thư viện xlsx (SheetJS) đọc file .xlsx và .csv, ghi file .xlsx phía client cho file mẫu.

#### 3.1.4. Communications Interfaces

- CI-1: HTTPS cho mọi giao tiếp client-server.
- CI-2: Route xác thực (/api/auth/...) là endpoint HTTP duy nhất ngoài cơ chế Server Actions.
- CI-3: Trang chia sẻ truy cập công khai qua URL dạng /s/[shareToken] không cần phiên đăng nhập.

### 3.2. Functional Requirements

MoSCoW: Must (M), Should (S), Could (C), Won't-this-release (W).

#### Module AUTH — Xác thực

##### FR-AUTH-001
- Title: Đăng nhập bằng Google.
- Description: Người dùng chưa đăng nhập có thể đăng nhập bằng tài khoản Google.
- Input: Hành động bấm nút "Đăng nhập với Google"; phản hồi OAuth từ Google.
- Processing: Khởi tạo luồng OAuth Google qua Auth.js; tạo/khớp user trong DB; tạo phiên (session) lưu ở DB.
- Output: Người dùng được chuyển về trang chủ ở trạng thái đã đăng nhập, thấy danh sách board của mình.
- Priority: Must.
- Dependencies: SI-1.
- Acceptance Criteria:
  - Given người dùng chưa đăng nhập đang ở trang chủ, When tải trang, Then trang hiển thị nút "Đăng nhập với Google" và mô tả ngắn về app.
  - Given người dùng bấm "Đăng nhập với Google" và hoàn tất OAuth, When quay lại app, Then người dùng được đưa về trang chủ và thấy danh sách board thuộc về mình (rỗng nếu chưa có board).

##### FR-AUTH-002
- Title: Đăng xuất.
- Description: Người dùng đã đăng nhập có thể đăng xuất.
- Input: Hành động bấm nút "Đăng xuất".
- Processing: Hủy phiên đăng nhập trong DB.
- Output: Người dùng về trạng thái chưa đăng nhập; không truy cập được các trang cần đăng nhập.
- Priority: Must.
- Dependencies: FR-AUTH-001.
- Acceptance Criteria:
  - Given người dùng đã đăng nhập, When bấm "Đăng xuất", Then phiên kết thúc và trang chủ hiển thị nút "Đăng nhập với Google".
  - Given người dùng vừa đăng xuất, When truy cập một trang board cần đăng nhập, Then bị chặn/redirect về trang đăng nhập.

##### FR-AUTH-003
- Title: Bảo vệ route yêu cầu đăng nhập.
- Description: Mọi route ứng dụng (trừ trang chia sẻ /s/[token] và route auth /api/auth) yêu cầu đăng nhập.
- Input: Truy cập một URL ứng dụng.
- Processing: Kiểm tra phiên đăng nhập; nếu chưa đăng nhập thì chặn/redirect.
- Output: Trang được phép hiển thị nếu đã đăng nhập; ngược lại redirect tới đăng nhập.
- Priority: Must.
- Dependencies: FR-AUTH-001.
- Acceptance Criteria:
  - Given người dùng chưa đăng nhập, When truy cập trang chi tiết board hoặc form tạo buổi, Then bị redirect tới trang đăng nhập, không thấy nội dung.
  - Given người dùng chưa đăng nhập, When truy cập /s/[token] hợp lệ, Then xem được trang chia sẻ mà không bị redirect.

#### Module BOARD — Quản lý board

##### FR-BOARD-001
- Title: Tạo board.
- Description: Owner tạo board mới bằng cách nhập tên.
- Input: Tên board (chuỗi).
- Processing: Trim tên; nếu rỗng báo lỗi; nếu hợp lệ tạo board gắn ownerId là user hiện tại, sinh share token; revalidate trang chủ.
- Output: Board mới xuất hiện trong danh sách của owner và mở được trang chi tiết.
- Priority: Must.
- Dependencies: FR-AUTH-003.
- Acceptance Criteria:
  - Given owner đang ở trang chủ, When nhập tên "Cầu lông thứ 7" và bấm tạo, Then board mới xuất hiện trong danh sách và mở được trang chi tiết.
  - Given form tạo board, When tên rỗng hoặc chỉ chứa khoảng trắng (sau trim), Then hệ thống không tạo board và hiển thị thông báo lỗi tiếng Việt.

##### FR-BOARD-002
- Title: Đổi tên board.
- Description: Owner đổi tên board của mình.
- Input: boardId, tên mới.
- Processing: Kiểm tra board tồn tại và thuộc owner; trim tên mới; cập nhật; revalidate trang board.
- Output: Tên mới hiển thị ngay sau khi lưu.
- Priority: Should.
- Dependencies: FR-BOARD-001.
- Acceptance Criteria:
  - Given owner ở trang board của mình, When đổi tên và lưu, Then tên mới hiển thị ngay.
  - Given một người không phải owner, When cố đổi tên board không thuộc về mình, Then thao tác bị từ chối với thông báo "Không có quyền".

##### FR-BOARD-003
- Title: Xóa board.
- Description: Owner xóa board của mình, kéo theo toàn bộ dữ liệu con.
- Input: boardId.
- Processing: Kiểm tra quyền owner; xóa board và cascade toàn bộ member, session, expense, attendee, payment, settlement thuộc board; revalidate trang chủ.
- Output: Board biến mất khỏi danh sách.
- Priority: Should.
- Dependencies: FR-BOARD-001.
- Acceptance Criteria:
  - Given board có member và buổi, When owner xóa board, Then board biến mất khỏi danh sách và mọi dữ liệu con bị xóa theo.
  - Given một người không phải owner, When cố xóa board không thuộc về mình, Then thao tác bị từ chối với thông báo "Không có quyền".

##### FR-BOARD-004
- Title: Cô lập dữ liệu board theo owner.
- Description: Mỗi board chỉ hiển thị và truy cập được bởi đúng owner.
- Input: userId hiện tại, boardId.
- Processing: Mọi truy vấn/ghi đối với board kiểm tra ownerId khớp user hiện tại.
- Output: Owner chỉ thấy và thao tác được board của mình.
- Priority: Must.
- Dependencies: FR-AUTH-003.
- Acceptance Criteria:
  - Given user X và board của user Y, When X mở danh sách board, Then không thấy board của Y.
  - Given user X, When X truy cập trực tiếp URL board của Y, Then bị từ chối/redirect, không thấy nội dung.

#### Module MEMBER — Quản lý thành viên

##### FR-MEMBER-001
- Title: Thêm thành viên bằng tên.
- Description: Owner thêm member vào board chỉ bằng tên.
- Input: boardId, tên member.
- Processing: Kiểm tra quyền owner; trim tên; từ chối nếu rỗng hoặc trùng (so sánh không phân biệt hoa/thường) trong board; tạo member; revalidate trang board.
- Output: Member mới xuất hiện trong danh sách và chọn được khi tạo buổi.
- Priority: Must.
- Dependencies: FR-BOARD-001.
- Acceptance Criteria:
  - Given board chưa có member "Nam", When owner thêm "Nam", Then "Nam" xuất hiện trong danh sách và có thể tick khi tạo buổi.
  - Given board đã có "Nam", When owner thêm "nam" (khác hoa/thường), Then hệ thống từ chối với thông báo trùng tên tiếng Việt.
  - Given form thêm member, When tên rỗng sau trim, Then hệ thống không thêm và báo lỗi.

##### FR-MEMBER-002
- Title: Sửa tên thành viên.
- Description: Owner sửa tên một member.
- Input: memberId, tên mới.
- Processing: Kiểm tra quyền owner của board chứa member; trim tên; áp dụng kiểm tra trống/trùng như FR-MEMBER-001; cập nhật; revalidate.
- Output: Tên mới áp dụng ở mọi nơi hiển thị.
- Priority: Should.
- Dependencies: FR-MEMBER-001.
- Acceptance Criteria:
  - Given member "Nam" đã tham gia một buổi, When owner đổi tên thành "Nam A", Then tên "Nam A" hiển thị ở danh sách member, chip người tham gia và bảng số dư.
  - Given một người không phải owner, When cố sửa member của board không thuộc về mình, Then bị từ chối với thông báo "Không có quyền".

##### FR-MEMBER-003
- Title: Xóa thành viên với cảnh báo.
- Description: Owner xóa một member; nếu member đã tham gia buổi thì cảnh báo trước.
- Input: memberId.
- Processing: Kiểm tra quyền owner; nếu member đã có trong buổi nào, hiển thị cảnh báo trước khi xóa; khi xác nhận, xóa member; revalidate. (Hành vi sau xác nhận với dữ liệu liên quan tham chiếu OQ4; mặc định v1: cảnh báo rồi cho phép xóa.)
- Output: Member biến mất khỏi danh sách.
- Priority: Should.
- Dependencies: FR-MEMBER-001.
- Acceptance Criteria:
  - Given member chưa tham gia buổi nào, When owner xóa, Then member bị xóa khỏi danh sách không cần cảnh báo.
  - Given member đã tham gia ít nhất một buổi, When owner bấm xóa, Then hệ thống hiển thị cảnh báo và chỉ xóa sau khi owner xác nhận.
  - Given một người không phải owner, When cố xóa member của board không thuộc về mình, Then bị từ chối với thông báo "Không có quyền".

#### Module SESSION — Tạo và quản lý buổi

##### FR-SESSION-001
- Title: Tạo buổi mới.
- Description: Owner tạo một buổi: ngày, ghi chú tùy chọn, danh sách người tham gia, danh sách khoản chi, danh sách người ứng.
- Input: boardId; date (YYYY-MM-DD); note (tùy chọn); attendeeIds (>=1); expenses (label + amount nguyên dương); payments (memberId + amount).
- Processing: Kiểm tra quyền owner; validate date đúng định dạng, có ít nhất 1 attendee, mỗi amount là số nguyên dương, payments.memberId thuộc member của board; lưu session cùng expense/attendee/payment trong một giao dịch (transaction); revalidate trang board.
- Output: Buổi xuất hiện trong danh sách buổi; số dư board được cập nhật.
- Priority: Must.
- Dependencies: FR-MEMBER-001, FR-SPLIT-001.
- Acceptance Criteria:
  - Given board có member, When owner mở form tạo buổi, Then ngày mặc định là hôm nay và tất cả member được tick là có mặt mặc định.
  - Given form tạo buổi, When owner bỏ tick toàn bộ người tham gia, Then không cho lưu và báo lỗi tiếng Việt.
  - Given một khoản chi có số tiền không phải số nguyên dương (ví dụ 0 hoặc -100), When owner cố lưu, Then không cho lưu và báo lỗi.
  - Given form hợp lệ với người tham gia và khoản chi đúng, When owner lưu, Then buổi xuất hiện trong tab Buổi và số dư được cập nhật.

##### FR-SESSION-002
- Title: Khoản chi với preset và label free-form.
- Description: Form khoản chi hỗ trợ preset nhanh (Sân/Cầu/Nước) và label nhập tự do.
- Input: Hành động bấm preset hoặc nhập label; số tiền.
- Processing: Preset thêm một dòng khoản chi với label sẵn; cho phép sửa label thành chuỗi tự do; số tiền nhập dạng số nguyên VND, hiển thị định dạng vi-VN.
- Output: Dòng khoản chi với label và số tiền hiển thị.
- Priority: Should.
- Dependencies: FR-SESSION-001.
- Acceptance Criteria:
  - Given form khoản chi, When owner bấm preset "Sân", Then một dòng khoản chi với label "Sân" được thêm để nhập số tiền.
  - Given owner nhập số tiền 200000 vào một dòng, When hiển thị, Then số tiền hiển thị "200.000đ".

##### FR-SESSION-003
- Title: Chọn người ứng tiền (payer).
- Description: Form cho chọn một hoặc nhiều người ứng tiền và số tiền ứng; mặc định một người ứng bằng tổng chi.
- Input: payments (memberId + amount).
- Processing: Cho chọn member làm payer và nhập số tiền ứng; mặc định gợi ý một payer với số tiền bằng tổng chi.
- Output: Danh sách người ứng và số tiền ứng.
- Priority: Should.
- Dependencies: FR-SESSION-001.
- Acceptance Criteria:
  - Given form tạo buổi có tổng chi 300.000đ, When mở form, Then có sẵn một người ứng được gợi ý với số tiền ứng bằng 300.000đ (cho phép sửa).
  - Given owner chọn hai người ứng, When nhập số tiền cho từng người, Then cả hai khoản ứng được lưu cùng buổi.

##### FR-SESSION-004
- Title: Hiển thị live "Mỗi người: Xđ".
- Description: Form hiển thị số tiền mỗi người gánh, cập nhật theo dữ liệu nhập, tính phía client.
- Input: Tổng khoản chi, số người tham gia.
- Processing: Tính perHead = round1000(tổng / số attendee) ngay phía client mỗi khi dữ liệu thay đổi.
- Output: Dòng "Mỗi người: Xđ" định dạng vi-VN.
- Priority: Should.
- Dependencies: FR-SESSION-001, FR-SPLIT-001.
- Acceptance Criteria:
  - Given form có tổng chi 300.000đ và 3 người tham gia, When dữ liệu nhập, Then hiển thị "Mỗi người: 100.000đ".
  - Given form có tổng chi 100.000đ và 3 người tham gia, When dữ liệu nhập, Then hiển thị "Mỗi người: 33.000đ".

##### FR-SESSION-005
- Title: Danh sách buổi.
- Description: Tab "Buổi" hiển thị danh sách các buổi đã chia.
- Input: boardId.
- Processing: Tải các buổi của board; với mỗi buổi tính tổng chi, số người tham gia, perHead.
- Output: Mỗi dòng gồm ngày, tổng chi, số người tham gia, mỗi người Xđ.
- Priority: Must.
- Dependencies: FR-SESSION-001, FR-SPLIT-001.
- Acceptance Criteria:
  - Given board có một buổi ngày 2026-06-20 tổng 300.000đ, 3 người, When mở tab Buổi, Then dòng hiển thị ngày, "300.000đ", "3 người", "100.000đ".
  - Given tab Buổi, When hiển thị các số tiền, Then định dạng vi-VN và canh thẳng cột (tabular-nums); có nút "Thêm buổi" mở form tạo buổi.

##### FR-SESSION-006
- Title: Sửa buổi.
- Description: Owner sửa thông tin một buổi (ngày, người tham gia, khoản chi, người ứng).
- Input: sessionId, dữ liệu buổi mới.
- Processing: Kiểm tra quyền owner; validate như FR-SESSION-001; cập nhật buổi và dữ liệu con; revalidate.
- Output: Buổi cập nhật; số dư tính lại đúng.
- Priority: Should.
- Dependencies: FR-SESSION-001.
- Acceptance Criteria:
  - Given một buổi đã lưu, When owner sửa khoản chi hoặc người tham gia và lưu, Then thay đổi phản ánh vào danh sách buổi và bảng số dư.
  - Given một người không phải owner, When cố sửa buổi của board không thuộc về mình, Then bị từ chối với thông báo "Không có quyền".

##### FR-SESSION-007
- Title: Xóa buổi.
- Description: Owner xóa một buổi; số dư được tính lại.
- Input: sessionId.
- Processing: Kiểm tra quyền owner; xóa buổi và dữ liệu con (expense, attendee, payment); revalidate.
- Output: Buổi biến mất; số dư tính lại.
- Priority: Should.
- Dependencies: FR-SESSION-001, FR-BALANCE-001.
- Acceptance Criteria:
  - Given board có hai buổi, When owner xóa một buổi, Then buổi đó biến mất và bảng số dư phản ánh chỉ còn net của buổi còn lại.

#### Module SPLIT — Chia tiền một buổi

##### FR-SPLIT-001
- Title: Chia đều chi phí buổi cho người có mặt.
- Description: Tính tổng chi, mỗi người gánh (perHead) làm tròn 1.000đ, phần phải gánh từng người (share), số đã ứng (paid) và net từng member trong một buổi.
- Input: expenses (amount), attendeeIds, payments (memberId + amount).
- Processing:
  - total = tổng các amount của expenses.
  - perHead = round1000(total / số attendee).
  - Khởi tạo share của mỗi attendee = perHead.
  - remainder = total − perHead × số attendee; dồn remainder vào người ứng nếu người ứng có mặt; nếu không có người ứng nào có mặt thì dồn vào attendee đầu tiên. Bảo đảm tổng share = total.
  - paid[memberId] = tổng amount ứng của member.
  - net[memberId] = share − paid. Tổng net trong buổi = 0.
  - Nếu không có attendee: perHead = 0, share = {}, không chia.
- Output: total, perHead, shares (per member), paid (per member), net (per member).
- Priority: Must.
- Dependencies: FR-SESSION-001 (làm tròn theo BR3), BR4, BR5, BR8, BR10.
- Acceptance Criteria:
  - Given expenses tổng 300000, attendee [a,b,c], payment a=300000, When chia, Then perHead=100000; shares={a:100000,b:100000,c:100000}; net={a:-200000,b:100000,c:100000}; tổng net = 0.
  - Given expenses tổng 100000, attendee [a,b,c], payment a=100000, When chia, Then perHead=33000; remainder = 100000 − 33000×3 = 1000 dồn vào a; shares={a:34000,b:33000,c:33000}; tổng shares = 100000 (= total); net={a:-66000,b:33000,c:33000}; tổng net = 0.
  - Given expenses tổng 100000, attendee [b,c], payment a=100000 (người ứng a không có mặt), When chia, Then perHead=50000; remainder=0; shares={b:50000,c:50000}; net.a=-100000; net.b=50000; net.c=50000; tổng net = 0.
  - Given expenses tổng 100000, attendeeIds rỗng, payments rỗng, When chia, Then perHead=0 và shares={} (buổi không hợp lệ để lưu theo FR-SESSION-001).

#### Module BALANCE — Số dư tích lũy

##### FR-BALANCE-001
- Title: Tính số dư tích lũy từng member.
- Description: Tính balance mỗi member = tổng net qua tất cả buổi − tổng settlement đã trả.
- Input: Danh sách buổi (mỗi buổi feed FR-SPLIT-001), danh sách settlement (memberId + amount).
- Processing: Cộng dồn net của từng member qua các buổi; trừ tổng settlement của member. Bảo đảm tổng balance toàn board = 0.
- Output: balance per member (số nguyên VND, dương = còn nợ, âm = được nhận).
- Priority: Must.
- Dependencies: FR-SPLIT-001, FR-SETTLE-001.
- Acceptance Criteria:
  - Given buổi 1 (tổng 300000, attendee [a,b,c], a ứng 300000) và buổi 2 (tổng 200000, attendee [a,b], b ứng 200000), không settlement, When tính, Then balance a=-100000, b=0, c=100000; tổng = 0.
  - Given buổi 1 như trên (a ứng 300000) và settlement c=100000, When tính, Then balance c=0 và balance a=-200000.

##### FR-BALANCE-002
- Title: Hiển thị bảng số dư.
- Description: Tab "Số dư" hiển thị bảng từng member với số dư tích lũy.
- Input: boardId.
- Processing: Tính số dư qua FR-BALANCE-001; hiển thị nhãn và màu theo dấu số dư.
- Output: Bảng member với số dư; dương = "còn nợ" (đỏ), âm = "được nhận" (xanh); kèm nút "Đánh dấu đã trả".
- Priority: Must.
- Dependencies: FR-BALANCE-001.
- Acceptance Criteria:
  - Given member có balance 100000, When hiển thị, Then dòng đó hiển thị "còn nợ" với số 100.000đ màu cảnh báo.
  - Given member có balance -100000, When hiển thị, Then dòng đó hiển thị "được nhận" với số 100.000đ màu tích cực.
  - Given bảng số dư của board bất kỳ, When cộng tất cả số dư member, Then tổng bằng 0.

#### Module SETTLE — Thanh toán nợ

##### FR-SETTLE-001
- Title: Ghi settlement.
- Description: Owner đánh dấu một member đã trả nợ bằng cách ghi settlement (số tiền, ngày, ghi chú tùy chọn).
- Input: boardId, memberId, amount (số nguyên dương), date (YYYY-MM-DD), note (tùy chọn).
- Processing: Kiểm tra quyền owner; validate amount nguyên dương và date đúng định dạng; lưu settlement; revalidate.
- Output: Settlement được ghi; số dư member giảm đúng bằng số tiền đã trả.
- Priority: Must.
- Dependencies: FR-BALANCE-001.
- Acceptance Criteria:
  - Given member có balance 100000, When owner ghi settlement 100000, Then balance member giảm còn 0.
  - Given member có balance 100000, When owner ghi settlement 40000, Then balance member còn 60000.
  - Given một người không phải owner, When cố ghi settlement cho board không thuộc về mình, Then bị từ chối với thông báo "Không có quyền".

##### FR-SETTLE-002
- Title: Xóa settlement.
- Description: Owner xóa một settlement; số dư được tính lại.
- Input: settlementId.
- Processing: Kiểm tra quyền owner; xóa settlement; revalidate.
- Output: Settlement biến mất; số dư member tăng lại đúng bằng số đã xóa.
- Priority: Should.
- Dependencies: FR-SETTLE-001.
- Acceptance Criteria:
  - Given member có settlement 100000 khiến balance về 0, When owner xóa settlement đó, Then balance member trở lại 100000.
  - Given một người không phải owner, When cố xóa settlement của board không thuộc về mình, Then bị từ chối với thông báo "Không có quyền".

##### FR-SETTLE-003
- Title: Không định tuyến "ai chuyển ai".
- Description: Hệ thống chỉ cấn trừ số dư tích lũy, không gợi ý ai chuyển tiền cho ai.
- Input: Dữ liệu số dư.
- Processing: Chỉ tính và hiển thị số dư từng member; không sinh đề xuất chuyển khoản giữa các member.
- Output: Bảng số dư không có gợi ý chuyển khoản.
- Priority: Must.
- Dependencies: FR-BALANCE-002.
- Acceptance Criteria:
  - Given board có nhiều member còn nợ và được nhận, When mở tab Số dư, Then chỉ hiển thị số dư từng người, không có dòng gợi ý kiểu "A chuyển cho B".

#### Module SHARE — Chia sẻ read-only

##### FR-SHARE-001
- Title: Lấy và sao chép share link.
- Description: Mỗi board có một share link cố định dạng /s/[shareToken]; owner sao chép được link.
- Input: boardId.
- Processing: Hiển thị share token của board; cung cấp nút sao chép link.
- Output: Link /s/[shareToken] được sao chép vào clipboard.
- Priority: Must.
- Dependencies: FR-BOARD-001.
- Acceptance Criteria:
  - Given owner ở trang chi tiết board, When bấm "Chia sẻ", Then link /s/[shareToken] của board được hiển thị/sao chép.
  - Given hai lần mở trang cùng một board, When lấy share link, Then share token không đổi (cố định).

##### FR-SHARE-002
- Title: Trang chia sẻ public read-only.
- Description: Người xem mở /s/[shareToken] xem số dư hiện tại và lịch sử buổi rút gọn mà không cần đăng nhập.
- Input: shareToken.
- Processing: Tìm board theo share token (không yêu cầu auth); nếu không tồn tại trả 404; nếu tồn tại hiển thị tên board, bảng số dư hiện tại, lịch sử buổi rút gọn; không trả về thông tin owner (email, ownerId).
- Output: Trang read-only; không có nút sửa/xóa.
- Priority: Must.
- Dependencies: FR-SHARE-001, FR-BALANCE-002.
- Acceptance Criteria:
  - Given share token hợp lệ, When người xem ẩn danh mở /s/[token], Then thấy tên board, bảng số dư hiện tại và lịch sử buổi rút gọn, không có nút sửa/xóa, không bị yêu cầu đăng nhập.
  - Given trang chia sẻ, When kiểm tra nội dung trả về, Then không lộ email hay ownerId của owner.
  - Given share token không hợp lệ, When mở /s/[token], Then hiển thị trang 404 với thông báo tiếng Việt.

#### Module IMPORT — Import lịch sử Excel/CSV

##### FR-IMPORT-001
- Title: Tải file mẫu.
- Description: Trang import cung cấp nút tải file mẫu cho cả CSV và Excel.
- Input: Hành động bấm nút tải.
- Processing: Cung cấp file mẫu CSV tĩnh; sinh file Excel (.xlsx) cho người dùng tải về. File mẫu chứa đúng các cột: ngày, khoản, số tiền, người ứng, người tham gia, kèm vài dòng ví dụ.
- Output: File mẫu .csv và .xlsx tải về máy người dùng.
- Priority: Should.
- Dependencies: SI-3.
- Acceptance Criteria:
  - Given trang import, When bấm "Tải file mẫu (CSV)", Then tải về file CSV có header "ngày,khoản,số tiền,người ứng,người tham gia" và vài dòng ví dụ.
  - Given trang import, When bấm "Tải file mẫu (Excel)", Then tải về file .xlsx với cùng cấu trúc cột và dòng ví dụ.

##### FR-IMPORT-002
- Title: Đọc và phân tích file import.
- Description: App đọc file .xlsx/.csv theo template long-format, gom theo ngày thành buổi, tách người tham gia, và báo lỗi theo dòng.
- Input: File .xlsx hoặc .csv theo template (mỗi dòng một khoản chi).
- Processing:
  - Đọc các dòng thành bản ghi với cột ngày, khoản, số tiền, người ứng, người tham gia.
  - Gom các dòng cùng ngày thành một buổi.
  - Tách "người tham gia" theo dấu phẩy, trim, loại trùng.
  - Chuẩn hóa số tiền: bỏ dấu "." phân nhóm và hậu tố "đ" (ví dụ "200.000đ" -> 200000).
  - Validate theo dòng: thiếu cột; ngày sai định dạng (không phải YYYY-MM-DD); số tiền không phải số nguyên dương.
  - Xác định danh sách member mới cần tạo (tên chưa tồn tại trong board); tên người ứng phải nằm trong danh sách tham gia hoặc được tạo mới.
- Output: Cấu trúc kết quả gồm danh sách buổi sẽ tạo, danh sách member mới sẽ thêm, và danh sách lỗi theo dòng.
- Priority: Should.
- Dependencies: SI-3, FR-SPLIT-001, BR11.
- Acceptance Criteria:
  - Given file có 2 dòng cùng ngày 2026-06-20 (Sân 200000, Cầu 120000, cùng người tham gia "Tuấn, Nam, Hùng"), When phân tích, Then tạo 1 buổi với 2 khoản chi và 3 người tham gia (đã trim, loại trùng).
  - Given một dòng có số tiền "200.000đ", When phân tích, Then số tiền được chuẩn hóa thành 200000.
  - Given một dòng thiếu cột số tiền hoặc có ngày "20/06/2026" (sai định dạng), When phân tích, Then dòng đó xuất hiện trong danh sách lỗi với thông báo rõ theo dòng.
  - Given file có tên người tham gia chưa tồn tại trong board, When phân tích, Then tên đó nằm trong danh sách member mới sẽ thêm.

##### FR-IMPORT-003
- Title: Preview trước khi ghi.
- Description: App hiển thị preview kết quả phân tích trước khi ghi vào board.
- Input: Kết quả từ FR-IMPORT-002.
- Processing: Hiển thị danh sách buổi sẽ tạo, danh sách member mới, và bảng các dòng lỗi.
- Output: Màn preview phân tách buổi hợp lệ, member mới, và lỗi.
- Priority: Should.
- Dependencies: FR-IMPORT-002.
- Acceptance Criteria:
  - Given file đã phân tích, When mở preview, Then thấy danh sách buổi sẽ tạo, danh sách member mới sẽ thêm, và bảng các dòng lỗi (nếu có).

##### FR-IMPORT-004
- Title: Xác nhận và ghi dữ liệu import.
- Description: Owner xác nhận nhập sau khi xem preview; hệ thống tạo member còn thiếu và tạo từng buổi tương ứng.
- Input: Kết quả preview đã phân tích.
- Processing: Nút "Xác nhận nhập" bị vô hiệu hóa khi còn dòng lỗi (mặc định v1: chặn toàn bộ nếu còn lỗi, tham chiếu OQ6). Khi xác nhận: tạo member còn thiếu, tạo từng buổi theo cùng logic chia tiền như buổi tạo tay (FR-SPLIT-001), trong giao dịch; revalidate.
- Output: Thông báo số buổi đã nhập (ví dụ "Đã nhập N buổi"); số dư board cập nhật.
- Priority: Should.
- Dependencies: FR-IMPORT-003, FR-SESSION-001, FR-SPLIT-001.
- Acceptance Criteria:
  - Given preview còn ít nhất một dòng lỗi, When xem nút "Xác nhận nhập", Then nút bị vô hiệu hóa.
  - Given preview không còn lỗi với 3 buổi và 2 member mới, When owner bấm "Xác nhận nhập", Then hệ thống tạo 2 member mới, tạo 3 buổi, và hiển thị "Đã nhập 3 buổi".
  - Given buổi nhập từ import, When tính số dư, Then áp dụng cùng quy tắc chia đều và làm tròn 1.000đ như buổi tạo tay.

### 3.3. Non-Functional Requirements

##### NFR-PERF-001 (Performance)
- Một buổi mới được nhập đầy đủ trên điện thoại trong dưới 2 phút (thao tác người dùng).
- Acceptance: Given một owner quen tay trên điện thoại, When tạo một buổi với 5 người và 3 khoản chi, Then hoàn tất trong dưới 2 phút.

##### NFR-PERF-002 (Performance)
- Tính "Mỗi người: Xđ" phía client cập nhật tức thời khi dữ liệu thay đổi (cảm nhận không độ trễ).
- Acceptance: Given form tạo buổi, When thay đổi số tiền hoặc số người, Then dòng "Mỗi người" cập nhật ngay trong cùng tương tác.

##### NFR-SEC-001 (Security)
- Mọi action ghi (trừ trang share) yêu cầu đăng nhập và kiểm tra quyền owner.
- Acceptance: Given một request ghi không có phiên đăng nhập hợp lệ hoặc không phải owner, When thực thi, Then bị từ chối.

##### NFR-SEC-002 (Security)
- Trang chia sẻ chỉ đọc và không lộ thông tin owner (email, ownerId).
- Acceptance: Given trang /s/[token], When kiểm tra dữ liệu phản hồi, Then không chứa email hay ownerId của owner.

##### NFR-SEC-003 (Security)
- Mọi giao tiếp qua HTTPS; secrets không hardcode trong mã nguồn.
- Acceptance: Given môi trường triển khai, When kiểm tra cấu hình, Then OAuth client secret và DB credential lấy từ biến môi trường, không nằm trong repo.

##### NFR-REL-001 (Reliability)
- Tổng số dư toàn board luôn cân bằng về 0, không lệch do làm tròn.
- Acceptance: Given board bất kỳ với nhiều buổi và settlement, When cộng số dư mọi member, Then tổng = 0.

##### NFR-REL-002 (Reliability)
- Tạo/sửa/xóa buổi và import ghi dữ liệu trong giao dịch (transaction); lỗi giữa chừng không để lại dữ liệu một phần.
- Acceptance: Given thao tác tạo buổi thất bại ở một bước, When kết thúc, Then không có session/expense/attendee/payment được ghi một phần.

##### NFR-USE-001 (Usability)
- 100% giao diện tiếng Việt; technical term tiếng Anh chỉ trong mã, không hiển thị cho người dùng.
- Acceptance: Given bất kỳ màn hình nào, When người dùng xem, Then mọi nhãn và thông báo là tiếng Việt.

##### NFR-USE-002 (Usability)
- Mobile-first; tiền hiển thị định dạng vi-VN với hậu tố đ; cột số canh thẳng (tabular-nums).
- Acceptance: Given số tiền 1234000, When hiển thị, Then là "1.234.000đ" và canh thẳng cột.

##### NFR-USE-003 (Usability)
- Hỗ trợ dark mode (tùy chọn, tham chiếu OQ8); tôn trọng prefers-reduced-motion; có trạng thái focus rõ ràng.
- Acceptance: Given người dùng bật prefers-reduced-motion, When duyệt app, Then animation bị giảm/tắt.

##### NFR-MAINT-001 (Maintainability)
- Logic chia tiền, số dư và parser import là hàm thuần, có test tự động (vitest), tách khỏi DB và UI.
- Acceptance: Given codebase, When chạy npm test, Then toàn bộ test domain (chia tiền, số dư, parser) pass.

##### NFR-MAINT-002 (Maintainability)
- Tuân quy ước đặt tên: bảng plural snake_case columns, ID = UUID text PK, mutation qua Server Actions.
- Acceptance: Given schema và actions, When review, Then tuân quy ước đã nêu.

##### NFR-COMP-001 (Compliance)
- Đơn vị tiền duy nhất VND, lưu số nguyên, làm tròn tới 1.000đ.
- Acceptance: Given mọi giá trị tiền lưu trong hệ thống, When kiểm tra, Then là số nguyên VND.

##### NFR-SCAL-001 (Scalability)
- Hỗ trợ một owner sở hữu nhiều board và mỗi board nhiều buổi/member ở quy mô nhóm thể thao (hàng chục member, hàng trăm buổi) mà không suy giảm rõ rệt. Phân trang khi board rất nhiều buổi tham chiếu OQ3 (chưa bắt buộc v1).
- Acceptance: Given một board với hàng trăm buổi, When mở tab Buổi và Số dư, Then trang vẫn tải và hiển thị đúng số dư.

### 3.4. Data Requirements (mức conceptual)

##### DR-USER
- Entity: User (người đăng nhập Google).
- Thuộc tính: id, name, email, image, thời điểm xác thực email.
- Quan hệ: một User sở hữu nhiều Board.

##### DR-BOARD
- Entity: Board.
- Thuộc tính: id, ownerId (tham chiếu User), name, shareToken (duy nhất, dùng cho trang public), createdAt.
- Quan hệ: thuộc một User (owner); có nhiều Member, nhiều Session, nhiều Settlement.

##### DR-MEMBER
- Entity: Member (tên người chơi trong board, không gắn account).
- Thuộc tính: id, boardId, name.
- Ràng buộc: name duy nhất trong phạm vi board, không phân biệt hoa/thường; không rỗng.
- Quan hệ: thuộc một Board; tham gia nhiều Session (qua Attendee); có thể là payer; gắn với Settlement.

##### DR-SESSION
- Entity: Session (buổi), bảng game_sessions.
- Thuộc tính: id, boardId, date (YYYY-MM-DD), note (tùy chọn), createdAt.
- Quan hệ: thuộc một Board; có nhiều Expense, nhiều Attendee, nhiều Payment.

##### DR-EXPENSE
- Entity: Expense (khoản chi).
- Thuộc tính: id, sessionId, label, amount (số nguyên VND, > 0).
- Quan hệ: thuộc một Session.

##### DR-ATTENDEE
- Entity: Attendee (người tham gia một buổi).
- Thuộc tính: sessionId, memberId (khóa kết hợp).
- Quan hệ: liên kết một Session với một Member; chỉ attendee mới gánh chi phí buổi.

##### DR-PAYMENT
- Entity: Payment (ứng tiền của một buổi).
- Thuộc tính: id, sessionId, memberId, amount (số nguyên VND).
- Quan hệ: thuộc một Session; gắn với một Member.

##### DR-SETTLEMENT
- Entity: Settlement (member trả nợ).
- Thuộc tính: id, boardId, memberId, amount (số nguyên VND, > 0), date (YYYY-MM-DD), note (tùy chọn).
- Quan hệ: thuộc một Board; gắn với một Member; cấn trừ số dư.

##### DR-RULES
- Số dư là giá trị dẫn xuất (derived), không lưu trữ trực tiếp; tính từ Session (qua chia tiền) và Settlement.
- Mọi tiền là số nguyên VND; định dạng vi-VN chỉ ở tầng hiển thị.
- Xóa Board/Session/Member cascade dữ liệu con liên quan theo ràng buộc khóa ngoại.

### 3.5. Business Rules

- BR-001: Quy ước số dư: dương = còn nợ quỹ, âm = được nhận lại.
- BR-002: Mỗi buổi, tổng chi = tổng các khoản chi của buổi đó.
- BR-003: Mỗi người gánh = round1000(tổng / số người có mặt), làm tròn tới 1.000đ.
- BR-004: Phần lệch do làm tròn (tổng − mỗi-người × số-người) dồn vào người ứng tiền; nếu người ứng không có mặt thì dồn vào người tham gia đầu tiên. Tổng phần gánh luôn bằng tổng chi.
- BR-005: Net mỗi member trong buổi = phần phải gánh − số đã ứng. Tổng net trong một buổi luôn bằng 0.
- BR-006: Số dư tích lũy của một member = tổng net qua các buổi − tổng settlement đã trả. Tổng số dư toàn board luôn bằng 0.
- BR-007: Settlement là việc member đưa tiền để giảm số dư về phía 0; chỉ cấn trừ số dư, không định tuyến "ai chuyển ai".
- BR-008: Chỉ tính chia cho người có mặt buổi đó; người vắng không gánh chi phí buổi đó.
- BR-009: Member là một tên trong phạm vi board, không gắn account; mỗi tên duy nhất (không phân biệt hoa/thường) trong board.
- BR-010: Khi không có người tham gia, buổi không hợp lệ để lưu (mỗi-người = 0, không chia).
- BR-011: Import: gom theo ngày thành buổi; tên trong "người ứng" phải nằm trong "người tham gia" hoặc được tạo mới; số tiền và ngày phải đúng định dạng, ngược lại báo lỗi dòng.
- BR-012: Số tiền lưu dưới dạng số nguyên VND; số tiền import dạng "200.000đ" được chuẩn hóa thành 200000.
- BR-013: Chỉ owner mới đọc/ghi dữ liệu board của mình; trang chia sẻ là ngoại lệ chỉ đọc và ẩn danh.

### 3.6. Use Case Flows

##### UC-001: Đăng nhập và tạo board
- Actor: Owner.
- Tiền điều kiện: Owner có tài khoản Google.
- Luồng chính:
  1. Owner mở trang chủ (chưa đăng nhập), thấy nút "Đăng nhập với Google".
  2. Owner đăng nhập, hệ thống tạo/khớp user và phiên DB.
  3. Owner về trang chủ, thấy danh sách board (rỗng nếu mới).
  4. Owner nhập tên board và bấm tạo.
  5. Hệ thống tạo board (gắn owner, sinh share token) và mở/hiện trong danh sách.
- Luồng phụ: 4a. Tên rỗng -> hệ thống báo lỗi, không tạo.
- Ngoại lệ: 2a. OAuth thất bại -> quay lại trang đăng nhập, không tạo phiên.

##### UC-002: Thêm danh sách thành viên
- Actor: Owner.
- Tiền điều kiện: Owner đã có board.
- Luồng chính:
  1. Owner mở trang thành viên của board.
  2. Owner nhập tên và thêm member.
  3. Hệ thống kiểm tra trống/trùng, tạo member, hiển thị trong danh sách.
- Luồng phụ: 2a. Tên rỗng -> báo lỗi. 2b. Tên trùng (không phân biệt hoa/thường) -> báo lỗi.
- Ngoại lệ: 1a. Không phải owner -> bị từ chối "Không có quyền".

##### UC-003: Tạo một buổi mới
- Actor: Owner.
- Tiền điều kiện: Board có ít nhất một member.
- Luồng chính:
  1. Owner mở form tạo buổi; ngày mặc định hôm nay, tất cả member tick mặc định.
  2. Owner chọn người có mặt (chip tick), thêm khoản chi (preset hoặc free-form) và số tiền.
  3. Owner chọn người ứng và số tiền ứng (mặc định một người ứng = tổng).
  4. Form hiển thị live "Mỗi người: Xđ".
  5. Owner lưu; hệ thống validate và ghi buổi trong transaction; số dư cập nhật.
- Luồng phụ: 2a. Bỏ tick toàn bộ người tham gia -> không cho lưu. 2b. Khoản chi có số tiền không hợp lệ -> không cho lưu.
- Ngoại lệ: 5a. Lỗi ghi giữa chừng -> rollback, không ghi một phần (NFR-REL-002).

##### UC-004: Xem số dư và đánh dấu đã trả
- Actor: Owner.
- Tiền điều kiện: Board có buổi.
- Luồng chính:
  1. Owner mở tab Số dư, thấy bảng từng member với số dư (còn nợ/được nhận).
  2. Owner bấm "Đánh dấu đã trả" cho một member.
  3. Owner nhập số tiền, ngày, ghi chú tùy chọn và lưu settlement.
  4. Hệ thống ghi settlement; số dư member giảm đúng số đã trả.
- Luồng phụ: 1a. Tổng số dư board luôn bằng 0.
- Ngoại lệ: 3a. Không phải owner -> bị từ chối "Không có quyền".

##### UC-005: Chia sẻ link read-only
- Actor: Owner.
- Tiền điều kiện: Board tồn tại.
- Luồng chính:
  1. Owner mở trang chi tiết board.
  2. Owner bấm "Chia sẻ", hệ thống hiển thị/sao chép link /s/[shareToken].
- Ngoại lệ: Không có (share token cố định theo board).

##### UC-006: Thành viên xem qua share link
- Actor: Share viewer (ẩn danh).
- Tiền điều kiện: Có share link hợp lệ.
- Luồng chính:
  1. Viewer mở /s/[shareToken] (không đăng nhập).
  2. Hệ thống tìm board theo token; hiển thị tên board, số dư hiện tại, lịch sử buổi rút gọn (read-only, ẩn thông tin owner).
- Ngoại lệ: 2a. Token không hợp lệ -> trang 404 tiếng Việt.

##### UC-007: Import lịch sử từ Excel/CSV
- Actor: Owner.
- Tiền điều kiện: Owner có board; có file theo template.
- Luồng chính:
  1. Owner mở trang import; tải file mẫu nếu cần.
  2. Owner upload file .xlsx/.csv.
  3. Hệ thống đọc và phân tích: gom theo ngày, tách người tham gia, chuẩn hóa số tiền, xác định member mới, gắn lỗi theo dòng.
  4. Hệ thống hiển thị preview (buổi sẽ tạo, member mới, dòng lỗi).
  5. Owner bấm "Xác nhận nhập" (chỉ khi không còn lỗi).
  6. Hệ thống tạo member còn thiếu và từng buổi trong transaction; báo "Đã nhập N buổi".
- Luồng phụ: 4a. Có dòng lỗi -> nút xác nhận vô hiệu hóa.
- Ngoại lệ: 3a. Thiếu cột/sai định dạng ngày/số tiền -> dòng được đánh dấu lỗi trong preview; 1a. Không phải owner -> bị từ chối.

---

## 4. Traceability Matrix (PRD user story -> SRS FR)

| PRD User Story | Mô tả ngắn | SRS FR |
|----------------|------------|--------|
| A1 | Đăng nhập Google, bảo vệ route | FR-AUTH-001, FR-AUTH-002, FR-AUTH-003 |
| A2 | Tạo nhiều board, cô lập theo owner | FR-BOARD-001, FR-BOARD-004 |
| A3 | Đổi tên/xóa board, cascade, chỉ owner | FR-BOARD-002, FR-BOARD-003 |
| B1 | Thêm member bằng tên, chống trống/trùng | FR-MEMBER-001 |
| B2 | Sửa/xóa member, cảnh báo, chỉ owner | FR-MEMBER-002, FR-MEMBER-003 |
| C1 | Tạo buổi: ngày, người, khoản chi, người ứng, live perHead | FR-SESSION-001, FR-SESSION-002, FR-SESSION-003, FR-SESSION-004, FR-SPLIT-001 |
| C2 | Danh sách buổi | FR-SESSION-005 |
| C3 | Sửa/xóa buổi, tính lại số dư | FR-SESSION-006, FR-SESSION-007 |
| D1 | Bảng số dư tích lũy, dấu/màu, tổng = 0 | FR-BALANCE-001, FR-BALANCE-002 |
| D2 | Đánh dấu đã trả (settlement), chỉ owner, không định tuyến | FR-SETTLE-001, FR-SETTLE-002, FR-SETTLE-003 |
| E1 | Share link cố định, sao chép | FR-SHARE-001 |
| E2 | Trang share read-only, ẩn owner, 404 token sai | FR-SHARE-002 |
| F1 | Tải file mẫu CSV/Excel | FR-IMPORT-001 |
| F2 | Upload, phân tích, preview, lỗi theo dòng, chuẩn hóa tiền | FR-IMPORT-002, FR-IMPORT-003 |
| F3 | Xác nhận nhập, tạo member/buổi, cùng logic chia | FR-IMPORT-004 |

Tổng kết coverage: 16/16 user story PRD được phủ bởi ít nhất một FR. Không có FR mồ côi: mọi FR đều trace về ít nhất một user story.
