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

export interface NhanVien {
  id: string;
  hoTen: string;
  vaiTro: VaiTroNhanVien;
  ngayVaoLam: string; // YYYY-MM-DD
  ngayNghiViec?: string | null;
  sdt?: string;
  stkNganHang?: string;
  tenNganHang?: string;
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
  ngay: string; // YYYY-MM-DD (unique)
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

export interface UserSession {
  id: string;
  tenHienThi: string;
  vaiTro: VaiTroNguoiDung;
  nhanVienId?: string;
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
