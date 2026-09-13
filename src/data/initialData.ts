import {
  BangChamCongNgay,
  CauHinhLuong,
  NhanVien,
  NhatKyThayDoi,
  ThongTinDoanhNghiep,
} from '../types';
import { calculateDailyPayroll } from '../utils/payrollEngine';
import { getDayOfWeekVN } from '../utils/formatters';

export const THONG_TIN_CONG_TY: ThongTinDoanhNghiep = {
  tenCongTy: 'CÔNG TY TNHH COGAVA',
  mst: '3703421624',
  email: 'gavangcogava@gmail.com',
  vanPhong: 'Số nhà 26, tầng 3, Đường số 9, Dĩ An, Bình Dương',
  tongKho: '256/30 Nguyễn Tri Phương, Dĩ An, Bình Dương',
  hotline: ['0822.705.705', '0374.523.959', '0364.218.182'],
  linhVuc: 'Dịch vụ bắt gà — trả lương đội theo sản lượng ngày',
  mauChuDao: '#FF8000',
};

export const INITIAL_EMPLOYEES: NhanVien[] = [
  {
    id: 'emp-kien',
    hoTen: 'Kiên',
    vaiTro: 'CHINH',
    ngayVaoLam: '2026-01-01',
    sdt: '0912.345.678',
    stkNganHang: '1903688888999',
    tenNganHang: 'Techcombank (CN Bình Dương)',
    trangThai: 'DANG_LAM',
  },
  {
    id: 'emp-sang',
    hoTen: 'Sáng',
    vaiTro: 'CHINH',
    ngayVaoLam: '2026-01-01',
    sdt: '0923.456.789',
    stkNganHang: '0421000123456',
    tenNganHang: 'Vietcombank (CN Dĩ An)',
    trangThai: 'DANG_LAM',
  },
  {
    id: 'emp-vu',
    hoTen: 'Vũ',
    vaiTro: 'CHINH',
    ngayVaoLam: '2026-01-01',
    sdt: '0934.567.890',
    stkNganHang: '1028749281',
    tenNganHang: 'MB Bank',
    trangThai: 'DANG_LAM',
  },
  {
    id: 'emp-dat',
    hoTen: 'Đạt',
    vaiTro: 'PHU',
    ngayVaoLam: '2026-02-15',
    sdt: '0945.678.901',
    stkNganHang: '9028471928',
    tenNganHang: 'BIDV (CN Đông Bình Dương)',
    trangThai: 'DANG_LAM',
  },
  {
    id: 'emp-toi',
    hoTen: 'Tỏi',
    vaiTro: 'PHU',
    ngayVaoLam: '2026-03-01',
    sdt: '0956.789.012',
    stkNganHang: '0382947192',
    tenNganHang: 'ACB',
    trangThai: 'DANG_LAM',
  },
];

export const INITIAL_CONFIGS: CauHinhLuong[] = [
  {
    id: 'cfg-2026-08',
    hieuLucTuNgay: '2026-08-01',
    tyLePhuChinh: 0.85,
    donGiaBinhQuan: 1200,
    ghiChu: 'Cấu hình chuẩn từ Excel Bang_luong_COGAVA (Tỷ lệ phụ: 85%, Đơn giá: 1.200 đ/con)',
    ngayTao: '2026-08-01 08:00:00',
    nguoiTao: 'Thạch (Admin)',
  },
];

// Helper để tạo bản ghi ngày với snapshot chuẩn
function createDayRecord(
  ngay: string,
  soGa: number,
  donGia: number,
  presentIds: string[],
  trangThai: 'NHAP' | 'DA_CHOT' = 'DA_CHOT'
): BangChamCongNgay {
  const employeeStatus = INITIAL_EMPLOYEES.map(emp => ({
    id: emp.id,
    hoTen: emp.hoTen,
    vaiTro: emp.vaiTro,
    coMat: presentIds.includes(emp.id),
  }));

  const calc = calculateDailyPayroll({
    soGa,
    donGia,
    tyLePhuChinh: 0.85,
    employees: employeeStatus,
  });

  return {
    id: `att-${ngay}`,
    ngay,
    thuTrongTuan: getDayOfWeekVN(ngay),
    soGaBatDuoc: soGa,
    donGiaApDung: donGia,
    cauHinhId: 'cfg-2026-08',
    tongLuongNgay: calc.tongLuongNgay,
    trangThai,
    nguoiCapNhat: 'Lê Đội Trưởng (Hiện trường)',
    thoiGianCapNhat: `${ngay} 18:30:00`,
    chiTiet: calc.chiTietLuong.map(c => ({
      id: `detail-${ngay}-${c.nhanVienId}`,
      banGhiNgayId: `att-${ngay}`,
      nhanVienId: c.nhanVienId,
      hoTen: c.hoTen,
      vaiTro: c.vaiTro,
      coMat: c.coMat,
      luongNhanDuoc: c.luongNhanDuoc,
    })),
  };
}

