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

// Prefix storage key v3
const DB_PREFIX = 'cogava_payroll_db_v3_';

// 1. Initial User Accounts (Chỉ 2 tài khoản quản trị mặc định ban đầu theo yêu cầu)
export const DEFAULT_USER_ACCOUNTS: UserAccount[] = [
  {
    id: 'usr-thach',
    username: 'thach',
    password: '123456',
    tenHienThi: 'Thạch',
    vaiTro: 'ADMIN',
    avatar: 'preset-admin',
    ngayTao: '2026-01-01 08:00:00',
  },
  {
    id: 'usr-admin',
    username: 'admin',
    password: 'Langbat136@',
    tenHienThi: 'Admin',
    vaiTro: 'ADMIN',
    avatar: 'preset-admin',
    ngayTao: '2026-01-01 08:00:00',
  },
];

export const INITIAL_BLANK_AUDIT_LOGS: NhatKyThayDoi[] = [
  {
    id: 'log-db-init-blank',
    bang: 'HeThong',
    banGhiId: 'csdl-trang',
    nguoiThucHien: 'Thạch',
    vaiTroNguoiThucHien: 'ADMIN',
    thoiGian: new Date().toISOString().replace('T', ' ').substring(0, 19),
    hanhDong: 'TAO',
    moTa: 'Khởi tạo cấu trúc hệ thống quản trị COGAVA với 2 tài khoản quản trị mặc định.',
    giaTriCu: null,
    giaTriMoi: { trangThai: 'HOAT_DONG', adminCount: 2 },
  },
];

/**
 * CSDL Engine cho Bảng lương COGAVA
 */
export class PayrollDatabase {
  // 1. Quản lý Đội nhân viên (Teams)
  static getTeams(): DoiNhanVien[] {
    const saved = localStorage.getItem(DB_PREFIX + 'teams');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
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
    const updated = [...teams, newTeam];
    this.saveTeams(updated);
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
    const filtered = teams.filter(t => t.id !== id);
    this.saveTeams(filtered);
    return { success: true, message: 'Đã xóa đội thành công!' };
  }

  // Lấy danh sách tài khoản (luôn bảo đảm 2 tài khoản quản trị thach và admin tồn tại và đúng pass)
  static getUserAccounts(): UserAccount[] {
    const saved = localStorage.getItem(DB_PREFIX + 'users');
    let accounts: UserAccount[] = [];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          accounts = parsed;
        }
      } catch (e) {
        console.error('Lỗi đọc user accounts từ DB:', e);
      }
    }

    let modified = false;
    // Đảm bảo tài khoản 'thach' (pass: 123456)
    const thachIndex = accounts.findIndex(a => a.username.toLowerCase() === 'thach');
    if (thachIndex === -1) {
      accounts.unshift({
        id: 'usr-thach',
        username: 'thach',
        password: '123456',
        tenHienThi: 'Thạch',
        vaiTro: 'ADMIN',
        avatar: 'preset-admin',
        ngayTao: '2026-01-01 08:00:00',
      });
      modified = true;
    } else {
      if (accounts[thachIndex].password !== '123456' || accounts[thachIndex].vaiTro !== 'ADMIN') {
        accounts[thachIndex].password = '123456';
        accounts[thachIndex].vaiTro = 'ADMIN';
        modified = true;
      }
    }

    // Đảm bảo tài khoản 'admin' (pass: Langbat136@)
    const adminIndex = accounts.findIndex(a => a.username.toLowerCase() === 'admin');
    if (adminIndex === -1) {
      accounts.push({
        id: 'usr-admin',
        username: 'admin',
        password: 'Langbat136@',
        tenHienThi: 'Admin',
        vaiTro: 'ADMIN',
        avatar: 'preset-admin',
        ngayTao: '2026-01-01 08:00:00',
      });
      modified = true;
    } else {
      if (accounts[adminIndex].password !== 'Langbat136@' || accounts[adminIndex].vaiTro !== 'ADMIN') {
        accounts[adminIndex].password = 'Langbat136@';
        accounts[adminIndex].vaiTro = 'ADMIN';
        modified = true;
      }
    }

    if (modified || accounts.length === 0) {
      this.saveUserAccounts(accounts);
    }
    return accounts;
  }

  static saveUserAccounts(users: UserAccount[]): void {
    localStorage.setItem(DB_PREFIX + 'users', JSON.stringify(users));
  }

  // Lấy danh sách nhân viên
  static getEmployees(): NhanVien[] {
    const saved = localStorage.getItem(DB_PREFIX + 'employees');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
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
