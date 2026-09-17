export type VaiTroNhanVien = 'CHINH' | 'PHU';

export type TrangThaiNhanVien = 'DANG_LAM' | 'DA_NGHI';

export type TrangThaiChamCong = 'NHAP' | 'DA_CHOT';

export type HanhDongAudit = 
  | 'TAO' 
  | 'SUA' 
  | 'XOA' 
  | 'CHOT_SO' 
  | 'MO_LAI' 
  | 'CAP_NHAT_CAU_HINH';

export type VaiTroNguoiDung = 'ADMIN' | 'DOI_TRUONG' | 'NHAN_VIEN';

export interface ThongTinDoanhNghiep {
  tenCongTy: string;
  mst: string;
  email: string;
  vanPhong: string;
  tongKho: string;
  hotline: string[];
  linhVuc: string;
  mauChuDao: string;
}

export interface DoiNhanVien {
  id: string; // e.g. 'doi-1', 'doi-2'
  tenDoi: string; // e.g. 'Đội 1 - Dĩ An'
  doiTruongUserId?: string; // id UserAccount của đội trưởng
  doiTruongTen?: string; // Tên hiển thị của đội trưởng
  khuVuc?: string; // Khu vực hoạt động
  moTa?: string; // Mô tả đội
  ghiChu?: string;
  ngayTao?: string;
}

export interface NhanVien {
  id: string;
  hoTen: string;
  vaiTro: VaiTroNhanVien;
  doiId?: string; // Liên kết tới DoiNhanVien.id
  ngayVaoLam: string; // YYYY-MM-DD
  ngayNghiViec?: string | null;
  sdt?: string;
  soDienThoai?: string; // Alias for sdt
  stkNganHang?: string;
  tenNganHang?: string;
  soCccd?: string; // Số Căn cước công dân (12 số - không bắt buộc)
  cccdNgayCap?: string; // Ngày cấp CCCD (tuỳ chọn)
  cccdNoiCap?: string; // Nơi cấp (tuỳ chọn)
  cccdMatTruoc?: string; // Data URL ảnh mặt trước CCCD
  cccdMatSau?: string; // Data URL ảnh mặt sau CCCD
  trangThai: TrangThaiNhanVien;
}

export interface CauHinhLuong {
  id: string;
  hieuLucTuNgay: string; // YYYY-MM-DD
  tyLePhuChinh: number; // e.g. 0.85
  donGiaBinhQuan: number; // e.g. 1200
  ghiChu?: string;
  ngayTao: string;
  nguoiTao: string;
}

export interface ChiTietChamCong {
  id: string;
  banGhiNgayId: string;
  nhanVienId: string;
  hoTen: string;
  vaiTro: VaiTroNhanVien;
  coMat: boolean;
  luongNhanDuoc: number; // Snapshot tại thời điểm tính
}

export interface BangChamCongNgay {
  id: string;
  ngay: string; // YYYY-MM-DD
  doiId?: string; // Mã đội phụ trách (e.g. 'doi-1', 'doi-2')
  thuTrongTuan: string; // Thứ Hai, Thứ Ba...
  soGaBatDuoc: number;
  donGiaApDung: number; // Snapshot
  cauHinhId?: string;
  ghiChuDonGia?: string;
  tongLuongNgay: number; // soGaBatDuoc * donGiaApDung
  trangThai: TrangThaiChamCong;
  nguoiCapNhat: string;
  thoiGianCapNhat: string;
  chiTiet: ChiTietChamCong[];
}

export interface NhatKyThayDoi {
  id: string;
  bang: string;
  banGhiId: string;
  nguoiThucHien: string;
  vaiTroNguoiThucHien: VaiTroNguoiDung;
  thoiGian: string;
  hanhDong: HanhDongAudit;
  moTa: string;
  giaTriCu?: Record<string, unknown> | null;
  giaTriMoi?: Record<string, unknown> | null;
}

export interface UserAccount {
  id: string;
  username: string; // Tên đăng nhập (e.g. 'admin', 'doitruong', 'kien'...)
  password: string; // Mật khẩu tài khoản
  tenHienThi: string;
  vaiTro: VaiTroNguoiDung;
  nhanVienId?: string; // Liên kết hồ sơ nhân viên nếu là NHAN_VIEN
  doiId?: string; // Đội phụ trách (nếu là DOI_TRUONG hoặc NHAN_VIEN)
  avatar?: string; // Mã preset avatar hoặc Data URL ảnh
  sdt?: string;
  email?: string;
  soCccd?: string; // Số CCCD (không bắt buộc)
  cccdNgayCap?: string; // Ngày cấp CCCD
  cccdNoiCap?: string; // Nơi cấp
  cccdMatTruoc?: string; // Ảnh mặt trước CCCD
  cccdMatSau?: string; // Ảnh mặt sau CCCD
  ngayTao?: string;
}

export interface UserSession {
  id: string;
  username?: string;
  tenHienThi: string;
  vaiTro: VaiTroNguoiDung;
  nhanVienId?: string;
  doiId?: string; // Đội được phân công
  avatar?: string;
  soCccd?: string;
  cccdNgayCap?: string;
  cccdNoiCap?: string;
  cccdMatTruoc?: string;
  cccdMatSau?: string;
}

export interface PayrollCalculationInput {
  soGa: number;
  donGia: number;
  tyLePhuChinh: number;
  employees: {
    id: string;
    hoTen: string;
    vaiTro: VaiTroNhanVien;
    coMat: boolean;
  }[];
}

export interface PayrollCalculationResult {
  tongLuongNgay: number;
  soChinhDiLam: number;
  soPhuDiLam: number;
  soNguoiDiLam: number;
  luongTrungBinhMoiNguoi: number;
  luong1Phu: number;
  luong1Chinh: number;
  phanDuLamTron: number;
  chiTietLuong: {
    nhanVienId: string;
    hoTen: string;
    vaiTro: VaiTroNhanVien;
    coMat: boolean;
    luongNhanDuoc: number;
    duocCongPhanDu?: boolean;
  }[];
  kiemTraHopLe: boolean;
  tongLuongThucChia: number;
  chenhLech: number;
}