// Dữ liệu mẫu thực tế Tháng 8/2026 (đã chốt sổ) và Tháng 9/2026 (đang nhập)
export const INITIAL_ATTENDANCE_RECORDS: BangChamCongNgay[] = [
  // 3 ngày mẫu đối chiếu khớp trực tiếp Phụ lục B
  createDayRecord('2026-08-01', 1000, 1200, ['emp-kien', 'emp-sang', 'emp-vu', 'emp-dat', 'emp-toi'], 'DA_CHOT'),
  createDayRecord('2026-08-02', 700, 1200, ['emp-kien', 'emp-sang', 'emp-dat'], 'DA_CHOT'),
  createDayRecord('2026-08-03', 1000, 1200, ['emp-vu', 'emp-dat', 'emp-toi'], 'DA_CHOT'),
  // Các ngày tiếp theo trong tháng 8
  createDayRecord('2026-08-04', 1250, 1200, ['emp-kien', 'emp-sang', 'emp-vu', 'emp-dat', 'emp-toi'], 'DA_CHOT'),
  createDayRecord('2026-08-05', 900, 1200, ['emp-kien', 'emp-sang', 'emp-vu', 'emp-dat'], 'DA_CHOT'),
  createDayRecord('2026-08-06', 1100, 1200, ['emp-kien', 'emp-sang', 'emp-vu', 'emp-toi'], 'DA_CHOT'),
  createDayRecord('2026-08-07', 850, 1200, ['emp-kien', 'emp-vu', 'emp-dat', 'emp-toi'], 'DA_CHOT'),
  createDayRecord('2026-08-08', 1400, 1200, ['emp-kien', 'emp-sang', 'emp-vu', 'emp-dat', 'emp-toi'], 'DA_CHOT'),
  createDayRecord('2026-08-09', 650, 1200, ['emp-sang', 'emp-vu', 'emp-toi'], 'DA_CHOT'),
  createDayRecord('2026-08-10', 1300, 1200, ['emp-kien', 'emp-sang', 'emp-vu', 'emp-dat', 'emp-toi'], 'DA_CHOT'),
  createDayRecord('2026-08-11', 950, 1200, ['emp-kien', 'emp-sang', 'emp-vu', 'emp-dat'], 'DA_CHOT'),
  createDayRecord('2026-08-12', 1200, 1200, ['emp-kien', 'emp-sang', 'emp-dat', 'emp-toi'], 'DA_CHOT'),
  createDayRecord('2026-08-13', 1050, 1200, ['emp-kien', 'emp-vu', 'emp-dat', 'emp-toi'], 'DA_CHOT'),
  createDayRecord('2026-08-14', 1150, 1200, ['emp-sang', 'emp-vu', 'emp-dat', 'emp-toi'], 'DA_CHOT'),
  createDayRecord('2026-08-15', 1500, 1200, ['emp-kien', 'emp-sang', 'emp-vu', 'emp-dat', 'emp-toi'], 'DA_CHOT'),
  createDayRecord('2026-08-17', 980, 1200, ['emp-kien', 'emp-sang', 'emp-vu', 'emp-dat', 'emp-toi'], 'DA_CHOT'),
  createDayRecord('2026-08-18', 1120, 1200, ['emp-kien', 'emp-sang', 'emp-vu', 'emp-toi'], 'DA_CHOT'),
  createDayRecord('2026-08-19', 1350, 1200, ['emp-kien', 'emp-sang', 'emp-vu', 'emp-dat', 'emp-toi'], 'DA_CHOT'),
  createDayRecord('2026-08-20', 890, 1200, ['emp-kien', 'emp-vu', 'emp-dat'], 'DA_CHOT'),
  createDayRecord('2026-08-21', 1280, 1200, ['emp-kien', 'emp-sang', 'emp-vu', 'emp-dat', 'emp-toi'], 'DA_CHOT'),
  createDayRecord('2026-08-22', 1420, 1200, ['emp-kien', 'emp-sang', 'emp-vu', 'emp-dat', 'emp-toi'], 'DA_CHOT'),
  createDayRecord('2026-08-24', 920, 1200, ['emp-sang', 'emp-vu', 'emp-dat', 'emp-toi'], 'DA_CHOT'),
  createDayRecord('2026-08-25', 1080, 1200, ['emp-kien', 'emp-sang', 'emp-vu', 'emp-dat', 'emp-toi'], 'DA_CHOT'),
  createDayRecord('2026-08-26', 1160, 1200, ['emp-kien', 'emp-sang', 'emp-vu', 'emp-dat'], 'DA_CHOT'),
  createDayRecord('2026-08-27', 1240, 1200, ['emp-kien', 'emp-sang', 'emp-vu', 'emp-dat', 'emp-toi'], 'DA_CHOT'),
  createDayRecord('2026-08-28', 1310, 1200, ['emp-kien', 'emp-sang', 'emp-vu', 'emp-dat', 'emp-toi'], 'DA_CHOT'),
  createDayRecord('2026-08-29', 1450, 1200, ['emp-kien', 'emp-sang', 'emp-vu', 'emp-dat', 'emp-toi'], 'DA_CHOT'),
  createDayRecord('2026-08-31', 1000, 1200, ['emp-kien', 'emp-sang', 'emp-vu', 'emp-dat', 'emp-toi'], 'DA_CHOT'),

  // Tháng 9/2026 (Kỳ lương hiện hành - trạng thái ĐANG NHẬP / NHÁP)
  createDayRecord('2026-09-01', 1100, 1200, ['emp-kien', 'emp-sang', 'emp-vu', 'emp-dat', 'emp-toi'], 'NHAP'),
  createDayRecord('2026-09-02', 800, 1200, ['emp-kien', 'emp-sang', 'emp-dat', 'emp-toi'], 'NHAP'),
  createDayRecord('2026-09-03', 1250, 1200, ['emp-kien', 'emp-sang', 'emp-vu', 'emp-dat', 'emp-toi'], 'NHAP'),
  createDayRecord('2026-09-04', 1350, 1200, ['emp-kien', 'emp-sang', 'emp-vu', 'emp-dat', 'emp-toi'], 'NHAP'),
  createDayRecord('2026-09-05', 920, 1200, ['emp-kien', 'emp-vu', 'emp-dat', 'emp-toi'], 'NHAP'),
  createDayRecord('2026-09-07', 1050, 1200, ['emp-kien', 'emp-sang', 'emp-vu', 'emp-dat'], 'NHAP'),
  createDayRecord('2026-09-08', 1400, 1200, ['emp-kien', 'emp-sang', 'emp-vu', 'emp-dat', 'emp-toi'], 'NHAP'),
  createDayRecord('2026-09-09', 1150, 1200, ['emp-sang', 'emp-vu', 'emp-dat', 'emp-toi'], 'NHAP'),
  createDayRecord('2026-09-10', 1220, 1200, ['emp-kien', 'emp-sang', 'emp-vu', 'emp-dat', 'emp-toi'], 'NHAP'),
  createDayRecord('2026-09-11', 980, 1200, ['emp-kien', 'emp-sang', 'emp-vu', 'emp-dat'], 'NHAP'),
  createDayRecord('2026-09-12', 1300, 1200, ['emp-kien', 'emp-sang', 'emp-vu', 'emp-dat', 'emp-toi'], 'NHAP'),
];

