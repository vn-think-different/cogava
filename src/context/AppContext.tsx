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
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(true);
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

      // Teams: Luôn đồng bộ danh sách đội từ Cloud (nếu Cloud trống thì cập nhật rỗng)
      setTeams(cloudData.teams);
      PayrollDatabase.saveTeams(cloudData.teams);

      // Employees: Luôn đồng bộ danh sách nhân viên từ Cloud
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

      if (cloudData.attendanceRecords.length > 0) {
        setAttendanceRecords(cloudData.attendanceRecords);
        PayrollDatabase.saveAttendanceRecords(cloudData.attendanceRecords);
      } else {
        // Nếu Cloud chưa có bản ghi nào nhưng máy cục bộ có -> Đẩy lên Cloud bảo lưu
        const localAtt = PayrollDatabase.getAttendanceRecords();
        if (localAtt.length > 0) {
          await FirestoreSyncService.batchSaveAttendance(localAtt);
        }
      }

      if (cloudData.auditLogs.length > 0) {
        setAuditLogs(cloudData.auditLogs);
        PayrollDatabase.saveAuditLogs(cloudData.auditLogs.slice(0, 100));
      }

      setIsCloudSynced(true);
    } catch (err) {
      console.warn('Lỗi khi đồng bộ dữ liệu từ Cloud Firestore:', err);
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // Initial Cloud Firestore Seeding & Realtime Listeners
  useEffect(() => {
    // 1. Initial Cloud seed if database collections are empty
    FirestoreSyncService.ensureDefaultDataOnCloud({
      defaultTeams: DEFAULT_TEAMS,
      defaultUsers: DEFAULT_USER_ACCOUNTS,
      defaultConfigs: INITIAL_CONFIGS,
    }).catch(err => console.warn('Firestore initial sync notice:', err));

    // 2. Real-time Subscriptions with Firestore (Luôn cập nhật ngay cả khi danh sách trở về rỗng do Quản trị viên xóa)
    const unsubTeams = FirestoreSyncService.subscribeTeams(cloudTeams => {
      setTeams(cloudTeams);
      PayrollDatabase.saveTeams(cloudTeams);
      setIsCloudSynced(true);
    });

    const unsubEmps = FirestoreSyncService.subscribeEmployees(cloudEmps => {
      setEmployees(cloudEmps);
      PayrollDatabase.saveEmployees(cloudEmps);
      setIsCloudSynced(true);
    });

    const unsubAtt = FirestoreSyncService.subscribeAttendance(cloudAtt => {
      if (cloudAtt.length > 0) {
        setAttendanceRecords(cloudAtt);
        PayrollDatabase.saveAttendanceRecords(cloudAtt);
        setIsCloudSynced(true);
      } else {
        const localAtt = PayrollDatabase.getAttendanceRecords();
        if (localAtt.length > 0) {
          FirestoreSyncService.batchSaveAttendance(localAtt).catch(e => console.warn(e));
        }
      }
    });

    const unsubCfg = FirestoreSyncService.subscribeConfigs(cloudCfg => {
      if (cloudCfg.length > 0) {
        setConfigs(cloudCfg);
        PayrollDatabase.saveConfigs(cloudCfg);
        setIsCloudSynced(true);
      }
    });

    const unsubUsers = FirestoreSyncService.subscribeUsers(cloudUsers => {
      if (cloudUsers.length > 0) {
        setUserAccounts(cloudUsers);
        PayrollDatabase.saveUserAccounts(cloudUsers);
        setIsCloudSynced(true);
      }
    });

    const unsubAudit = FirestoreSyncService.subscribeAuditLogs(cloudLogs => {
      setAuditLogs(cloudLogs);
      PayrollDatabase.saveAuditLogs(cloudLogs.slice(0, 100));
      setIsCloudSynced(true);
    });

    return () => {
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

    login(session);
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
    if (currentUser.vaiTro !== 'ADMIN') {
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
        `Admin ${currentUser.tenHienThi} đặt lại mật khẩu cho tài khoản ${userId} về mặc định (${newPassword})`
      );
    }
    return result;
  };

  // Admin thêm tài khoản mới
  const addUserAccount = (
    data: Omit<UserAccount, 'id' | 'ngayTao'>
  ): { success: boolean; message: string } => {
    if (currentUser.vaiTro !== 'ADMIN') {
      return { success: false, message: 'Chỉ Quản trị viên mới có quyền tạo tài khoản người dùng!' };
    }
    const result = PayrollDatabase.addUserAccount(data);
    if (result.success && result.user) {
      setUserAccounts(PayrollDatabase.getUserAccounts());
      FirestoreSyncService.saveUser(result.user).catch(e => console.warn('Cloud user save:', e));
      createAuditLog(
        'UserAccount',
        result.user.id,
        'TAO',
        `Admin tạo tài khoản mới: "${result.user.username}" (${result.user.tenHienThi} - ${result.user.vaiTro})`
      );
    }
    return result;
  };

  // Cập nhật phân quyền và đội nhóm cho tài khoản người dùng
  const updateUserRoleAndTeam = (
    userId: string,
    vaiTro: VaiTroNguoiDung,
    doiId?: string
  ): { success: boolean; message: string } => {
    if (currentUser.vaiTro !== 'ADMIN') {
      return { success: false, message: 'Chỉ Quản trị viên mới có quyền thay đổi phân quyền và phân đội!' };
    }

    const targetUser = userAccounts.find(u => u.id === userId);
    if (!targetUser) {
      return { success: false, message: 'Không tìm thấy tài khoản người dùng!' };
    }

    const assignedDoiId = vaiTro === 'ADMIN' ? undefined : (doiId || undefined);

    // 1. Cập nhật UserAccount
    const updatedUser: UserAccount = {
      ...targetUser,
      vaiTro,
      doiId: assignedDoiId,
    };

    PayrollDatabase.updateUserAccount(userId, updatedUser);
    setUserAccounts(PayrollDatabase.getUserAccounts());
    FirestoreSyncService.saveUser(updatedUser).catch(e => console.warn('Cloud user update:', e));

    // 2. Nếu tài khoản liên kết với Hồ sơ Nhân viên (nhanVienId)
    if (targetUser.nhanVienId) {
      setEmployees(prev => {
        const updated = prev.map(emp => {
          if (emp.id === targetUser.nhanVienId) {
            return {
              ...emp,
              ...(assignedDoiId ? { doiId: assignedDoiId } : {}),
            };
          }
          return emp;
        });
        PayrollDatabase.saveEmployees(updated);
        return updated;
      });
    }

    // 3. Nếu vai trò chuyển thành DOI_TRUONG và có assignedDoiId
    if (vaiTro === 'DOI_TRUONG' && assignedDoiId) {
      setTeams(prev => {
        const updated = prev.map(t => {
          if (t.id === assignedDoiId) {
            return {
              ...t,
              doiTruongTen: targetUser.tenHienThi,
              doiTruongUserId: targetUser.id,
            };
          }
          // Nếu user này trước đó là đội trưởng của đội khác, xóa khỏi đội cũ
          if (
            t.id !== assignedDoiId &&
            (t.doiTruongUserId === targetUser.id ||
              (t.doiTruongTen && t.doiTruongTen.trim().toLowerCase() === targetUser.tenHienThi.trim().toLowerCase()))
          ) {
            return {
              ...t,
              doiTruongTen: undefined,
              doiTruongUserId: undefined,
            };
          }
          return t;
        });
        PayrollDatabase.saveTeams(updated);
        return updated;
      });
    } else if (vaiTro !== 'DOI_TRUONG') {
      // Nếu chuyển khỏi vai trò DOI_TRUONG, gỡ bỏ chức danh đội trưởng của các đội
      setTeams(prev => {
        const updated = prev.map(t => {
          if (
            t.doiTruongUserId === targetUser.id ||
            (t.doiTruongTen && t.doiTruongTen.trim().toLowerCase() === targetUser.tenHienThi.trim().toLowerCase())
          ) {
            return {
              ...t,
              doiTruongTen: undefined,
              doiTruongUserId: undefined,
            };
          }
          return t;
        });
        PayrollDatabase.saveTeams(updated);
        return updated;
      });
    }

    // 4. Nếu là currentUser, đồng bộ session đang đăng nhập
    if (currentUser.id === userId) {
      setCurrentUser(prev => ({
        ...prev,
        vaiTro,
        doiId: assignedDoiId,
      }));
    }

    const teamObj = teams.find(t => t.id === assignedDoiId);
    const teamName = teamObj ? teamObj.tenDoi : vaiTro === 'ADMIN' ? 'Toàn công ty' : 'Chưa phân đội';
    const roleName = vaiTro === 'ADMIN' ? 'Quản trị viên' : vaiTro === 'DOI_TRUONG' ? 'Đội trưởng' : 'Nhân viên';

    createAuditLog(
      'UserAccount',
      userId,
      'SUA',
      `Thay đổi quyền/đội cho @${targetUser.username} (${targetUser.tenHienThi}) -> Vai trò: ${roleName}, Đội: ${teamName}`
    );

    return {
      success: true,
      message: `Đã cập nhật phân quyền "${roleName}" và đội "${teamName}" cho ${targetUser.tenHienThi}!`,
    };
  };

  // Admin xóa tài khoản
  const deleteUserAccount = (userId: string): { success: boolean; message: string } => {
    if (currentUser.vaiTro !== 'ADMIN') {
      return { success: false, message: 'Chỉ Quản trị viên mới có quyền xóa tài khoản!' };
    }
    const target = userAccounts.find(u => u.id === userId);
    const result = PayrollDatabase.deleteUserAccount(userId);
    if (result.success) {
      setUserAccounts(PayrollDatabase.getUserAccounts());
      FirestoreSyncService.deleteUser(userId).catch(e => console.warn('Cloud user delete:', e));
      createAuditLog(
        'UserAccount',
        userId,
        'XOA',
        `Admin xóa tài khoản người dùng: ${target?.tenHienThi || userId}`
      );
    }
    return result;
  };

  // Xóa sạch CSDL chấm công về CSDL trắng để kiểm thử
  const clearAttendanceToBlank = (): { success: boolean; message: string } => {
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

  // Quản lý Đội nhóm (Teams)
  const addTeam = (data: Omit<DoiNhanVien, 'id' | 'ngayTao'>): { success: boolean; message: string } => {
    if (currentUser.vaiTro !== 'ADMIN') {
      return { success: false, message: 'Chỉ Quản trị viên mới có quyền tạo Đội mới!' };
    }
    const res = PayrollDatabase.addTeam(data);
    if (res.success && res.team) {
      const newTeamId = res.team.id;
      setTeams(PayrollDatabase.getTeams());
      FirestoreSyncService.saveTeam(res.team).catch(e => console.warn('Cloud team save:', e));
      createAuditLog('DoiNhanVien', newTeamId, 'TAO', `Tạo đội mới: "${data.tenDoi}"`);

      // Nếu có chỉ định Đội trưởng ngay khi tạo đội (bằng tên hoặc ID)
      if (data.doiTruongTen) {
        const allEmps = PayrollDatabase.getEmployees();
        const emp = allEmps.find(
          e =>
            (data.doiTruongUserId && e.id === data.doiTruongUserId) ||
            e.hoTen.trim().toLowerCase() === data.doiTruongTen!.trim().toLowerCase()
        );
        if (emp) {
          appointCaptain(newTeamId, emp.id);
        }
      }
    }
    return res;
  };

  const updateTeam = (id: string, data: Partial<DoiNhanVien>): { success: boolean; message: string } => {
    if (currentUser.vaiTro !== 'ADMIN') {
      return { success: false, message: 'Chỉ Quản trị viên mới có quyền sửa thông tin Đội!' };
    }
    const res = PayrollDatabase.updateTeam(id, data);
    if (res.success) {
      setTeams(PayrollDatabase.getTeams());
      const updatedTeam = PayrollDatabase.getTeams().find(t => t.id === id);
      if (updatedTeam) FirestoreSyncService.saveTeam(updatedTeam).catch(e => console.warn('Cloud team update:', e));
      createAuditLog('DoiNhanVien', id, 'SUA', `Cập nhật thông tin đội ${id}`);

      // Nếu đổi đội trưởng, đồng bộ nhân viên và tài khoản mà KHÔNG gọi lại updateTeam
      if (data.doiTruongTen) {
        const emp = employees.find(
          e =>
            (data.doiTruongUserId && e.id === data.doiTruongUserId) ||
            e.hoTen.trim().toLowerCase() === data.doiTruongTen!.trim().toLowerCase()
        );
        if (emp) {
          setEmployees(prev => {
            const updated = prev.map(e => (e.id === emp.id ? { ...e, doiId: id } : e));
            PayrollDatabase.saveEmployees(updated);
            FirestoreSyncService.saveEmployee({ ...emp, doiId: id }).catch(e => console.warn('Cloud emp update:', e));
            return updated;
          });
          const userAcc = userAccounts.find(u => u.nhanVienId === emp.id || u.username === emp.soDienThoai);
          if (userAcc) {
            setUserAccounts(prev => {
              const updated = prev.map(u =>
                u.id === userAcc.id ? { ...u, vaiTro: 'DOI_TRUONG' as const, doiId: id } : u
              );
              PayrollDatabase.saveUserAccounts(updated);
              FirestoreSyncService.saveUser({ ...userAcc, vaiTro: 'DOI_TRUONG', doiId: id }).catch(e => console.warn('Cloud user update:', e));
              return updated;
            });
          }
        }
      }
    }
    return res;
  };

  const deleteTeam = (id: string): { success: boolean; message: string } => {
    if (currentUser.vaiTro !== 'ADMIN') {
      return { success: false, message: 'Chỉ Quản trị viên mới có quyền xóa Đội!' };
    }
    const targetTeam = teams.find(t => t.id === id);
    const teamName = targetTeam?.tenDoi || id;

    // 1. Xóa đội khỏi CSDL Teams
    const res = PayrollDatabase.deleteTeam(id);
    if (!res.success) return res;

    setTeams(prev => prev.filter(t => t.id !== id));
    FirestoreSyncService.deleteTeam(id).catch(e => console.warn('Cloud team delete:', e));

    // 2. Cập nhật nhân viên thuộc đội này (bỏ liên kết đội)
    setEmployees(prev => {
      const updated = prev.map(emp => (emp.doiId === id ? { ...emp, doiId: '' } : emp));
      PayrollDatabase.saveEmployees(updated);
      return updated;
    });

    // 3. Cập nhật tài khoản người dùng liên kết
    setUserAccounts(prev => {
      const updated = prev.map(u => (u.doiId === id ? { ...u, doiId: undefined } : u));
      PayrollDatabase.saveUserAccounts(updated);
      return updated;
    });

    createAuditLog('DoiNhanVien', id, 'XOA', `Xóa đội "${teamName}" khỏi hệ thống`);
    return { success: true, message: `Đã xóa "${teamName}" thành công!` };
  };

  const assignEmployeeToTeam = (empId: string, teamId: string) => {
    setEmployees(prev => {
      const updated = prev.map(emp => (emp.id === empId ? { ...emp, doiId: teamId } : emp));
      PayrollDatabase.saveEmployees(updated);
      const target = updated.find(e => e.id === empId);
      if (target) FirestoreSyncService.saveEmployee(target).catch(e => console.warn('Cloud emp assign:', e));
      return updated;
    });
    setUserAccounts(prev => {
      const updated = prev.map(u => (u.nhanVienId === empId ? { ...u, doiId: teamId } : u));
      PayrollDatabase.saveUserAccounts(updated);
      const targetUser = updated.find(u => u.nhanVienId === empId);
      if (targetUser) FirestoreSyncService.saveUser(targetUser).catch(e => console.warn('Cloud user assign:', e));
      return updated;
    });
    const targetEmp = employees.find(e => e.id === empId);
    const targetTeam = teams.find(t => t.id === teamId);
    createAuditLog(
      'NhanVien',
      empId,
      'SUA',
      `Phân công nhân viên ${targetEmp?.hoTen || empId} vào đội "${targetTeam?.tenDoi || teamId}"`
    );
  };

  // Quản lý nhân viên
  const addEmployee = (data: Omit<NhanVien, 'id'>) => {
    const newId = `emp-${Date.now()}`;
    const assignedTeam = data.doiId || (teams[0]?.id || 'doi-1');
    const newEmp: NhanVien = {
      ...data,
      id: newId,
      doiId: assignedTeam,
    };
    setEmployees(prev => {
      const updated = [...prev, newEmp];
      PayrollDatabase.saveEmployees(updated);
      return updated;
    });
    FirestoreSyncService.saveEmployee(newEmp).catch(e => console.warn('Cloud emp save:', e));

    // Tự động tạo tài khoản người dùng đăng nhập cho nhân viên mới
    const rawUsername = data.hoTen
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '') || `nv${Date.now().toString().slice(-4)}`;

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
    const createdAccRes = PayrollDatabase.addUserAccount(userAccountData);
    setUserAccounts(PayrollDatabase.getUserAccounts());
    if (createdAccRes.user) {
      FirestoreSyncService.saveUser(createdAccRes.user).catch(e => console.warn('Cloud user save:', e));
    }

    createAuditLog(
      'NhanVien',
      newEmp.id,
      'TAO',
      `Thêm nhân viên mới: ${newEmp.hoTen} (${newEmp.vaiTro === 'CHINH' ? 'Lương chính' : 'Lương phụ'}). Đội: ${assignedTeam}. Đã cấp tài khoản: "${rawUsername}" / MK: 123456`,
      null,
      { ...newEmp }
    );
  };

  const updateEmployee = (id: string, data: Partial<NhanVien>) => {
    const currentEmp = employees.find(e => e.id === id);
    if (!currentEmp) return;

    setEmployees(prev => {
      const updated = prev.map(emp => (emp.id === id ? { ...emp, ...data } : emp));
      PayrollDatabase.saveEmployees(updated);
      const target = updated.find(e => e.id === id);
      if (target) FirestoreSyncService.saveEmployee(target).catch(e => console.warn('Cloud emp update:', e));
      return updated;
    });

    // Đồng bộ sang tài khoản nếu đổi thông tin (đội, họ tên, sđt, CCCD)
    setUserAccounts(prev => {
      const updated = prev.map(u => {
        if (u.nhanVienId === id) {
          const updatedUser = {
            ...u,
            ...(data.doiId ? { doiId: data.doiId } : {}),
            ...(data.hoTen ? { tenHienThi: data.hoTen } : {}),
            ...(data.sdt !== undefined ? { sdt: data.sdt } : {}),
            ...(data.soCccd !== undefined ? { soCccd: data.soCccd } : {}),
            ...(data.cccdNgayCap !== undefined ? { cccdNgayCap: data.cccdNgayCap } : {}),
            ...(data.cccdNoiCap !== undefined ? { cccdNoiCap: data.cccdNoiCap } : {}),
            ...(data.cccdMatTruoc !== undefined ? { cccdMatTruoc: data.cccdMatTruoc } : {}),
            ...(data.cccdMatSau !== undefined ? { cccdMatSau: data.cccdMatSau } : {}),
          };
          FirestoreSyncService.saveUser(updatedUser).catch(e => console.warn('Cloud user sync:', e));
          return updatedUser;
        }
        return u;
      });
      PayrollDatabase.saveUserAccounts(updated);
      return updated;
    });

    if (currentUser.nhanVienId === id) {
      setCurrentUser(prev => ({
        ...prev,
        ...(data.hoTen ? { tenHienThi: data.hoTen } : {}),
        ...(data.doiId ? { doiId: data.doiId } : {}),
        ...(data.soCccd !== undefined ? { soCccd: data.soCccd } : {}),
        ...(data.cccdNgayCap !== undefined ? { cccdNgayCap: data.cccdNgayCap } : {}),
        ...(data.cccdNoiCap !== undefined ? { cccdNoiCap: data.cccdNoiCap } : {}),
        ...(data.cccdMatTruoc !== undefined ? { cccdMatTruoc: data.cccdMatTruoc } : {}),
        ...(data.cccdMatSau !== undefined ? { cccdMatSau: data.cccdMatSau } : {}),
      }));
    }

    createAuditLog(
      'NhanVien',
      id,
      'SUA',
      `Cập nhật thông tin nhân viên: ${currentEmp.hoTen}`,
      { ...currentEmp },
      { ...data }
    );
  };

  const deleteEmployee = (id: string): { success: boolean; message: string } => {
    const currentEmp = employees.find(e => e.id === id);
    if (!currentEmp) {
      return { success: false, message: 'Không tìm thấy nhân viên!' };
    }

    // 1. Xóa nhân viên khỏi danh sách
    setEmployees(prev => {
      const updated = prev.filter(emp => emp.id !== id);
      PayrollDatabase.saveEmployees(updated);
      return updated;
    });
    FirestoreSyncService.deleteEmployee(id).catch(e => console.warn('Cloud emp delete:', e));

    // 2. Xóa tài khoản người dùng tương ứng nếu có
    const userToDelete = userAccounts.find(u => u.nhanVienId === id);
    if (userToDelete) {
      FirestoreSyncService.deleteUser(userToDelete.id).catch(e => console.warn('Cloud user delete:', e));
    }
    setUserAccounts(prev => {
      const updated = prev.filter(u => u.nhanVienId !== id);
      PayrollDatabase.saveUserAccounts(updated);
      return updated;
    });

    // 3. Nếu nhân viên là Đội trưởng của đội nào đó, gỡ bỏ chức vụ đội trưởng
    setTeams(prev => {
      const updated = prev.map(t => {
        if (
          (t.doiTruongTen && t.doiTruongTen.trim().toLowerCase() === currentEmp.hoTen.trim().toLowerCase()) ||
          t.doiTruongUserId === currentEmp.id
        ) {
          const modTeam = {
            ...t,
            doiTruongTen: undefined,
            doiTruongUserId: undefined,
          };
          FirestoreSyncService.saveTeam(modTeam).catch(e => console.warn('Cloud team update:', e));
          return modTeam;
        }
        return t;
      });
      PayrollDatabase.saveTeams(updated);
      return updated;
    });

    createAuditLog(
      'NhanVien',
      id,
      'XOA',
      `Xóa nhân viên ${currentEmp.hoTen} khỏi hệ thống`,
      { ...currentEmp },
      null
    );

    return { success: true, message: `Đã xóa nhân viên ${currentEmp.hoTen} thành công!` };
  };

  const appointCaptain = (teamId: string, empId: string): { success: boolean; message: string } => {
    const allTeams = PayrollDatabase.getTeams();
    const allEmployees = PayrollDatabase.getEmployees();
    const allUsers = PayrollDatabase.getUserAccounts();

    const team = allTeams.find(t => t.id === teamId) || teams.find(t => t.id === teamId);
    const emp = allEmployees.find(e => e.id === empId) || employees.find(e => e.id === empId);

    if (!team) return { success: false, message: 'Không tìm thấy đội!' };
    if (!emp) return { success: false, message: 'Không tìm thấy nhân viên!' };

    // Tìm tài khoản người dùng của nhân viên
    const userAcc = allUsers.find(u => u.nhanVienId === empId || u.username === emp.soDienThoai);

    // 1. Cập nhật đội trong CSDL & State
    PayrollDatabase.updateTeam(teamId, {
      doiTruongUserId: userAcc?.id || emp.id,
      doiTruongTen: emp.hoTen,
    });
    const updatedTeamList = PayrollDatabase.getTeams();
    setTeams(updatedTeamList);
    const currentUpdatedTeam = updatedTeamList.find(t => t.id === teamId);
    if (currentUpdatedTeam) FirestoreSyncService.saveTeam(currentUpdatedTeam).catch(e => console.warn('Cloud team update:', e));

    // 2. Gán nhân viên vào đội này
    const updatedEmployees = PayrollDatabase.getEmployees().map(e =>
      e.id === empId ? { ...e, doiId: teamId } : e
    );
    PayrollDatabase.saveEmployees(updatedEmployees);
    setEmployees(updatedEmployees);
    const updatedEmp = updatedEmployees.find(e => e.id === empId);
    if (updatedEmp) FirestoreSyncService.saveEmployee(updatedEmp).catch(e => console.warn('Cloud emp update:', e));

    // 3. Nếu có tài khoản, nâng quyền lên DOI_TRUONG
    if (userAcc) {
      const updatedUsers = PayrollDatabase.getUserAccounts().map(u =>
        u.id === userAcc.id ? { ...u, vaiTro: 'DOI_TRUONG' as const, doiId: teamId } : u
      );
      PayrollDatabase.saveUserAccounts(updatedUsers);
      setUserAccounts(updatedUsers);
      const targetUser = updatedUsers.find(u => u.id === userAcc.id);
      if (targetUser) FirestoreSyncService.saveUser(targetUser).catch(e => console.warn('Cloud user update:', e));
    }

    createAuditLog(
      'DoiNhanVien',
      teamId,
      'SUA',
      `Bổ nhiệm ${emp.hoTen} làm Đội trưởng cho đội "${team.tenDoi}"`
    );

    return {
      success: true,
      message: `Đã bổ nhiệm ${emp.hoTen} làm Đội trưởng cho "${team.tenDoi}" thành công!`,
    };
  };

  const toggleEmployeeStatus = (id: string) => {
    const currentEmp = employees.find(e => e.id === id);
    if (!currentEmp) return;

    const newStatus: TrangThaiNhanVien = currentEmp.trangThai === 'DANG_LAM' ? 'DA_NGHI' : 'DANG_LAM';
    const todayStr = new Date().toISOString().substring(0, 10);

    setEmployees(prev => {
      const updated: NhanVien[] = prev.map(emp =>
        emp.id === id
          ? {
              ...emp,
              trangThai: newStatus,
              ngayNghiViec: newStatus === 'DA_NGHI' ? todayStr : undefined,
            }
          : emp
      );
      PayrollDatabase.saveEmployees(updated);
      const target = updated.find(e => e.id === id);
      if (target) FirestoreSyncService.saveEmployee(target).catch(e => console.warn('Cloud emp status:', e));
      return updated;
    });
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
    const targetDoiId = doiId || currentUser.doiId || 'doi-1';

    // Kiểm tra khoá sổ
    const existing = attendanceRecords.find(
      r => r.ngay === ngay && (r.doiId === targetDoiId || (!r.doiId && targetDoiId === 'doi-1'))
    );
    if (existing && existing.trangThai === 'DA_CHOT') {
      if (currentUser.vaiTro !== 'ADMIN') {
        return {
          success: false,
          message: 'Ngày này đã được khoá sổ (chốt lương). Chỉ Quản trị viên mới có quyền can thiệp!',
        };
      }
    }

    // Chỉ nhân viên thuộc đội mới được đưa vào tính toán công thức ngày
    const teamEmployees = employees.filter(
      e => e.doiId === targetDoiId || (!e.doiId && targetDoiId === 'doi-1')
    );
    const activeEmployees = teamEmployees.filter(
      e => e.trangThai === 'DANG_LAM' || presentEmployeeIds.includes(e.id)
    );
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
    const recordId = existing ? existing.id : `att-${ngay}-${targetDoiId}`;

    const newRecord: BangChamCongNgay = {
      id: recordId,
      ngay,
      doiId: targetDoiId,
      thuTrongTuan: getDayOfWeekVN(ngay),
      soGaBatDuoc: soGa,
      donGiaApDung: donGia,
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

    if (target.trangThai === 'DA_CHOT' && currentUser.vaiTro !== 'ADMIN') {
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
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  const value: AppContextType = {
    companyInfo: THONG_TIN_CONG_TY,
    isCloudSynced,
    isSyncingCloud,
    syncFromCloud,
    sessionConflictInfo,
    closeSessionConflictModal,
    activeTab,
    setActiveTab,
    employees,
    teams,
    configs,
    attendanceRecords,
    auditLogs,
    userAccounts,
    currentUser,
    setCurrentUser,
    availableUsers,
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
