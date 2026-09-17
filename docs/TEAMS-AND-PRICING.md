# Đội nhóm, quyền thao tác và đơn giá

## Cách sử dụng

1. Admin mở **Nhân viên → Quản lý Đội nhóm**. Tạo đội, nhập đơn giá mặc định (ban đầu 1.200 đ/con), chọn đội trưởng bằng tài khoản liên kết hồ sơ nhân viên. Có thể để chưa bổ nhiệm.
2. Admin phân công nhân viên vào đội. Chuyển đội trưởng sang đội khác bằng thao tác phân công thông thường sẽ gỡ chức đội trưởng ở đội cũ; muốn bổ nhiệm ở đội mới cần chọn rõ đội trưởng.
3. Để đặt giá riêng một ngày chưa chấm công: mở **Chấm công ngày**, chọn đội và ngày, chọn **Tùy chỉnh giá**, nhập giá rồi bấm **Lưu đơn giá ngày cho đội (chưa lưu chấm công)**. Giá này chỉ áp dụng đúng ngày được chọn; những ngày khác dùng giá mặc định.
4. Đội trưởng chấm công mới cho đội của mình theo giá Admin đặt, xem bảng lương toàn đội. Sau khi lưu, chỉ Admin được sửa/xóa; ngày đã chốt cần mở sổ trước.
5. Nhân viên sử dụng **Lương cá nhân**, xem số tiền và giá đ/con từng ngày, cập nhật hồ sơ cá nhân qua menu tài khoản.

## Bảo toàn lịch sử

- Bản ghi ngày giữ mã đội, tên đội, danh sách nhân viên, tên/vai trò tại ngày lưu, đơn giá, tỷ lệ tính lương và số tiền từng người.
- Đổi đơn giá mặc định, chuyển nhóm hoặc xóa hồ sơ không tính lại bản ghi ngày. Bảng lương tháng lấy danh sách từ bản ghi đã lưu nên vẫn hiển thị nhân viên đã chuyển đội hoặc bị xóa.
- Admin chủ động lưu sửa một ngày chưa chốt vẫn thay đổi bản ghi đó. Danh sách của ngày cũ lấy từ bản ghi cũ, không tự thay bằng nhân sự hiện tại.
- Dữ liệu cũ không có giá mặc định riêng cho đội dùng 1.200 đ/con. Giá trong các bản ghi chấm công cũ giữ nguyên. Tỷ lệ của bản ghi cũ khi sửa lấy cấu hình đã liên kết nếu còn tồn tại.
- Liên kết đội trưởng dùng **ID tài khoản**, không ghép theo tên. Đội cũ chỉ lưu tên đội trưởng cần được Admin bổ nhiệm lại một lần.

## Kiểm chứng và giới hạn vận hành

- 22 kiểm thử tự động: tính lương, CSV, đồng bộ, chuyển/bỏ đội, thay đội trưởng, người trùng tên và danh sách lịch sử.
- Kiểm tra trình duyệt với ba vai trò, tạo đội có giá riêng, chuyển đội trưởng và đối chiếu lịch sử không đổi. Mọi yêu cầu mạng ngoài localhost đều bị chặn khi thử.
- `npm run lint`, `npm test`, `npm run build`.
- Kiểm thử trình duyệt bổ sung: chạy Vite ở cổng 4173, có Playwright và Chromium; chạy `node tests/teams.browser.cjs`. Có thể đặt `PLAYWRIGHT_MODULE` và `CHROME_PATH` để dùng runtime sẵn có.
- Cập nhật đội/nhân viên/tài khoản được gửi chung một Firestore write batch. Giao diện vẫn lưu cục bộ trước khi máy chủ xác nhận; khi báo lỗi đồng bộ, cần khôi phục kết nối và đối chiếu dữ liệu trước khi vận hành trên nhiều máy. Chưa có xử lý xung đột nhiều người ghi cùng lúc.
- **Phân quyền hiện được kiểm tra trong ứng dụng, chưa phải bảo mật phía máy chủ.** Mã nguồn hiện còn tài khoản/mật khẩu lưu dạng rõ và Firestore Rules mở. Trước khi đưa dữ liệu nhân sự/lương thật vào, cần chuyển sang Firebase Authentication, ánh xạ quyền bằng UID và triển khai Security Rules tương ứng. Chỉ đăng nhập Firebase CLI chưa hoàn tất bước này. Bản cập nhật này không triển khai Rules khóa đột ngột vì ứng dụng hiện chưa dùng Firebase Auth.
