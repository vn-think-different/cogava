import { assignRole, moveEmployee, teamPrice, Organization } from '../utils/teamManagement';
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  BangChamCongNgay,
  CauHinhLuong,
  DoiNhanVien,
  HanhDongAudit,
  NhanVien,
  NhatKyThayDoi,
  ThongTinDoanhNghiep,
  UserAccount,
  UserSession,
  VaiTroNguoiDung,
  TrangThaiNhanVien,
  TrangThaiChamCong,
} from '../types';
import { THONG_TIN_CONG_TY, DEFAULT_TEAMS, INITIAL_CONFIGS } from '../data/initialData';
import { calculateDailyPayroll } from '../utils/payrollEngine';
import { canManageTeam, isValidDate, validatePayrollNumbers } from '../utils/attendanceValidation';
import { getDayOfWeekVN } from '../utils/formatters';
import { PayrollDatabase, DEFAULT_USER_ACCOUNTS } from '../services/payrollDatabase';
import { FirestoreSyncService } from '../services/firestoreSync';

interface SaveAttendanceInput {
  ngay: string;
  doiId?: string;
  soGa: number;
  donGia: number;
  ghiChuDonGia?: string;
  presentEmployeeIds: string[];
}

interface AppContextType {
  companyInfo: ThongTinDoanhNghiep;
  isCloudSynced: boolean;
  employees: NhanVien[];
  teams: DoiNhanVien[];
  configs: CauHinhLuong[];
  attendanceRecords: BangChamCongNgay[];
  auditLogs: NhatKyThayDoi[];
  userAccounts: UserAccount[];
  currentUser: UserSession;
  setCurrentUser: (user: UserSession | ((prev: UserSession) => UserSession)) => void;
  availableUsers: UserSession[];
  isAuthenticated: boolean;
  login: (user: UserSession) => void;
  loginWithCredentials: (username: string, password: string) => { success: boolean; message: string; user?: UserSession };
  logout: () => void;

  // Quản lý Đội nhóm (Teams)
  addTeam: (data: Omit<DoiNhanVien, 'id' | 'ngayTao'>) => { success: boolean; message: string };
  updateTeam: (id: string, data: Partial<DoiNhanVien>) => { success: boolean; message: string };
  deleteTeam: (id: string) => { success: boolean; message: string };
  assignEmployeeToTeam: (empId: string, teamId: string) => void;

  // Quản lý tài khoản & phân quyền
  updateCurrentUserAvatar: (avatar: string) => { success: boolean; message: string };
  updateCurrentUserProfile: (data: Partial<Pick<UserAccount, 'tenHienThi' | 'sdt' | 'email' | 'soCccd' | 'cccdNgayCap' | 'cccdNoiCap' | 'cccdMatTruoc' | 'cccdMatSau'>>) => { success: boolean; message: string };
  changeUserPassword: (matKhauCu: string, matKhauMoi: string) => { success: boolean; message: string };
  adminResetUserPassword: (userId: string, newPassword?: string) => { success: boolean; message: string };
  addUserAccount: (data: Omit<UserAccount, 'id' | 'ngayTao'>) => { success: boolean; message: string };
  updateUserRoleAndTeam: (userId: string, vaiTro: VaiTroNguoiDung, doiId?: string) => { success: boolean; message: string };
  deleteUserAccount: (userId: string) => { success: boolean; message: string };

  // Quản lý CSDL bảng lương: CSDL Trắng để kiểm thử & nạp mẫu
  clearAttendanceToBlank: () => { success: boolean; message: string };
  loadSampleExcelAttendance: () => void;

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
  deleteEmployee: (id: string) => { success: boolean; message: string };
  toggleEmployeeStatus: (id: string) => void;
  appointCaptain: (teamId: string, empId: string) => { success: boolean; message: string };

  // Chấm công & tính lương
  saveDailyAttendance: (input: SaveAttendanceInput) => { success: boolean; message: string };
  deleteDailyAttendance: (id: string) => void;

  // Khoá sổ / Chốt lương
  isMonthLocked: (yearMonth: string) => boolean;
  lockMonth: (yearMonth: string) => void;
  unlockMonth: (yearMonth: string, lyDo: string) => void;

  // Quản lý Tab hiển thị toàn hệ thống
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Trạng thái đồng bộ Cloud & Tự động đồng bộ
  isSyncingCloud: boolean;
  syncFromCloud: () => Promise<void>;

  // Cảnh báo bảo vệ đăng nhập đơn thiết bị
  sessionConflictInfo: {
    isOpen: boolean;
    deviceName: string;
    loginAt: string;
  };
  closeSessionConflictModal: () => void;

  // Tiện ích
  resetToSampleData: () => void;
}

