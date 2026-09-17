# COGAVA — Chấm công và tính lương

Ứng dụng React/TypeScript quản lý đội, nhân sự, chấm công sản lượng và tổng hợp lương.

## Chạy và kiểm tra

Yêu cầu Node.js 24 và npm. Dùng `package-lock.json` để cài đặt tái lập:

```sh
npm ci --ignore-scripts
npm run dev
npm run lint
npm test
npm run build
```

`lint` hiện kiểm tra kiểu TypeScript. Kiểm thử dùng Node test runner, module mocks và tsx, không truy cập Firebase thật. GitHub Actions chạy kiểm tra kiểu, kiểm thử và build cho mỗi push/PR. `bun.lock` là lockfile cũ; CI sử dụng npm.

## Quy tắc lương hiện được giữ nguyên

- Quỹ lương = làm tròn(sản lượng × đơn giá).
- Khi có Chính: lương mỗi Phụ = làm tròn(lương trung bình × tỷ lệ). Đây là tỷ lệ trên **lương trung bình**, không phải 85% lương một người Chính.
- Phần còn lại chia cho Chính; phần dư chia nguyên đồng cộng vào người Chính đầu tiên.
- Nếu chỉ có Phụ: chia đều và cộng dư cho Phụ đầu tiên.
- Với quỹ rất nhỏ, giới hạn tiền trả Phụ để không tạo lương Chính âm.
- Không chấp nhận sản lượng âm/lẻ, NaN/Infinity, tỷ lệ ngoài 0–1, mã nhân viên trùng hoặc số tiền vượt giới hạn số nguyên an toàn.
- Có quỹ lương nhưng không có người đi làm là không hợp lệ. Quỹ bằng 0 vẫn giữ số người có mặt.
- Bản ghi đã chốt cần mở lại sổ có lý do trước khi sửa/xóa, kể cả Admin.

## Giới hạn trước khi dùng dữ liệu thật

**Bản này chưa đủ điều kiện bảo mật để triển khai dữ liệu nhân sự/lương thật.** Xem [báo cáo rà soát](docs/REVIEW-2026-09-17.md). Đăng nhập vẫn là cơ chế cũ ở trình duyệt, dữ liệu tài khoản còn chứa mật khẩu và `firestore.rules` hiện cho phép truy cập công khai. Các kiểm tra quyền trong React hỗ trợ luồng thao tác, không thay thế xác thực/phân quyền tại máy chủ.

Repo sử dụng cấu hình Firebase trong `firebase-applet-config.json`. Mở ứng dụng hiện có thể khởi tạo dữ liệu mặc định lên project này. Chỉ kiểm thử với project biệt lập hoặc chặn toàn bộ yêu cầu mạng ngoài localhost. Không nhập CCCD, ảnh giấy tờ hoặc dữ liệu lương thật trước khi hoàn tất chuyển đổi bảo mật.

## Thương hiệu

Màn hình đăng nhập sử dụng logo sẵn có trong repo. Tham khảo [website COGAVA](https://cogava.com) và [trang kênh mạng xã hội chính thức](https://cogava.com/mang-xa-hoi-cogava/). Thông tin pháp nhân, mã số thuế và địa chỉ trong dữ liệu gốc cần chủ doanh nghiệp xác nhận trước khi dùng làm chứng từ.
