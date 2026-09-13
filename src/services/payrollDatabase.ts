import {
  BangChamCongNgay,
  CauHinhLuong,
  DoiNhanVien,
  NhanVien,
  NhatKyThayDoi,
  UserAccount,
  UserSession,
} from '../types';
import {
  DEFAULT_TEAMS,
  INITIAL_CONFIGS,
  INITIAL_EMPLOYEES,
  INITIAL_ATTENDANCE_RECORDS as SAMPLE_EXCEL_RECORDS,
} from '../data/initialData';
import { createSampleCccdFront, createSampleCccdBack } from '../utils/cccdHelper';

// Prefix storage key
const DB_PREFIX = 'cogava_payroll_db_v2_';

// 1. Initial User Accounts
export const DEFAULT_USER_ACCOUNTS: UserAccount[] = [
  {
    id: 'usr-admin',
    username: 'admin',
    password: '123456',
    tenHienThi: 'Thạch',
    vaiTro: 'ADMIN',
    avatar: 'preset-admin',
    sdt: '0822.705.705',
    email: 'thach.admin@cogava.vn',
    soCccd: '079088001122',
    cccdNgayCap: '2021-05-18',
    cccdNoiCap: 'Cục Cảnh sát QLHC về TTXH',
    cccdMatTruoc: createSampleCccdFront('Thạch Quản Trị', '079088001122'),
    cccdMatSau: createSampleCccdBack('Thạch Quản Trị', '079088001122'),
    ngayTao: '2026-01-01 08:00:00',
  },
  {
    id: 'usr-captain',
    username: 'doitruong',
    password: '123456',
    tenHienThi: 'Lê Đội Trưởng',
    vaiTro: 'DOI_TRUONG',
    doiId: 'doi-1',
    avatar: 'preset-captain',
    sdt: '0374.523.959',
    email: 'doitruong@cogava.vn',
    soCccd: '079090003344',
    cccdNgayCap: '2021-08-20',
    cccdNoiCap: 'Cục Cảnh sát QLHC về TTXH',
    cccdMatTruoc: createSampleCccdFront('Lê Đội Trưởng', '079090003344'),
    cccdMatSau: createSampleCccdBack('Lê Đội Trưởng', '079090003344'),
    ngayTao: '2026-01-01 08:00:00',
  },
  {
    id: 'usr-captain-2',
    username: 'doitruong2',
    password: '123456',
    tenHienThi: 'Trần Đội Trưởng',
    vaiTro: 'DOI_TRUONG',
    doiId: 'doi-2',
    avatar: 'preset-captain',
    sdt: '0385.123.456',
    email: 'doitruong2@cogava.vn',
    soCccd: '079091004455',
    cccdNgayCap: '2022-02-14',
    cccdNoiCap: 'Cục Cảnh sát QLHC về TTXH',
    ngayTao: '2026-02-01 08:00:00',
  },
  {
    id: 'usr-emp-kien',
    username: 'kien',
    password: '123456',
    tenHienThi: 'Kiên',
    vaiTro: 'NHAN_VIEN',
    nhanVienId: 'emp-kien',
    doiId: 'doi-1',
    avatar: 'preset-worker-kien',
    sdt: '0912.345.678',
    email: 'kien.worker@cogava.vn',
    soCccd: '079095012345',
    cccdNgayCap: '2022-01-10',
    cccdNoiCap: 'Cục Cảnh sát QLHC về TTXH',
    cccdMatTruoc: createSampleCccdFront('Nguyễn Văn Kiên', '079095012345'),
    cccdMatSau: createSampleCccdBack('Nguyễn Văn Kiên', '079095012345'),
    ngayTao: '2026-01-01 08:00:00',
  },
  {
    id: 'usr-emp-sang',
    username: 'sang',
    password: '123456',
    tenHienThi: 'Sáng',
    vaiTro: 'NHAN_VIEN',
    nhanVienId: 'emp-sang',
    doiId: 'doi-1',
    avatar: 'preset-worker-sang',
    sdt: '0923.456.789',
    email: 'sang.worker@cogava.vn',
    soCccd: '079096054321',
    cccdNgayCap: '2022-03-15',
    cccdNoiCap: 'Cục Cảnh sát QLHC về TTXH',
    cccdMatTruoc: createSampleCccdFront('Trần Văn Sáng', '079096054321'),
    cccdMatSau: createSampleCccdBack('Trần Văn Sáng', '079096054321'),
    ngayTao: '2026-01-01 08:00:00',
  },
  {
    id: 'usr-emp-vu',
    username: 'vu',
    password: '123456',
    tenHienThi: 'Vũ',
    vaiTro: 'NHAN_VIEN',
    nhanVienId: 'emp-vu',
    doiId: 'doi-1',
    avatar: 'preset-worker-vu',
    sdt: '0934.567.890',
    email: 'vu.worker@cogava.vn',
    soCccd: '079094033221',
    cccdNgayCap: '2022-06-20',
    cccdNoiCap: 'Cục Cảnh sát QLHC về TTXH',
    ngayTao: '2026-01-01 08:00:00',
  },
  {
    id: 'usr-emp-dat',
    username: 'dat',
    password: '123456',
    tenHienThi: 'Đạt',
    vaiTro: 'NHAN_VIEN',
    nhanVienId: 'emp-dat',
    doiId: 'doi-1',
    avatar: 'preset-worker-dat',
    sdt: '0945.678.901',
    email: 'dat.worker@cogava.vn',
    soCccd: '079098088999',
    cccdNgayCap: '2023-01-12',
    cccdNoiCap: 'Cục Cảnh sát QLHC về TTXH',
    ngayTao: '2026-02-15 08:00:00',
  },
  {
    id: 'usr-emp-toi',
    username: 'toi',
    password: '123456',
    tenHienThi: 'Tỏi',
    vaiTro: 'NHAN_VIEN',
    nhanVienId: 'emp-toi',
    doiId: 'doi-2',
    avatar: 'preset-worker-toi',
    sdt: '0956.789.012',
    email: 'toi.worker@cogava.vn',
    soCccd: '079097066554',
    ngayTao: '2026-03-01 08:00:00',
  },
  {
    id: 'usr-emp-an',
    username: 'an',
    password: '123456',
    tenHienThi: 'An',
    vaiTro: 'NHAN_VIEN',
    nhanVienId: 'emp-an',
    doiId: 'doi-2',
    avatar: 'preset-worker-kien',
    sdt: '0967.890.123',
    email: 'an.worker@cogava.vn',
    soCccd: '079099011223',
    ngayTao: '2026-03-05 08:00:00',
  },
];