const LOCAL_STORAGE_SESSION_KEY = 'cogava_payroll_auth_session_v3';

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. User Accounts State (CSDL Tài khoản người dùng)
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>(() => {
    return PayrollDatabase.getUserAccounts();
  });

  // 2. Employees state (CSDL Nhân viên)
  const [employees, setEmployees] = useState<NhanVien[]>(() => {
    return PayrollDatabase.getEmployees();
  });

  // 2.1 Teams state (CSDL Đội nhóm)
  const [teams, setTeams] = useState<DoiNhanVien[]>(() => {
    return PayrollDatabase.getTeams();
  });

  // 3. Configs state (CSDL Cấu hình đơn giá & công thức)
  const [configs, setConfigs] = useState<CauHinhLuong[]>(() => {
    return PayrollDatabase.getConfigs();
  });

  // 4. Attendance records state (CSDL Bảng chấm công ngày - MẶC ĐỊNH LÀ CSDL TRẮNG ĐỂ KIỂM THỬ)
  const [attendanceRecords, setAttendanceRecords] = useState<BangChamCongNgay[]>(() => {
    return PayrollDatabase.getAttendanceRecords();
  });

  // 5. Audit logs state (CSDL Nhật ký kiểm toán)
  const [auditLogs, setAuditLogs] = useState<NhatKyThayDoi[]>(() => {
    return PayrollDatabase.getAuditLogs();
  });

  // Cloud Synchronization Status
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(false);

  // Tab State
  const [activeTab, setActiveTabState] = useState<string>('dashboard');
  const setActiveTab = (tab: string) => {
    if (tab === 'NHAN_SU') {
      setActiveTabState('employees');
    } else {
      setActiveTabState(tab);
    }
  };

  // Cảnh báo xung đột đăng nhập (Single Device Session Protection)
  const [sessionConflictInfo, setSessionConflictInfo] = useState<{
    isOpen: boolean;
    deviceName: string;
    loginAt: string;
  }>({
    isOpen: false,
    deviceName: '',
    loginAt: '',
  });

  const closeSessionConflictModal = () => {
    setSessionConflictInfo(prev => ({ ...prev, isOpen: false }));
  };

  // Tự động đồng bộ toàn bộ CSDL từ Cloud Firestore
  const syncFromCloud = async () => {
    setIsSyncingCloud(true);
    try {
      // 1. Đảm bảo cấu hình và dữ liệu nền tảng có trên Cloud
      await FirestoreSyncService.ensureDefaultDataOnCloud({
        defaultTeams: DEFAULT_TEAMS,
        defaultUsers: DEFAULT_USER_ACCOUNTS,
        defaultConfigs: INITIAL_CONFIGS,
      });

      // 2. Tải dữ liệu mới nhất từ Cloud (Cloud Firestore là nguồn dữ liệu chuẩn)
      const cloudData = await FirestoreSyncService.syncAllDataFromCloud();

      // Empty collections are authoritative; never recreate deleted cloud data.
      setTeams(cloudData.teams);
      PayrollDatabase.saveTeams(cloudData.teams);
      setEmployees(cloudData.employees);
      PayrollDatabase.saveEmployees(cloudData.employees);

      if (cloudData.configs.length > 0) {
        setConfigs(cloudData.configs);
        PayrollDatabase.saveConfigs(cloudData.configs);
      }

      if (cloudData.users.length > 0) {
        setUserAccounts(cloudData.users);
        PayrollDatabase.saveUserAccounts(cloudData.users);
      }

      // Attendance records: Đồng bộ danh sách chấm công từ Cloud
      setAttendanceRecords(cloudData.attendanceRecords);
      PayrollDatabase.saveAttendanceRecords(cloudData.attendanceRecords);

      if (cloudData.auditLogs.length > 0) {
        setAuditLogs(cloudData.auditLogs);
        PayrollDatabase.saveAuditLogs(cloudData.auditLogs.slice(0, 100));
      }

      setIsCloudSynced(true);
    } catch (err) {
      setIsCloudSynced(false);
      console.warn('Lỗi khi đồng bộ dữ liệu từ Cloud Firestore:', err);
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // Initial Cloud Firestore Seeding & Realtime Listeners
  useEffect(() => {
    const handleSyncError = () => setIsCloudSynced(false);
    window.addEventListener('cogava:sync-error', handleSyncError);
    // 1. Initial Cloud seed if database collections are empty
    FirestoreSyncService.ensureDefaultDataOnCloud({
      defaultTeams: DEFAULT_TEAMS,
      defaultUsers: DEFAULT_USER_ACCOUNTS,
      defaultConfigs: INITIAL_CONFIGS,
    }).catch(err => console.warn('Firestore initial sync notice:', err));

    // 2. Real-time Subscriptions with Firestore
    const unsubTeams = FirestoreSyncService.subscribeTeams(cloudTeams => {
      setTeams(cloudTeams);
      PayrollDatabase.saveTeams(cloudTeams);

    });

    const unsubEmps = FirestoreSyncService.subscribeEmployees(cloudEmps => {
      setEmployees(cloudEmps);
      PayrollDatabase.saveEmployees(cloudEmps);

    });

    const unsubAtt = FirestoreSyncService.subscribeAttendance(cloudAtt => {
      setAttendanceRecords(cloudAtt);
      PayrollDatabase.saveAttendanceRecords(cloudAtt);

    });

    const unsubCfg = FirestoreSyncService.subscribeConfigs(cloudCfg => {
      if (cloudCfg.length > 0) {
        setConfigs(cloudCfg);
        PayrollDatabase.saveConfigs(cloudCfg);

      }
    });

    const unsubUsers = FirestoreSyncService.subscribeUsers(cloudUsers => {
        setUserAccounts(cloudUsers);
        PayrollDatabase.saveUserAccounts(cloudUsers);
    });

    const unsubAudit = FirestoreSyncService.subscribeAuditLogs(cloudLogs => {
      setAuditLogs(cloudLogs);
      PayrollDatabase.saveAuditLogs(cloudLogs.slice(0, 100));

    });

    return () => {
      window.removeEventListener('cogava:sync-error', handleSyncError);
      unsubTeams();
      unsubEmps();
      unsubAtt();
      unsubCfg();
      unsubUsers();
      unsubAudit();
    };
  }, []);

  // 6. Authentication & Session Management
  // Dùng sessionStorage để khi người dùng tắt tab hoặc thoát trình duyệt, hệ thống tự động đăng xuất!
  const SESSION_ACTIVE_KEY = 'cogava_payroll_auth_session_active';
  const SESSION_TOKEN_KEY = 'cogava_payroll_active_token';
  const SESSION_USER_KEY = 'cogava_payroll_auth_session_user';

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem(SESSION_ACTIVE_KEY) === 'true';
  });

  const [currentSessionToken, setCurrentSessionToken] = useState<string>(() => {
    return sessionStorage.getItem(SESSION_TOKEN_KEY) || '';
  });

  const [currentUser, setCurrentUserState] = useState<UserSession>(() => {
    const saved = sessionStorage.getItem(SESSION_USER_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    const adminAccount = userAccounts.find(u => u.vaiTro === 'ADMIN') || DEFAULT_USER_ACCOUNTS[0];
    return {
      id: adminAccount.id,
      username: adminAccount.username,
      tenHienThi: adminAccount.tenHienThi,
      vaiTro: adminAccount.vaiTro,
      doiId: adminAccount.doiId,
      avatar: adminAccount.avatar,
    };
  });

  // Dynamic available users derived from userAccounts
  const availableUsers: UserSession[] = useMemo(() => {
    return userAccounts.map(u => ({
      id: u.id,
      username: u.username,
      tenHienThi: u.tenHienThi,
      vaiTro: u.vaiTro,
      nhanVienId: u.nhanVienId,
      doiId: u.doiId,
      avatar: u.avatar,
    }));
  }, [userAccounts]);

  const setCurrentUser = (userOrUpdater: UserSession | ((prev: UserSession) => UserSession)) => {
    setCurrentUserState(prev => {
      const next = typeof userOrUpdater === 'function' ? userOrUpdater(prev) : userOrUpdater;
      sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(next));
      return next;
    });
  };

  const login = async (user: UserSession) => {
    const sessionToken = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setCurrentSessionToken(sessionToken);
    setCurrentUser(user);
    setIsAuthenticated(true);

    // Lưu vào sessionStorage để đảm bảo khi tắt trình duyệt sẽ tự động đăng xuất
    sessionStorage.setItem(SESSION_ACTIVE_KEY, 'true');
    sessionStorage.setItem(SESSION_TOKEN_KEY, sessionToken);
    sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));

    // Đặt tab mặc định theo vai trò
    setActiveTabState(user.vaiTro === 'NHAN_VIEN' ? 'portal' : 'dashboard');

    // 1. Đăng ký session trên Cloud Firestore để kiểm soát đăng nhập 1 thiết bị
    try {
      await FirestoreSyncService.registerActiveSession(user.id, sessionToken);
    } catch (err) {
      console.warn('Lỗi lưu session lên Firestore:', err);
    }

    // 2. Tự động đồng bộ toàn bộ dữ liệu Cloud sau khi đăng nhập
    syncFromCloud().catch(err => console.warn('Lỗi auto syncFromCloud khi đăng nhập:', err));
  };

  const loginWithCredentials = (
    username: string,
    passwordInput: string
  ): { success: boolean; message: string; user?: UserSession } => {
    const cleanUser = username.trim().toLowerCase();
    const account = userAccounts.find(u => u.username.toLowerCase() === cleanUser);

    if (!account) {
      return {
        success: false,
        message: `Tài khoản "${username}" không tồn tại trong hệ thống! Vui lòng kiểm tra lại.`,
      };
    }

    if (account.password !== passwordInput) {
      return {
        success: false,
        message: 'Mật khẩu không chính xác! Vui lòng thử lại hoặc liên hệ Quản trị viên.',
      };
    }

    const session: UserSession = {
      id: account.id,
      username: account.username,
      tenHienThi: account.tenHienThi,
      vaiTro: account.vaiTro,
      nhanVienId: account.nhanVienId,
      doiId: account.doiId,
      avatar: account.avatar,
    };

    return {
      success: true,
      message: `Đăng nhập thành công! Chào mừng ${account.tenHienThi}.`,
      user: session,
    };
  };

  const logout = async (isConflict = false) => {
    if (currentUser?.id && currentSessionToken && !isConflict) {
      try {
        await FirestoreSyncService.clearActiveSession(currentUser.id, currentSessionToken);
      } catch (e) {
        console.warn('Lỗi xóa session Firestore:', e);
      }
    }
    setIsAuthenticated(false);
    setCurrentSessionToken('');
    sessionStorage.removeItem(SESSION_ACTIVE_KEY);
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    sessionStorage.removeItem(SESSION_USER_KEY);
    localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY + '_active');
  };

  // Giám sát phiên đăng nhập đơn thiết bị thời gian thực
  // Nếu có thiết bị khác đăng nhập trùng tài khoản -> Tự động đăng xuất và cảnh báo
  useEffect(() => {
    if (!isAuthenticated || !currentUser?.id || !currentSessionToken) return;

    const unsubSession = FirestoreSyncService.subscribeActiveSession(
      currentUser.id,
      currentSessionToken,
      (conflictInfo) => {
        // Thiết bị khác đã đăng nhập!
        setSessionConflictInfo({
          isOpen: true,
          deviceName: conflictInfo.deviceName || 'Thiết bị khác',
          loginAt: conflictInfo.loginAt || new Date().toLocaleString('vi-VN'),
        });
        // Đăng xuất ngay lập tức khỏi thiết bị hiện tại
        logout(true);
      }
    );

    return () => {
      unsubSession();
    };
  }, [isAuthenticated, currentUser?.id, currentSessionToken]);

  // 7. Device Recognition (Desktop vs Mobile)
  const [deviceMode, setDeviceModeState] = useState<'auto' | 'desktop' | 'mobile'>(() => {
    const saved = localStorage.getItem('cogava_device_mode');
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
    localStorage.setItem('cogava_device_mode', mode);
  };

  const isMobileView = useMemo(() => {
    if (deviceMode === 'desktop') return false;
    if (deviceMode === 'mobile') return true;
    return windowWidth < 768;
  }, [deviceMode, windowWidth]);

  // Sync to database
  useEffect(() => {
    PayrollDatabase.saveUserAccounts(userAccounts);
  }, [userAccounts]);

  useEffect(() => {
    PayrollDatabase.saveEmployees(employees);
  }, [employees]);

  useEffect(() => {
    PayrollDatabase.saveConfigs(configs);
  }, [configs]);

  useEffect(() => {
    PayrollDatabase.saveAttendanceRecords(attendanceRecords);
  }, [attendanceRecords]);

  useEffect(() => {
    PayrollDatabase.saveAuditLogs(auditLogs);
  }, [auditLogs]);

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
    FirestoreSyncService.saveAuditLog(newLog).catch(e => console.warn('Cloud log save:', e));
  };

  // Quản lý Avatar & Hồ sơ cá nhân
  const updateCurrentUserAvatar = (avatar: string): { success: boolean; message: string } => {
    const result = PayrollDatabase.updateAvatar(currentUser.id, avatar);
    if (result.success && result.updatedUser) {
      setUserAccounts(prev =>
        prev.map(u => (u.id === currentUser.id ? { ...u, avatar } : u))
      );
      const updatedSession: UserSession = {
        ...currentUser,
        avatar,
      };
      setCurrentUser(updatedSession);
      FirestoreSyncService.saveUser(result.updatedUser).catch(e => console.warn('Cloud user save:', e));
      createAuditLog(
        'UserAccount',
        currentUser.id,
        'SUA',
        `Người dùng ${currentUser.tenHienThi} cập nhật ảnh đại diện mới`,
        { avatar: currentUser.avatar },
        { avatar }
      );
    }
    return result;
  };

  const updateCurrentUserProfile = (
    data: Partial<Pick<UserAccount, 'tenHienThi' | 'sdt' | 'email' | 'soCccd' | 'cccdNgayCap' | 'cccdNoiCap' | 'cccdMatTruoc' | 'cccdMatSau'>>
  ): { success: boolean; message: string } => {
    if (!isAuthenticated) return { success: false, message: 'Vui lòng đăng nhập.' };
    const allowedFields = ['tenHienThi', 'sdt', 'email', 'soCccd', 'cccdNgayCap', 'cccdNoiCap', 'cccdMatTruoc', 'cccdMatSau'];
    data = Object.fromEntries(Object.entries(data).filter(([key]) => allowedFields.includes(key)));
    const result = PayrollDatabase.updateProfile(currentUser.id, data);
    if (result.success && result.updatedUser) {
      setUserAccounts(prev =>
        prev.map(u => (u.id === currentUser.id ? { ...u, ...data } : u))
      );
      setCurrentUser(prev => ({
        ...prev,
        ...data,
      }));
      FirestoreSyncService.saveUser(result.updatedUser).catch(e => console.warn('Cloud user save:', e));

      // Đồng bộ sang bảng nhân viên nếu user được liên kết hồ sơ nhân viên
      if (currentUser.nhanVienId) {
        setEmployees(prevEmps => {
          const updated = prevEmps.map(emp => {
            if (emp.id === currentUser.nhanVienId) {
              const updatedEmp = {
                ...emp,
                ...(data.tenHienThi ? { hoTen: data.tenHienThi } : {}),
                ...(data.sdt !== undefined ? { sdt: data.sdt } : {}),
                ...(data.soCccd !== undefined ? { soCccd: data.soCccd } : {}),
                ...(data.cccdNgayCap !== undefined ? { cccdNgayCap: data.cccdNgayCap } : {}),
                ...(data.cccdNoiCap !== undefined ? { cccdNoiCap: data.cccdNoiCap } : {}),
                ...(data.cccdMatTruoc !== undefined ? { cccdMatTruoc: data.cccdMatTruoc } : {}),
                ...(data.cccdMatSau !== undefined ? { cccdMatSau: data.cccdMatSau } : {}),
              };
              FirestoreSyncService.saveEmployee(updatedEmp).catch(e => console.warn('Cloud emp save:', e));
              return updatedEmp;
            }
            return emp;
          });
          PayrollDatabase.saveEmployees(updated);
          return updated;
        });
      }

      createAuditLog(
        'UserAccount',
        currentUser.id,
        'SUA',
        `Cập nhật thông tin tài khoản & CCCD ${currentUser.tenHienThi}`,
        null,
        { ...data }
      );
    }
    return result;
  };

  // Đổi mật khẩu
  const changeUserPassword = (
    matKhauCu: string,
    matKhauMoi: string
  ): { success: boolean; message: string } => {
    const result = PayrollDatabase.changePassword(currentUser.id, matKhauCu, matKhauMoi);
    if (result.success) {
      const allUsers = PayrollDatabase.getUserAccounts();
      setUserAccounts(allUsers);
      const user = allUsers.find(u => u.id === currentUser.id);
      if (user) FirestoreSyncService.saveUser(user).catch(e => console.warn('Cloud pass save:', e));
      createAuditLog(
        'UserAccount',
        currentUser.id,
        'SUA',
        `Người dùng ${currentUser.tenHienThi} đã thay đổi mật khẩu đăng nhập`
      );
    }
    return result;
  };

  // Admin đặt lại mật khẩu cho tài khoản
  const adminResetUserPassword = (
    userId: string,
    newPassword = '123456'
  ): { success: boolean; message: string } => {
    if (!isAuthenticated || currentUser.vaiTro !== 'ADMIN') {
      return { success: false, message: 'Chỉ Quản trị viên mới có quyền đặt lại mật khẩu!' };
    }
    const result = PayrollDatabase.adminResetPassword(userId, newPassword);
    if (result.success) {
      const allUsers = PayrollDatabase.getUserAccounts();
      setUserAccounts(allUsers);
      const user = allUsers.find(u => u.id === userId);
      if (user) FirestoreSyncService.saveUser(user).catch(e => console.warn('Cloud pass reset save:', e));
      createAuditLog(
        'UserAccount',
        userId,
        'SUA',
        `Admin ${currentUser.tenHienThi} đặt lại mật khẩu cho tài khoản ${userId} `
      );
    }
    return result;
  };

  // Admin thêm tài khoản mới
  const addUserAccount = (data: Omit<UserAccount, 'id' | 'ngayTao'>) => organizationAction(state => {
    if (!data.username.trim() || state.users.some(u => u.username.toLowerCase() === data.username.trim().toLowerCase())) throw new Error('Tên đăng nhập trống hoặc đã tồn tại.');
    if (data.nhanVienId && state.users.some(u => u.nhanVienId === data.nhanVienId)) throw new Error('Nhân viên đã có tài khoản.');
    const user: UserAccount = { ...data, username: data.username.trim(), id: 'usr-' + crypto.randomUUID(), ngayTao: new Date().toISOString() };
    return assignRole({ ...state, users: [...state.users, user] }, user.id, data.vaiTro, data.doiId);
  });

  // Cập nhật phân quyền và đội nhóm cho tài khoản người dùng
  const organization = (): Organization => ({ teams: PayrollDatabase.getTeams(), employees: PayrollDatabase.getEmployees(), users: PayrollDatabase.getUserAccounts() });
  const persistOrganization = (before: Organization, next: Organization) => {
    PayrollDatabase.saveTeams(next.teams); PayrollDatabase.saveEmployees(next.employees); PayrollDatabase.saveUserAccounts(next.users);
    setTeams(next.teams); setEmployees(next.employees); setUserAccounts(next.users);
    FirestoreSyncService.saveOrganization(before, next).catch(e => console.warn('Cloud organization save:', e));
  };
  const organizationAction = (action: (state: Organization) => Organization) => {
    if (!isAuthenticated || currentUser.vaiTro !== 'ADMIN') return { success: false, message: 'Chỉ quản trị viên được quản lý đội và thành viên.' };
    try {
      const before = organization();
      const next = action(before);
      if (!next.users.some(u => u.vaiTro === 'ADMIN')) throw new Error('Phải giữ ít nhất một tài khoản quản trị.');
      persistOrganization(before, next);
      const changedIds = (key: keyof Organization) => [...new Set([...before[key], ...next[key]].map(item => item.id))].filter(id => JSON.stringify(before[key].find(item => item.id === id)) !== JSON.stringify(next[key].find(item => item.id === id)));
      createAuditLog('DoiNhanVien', 'organization', 'SUA', 'Cập nhật đội, nhân viên và phân quyền; giữ nguyên lịch sử chấm công.', null, { teams: changedIds('teams'), employees: changedIds('employees'), users: changedIds('users') });
      return { success: true, message: 'Đã cập nhật trên máy, đang đồng bộ. Lịch sử chấm công được giữ nguyên.' };
    }
    catch (error) { return { success: false, message: error instanceof Error ? error.message : 'Không thể cập nhật.' }; }
  };
  const updateUserRoleAndTeam = (userId: string, vaiTro: VaiTroNguoiDung, doiId?: string) => {
    const result = organizationAction(state => assignRole(state, userId, vaiTro, doiId));
    if (result.success) createAuditLog('UserAccount', userId, 'SUA', 'Cập nhật quyền và đội: ' + vaiTro + ' / ' + (doiId || 'Chưa phân đội'));
    return result;
  };

  // Admin xóa tài khoản
  const deleteUserAccount = (userId: string) => organizationAction(state => {
    if (userId === currentUser.id) throw new Error('Không thể xóa tài khoản đang đăng nhập.');
    return { ...state, users: state.users.filter(u => u.id !== userId), teams: state.teams.map(t => t.doiTruongUserId === userId ? { ...t, doiTruongUserId: '', doiTruongTen: '' } : t) };
  });

  // Xóa sạch CSDL chấm công về CSDL trắng để kiểm thử
  const clearAttendanceToBlank = (): { success: boolean; message: string } => {
    if (!isAuthenticated || currentUser.vaiTro !== 'ADMIN') return { success: false, message: 'Chỉ quản trị viên được xóa dữ liệu.' };
    const res = PayrollDatabase.clearAttendanceToBlank();
    setAttendanceRecords([]);
    FirestoreSyncService.clearAllAttendance().catch(e => console.warn('Cloud clear attendance:', e));
    createAuditLog(
      'BangChamCongNgay',
      'all',
      'XOA',
      'Xóa sạch toàn bộ CSDL chấm công để chuyển sang chế độ CSDL Trắng (0 bản ghi) phục vụ kiểm thử tính toán độc lập.'
    );
    return res;
  };

  // Nạp lại dữ liệu mẫu Excel 28 ngày
  const loadSampleExcelAttendance = () => {
    if (!isAuthenticated || currentUser.vaiTro !== 'ADMIN') return;
    const sampleRecords = PayrollDatabase.loadSampleExcelAttendance();
    setAttendanceRecords(sampleRecords);
    FirestoreSyncService.batchSaveAttendance(sampleRecords).catch(e => console.warn('Cloud load sample attendance:', e));
    createAuditLog(
      'BangChamCongNgay',
      'excel-import',
      'TAO',
      'Nạp 28 bản ghi chấm công mẫu từ file Excel Bang_luong_COGAVA để phục vụ đối chiếu công thức.'
    );
  };

  // Lấy cấu hình áp dụng cho ngày
  const getConfigForDate = (dateStr: string): CauHinhLuong => {
    const validConfigs = configs
      .filter(c => c.hieuLucTuNgay <= dateStr)
      .sort((a, b) => b.hieuLucTuNgay.localeCompare(a.hieuLucTuNgay));

    if (validConfigs.length > 0) {
      return validConfigs[0];
    }
    return [...configs].sort((a, b) => a.hieuLucTuNgay.localeCompare(b.hieuLucTuNgay))[0] || configs[0];
  };

  // Thêm cấu hình mới
  const addConfig = (data: Omit<CauHinhLuong, 'id' | 'ngayTao' | 'nguoiTao'>) => {
    if (!isAuthenticated || currentUser.vaiTro !== 'ADMIN') return;
    const now = new Date();
    const dateStr = now.toISOString().replace('T', ' ').substring(0, 19);
    const newConfig: CauHinhLuong = {
      ...data,
      id: `cfg-${Date.now()}`,
      ngayTao: dateStr,
      nguoiTao: currentUser.tenHienThi,
    };

    setConfigs(prev => [...prev, newConfig]);
    FirestoreSyncService.saveConfig(newConfig).catch(e => console.warn('Cloud config save:', e));
    createAuditLog(
      'CauHinhLuong',
      newConfig.id,
      'CAP_NHAT_CAU_HINH',
      `Tạo cấu hình lương mới: Áp dụng từ ngày ${data.hieuLucTuNgay}, đơn giá ${data.donGiaBinhQuan}đ, tỷ lệ phụ ${(data.tyLePhuChinh * 100).toFixed(0)}%`,
      null,
      { ...data }
    );
  };

  const saveTeam = (id: string, data: Partial<DoiNhanVien>, creating = false) => organizationAction(state => {
    const old = state.teams.find(t => t.id === id);
    if (!creating && !old) throw new Error('Không tìm thấy đội.');
    const name = (data.tenDoi ?? old?.tenDoi ?? '').trim();
    if (!name || state.teams.some(t => t.id !== id && t.tenDoi.trim().toLocaleLowerCase('vi') === name.toLocaleLowerCase('vi'))) throw new Error('Tên đội trống hoặc đã tồn tại.');
    const price = data.donGiaMacDinh ?? old?.donGiaMacDinh ?? 1200;
    if (!Number.isSafeInteger(price) || price < 0) throw new Error('Đơn giá phải là số nguyên không âm.');
    for (const [date, value] of Object.entries(data.donGiaTheoNgay ?? {})) if (!isValidDate(date) || !Number.isSafeInteger(value) || value < 0) throw new Error('Đơn giá theo ngày không hợp lệ.');
    const captainId = data.doiTruongUserId ?? old?.doiTruongUserId ?? '';
    const team: DoiNhanVien = { ...old, ...data, id, tenDoi: name, donGiaMacDinh: price, ngayTao: old?.ngayTao ?? new Date().toISOString(), doiTruongUserId: '', doiTruongTen: '' };
    let next: Organization = { ...state, teams: creating ? [...state.teams, team] : state.teams.map(t => t.id === id ? team : t), users: state.users.map(u => u.vaiTro === 'DOI_TRUONG' && u.doiId === id ? { ...u, vaiTro: 'NHAN_VIEN' } : u) };
    if (captainId) next = assignRole(next, captainId, 'DOI_TRUONG', id);
    return next;
  });
  const addTeam = (data: Omit<DoiNhanVien, 'id' | 'ngayTao'>) => saveTeam('doi-' + crypto.randomUUID(), data, true);
  const updateTeam = (id: string, data: Partial<DoiNhanVien>) => saveTeam(id, data);
  const deleteTeam = (id: string) => organizationAction(state => {
    if (!state.teams.some(t => t.id === id)) throw new Error('Không tìm thấy đội.');
    return { teams: state.teams.filter(t => t.id !== id), employees: state.employees.map(e => e.doiId === id ? { ...e, doiId: '' } : e), users: state.users.map(u => u.doiId === id ? { ...u, doiId: '', vaiTro: u.vaiTro === 'DOI_TRUONG' ? 'NHAN_VIEN' : u.vaiTro } : u) };
  });
  const assignEmployeeToTeam = (empId: string, teamId: string) => {
    const result = organizationAction(state => moveEmployee(state, empId, teamId));
    if (!result.success) alert(result.message);
  };

  // Quản lý nhân viên
  const addEmployee = (data: Omit<NhanVien, 'id'>) => {
    if (!isAuthenticated || currentUser.vaiTro !== 'ADMIN') return;
    const newId = 'emp-' + crypto.randomUUID();
    const assignedTeam = data.doiId || '';
    if (assignedTeam && !teams.some(t => t.id === assignedTeam)) return;
    const newEmp: NhanVien = {
      ...data,
      id: newId,
      doiId: assignedTeam,
    };


    // Tự động tạo tài khoản người dùng đăng nhập cho nhân viên mới
    let rawUsername = data.hoTen
      .toLowerCase()
      .replace(/đ/g, 'd').normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '') || `nv${Date.now().toString().slice(-4)}`;

    const baseUsername = rawUsername;
    let suffix = 1;
    while (PayrollDatabase.getUserAccounts().some(u => u.username.toLowerCase() === rawUsername)) rawUsername = baseUsername + suffix++;
    const userAccountData: Omit<UserAccount, 'id' | 'ngayTao'> = {
      username: rawUsername,
      password: '123456',
      tenHienThi: data.hoTen,
      vaiTro: 'NHAN_VIEN',
      nhanVienId: newId,
      doiId: assignedTeam,
      sdt: data.sdt,
      soCccd: data.soCccd,
      cccdNgayCap: data.cccdNgayCap,
      cccdNoiCap: data.cccdNoiCap,
      cccdMatTruoc: data.cccdMatTruoc,
      cccdMatSau: data.cccdMatSau,
      avatar: 'preset-worker-dat',
    };
    const result = organizationAction(state => ({ ...state, employees: [...state.employees, newEmp], users: [...state.users, { ...userAccountData, id: 'usr-' + crypto.randomUUID(), ngayTao: new Date().toISOString() }] }));
    if (!result.success) { alert(result.message); return; }

    createAuditLog(
      'NhanVien',
      newEmp.id,
      'TAO',
      `Thêm nhân viên mới: ${newEmp.hoTen} (${newEmp.vaiTro === 'CHINH' ? 'Lương chính' : 'Lương phụ'}). Đội: ${assignedTeam}. Đã cấp tài khoản: "${rawUsername}"`,
      null,
      { ...newEmp }
    );
  };

  const updateEmployee = (id: string, data: Partial<NhanVien>) => {
    const result = organizationAction(state => {
      const old = state.employees.find(e => e.id === id);
      if (!old) throw new Error('Không tìm thấy nhân viên.');
      let next = data.doiId !== undefined && data.doiId !== old.doiId ? moveEmployee(state, id, data.doiId) : state;
      if (data.trangThai === 'DA_NGHI') for (const user of next.users.filter(u => u.nhanVienId === id && u.vaiTro === 'DOI_TRUONG')) next = assignRole(next, user.id, 'NHAN_VIEN', user.doiId);
      const employee = { ...old, ...data, id };
      return { ...next, employees: next.employees.map(e => e.id === id ? employee : e), users: next.users.map(u => u.nhanVienId === id ? { ...u, tenHienThi: employee.hoTen, sdt: employee.sdt, soCccd: employee.soCccd, cccdNgayCap: employee.cccdNgayCap, cccdNoiCap: employee.cccdNoiCap, cccdMatTruoc: employee.cccdMatTruoc, cccdMatSau: employee.cccdMatSau } : u), teams: next.teams.map(t => next.users.some(u => u.id === t.doiTruongUserId && u.nhanVienId === id) ? { ...t, doiTruongTen: employee.hoTen } : t) };
    });
    if (!result.success) alert(result.message);
  };
  const deleteEmployee = (id: string) => organizationAction(state => {
    if (state.users.some(u => u.nhanVienId === id && u.id === currentUser.id)) throw new Error('Không thể xóa hồ sơ tài khoản đang đăng nhập.');
    const deletedUsers = state.users.filter(u => u.nhanVienId === id).map(u => u.id);
    return { employees: state.employees.filter(e => e.id !== id), users: state.users.filter(u => !deletedUsers.includes(u.id)), teams: state.teams.map(t => deletedUsers.includes(t.doiTruongUserId || '') ? { ...t, doiTruongUserId: '', doiTruongTen: '' } : t) };
  });

  const appointCaptain = (teamId: string, empId: string) => {
    const user = PayrollDatabase.getUserAccounts().find(u => u.nhanVienId === empId);
    if (!user || user.vaiTro === 'ADMIN') return { success: false, message: 'Chọn nhân viên đang làm việc có tài khoản nhân viên.' };
    return updateUserRoleAndTeam(user.id, 'DOI_TRUONG', teamId);
  };


  const toggleEmployeeStatus = (id: string) => {
    const employee = employees.find(e => e.id === id);
    if (!employee) return;
    updateEmployee(id, { trangThai: employee.trangThai === 'DANG_LAM' ? 'DA_NGHI' : 'DANG_LAM', ngayNghiViec: employee.trangThai === 'DANG_LAM' ? new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }) : null });
  };

  // Kiểm tra tháng đã khoá sổ chưa
  const isMonthLocked = (yearMonth: string): boolean => {
    const recordsInMonth = attendanceRecords.filter(r => r.ngay.startsWith(yearMonth));
    if (recordsInMonth.length === 0) return false;
    return recordsInMonth.every(r => r.trangThai === 'DA_CHOT');
  };

  // Khoá sổ tháng
  const lockMonth = (yearMonth: string) => {
    if (!isAuthenticated || currentUser.vaiTro !== 'ADMIN' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(yearMonth)) return;
    setAttendanceRecords(prev => {
      const updated: BangChamCongNgay[] = prev.map(rec =>
        rec.ngay.startsWith(yearMonth) ? { ...rec, trangThai: 'DA_CHOT' as TrangThaiChamCong } : rec
      );
      PayrollDatabase.saveAttendanceRecords(updated);
      const monthRecs = updated.filter(r => r.ngay.startsWith(yearMonth));
      FirestoreSyncService.batchSaveAttendance(monthRecs).catch(e => console.warn('Cloud lock month:', e));
      return updated;
    });
    createAuditLog(
      'BangChamCongNgay',
      `month-${yearMonth}`,
      'CHOT_SO',
      `Khoá sổ (chốt lương) tháng ${yearMonth.substring(5, 7)}/${yearMonth.substring(0, 4)}`,
      { trangThai: 'NHAP' },
      { trangThai: 'DA_CHOT' }
    );
  };

  // Mở lại sổ tháng (chỉ Admin)
  const unlockMonth = (yearMonth: string, lyDo: string) => {
    if (!isAuthenticated || currentUser.vaiTro !== 'ADMIN' || !lyDo.trim() || !/^\d{4}-(0[1-9]|1[0-2])$/.test(yearMonth)) return;
    setAttendanceRecords(prev => {
      const updated: BangChamCongNgay[] = prev.map(rec =>
        rec.ngay.startsWith(yearMonth) ? { ...rec, trangThai: 'NHAP' as TrangThaiChamCong } : rec
      );
      PayrollDatabase.saveAttendanceRecords(updated);
      const monthRecs = updated.filter(r => r.ngay.startsWith(yearMonth));
      FirestoreSyncService.batchSaveAttendance(monthRecs).catch(e => console.warn('Cloud unlock month:', e));
      return updated;
    });
    createAuditLog(
      'BangChamCongNgay',
      `month-${yearMonth}`,
      'MO_LAI',
      `Mở lại sổ tháng ${yearMonth.substring(5, 7)}/${yearMonth.substring(0, 4)}. Lý do: "${lyDo}"`,
      { trangThai: 'DA_CHOT' },
      { trangThai: 'NHAP', lyDo }
    );
  };

  // Lưu chấm công ngày (hỗ trợ theo đội)
  const saveDailyAttendance = (input: SaveAttendanceInput): { success: boolean; message: string } => {
    const { ngay, doiId, soGa, donGia, ghiChuDonGia, presentEmployeeIds } = input;
    const targetDoiId = doiId || currentUser.doiId || '';
    if (!teams.some(t => t.id === targetDoiId)) return { success: false, message: 'Vui lòng chọn đội hợp lệ.' };

    if (!isAuthenticated || !canManageTeam(currentUser, targetDoiId)) {
      return { success: false, message: 'Bạn không có quyền chấm công cho đội này.' };
    }
    if (!isValidDate(ngay)) return { success: false, message: 'Ngày chấm công không hợp lệ.' };
    const inputError = validatePayrollNumbers(soGa, donGia, getConfigForDate(ngay).tyLePhuChinh);
    if (inputError) return { success: false, message: inputError };
    const existing = attendanceRecords.find(r => r.ngay === ngay && (r.doiId || 'doi-1') === targetDoiId);
    if (currentUser.vaiTro === 'DOI_TRUONG' && (existing || donGia !== teamPrice(teams.find(t => t.id === targetDoiId), ngay))) return { success: false, message: 'Đội trưởng chỉ được tạo chấm công mới theo đơn giá Admin đã thiết lập.' };
    if (existing?.trangThai === 'DA_CHOT' || isMonthLocked(ngay.slice(0, 7))) return { success: false, message: 'Ngày hoặc tháng đã chốt. Admin phải mở sổ trước khi sửa.' };
    const activeEmployees = existing ? existing.chiTiet.map(c => ({ id: c.nhanVienId, hoTen: c.hoTen, vaiTro: c.vaiTro })) : employees.filter(e => e.doiId === targetDoiId && e.trangThai === 'DANG_LAM');
    if (new Set(presentEmployeeIds).size !== presentEmployeeIds.length || presentEmployeeIds.some(id => !activeEmployees.some(e => e.id === id))) return { success: false, message: 'Danh sách nhân viên không hợp lệ.' };
    const effectiveConfig = getConfigForDate(ngay);

    const engineInput = activeEmployees.map(emp => ({
      id: emp.id,
      hoTen: emp.hoTen,
      vaiTro: emp.vaiTro,
      coMat: presentEmployeeIds.includes(emp.id),
    }));

    const result = calculateDailyPayroll({
      soGa,
      donGia,
      tyLePhuChinh: existing?.tyLePhuChinh ?? configs.find(c => c.id === existing?.cauHinhId)?.tyLePhuChinh ?? effectiveConfig.tyLePhuChinh,
      employees: engineInput,
    });

    if (!result.kiemTraHopLe) {
      return {
        success: false,
        message: `Phát hiện lỗi sai lệch làm tròn (${result.chenhLech}đ). Không thể lưu bản ghi!`,
      };
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const recordId = existing ? existing.id : `att-${ngay}-${targetDoiId}`;

    const newRecord: BangChamCongNgay = {
      id: recordId,
      ngay,
      doiId: targetDoiId,
      thuTrongTuan: getDayOfWeekVN(ngay),
      soGaBatDuoc: soGa,
      donGiaApDung: donGia,
      tenDoi: existing?.tenDoi ?? teams.find(t => t.id === targetDoiId)?.tenDoi,
      tyLePhuChinh: existing?.tyLePhuChinh ?? configs.find(c => c.id === existing?.cauHinhId)?.tyLePhuChinh ?? effectiveConfig.tyLePhuChinh,
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
        luongNhanDuoc: c.luongNhanDuoc,
      })),
    };

    setAttendanceRecords(prev => {
      const idx = prev.findIndex(
        r => r.ngay === ngay && (r.doiId === targetDoiId || (!r.doiId && targetDoiId === 'doi-1'))
      );
      let updated: BangChamCongNgay[];
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newRecord;
        updated = copy;
      } else {
        updated = [...prev, newRecord].sort((a, b) => a.ngay.localeCompare(b.ngay));
      }
      PayrollDatabase.saveAttendanceRecords(updated);
      return updated;
    });

    FirestoreSyncService.saveAttendanceRecord(newRecord).catch(e => console.warn('Cloud attendance save:', e));

    createAuditLog(
      'BangChamCongNgay',
      recordId,
      existing ? 'SUA' : 'TAO',
      `${currentUser.tenHienThi} lưu chấm công ngày ${ngay} (Đội: ${targetDoiId}). ${soGa.toLocaleString('vi-VN')} con, đơn giá ${donGia.toLocaleString('vi-VN')}đ, ${presentEmployeeIds.length} người có mặt. Quỹ lương: ${result.tongLuongNgay.toLocaleString('vi-VN')}đ`,
      existing ? { soGa: existing.soGaBatDuoc, tongLuong: existing.tongLuongNgay } : null,
      { soGa, donGia, tongLuong: result.tongLuongNgay, coMatCount: presentEmployeeIds.length, doiId: targetDoiId }
    );

    return {
      success: true,
      message: `Đã lưu thành công dữ liệu ngày ${ngay}! Tổng lương ngày: ${result.tongLuongNgay.toLocaleString('vi-VN')} đ`,
    };
  };

  const deleteDailyAttendance = (id: string) => {
    const target = attendanceRecords.find(r => r.id === id);
    if (!target) return;

    if (!isAuthenticated || currentUser.vaiTro !== 'ADMIN') return;
    if (target.trangThai === 'DA_CHOT') {
      alert('Không thể xoá bản ghi đã chốt sổ!');
      return;
    }

    setAttendanceRecords(prev => {
      const updated = prev.filter(r => r.id !== id);
      PayrollDatabase.saveAttendanceRecords(updated);
      return updated;
    });
    FirestoreSyncService.deleteAttendanceRecord(id).catch(e => console.warn('Cloud attendance delete:', e));

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
    if (!isAuthenticated || currentUser.vaiTro !== 'ADMIN') return;
    for (const storage of [localStorage, sessionStorage]) {
      Object.keys(storage).filter(key => key.startsWith('cogava_')).forEach(key => storage.removeItem(key));
    }
    window.location.reload();
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    const account = userAccounts.find(u => u.id === currentUser.id);
    if (!account) { setIsAuthenticated(false); sessionStorage.removeItem(SESSION_ACTIVE_KEY); sessionStorage.removeItem(SESSION_USER_KEY); sessionStorage.removeItem(SESSION_TOKEN_KEY); return; }
    if (account.vaiTro !== currentUser.vaiTro || account.doiId !== currentUser.doiId || account.nhanVienId !== currentUser.nhanVienId) {
      setCurrentUser(prev => ({ ...prev, vaiTro: account.vaiTro, doiId: account.doiId, nhanVienId: account.nhanVienId }));
    }
  }, [userAccounts, isAuthenticated, currentUser.id, currentUser.vaiTro, currentUser.doiId, currentUser.nhanVienId]);
  const value: AppContextType = {
    companyInfo: THONG_TIN_CONG_TY,
    isCloudSynced,
    isSyncingCloud,
    syncFromCloud,
    sessionConflictInfo,
    closeSessionConflictModal,
    activeTab,
    setActiveTab,
    employees: currentUser.vaiTro === 'ADMIN' ? employees : employees.filter(e => currentUser.vaiTro === 'DOI_TRUONG' ? !!currentUser.doiId && e.doiId === currentUser.doiId : e.id === currentUser.nhanVienId),
    teams: currentUser.vaiTro === 'ADMIN' ? teams : teams.filter(t => t.id === currentUser.doiId),
    configs,
    attendanceRecords: currentUser.vaiTro === 'ADMIN' ? attendanceRecords : currentUser.vaiTro === 'DOI_TRUONG' ? attendanceRecords.filter(r => !!currentUser.doiId && (r.doiId || 'doi-1') === currentUser.doiId) : attendanceRecords.filter(r => r.chiTiet.some(c => c.nhanVienId === currentUser.nhanVienId)).map(r => ({ ...r, chiTiet: r.chiTiet.filter(c => c.nhanVienId === currentUser.nhanVienId), tongLuongNgay: r.chiTiet.filter(c => c.nhanVienId === currentUser.nhanVienId).reduce((sum, c) => sum + c.luongNhanDuoc, 0) })),
    auditLogs: currentUser.vaiTro === 'ADMIN' ? auditLogs : [],
    userAccounts: currentUser.vaiTro === 'ADMIN' ? userAccounts : [],
    currentUser,
    setCurrentUser,
    availableUsers: currentUser.vaiTro === 'ADMIN' ? availableUsers : [],
    isAuthenticated,
    login,
    loginWithCredentials,
    logout,
    addTeam,
    updateTeam,
    deleteTeam,
    assignEmployeeToTeam,
    updateCurrentUserAvatar,
    updateCurrentUserProfile,
    changeUserPassword,
    adminResetUserPassword,
    addUserAccount,
    updateUserRoleAndTeam,
    deleteUserAccount,
    clearAttendanceToBlank,
    loadSampleExcelAttendance,
    deviceMode,
    setDeviceMode,
    isMobileView,
    getConfigForDate,
    addConfig,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    toggleEmployeeStatus,
    appointCaptain,
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
