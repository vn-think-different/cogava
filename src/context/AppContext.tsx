import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  BangChamCongNgay,
  CauHinhLuong,
  HanhDongAudit,
  NhanVien,
  NhatKyThayDoi,
  ThongTinDoanhNghiep,
  UserSession,
  VaiTroNhanVien,
  VaiTroNguoiDung,
} from '../types';
import {
  INITIAL_ATTENDANCE_RECORDS,
  INITIAL_AUDIT_LOGS,
  INITIAL_CONFIGS,
  INITIAL_EMPLOYEES,
  THONG_TIN_CONG_TY,
} from '../data/initialData';
import { calculateDailyPayroll } from '../utils/payrollEngine';
import { getDayOfWeekVN } from '../utils/formatters';

interface SaveAttendanceInput {
  ngay: string;
  soGa: number;
  donGia: number;
  ghiChuDonGia?: string;
  presentEmployeeIds: string[];
}

interface AppContextType {
  companyInfo: ThongTinDoanhNghiep;
  employees: NhanVien[];
  configs: CauHinhLuong[];
  attendanceRecords: BangChamCongNgay[];
  auditLogs: NhatKyThayDoi[];
  currentUser: UserSession;
  setCurrentUser: (user: UserSession) => void;
  availableUsers: UserSession[];
  isAuthenticated: boolean;
  login: (user: UserSession) => void;
  logout: () => void;
  
  // Nhận diện và chuyển đổi chế độ Máy tính (Desktop) & Điện thoại (Mobile)
  deviceMode: 'auto' | 'desktop' | 'mobile';
  setDeviceMode: (mode: 'auto' | 'desktop' | 'mobile') => void;
  isMobileView: boolean;
  
  // Nghiệp vụ cấu hình theo thời gian
  getConfigForDate: (dateStr: string) => CauHinhLuong;
  addConfig: (data: Omit<CauHinhLuong, 'id' | 'ngayTao' | 'nguoiTao'>) => void;
  
  // Quản lý nhân viên
  addEmployee: (data: Omit<NhanVien, 'id'>) => void;
  updateEmployee: (id: string, data: Partial<NhanVien>) => void;
  toggleEmployeeStatus: (id: string) => void;

  // Chấm công & tính lương
  saveDailyAttendance: (input: SaveAttendanceInput) => { success: boolean; message: string };
  deleteDailyAttendance: (id: string) => void;

  // Khoá sổ / Chốt lương
  isMonthLocked: (yearMonth: string) => boolean;
  lockMonth: (yearMonth: string) => void;
  unlockMonth: (yearMonth: string, lyDo: string) => void;

  // Tiện ích
  resetToSampleData: () => void;
}

const LOCAL_STORAGE_KEY_PREFIX = 'cogava_payroll_v1_';