export const INITIAL_BLANK_AUDIT_LOGS: NhatKyThayDoi[] = [
  {
    id: 'log-db-init-blank',
    bang: 'HeThong',
    banGhiId: 'csdl-trang',
    nguoiThucHien: 'Hệ thống',
    vaiTroNguoiThucHien: 'ADMIN',
    thoiGian: new Date().toISOString().replace('T', ' ').substring(0, 19),
    hanhDong: 'TAO',
    moTa: 'Khởi tạo cấu trúc CSDL bảng lương và làm sạch dữ liệu chấm công (CSDL trắng 0 bản ghi) để kiểm thử độc lập độ chính xác.',
    giaTriCu: null,
    giaTriMoi: { trangThai: 'CSDL_TRANG', attendanceCount: 0 },
  },
];

/**
 * CSDL Engine cho Bảng lương COGAVA
 */
export class PayrollDatabase {
  // 1. Quản lý Đội nhân viên (Teams)
  static getTeams(): DoiNhanVien[] {
    const saved = localStorage.getItem(DB_PREFIX + 'teams');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Lỗi đọc teams từ DB:', e);
      }
    }
    this.saveTeams(DEFAULT_TEAMS);
    return DEFAULT_TEAMS;
  }

  static saveTeams(teams: DoiNhanVien[]): void {
    localStorage.setItem(DB_PREFIX + 'teams', JSON.stringify(teams));
  }

  static addTeam(team: Omit<DoiNhanVien, 'id' | 'ngayTao'>): { success: boolean; team?: DoiNhanVien; message: string } {
    const teams = this.getTeams();
    const newId = `doi-${Date.now()}`;
    const newTeam: DoiNhanVien = {
      ...team,
      id: newId,
      ngayTao: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    teams.push(newTeam);
    this.saveTeams(teams);
    return { success: true, team: newTeam, message: `Đã tạo "${newTeam.tenDoi}" thành công!` };
  }

  static updateTeam(id: string, data: Partial<DoiNhanVien>): { success: boolean; message: string } {
    const teams = this.getTeams();
    const idx = teams.findIndex(t => t.id === id);
    if (idx === -1) return { success: false, message: 'Không tìm thấy đội!' };
    teams[idx] = { ...teams[idx], ...data };
    this.saveTeams(teams);
    return { success: true, message: 'Đã cập nhật thông tin đội thành công!' };
  }

  static deleteTeam(id: string): { success: boolean; message: string } {
    const teams = this.getTeams();
    if (teams.length <= 1) {
      return { success: false, message: 'Hệ thống cần tối thiểu 1 đội bắt gà đang hoạt động!' };
    }
    const filtered = teams.filter(t => t.id !== id);
    this.saveTeams(filtered);
    return { success: true, message: 'Đã xóa đội thành công!' };
  }

  // Lấy danh sách tài khoản
  static getUserAccounts(): UserAccount[] {
    const saved = localStorage.getItem(DB_PREFIX + 'users');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Check & enrich missing accounts or fields
          let modified = false;
          const accounts: UserAccount[] = parsed.map((acc: UserAccount) => {
            if (!acc.doiId) {
              if (acc.username === 'doitruong') {
                modified = true;
                return { ...acc, doiId: 'doi-1' };
              }
              if (acc.username === 'toi' || acc.username === 'an') {
                modified = true;
                return { ...acc, doiId: 'doi-2' };
              }
              if (acc.vaiTro === 'NHAN_VIEN') {
                modified = true;
                return { ...acc, doiId: 'doi-1' };
              }
            }
            return acc;
          });

          // Ensure doitruong2 exists
          if (!accounts.some(a => a.username === 'doitruong2')) {
            const dt2 = DEFAULT_USER_ACCOUNTS.find(a => a.username === 'doitruong2');
            if (dt2) {
              accounts.push(dt2);
              modified = true;
            }
          }

          if (modified) {
            this.saveUserAccounts(accounts);
          }
          return accounts;
        }
      } catch (e) {
        console.error('Lỗi đọc user accounts từ DB:', e);
      }
    }
    this.saveUserAccounts(DEFAULT_USER_ACCOUNTS);
    return DEFAULT_USER_ACCOUNTS;
  }

  static saveUserAccounts(users: UserAccount[]): void {
    localStorage.setItem(DB_PREFIX + 'users', JSON.stringify(users));
  }

  // Lấy danh sách nhân viên
  static getEmployees(): NhanVien[] {
    const saved = localStorage.getItem(DB_PREFIX + 'employees');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          let modified = false;
          const employeesWithTeam = parsed.map((emp: NhanVien) => {
            if (!emp.doiId) {
              modified = true;
              return {
                ...emp,
                doiId: emp.id === 'emp-toi' ? 'doi-2' : 'doi-1',
              };
            }
            return emp;
          });

          // Check if emp-an exists
          if (!employeesWithTeam.some(e => e.id === 'emp-an')) {
            const empAn = INITIAL_EMPLOYEES.find(e => e.id === 'emp-an');
            if (empAn) {
              employeesWithTeam.push(empAn);
              modified = true;
            }
          }

          if (modified) {
            this.saveEmployees(employeesWithTeam);
          }
          return employeesWithTeam;
        }
      } catch (e) {
        console.error('Lỗi đọc employees từ DB:', e);
      }
    }
    this.saveEmployees(INITIAL_EMPLOYEES);
    return INITIAL_EMPLOYEES;
  }

  static saveEmployees(employees: NhanVien[]): void {
    localStorage.setItem(DB_PREFIX + 'employees', JSON.stringify(employees));
  }

  // Lấy cấu hình đơn giá & tỷ lệ
  static getConfigs(): CauHinhLuong[] {
    const saved = localStorage.getItem(DB_PREFIX + 'configs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Lỗi đọc configs từ DB:', e);
      }
    }
    this.saveConfigs(INITIAL_CONFIGS);
    return INITIAL_CONFIGS;
  }

  static saveConfigs(configs: CauHinhLuong[]): void {
    localStorage.setItem(DB_PREFIX + 'configs', JSON.stringify(configs));
  }

  /**
   * Lấy bản ghi chấm công:
   * MẶC ĐỊNH LÀ RỖNG [] (CSDL TRẮNG ĐỂ KIỂM THỬ)
   */
  static getAttendanceRecords(): BangChamCongNgay[] {
    const saved = localStorage.getItem(DB_PREFIX + 'attendance_records');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Lỗi đọc attendance từ DB:', e);
      }
    }
    // MẶC ĐỊNH CSDL TRẮNG: 0 BẢN GHI
    const blankRecords: BangChamCongNgay[] = [];
    this.saveAttendanceRecords(blankRecords);
    return blankRecords;
  }

  static saveAttendanceRecords(records: BangChamCongNgay[]): void {
    localStorage.setItem(DB_PREFIX + 'attendance_records', JSON.stringify(records));
  }

  // Lấy nhật ký audit
  static getAuditLogs(): NhatKyThayDoi[] {
    const saved = localStorage.getItem(DB_PREFIX + 'audit_logs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Lỗi đọc audit logs từ DB:', e);
      }
    }
    this.saveAuditLogs(INITIAL_BLANK_AUDIT_LOGS);
    return INITIAL_BLANK_AUDIT_LOGS;
  }

  static saveAuditLogs(logs: NhatKyThayDoi[]): void {
    localStorage.setItem(DB_PREFIX + 'audit_logs', JSON.stringify(logs));
  }

  /**
   * Làm sạch toàn bộ CSDL chấm công về CSDL trắng (0 bản ghi)
   */
  static clearAttendanceToBlank(): { success: boolean; message: string } {
    this.saveAttendanceRecords([]);
    return {
      success: true,
      message: 'Đã xóa sạch dữ liệu chấm công. CSDL hiện ở trạng thái trắng (0 bản ghi) để bạn tiến hành kiểm thử!',
    };
  }

  /**
   * Nạp lại dữ liệu mẫu 28 ngày từ file Excel COGAVA để đối chiếu
   */
  static loadSampleExcelAttendance(): BangChamCongNgay[] {
    this.saveAttendanceRecords(SAMPLE_EXCEL_RECORDS);
    return SAMPLE_EXCEL_RECORDS;
  }

  /**
   * Đổi mật khẩu tài khoản
   */
  static changePassword(
    userId: string,
    matKhauCu: string,
    matKhauMoi: string
  ): { success: boolean; message: string } {
    const users = this.getUserAccounts();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return { success: false, message: 'Không tìm thấy tài khoản người dùng trong CSDL!' };
    }

    const user = users[userIndex];
    if (user.password !== matKhauCu) {
      return { success: false, message: 'Mật khẩu hiện tại không chính xác. Vui lòng kiểm tra lại!' };
    }

    if (matKhauMoi.length < 4) {
      return { success: false, message: 'Mật khẩu mới phải có tối thiểu 4 ký tự!' };
    }

    users[userIndex] = {
      ...user,
      password: matKhauMoi,
    };
    this.saveUserAccounts(users);

    return {
      success: true,
      message: 'Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới cho các lần đăng nhập tiếp theo.',
    };
  }

  /**
   * Quản trị viên đặt lại mật khẩu cho tài khoản bất kỳ
   */
  static adminResetPassword(
    userId: string,
    newPassword = '123456'
  ): { success: boolean; message: string } {
    const users = this.getUserAccounts();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return { success: false, message: 'Không tìm thấy tài khoản!' };
    }

    users[userIndex].password = newPassword;
    this.saveUserAccounts(users);

    return {
      success: true,
      message: `Đã đặt lại mật khẩu cho tài khoản "${users[userIndex].tenHienThi}" về mặc định (${newPassword}).`,
    };
  }

  /**
   * Cập nhật Avatar cho người dùng
   */
  static updateAvatar(
    userId: string,
    avatar: string
  ): { success: boolean; updatedUser?: UserAccount; message: string } {
    const users = this.getUserAccounts();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return { success: false, message: 'Không tìm thấy tài khoản!' };
    }

    users[userIndex] = {
      ...users[userIndex],
      avatar,
    };
    this.saveUserAccounts(users);

    return {
      success: true,
      updatedUser: users[userIndex],
      message: 'Đã cập nhật ảnh đại diện (avatar) thành công!',
    };
  }

  /**
   * Cập nhật thông tin tài khoản (Tên, SĐT, Email, CCCD...)
   */
  static updateProfile(
    userId: string,
    data: Partial<Pick<UserAccount, 'tenHienThi' | 'sdt' | 'email' | 'soCccd' | 'cccdNgayCap' | 'cccdNoiCap' | 'cccdMatTruoc' | 'cccdMatSau'>>
  ): { success: boolean; updatedUser?: UserAccount; message: string } {
    const users = this.getUserAccounts();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return { success: false, message: 'Không tìm thấy tài khoản!' };
    }

    users[userIndex] = {
      ...users[userIndex],
      ...data,
    };
    this.saveUserAccounts(users);

    return {
      success: true,
      updatedUser: users[userIndex],
      message: 'Đã cập nhật thông tin hồ sơ thành công!',
    };
  }

  /**
   * Thêm tài khoản người dùng mới (Dành cho Admin)
   */
  static addUserAccount(accountData: Omit<UserAccount, 'id' | 'ngayTao'>): {
    success: boolean;
    user?: UserAccount;
    message: string;
  } {
    const users = this.getUserAccounts();
    // Check duplicate username
    if (users.some(u => u.username.toLowerCase() === accountData.username.toLowerCase())) {
      return { success: false, message: `Tên đăng nhập "${accountData.username}" đã tồn tại trên hệ thống!` };
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newUser: UserAccount = {
      ...accountData,
      id: `usr-${Date.now()}`,
      ngayTao: nowStr,
    };

    const updatedList = [...users, newUser];
    this.saveUserAccounts(updatedList);

    return {
      success: true,
      user: newUser,
      message: `Đã tạo tài khoản "${newUser.username}" thành công cho ${newUser.tenHienThi}!`,
    };
  }

  /**
   * Xóa tài khoản người dùng (Admin only, không cho xóa admin chính)
   */
  static deleteUserAccount(userId: string): { success: boolean; message: string } {
    if (userId === 'usr-admin') {
      return { success: false, message: 'Không thể xóa tài khoản Quản trị viên tối cao!' };
    }

    const users = this.getUserAccounts();
    const filtered = users.filter(u => u.id !== userId);
    this.saveUserAccounts(filtered);

    return { success: true, message: 'Đã xóa tài khoản thành công!' };
  }

  /**
   * Thống kê thông số CSDL
   */
  static getStats(): {
    userCount: number;
    employeeCount: number;
    attendanceCount: number;
    configCount: number;
    auditCount: number;
    isBlank: boolean;
  } {
    const users = this.getUserAccounts();
    const employees = this.getEmployees();
    const attendance = this.getAttendanceRecords();
    const configs = this.getConfigs();
    const audit = this.getAuditLogs();

    return {
      userCount: users.length,
      employeeCount: employees.length,
      attendanceCount: attendance.length,
      configCount: configs.length,
      auditCount: audit.length,
      isBlank: attendance.length === 0,
    };
  }
}