export const INITIAL_AUDIT_LOGS: NhatKyThayDoi[] = [
  {
    id: 'log-001',
    bang: 'CauHinhLuong',
    banGhiId: 'cfg-2026-08',
    nguoiThucHien: 'Thạch',
    vaiTroNguoiThucHien: 'ADMIN',
    thoiGian: '2026-08-01 08:00:00',
    hanhDong: 'TAO',
    moTa: 'Khởi tạo cấu hình lương gốc (Đơn giá 1.200 đ/con, Tỷ lệ phụ 85%)',
    giaTriCu: null,
    giaTriMoi: { tyLePhuChinh: 0.85, donGiaBinhQuan: 1200, hieuLucTuNgay: '2026-08-01' },
  },
  {
    id: 'log-002',
    bang: 'BangChamCongNgay',
    banGhiId: 'month-2026-08',
    nguoiThucHien: 'Thạch',
    vaiTroNguoiThucHien: 'ADMIN',
    thoiGian: '2026-09-01 09:30:00',
    hanhDong: 'CHOT_SO',
    moTa: 'Khoá sổ bảng lương Tháng 08/2026 sau khi hoàn tất chi trả cho 5 nhân viên',
    giaTriCu: { trangThai: 'NHAP' },
    giaTriMoi: { trangThai: 'DA_CHOT' },
  },
  {
    id: 'log-003',
    bang: 'BangChamCongNgay',
    banGhiId: 'att-2026-09-12',
    nguoiThucHien: 'Lê Đội Trưởng',
    vaiTroNguoiThucHien: 'DOI_TRUONG',
    thoiGian: '2026-09-12 18:45:00',
    hanhDong: 'TAO',
    moTa: 'Chấm công và nhập sản lượng ngày 12/09/2026 (1.300 con gà, đủ 5 người)',
    giaTriCu: null,
    giaTriMoi: { soGa: 1300, donGia: 1200, tongLuong: 1560000, coMatCount: 5 },
  },
];
