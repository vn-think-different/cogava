import {
  BangChamCongNgay,
  CauHinhLuong,
  DoiNhanVien,
  NhanVien,
  NhatKyThayDoi,
  ThongTinDoanhNghiep,
} from '../types';
import { calculateDailyPayroll } from '../utils/payrollEngine';
import { getDayOfWeekVN } from '../utils/formatters';
import { createSampleCccdFront, createSampleCccdBack } from '../utils/cccdHelper';

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

export const DEFAULT_TEAMS: DoiNhanVien[] = [];

export const INITIAL_EMPLOYEES: NhanVien[] = [];

export const INITIAL_CONFIGS: CauHinhLuong[] = [
  {
    id: 'cfg-2026-08',
    hieuLucTuNgay: '2026-01-01',
    tyLePhuChinh: 0.85,
    donGiaBinhQuan: 1200,
    ghiChu: 'Cấu hình chuẩn hệ thống COGAVA (Tỷ lệ phụ: 85%, Đơn giá bình quân: 1.200 đ/con)',
    ngayTao: '2026-01-01 08:00:00',
    nguoiTao: 'Thạch (Admin)',
  },
];

export const INITIAL_ATTENDANCE_RECORDS: BangChamCongNgay[] = [];

export const INITIAL_AUDIT_LOGS: NhatKyThayDoi[] = [
  {
    id: 'log-001',
    bang: 'HeThong',
    banGhiId: 'sys-init',
    nguoiThucHien: 'Thạch',
    vaiTroNguoiThucHien: 'ADMIN',
    thoiGian: '2026-01-01 08:00:00',
    hanhDong: 'TAO',
    moTa: 'Khởi tạo hệ thống quản trị bảng lương và chấm công COGAVA',
    giaTriCu: null,
    giaTriMoi: { trangThai: 'HOAT_DONG' },
  },
];