export const AVAILABLE_USERS: UserSession[] = [
  {
    id: 'usr-admin',
    tenHienThi: 'Thạch',
    vaiTro: 'ADMIN',
  },
  {
    id: 'usr-captain',
    tenHienThi: 'Lê Đội Trưởng',
    vaiTro: 'DOI_TRUONG',
  },
  {
    id: 'usr-kien',
    tenHienThi: 'Kiên',
    vaiTro: 'NHAN_VIEN',
    nhanVienId: 'emp-kien',
  },
  {
    id: 'usr-dat',
    tenHienThi: 'Đạt',
    vaiTro: 'NHAN_VIEN',
    nhanVienId: 'emp-dat',
  },
];

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Employees state
  const [employees, setEmployees] = useState<NhanVien[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + 'employees');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_EMPLOYEES;
  });

  // 2. Configs state
  const [configs, setConfigs] = useState<CauHinhLuong[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + 'configs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_CONFIGS;
  });

  // 3. Attendance records state
  const [attendanceRecords, setAttendanceRecords] = useState<BangChamCongNgay[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + 'attendance');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_ATTENDANCE_RECORDS;
  });

  // 4. Audit logs state
  const [auditLogs, setAuditLogs] = useState<NhatKyThayDoi[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + 'audit');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_AUDIT_LOGS;
  });

  // 5. Authentication & Current User session
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + 'isAuthenticated') === 'true';
  });

  const [currentUser, setCurrentUserState] = useState<UserSession>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + 'currentUser');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.id === 'usr-admin') {
          return { ...parsed, tenHienThi: 'Thạch' };
        }
        return parsed;
      } catch (e) { console.error(e); }
    }
    return AVAILABLE_USERS[0];
  });

  const setCurrentUser = (user: UserSession) => {
    setCurrentUserState(user);
    localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + 'currentUser', JSON.stringify(user));
  };

  const login = (user: UserSession) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + 'isAuthenticated', 'true');
    localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + 'currentUser', JSON.stringify(user));
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(LOCAL_STORAGE_KEY_PREFIX + 'isAuthenticated');
  };

  // 6. Device Recognition (Desktop vs Mobile)
  const [deviceMode, setDeviceModeState] = useState<'auto' | 'desktop' | 'mobile'>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + 'deviceMode');
    return (saved as 'auto' | 'desktop' | 'mobile') || 'auto';
  });

  const [windowWidth, setWindowWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const setDeviceMode = (mode: 'auto' | 'desktop' | 'mobile') => {
    setDeviceModeState(mode);
    localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + 'deviceMode', mode);
  };

  // Active view: if user forces 'desktop', it will never show mobile bottom bar or mobile drawers
  const isMobileView = useMemo(() => {
    if (deviceMode === 'desktop') return false;
    if (deviceMode === 'mobile') return true;
    return windowWidth < 768; // Auto mode: only true if window is physically smaller than 768px
  }, [deviceMode, windowWidth]);

  // Persistence effects
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + 'employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + 'configs', JSON.stringify(configs));
  }, [configs]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + 'attendance', JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + 'audit', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + 'currentUser', JSON.stringify(currentUser));
  }, [currentUser]);

  // Helper tạo audit log
  const createAuditLog = (
    bang: string,
    banGhiId: string,
    hanhDong: HanhDongAudit,
    moTa: string,
    giaTriCu: Record<string, unknown> | null = null,
    giaTriMoi: Record<string, unknown> | null = null
  ) => {
    const now = new Date();
    const dateStr = now.toISOString().replace('T', ' ').substring(0, 19);
    const newLog: NhatKyThayDoi = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      bang,
      banGhiId,
      nguoiThucHien: currentUser.tenHienThi,
      vaiTroNguoiThucHien: currentUser.vaiTro,
      thoiGian: dateStr,
      hanhDong,
      moTa,
      giaTriCu,
      giaTriMoi,
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  /**
   * Lấy cấu hình áp dụng cho ngày dateStr (Mục 5.2):
   * Lấy bản ghi có hieu_luc_tu_ngay lớn nhất nhưng vẫn <= dateStr
   */
  const getConfigForDate = (dateStr: string): CauHinhLuong => {
    const validConfigs = configs
      .filter(c => c.hieuLucTuNgay <= dateStr)
      .sort((a, b) => b.hieuLucTuNgay.localeCompare(a.hieuLucTuNgay));

    if (validConfigs.length > 0) {
      return validConfigs[0];
    }
    // Fallback nếu ngày quá cũ: lấy cấu hình có ngày nhỏ nhất
    return [...configs].sort((a, b) => a.hieuLucTuNgay.localeCompare(b.hieuLucTuNgay))[0] || INITIAL_CONFIGS[0];
  };

  // Thêm cấu hình mới theo hiệu lực
  const addConfig = (data: Omit<CauHinhLuong, 'id' | 'ngayTao' | 'nguoiTao'>) => {
    const now = new Date();
    const dateStr = now.toISOString().replace('T', ' ').substring(0, 19);
    const newConfig: CauHinhLuong = {
      ...data,
      id: `cfg-${Date.now()}`,
      ngayTao: dateStr,
      nguoiTao: currentUser.tenHienThi,
    };

    setConfigs(prev => [...prev, newConfig]);
    createAuditLog(
      'CauHinhLuong',
      newConfig.id,
      'CAP_NHAT_CAU_HINH',
      `Tạo cấu hình lương mới: Áp dụng từ ngày ${data.hieuLucTuNgay}, đơn giá ${data.donGiaBinhQuan}đ, tỷ lệ phụ ${(data.tyLePhuChinh * 100).toFixed(0)}%`,
      null,
      { ...data }
    );
  };

  // Quản lý nhân viên
  const addEmployee = (data: Omit<NhanVien, 'id'>) => {
    const newEmp: NhanVien = {
      ...data,
      id: `emp-${Date.now()}`,
    };
    setEmployees(prev => [...prev, newEmp]);
    createAuditLog(
      'NhanVien',
      newEmp.id,
      'TAO',
      `Thêm nhân viên mới: ${newEmp.hoTen} (${newEmp.vaiTro === 'CHINH' ? 'Lương chính' : 'Lương phụ'})`,
      null,
      { ...newEmp }
    );
  };

  const updateEmployee = (id: string, data: Partial<NhanVien>) => {
    const currentEmp = employees.find(e => e.id === id);
    if (!currentEmp) return;

    setEmployees(prev =>
      prev.map(emp => (emp.id === id ? { ...emp, ...data } : emp))
    );
    createAuditLog(
      'NhanVien',
      id,
      'SUA',
      `Cập nhật thông tin nhân viên: ${currentEmp.hoTen}`,
      { ...currentEmp },
      { ...data }
    );
  };

  const toggleEmployeeStatus = (id: string) => {
    const currentEmp = employees.find(e => e.id === id);
    if (!currentEmp) return;

    const newStatus = currentEmp.trangThai === 'DANG_LAM' ? 'DA_NGHI' : 'DANG_LAM';
    const todayStr = new Date().toISOString().substring(0, 10);

    setEmployees(prev =>
      prev.map(emp =>
        emp.id === id
          ? {
              ...emp,
              trangThai: newStatus,
              ngayNghiViec: newStatus === 'DA_NGHI' ? todayStr : null,
            }
          : emp
      )
    );
    createAuditLog(
      'NhanVien',
      id,
      'SUA',
      `Đổi trạng thái nhân viên ${currentEmp.hoTen}: ${newStatus === 'DANG_LAM' ? 'Đang làm việc' : 'Đã nghỉ việc'}`,
      { trangThai: currentEmp.trangThai },
      { trangThai: newStatus }
    );
  };

  // Kiểm tra tháng đã khoá sổ chưa
  const isMonthLocked = (yearMonth: string): boolean => {
    const recordsInMonth = attendanceRecords.filter(r => r.ngay.startsWith(yearMonth));
    if (recordsInMonth.length === 0) return false;
    return recordsInMonth.every(r => r.trangThai === 'DA_CHOT');
  };

  // Khoá sổ tháng
  const lockMonth = (yearMonth: string) => {
    setAttendanceRecords(prev =>
      prev.map(rec =>
        rec.ngay.startsWith(yearMonth) ? { ...rec, trangThai: 'DA_CHOT' } : rec
      )
    );
    createAuditLog(
      'BangChamCongNgay',
      `month-${yearMonth}`,
      'CHOT_SO',
      `Khoá sổ (chốt lương) tháng ${yearMonth.substring(5, 7)}/${yearMonth.substring(0, 4)}`,
      { trangThai: 'NHAP' },
      { trangThai: 'DA_CHOT' }
    );
  };

  // Mở lại sổ tháng (chỉ Admin, bắt buộc ghi lý do vào Audit Log)
  const unlockMonth = (yearMonth: string, lyDo: string) => {
    setAttendanceRecords(prev =>
      prev.map(rec =>
        rec.ngay.startsWith(yearMonth) ? { ...rec, trangThai: 'NHAP' } : rec
      )
    );
    createAuditLog(
      'BangChamCongNgay',
      `month-${yearMonth}`,
      'MO_LAI',
      `Mở lại sổ tháng ${yearMonth.substring(5, 7)}/${yearMonth.substring(0, 4)}. Lý do: "${lyDo}"`,
      { trangThai: 'DA_CHOT' },
      { trangThai: 'NHAP', lyDo }
    );
  };

  /**
   * Lưu dữ liệu chấm công & sản lượng theo ngày:
   * - Tính lương và lưu giá trị snapshot vĩnh viễn (khắc phục rủi ro #1)
   * - Kiểm tra khoá sổ
   * - Ghi audit log
   */
  const saveDailyAttendance = (input: SaveAttendanceInput): { success: boolean; message: string } => {
    const { ngay, soGa, donGia, ghiChuDonGia, presentEmployeeIds } = input;
    const yearMonth = ngay.substring(0, 7);

    // Kiểm tra khoá sổ
    const existing = attendanceRecords.find(r => r.ngay === ngay);
    if (existing && existing.trangThai === 'DA_CHOT') {
      if (currentUser.vaiTro !== 'ADMIN') {
        return {
          success: false,
          message: 'Ngày này đã được khoá sổ (chốt lương). Chỉ Quản trị viên mới có quyền can thiệp!',
        };
      }
    }

    // Lấy danh sách nhân viên đang làm (hoặc nhân viên có mặt nếu có nhân viên cũ)
    const activeEmployees = employees.filter(e => e.trangThai === 'DANG_LAM' || presentEmployeeIds.includes(e.id));
    const effectiveConfig = getConfigForDate(ngay);

    // Chuẩn bị đầu vào cho engine
    const engineInput = activeEmployees.map(emp => ({
      id: emp.id,
      hoTen: emp.hoTen,
      vaiTro: emp.vaiTro,
      coMat: presentEmployeeIds.includes(emp.id),
    }));

    // Chạy engine tính lương COGAVA
    const result = calculateDailyPayroll({
      soGa,
      donGia,
      tyLePhuChinh: effectiveConfig.tyLePhuChinh,
      employees: engineInput,
    });

    if (!result.kiemTraHopLe) {
      return {
        success: false,
        message: `Phát hiện lỗi sai lệch làm tròn (${result.chenhLech}đ). Không thể lưu bản ghi!`,
      };
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const recordId = existing ? existing.id : `att-${ngay}`;
    const newRecord: BangChamCongNgay = {
      id: recordId,
      ngay,
      thuTrongTuan: getDayOfWeekVN(ngay),
      soGaBatDuoc: soGa,
      donGiaApDung: donGia, // Snapshot
      cauHinhId: effectiveConfig.id,
      ghiChuDonGia,
      tongLuongNgay: result.tongLuongNgay,
      trangThai: existing ? existing.trangThai : 'NHAP',
      nguoiCapNhat: currentUser.tenHienThi,
      thoiGianCapNhat: nowStr,
      chiTiet: result.chiTietLuong.map(c => ({
        id: `detail-${ngay}-${c.nhanVienId}`,
        banGhiNgayId: recordId,
        nhanVienId: c.nhanVienId,
        hoTen: c.hoTen,
        vaiTro: c.vaiTro,
        coMat: c.coMat,
        luongNhanDuoc: c.luongNhanDuoc, // Snapshot cố định
      })),
    };

    setAttendanceRecords(prev => {
      const idx = prev.findIndex(r => r.ngay === ngay);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newRecord;
        return copy;
      }
      return [...prev, newRecord].sort((a, b) => a.ngay.localeCompare(b.ngay));
    });

    createAuditLog(
      'BangChamCongNgay',
      recordId,
      existing ? 'SUA' : 'TAO',
      `${existing ? 'Cập nhật' : 'Nhập mới'} chấm công ngày ${ngay} (${soGa.toLocaleString('vi-VN')} con gà, ${presentEmployeeIds.length} người có mặt, quỹ lương: ${result.tongLuongNgay.toLocaleString('vi-VN')}đ)`,
      existing ? { soGa: existing.soGaBatDuoc, tongLuong: existing.tongLuongNgay } : null,
      { soGa, donGia, tongLuong: result.tongLuongNgay, coMatCount: presentEmployeeIds.length }
    );

    return {
      success: true,
      message: `Đã lưu thành công dữ liệu ngày ${ngay}! Tổng lương ngày: ${result.tongLuongNgay.toLocaleString('vi-VN')} đ`,
    };
  };

  const deleteDailyAttendance = (id: string) => {
    const target = attendanceRecords.find(r => r.id === id);
    if (!target) return;

    if (target.trangThai === 'DA_CHOT' && currentUser.vaiTro !== 'ADMIN') {
      alert('Không thể xoá bản ghi đã chốt sổ!');
      return;
    }

    setAttendanceRecords(prev => prev.filter(r => r.id !== id));
    createAuditLog(
      'BangChamCongNgay',
      id,
      'XOA',
      `Xoá bản ghi chấm công ngày ${target.ngay}`,
      { ...target },
      null
    );
  };

  const resetToSampleData = () => {
    if (window.confirm('Khôi phục toàn bộ dữ liệu mẫu ban đầu từ file Excel COGAVA? Thao tác này sẽ đặt lại các sửa đổi.')) {
      setEmployees(INITIAL_EMPLOYEES);
      setConfigs(INITIAL_CONFIGS);
      setAttendanceRecords(INITIAL_ATTENDANCE_RECORDS);
      setAuditLogs(INITIAL_AUDIT_LOGS);
      setCurrentUser(AVAILABLE_USERS[0]);
      localStorage.clear();
      window.location.reload();
    }
  };

  const value: AppContextType = {
    companyInfo: THONG_TIN_CONG_TY,
    employees,
    configs,
    attendanceRecords,
    auditLogs,
    currentUser,
    setCurrentUser,
    availableUsers: AVAILABLE_USERS,
    isAuthenticated,
    login,
    logout,
    deviceMode,
    setDeviceMode,
    isMobileView,
    getConfigForDate,
    addConfig,
    addEmployee,
    updateEmployee,
    toggleEmployeeStatus,
    saveDailyAttendance,
    deleteDailyAttendance,
    isMonthLocked,
    lockMonth,
    unlockMonth,
    resetToSampleData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
