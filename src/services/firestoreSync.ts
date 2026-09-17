import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  BangChamCongNgay,
  CauHinhLuong,
  DoiNhanVien,
  NhanVien,
  NhatKyThayDoi,
  UserAccount,
} from '../types';

export interface ActiveSessionInfo {
  userId: string;
  sessionToken: string;
  loginAt: string;
  deviceName?: string;
  userAgent?: string;
}

export class FirestoreSyncService {
  // ==========================================
  // 1. TEAMS (Đội nhóm)
  // ==========================================
  static subscribeTeams(callback: (teams: DoiNhanVien[]) => void) {
    const colRef = collection(db, 'teams');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items: DoiNhanVien[] = [];
        snapshot.forEach((d) => items.push(d.data() as DoiNhanVien));
        callback(items);
      },
      (error) => {
        console.warn('Firestore teams sync warning:', error);
      }
    );
  }

  static async saveTeam(team: DoiNhanVien) {
    try {
      await setDoc(doc(db, 'teams', team.id), team);
    } catch (e) {
      console.error('Error saving team to Firestore:', e);
    }
  }

  static async deleteTeam(teamId: string) {
    try {
      await deleteDoc(doc(db, 'teams', teamId));
    } catch (e) {
      console.error('Error deleting team from Firestore:', e);
    }
  }

  // ==========================================
  // 2. EMPLOYEES (Nhân sự)
  // ==========================================
  static subscribeEmployees(callback: (employees: NhanVien[]) => void) {
    const colRef = collection(db, 'employees');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items: NhanVien[] = [];
        snapshot.forEach((d) => items.push(d.data() as NhanVien));
        callback(items);
      },
      (error) => {
        console.warn('Firestore employees sync warning:', error);
      }
    );
  }

  static async saveEmployee(emp: NhanVien) {
    try {
      await setDoc(doc(db, 'employees', emp.id), emp);
    } catch (e) {
      console.error('Error saving employee to Firestore:', e);
    }
  }

  static async deleteEmployee(empId: string) {
    try {
      await deleteDoc(doc(db, 'employees', empId));
    } catch (e) {
      console.error('Error deleting employee from Firestore:', e);
    }
  }

  // ==========================================
  // 3. ATTENDANCE RECORDS (Bảng chấm công ngày)
  // ==========================================
  static subscribeAttendance(callback: (records: BangChamCongNgay[]) => void) {
    const colRef = collection(db, 'attendance_records');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items: BangChamCongNgay[] = [];
        snapshot.forEach((d) => items.push(d.data() as BangChamCongNgay));
        callback(items);
      },
      (error) => {
        console.warn('Firestore attendance sync warning:', error);
      }
    );
  }

  static async saveAttendanceRecord(record: BangChamCongNgay) {
    try {
      await setDoc(doc(db, 'attendance_records', record.id), record);
    } catch (e) {
      console.error('Error saving attendance record to Firestore:', e);
    }
  }

  static async deleteAttendanceRecord(recordId: string) {
    try {
      await deleteDoc(doc(db, 'attendance_records', recordId));
    } catch (e) {
      console.error('Error deleting attendance record from Firestore:', e);
    }
  }

  static async clearAllAttendance() {
    try {
      const colRef = collection(db, 'attendance_records');
      const snap = await getDocs(colRef);
      const batch = writeBatch(db);
      snap.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    } catch (e) {
      console.error('Error clearing attendance records in Firestore:', e);
    }
  }

  static async batchSaveAttendance(records: BangChamCongNgay[]) {
    try {
      const batch = writeBatch(db);
      for (const rec of records) {
        batch.set(doc(db, 'attendance_records', rec.id), rec);
      }
      await batch.commit();
    } catch (e) {
      console.error('Error batch saving attendance in Firestore:', e);
    }
  }

  // ==========================================
  // 4. CONFIGS (Cấu hình đơn giá & công thức)
  // ==========================================
  static subscribeConfigs(callback: (configs: CauHinhLuong[]) => void) {
    const colRef = collection(db, 'configs');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items: CauHinhLuong[] = [];
        snapshot.forEach((d) => items.push(d.data() as CauHinhLuong));
        if (items.length > 0) {
          callback(items);
        }
      },
      (error) => {
        console.warn('Firestore configs sync warning:', error);
      }
    );
  }

  static async saveConfig(cfg: CauHinhLuong) {
    try {
      await setDoc(doc(db, 'configs', cfg.id), cfg);
    } catch (e) {
      console.error('Error saving config to Firestore:', e);
    }
  }

  // ==========================================
  // 5. USER ACCOUNTS (Tài khoản người dùng)
  // ==========================================
  static subscribeUsers(callback: (users: UserAccount[]) => void) {
    const colRef = collection(db, 'users');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items: UserAccount[] = [];
        snapshot.forEach((d) => items.push(d.data() as UserAccount));
        callback(items);
      },
      (error) => {
        console.warn('Firestore users sync warning:', error);
      }
    );
  }

  static async saveUser(user: UserAccount) {
    try {
      await setDoc(doc(db, 'users', user.id), user);
    } catch (e) {
      console.error('Error saving user to Firestore:', e);
    }
  }

  static async deleteUser(userId: string) {
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (e) {
      console.error('Error deleting user from Firestore:', e);
    }
  }

  // ==========================================
  // 6. AUDIT LOGS (Giới hạn tối đa 100 bản ghi mới nhất)
  // ==========================================
  static subscribeAuditLogs(callback: (logs: NhatKyThayDoi[]) => void) {
    const q = query(collection(db, 'audit_logs'), orderBy('thoiGian', 'desc'), limit(100));
    return onSnapshot(
      q,
      (snapshot) => {
        const items: NhatKyThayDoi[] = [];
        snapshot.forEach((d) => items.push(d.data() as NhatKyThayDoi));
        callback(items);
      },
      (error) => {
        console.warn('Firestore audit logs sync warning:', error);
      }
    );
  }

  static async saveAuditLog(log: NhatKyThayDoi) {
    try {
      await setDoc(doc(db, 'audit_logs', log.id), log);
    } catch (e) {
      console.error('Error saving audit log to Firestore:', e);
    }
  }

  // ==========================================
  // 7. BẢO VỆ ĐĂNG NHẬP (SINGLE DEVICE ACTIVE SESSION)
  // ==========================================
  static async registerActiveSession(
    userId: string,
    sessionToken: string,
    deviceName?: string
  ): Promise<void> {
    try {
      const sessionDocRef = doc(db, 'active_sessions', userId);
      const data: ActiveSessionInfo = {
        userId,
        sessionToken,
        loginAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        deviceName: deviceName || (typeof navigator !== 'undefined' ? (navigator.userAgent.includes('Mobile') ? 'Điện thoại di động' : 'Máy tính / Trình duyệt') : 'Thiết bị khác'),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      };
      await setDoc(sessionDocRef, data);
    } catch (e) {
      console.error('Error registering active session on Firestore:', e);
    }
  }

  static subscribeActiveSession(
    userId: string,
    currentLocalToken: string,
    onConflict: (info: { deviceName?: string; loginAt?: string }) => void
  ) {
    const sessionDocRef = doc(db, 'active_sessions', userId);
    return onSnapshot(
      sessionDocRef,
      (snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.data() as ActiveSessionInfo;
        // Nếu token trên Cloud khác token của máy hiện tại -> tài khoản vừa đăng nhập ở thiết bị khác!
        if (data && data.sessionToken && data.sessionToken !== currentLocalToken) {
          console.warn('Detected concurrent session login on another device for user:', userId);
          onConflict({
            deviceName: data.deviceName,
            loginAt: data.loginAt,
          });
        }
      },
      (error) => {
        console.warn('Active session listener warning:', error);
      }
    );
  }

  static async clearActiveSession(userId: string, currentSessionToken?: string): Promise<void> {
    try {
      const sessionDocRef = doc(db, 'active_sessions', userId);
      const snap = await getDoc(sessionDocRef);
      if (snap.exists()) {
        const data = snap.data() as ActiveSessionInfo;
        // Chỉ xóa nếu token khớp với phiên hiện tại đang đăng xuất
        if (!currentSessionToken || data.sessionToken === currentSessionToken) {
          await deleteDoc(sessionDocRef);
        }
      }
    } catch (e) {
      console.warn('Error clearing active session:', e);
    }
  }

  // ==========================================
  // 8. ĐỒNG BỘ TOÀN DIỆN KHI ĐĂNG NHẬP (FULL SYNC ON LOGIN)
  // ==========================================
  static async syncAllDataFromCloud(): Promise<{
    teams: DoiNhanVien[];
    employees: NhanVien[];
    configs: CauHinhLuong[];
    attendanceRecords: BangChamCongNgay[];
    users: UserAccount[];
    auditLogs: NhatKyThayDoi[];
  }> {
    const result = {
      teams: [] as DoiNhanVien[],
      employees: [] as NhanVien[],
      configs: [] as CauHinhLuong[],
      attendanceRecords: [] as BangChamCongNgay[],
      users: [] as UserAccount[],
      auditLogs: [] as NhatKyThayDoi[],
    };

    try {
      const [teamsSnap, empsSnap, cfgsSnap, attSnap, usersSnap, auditSnap] = await Promise.all([
        getDocs(collection(db, 'teams')),
        getDocs(collection(db, 'employees')),
        getDocs(collection(db, 'configs')),
        getDocs(collection(db, 'attendance_records')),
        getDocs(collection(db, 'users')),
        getDocs(query(collection(db, 'audit_logs'), orderBy('thoiGian', 'desc'), limit(100))),
      ]);

      teamsSnap.forEach((d) => result.teams.push(d.data() as DoiNhanVien));
      empsSnap.forEach((d) => result.employees.push(d.data() as NhanVien));
      cfgsSnap.forEach((d) => result.configs.push(d.data() as CauHinhLuong));
      attSnap.forEach((d) => result.attendanceRecords.push(d.data() as BangChamCongNgay));
      usersSnap.forEach((d) => result.users.push(d.data() as UserAccount));
      auditSnap.forEach((d) => result.auditLogs.push(d.data() as NhatKyThayDoi));
    } catch (e) {
      console.error('Error during syncAllDataFromCloud:', e);
    }

    return result;
  }

  // Đảm bảo dữ liệu cơ sở ban đầu (admin, config) luôn sẵn sàng trên Cloud
  // Tuyệt đối không tự tạo lại các đội nhóm hay tài khoản nhân viên mà Quản trị viên đã chủ động xóa!
  static async ensureDefaultDataOnCloud(params: {
    defaultTeams: DoiNhanVien[];
    defaultUsers: UserAccount[];
    defaultConfigs: CauHinhLuong[];
  }) {
    try {
      const metaDocRef = doc(db, 'system_metadata', 'init_state');
      const metaSnap = await getDoc(metaDocRef);

      const usersSnap = await getDocs(collection(db, 'users'));

      if (!metaSnap.exists()) {
        // Hệ thống lần đầu tiên khởi tạo trên Cloud
        if (usersSnap.empty) {
          for (const u of params.defaultUsers) {
            await setDoc(doc(db, 'users', u.id), u);
          }
        }
        const configsSnap = await getDocs(collection(db, 'configs'));
        if (configsSnap.empty) {
          for (const c of params.defaultConfigs) {
            await setDoc(doc(db, 'configs', c.id), c);
          }
        }
        // Đánh dấu hệ thống đã khởi tạo hoàn tất
        await setDoc(metaDocRef, {
          isInitialized: true,
          initializedAt: new Date().toISOString(),
        });
      } else {
        // Hệ thống ĐÃ KHỞI TẠO:
        // 1. Tuyệt đối KHÔNG tự động tạo lại bất kỳ đội nhóm nào! (Nếu mảng rỗng nghĩa là admin đã xóa)
        // 2. Tuyệt đối KHÔNG tự tạo lại các tài khoản nhân sự đã bị xóa!
        // Nếu chẳng may tất cả admin bị xóa hết, chỉ phục hồi 1 tài khoản admin tối cao để không bị khóa hệ thống
        if (usersSnap.empty) {
          const defaultAdmin = params.defaultUsers.find(u => u.username === 'admin') || params.defaultUsers[0];
          if (defaultAdmin) {
            await setDoc(doc(db, 'users', defaultAdmin.id), defaultAdmin);
          }
        }
      }
    } catch (e) {
      console.warn('ensureDefaultDataOnCloud notice:', e);
    }
  }
}
