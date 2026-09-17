import {
  collection,
  doc,
  getDoc,
  getDocs,
  getDocsFromServer,
  runTransaction,
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

/**
 * Loại bỏ các trường undefined đệ quy trước khi ghi vào Firestore
 * Ngăn chặn hoàn toàn lỗi: "Unsupported field value: undefined"
 */
export function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(data)) {
    return data.map(item => cleanForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleaned[key] = cleanForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

function reportSyncError() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('cogava:sync-error'));
}

export class FirestoreSyncService {
  static async saveOrganization(before: import('../utils/teamManagement').Organization, after: import('../utils/teamManagement').Organization) {
    try {
      const batch = writeBatch(db);
      for (const key of ['teams', 'employees', 'users'] as const) {
        for (const item of before[key]) if (!after[key].some(next => next.id === item.id)) batch.delete(doc(db, key, item.id));
        for (const item of after[key]) if (JSON.stringify(item) !== JSON.stringify(before[key].find(old => old.id === item.id))) {
          batch.set(doc(db, key, item.id), cleanForFirestore(item));
        }
      }
      await batch.commit();
    } catch (error) { reportSyncError(); throw error; }
  }

  // ==========================================
  // 1. TEAMS (Đội nhóm)
  // ==========================================
  static subscribeTeams(callback: (teams: DoiNhanVien[]) => void) {
    const colRef = collection(db, 'teams');
    return onSnapshot(
      colRef,
      { includeMetadataChanges: true },
      (snapshot) => {
        if (snapshot.metadata.fromCache) return;
        const items: DoiNhanVien[] = [];
        snapshot.forEach((d) => items.push(d.data() as DoiNhanVien));
        callback(items);
      },
      (error) => {
        reportSyncError();
        console.warn('Firestore teams sync warning:', error);
      }
    );
  }

  static async saveTeam(team: DoiNhanVien) {
    try {
      await setDoc(doc(db, 'teams', team.id), cleanForFirestore(team));
    } catch (e) {
      reportSyncError();
      console.error('Error saving team to Firestore:', e);
      throw e;
    }
  }

  static async deleteTeam(teamId: string) {
    try {
      await deleteDoc(doc(db, 'teams', teamId));
    } catch (e) {
      reportSyncError();
      console.error('Error deleting team from Firestore:', e);
      throw e;
    }
  }

  // ==========================================
  // 2. EMPLOYEES (Nhân sự)
  // ==========================================
  static subscribeEmployees(callback: (employees: NhanVien[]) => void) {
    const colRef = collection(db, 'employees');
    return onSnapshot(
      colRef,
      { includeMetadataChanges: true },
      (snapshot) => {
        if (snapshot.metadata.fromCache) return;
        const items: NhanVien[] = [];
        snapshot.forEach((d) => items.push(d.data() as NhanVien));
        callback(items);
      },
      (error) => {
        reportSyncError();
        console.warn('Firestore employees sync warning:', error);
      }
    );
  }

  static async saveEmployee(emp: NhanVien) {
    try {
      await setDoc(doc(db, 'employees', emp.id), cleanForFirestore(emp));
    } catch (e) {
      reportSyncError();
      console.error('Error saving employee to Firestore:', e);
      throw e;
    }
  }

  static async deleteEmployee(empId: string) {
    try {
      await deleteDoc(doc(db, 'employees', empId));
    } catch (e) {
      reportSyncError();
      console.error('Error deleting employee from Firestore:', e);
      throw e;
    }
  }

  // ==========================================
  // 3. ATTENDANCE RECORDS (Bảng chấm công ngày)
  // ==========================================
  static subscribeAttendance(callback: (records: BangChamCongNgay[]) => void) {
    const colRef = collection(db, 'attendance_records');
    return onSnapshot(
      colRef,
      { includeMetadataChanges: true },
      (snapshot) => {
        if (snapshot.metadata.fromCache) return;
        const items: BangChamCongNgay[] = [];
        snapshot.forEach((d) => items.push(d.data() as BangChamCongNgay));
        callback(items);
      },
      (error) => {
        reportSyncError();
        console.warn('Firestore attendance sync warning:', error);
      }
    );
  }

  static async saveAttendanceRecord(record: BangChamCongNgay) {
    try {
      await setDoc(doc(db, 'attendance_records', record.id), cleanForFirestore(record));
    } catch (e) {
      reportSyncError();
      console.error('Error saving attendance record to Firestore:', e);
      throw e;
    }
  }

  static async deleteAttendanceRecord(recordId: string) {
    try {
      await deleteDoc(doc(db, 'attendance_records', recordId));
    } catch (e) {
      reportSyncError();
      console.error('Error deleting attendance record from Firestore:', e);
      throw e;
    }
  }

  static async clearAllAttendance() {
    try {
      const colRef = collection(db, 'attendance_records');
      const snap = await getDocs(colRef);
      if (snap.empty) return;
      const batch = writeBatch(db);
      snap.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    } catch (e) {
      reportSyncError();
      console.error('Error clearing attendance records in Firestore:', e);
      throw e;
    }
  }

  static async batchSaveAttendance(records: BangChamCongNgay[]) {
    try {
      const batch = writeBatch(db);
      for (const rec of records) {
        batch.set(doc(db, 'attendance_records', rec.id), cleanForFirestore(rec));
      }
      await batch.commit();
    } catch (e) {
      reportSyncError();
      console.error('Error batch saving attendance in Firestore:', e);
      throw e;
    }
  }

  // ==========================================
  // 4. CONFIGS (Cấu hình đơn giá & công thức)
  // ==========================================
  static subscribeConfigs(callback: (configs: CauHinhLuong[]) => void) {
    const colRef = collection(db, 'configs');
    return onSnapshot(
      colRef,
      { includeMetadataChanges: true },
      (snapshot) => {
        if (snapshot.metadata.fromCache) return;
        const items: CauHinhLuong[] = [];
        snapshot.forEach((d) => items.push(d.data() as CauHinhLuong));
        if (items.length > 0) {
          callback(items);
        }
      },
      (error) => {
        reportSyncError();
        console.warn('Firestore configs sync warning:', error);
      }
    );
  }

  static async saveConfig(cfg: CauHinhLuong) {
    try {
      await setDoc(doc(db, 'configs', cfg.id), cleanForFirestore(cfg));
    } catch (e) {
      reportSyncError();
      console.error('Error saving config to Firestore:', e);
      throw e;
    }
  }

  // ==========================================
  // 5. USER ACCOUNTS (Tài khoản người dùng)
  // ==========================================
  static subscribeUsers(callback: (users: UserAccount[]) => void) {
    const colRef = collection(db, 'users');
    return onSnapshot(
      colRef,
      { includeMetadataChanges: true },
      (snapshot) => {
        if (snapshot.metadata.fromCache) return;
        const items: UserAccount[] = [];
        snapshot.forEach((d) => items.push(d.data() as UserAccount));
        callback(items);
      },
      (error) => {
        reportSyncError();
        console.warn('Firestore users sync warning:', error);
      }
    );
  }

  static async saveUser(user: UserAccount) {
    try {
      await setDoc(doc(db, 'users', user.id), cleanForFirestore(user));
    } catch (e) {
      reportSyncError();
      console.error('Error saving user to Firestore:', e);
      throw e;
    }
  }

  static async deleteUser(userId: string) {
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (e) {
      reportSyncError();
      console.error('Error deleting user from Firestore:', e);
      throw e;
    }
  }

  // ==========================================
  // 6. AUDIT LOGS (Giới hạn tối đa 100 bản ghi mới nhất)
  // ==========================================
  static subscribeAuditLogs(callback: (logs: NhatKyThayDoi[]) => void) {
    const q = query(collection(db, 'audit_logs'), orderBy('thoiGian', 'desc'), limit(100));
    return onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snapshot) => {
        if (snapshot.metadata.fromCache) return;
        const items: NhatKyThayDoi[] = [];
        snapshot.forEach((d) => items.push(d.data() as NhatKyThayDoi));
        callback(items);
      },
      (error) => {
        reportSyncError();
        console.warn('Firestore audit logs sync warning:', error);
      }
    );
  }

  static async saveAuditLog(log: NhatKyThayDoi) {
    try {
      await setDoc(doc(db, 'audit_logs', log.id), cleanForFirestore(log));
    } catch (e) {
      reportSyncError();
      console.error('Error saving audit log to Firestore:', e);
      throw e;
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
      await setDoc(sessionDocRef, cleanForFirestore(data));
    } catch (e) {
      reportSyncError();
      console.error('Error registering active session on Firestore:', e);
      throw e;
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
        reportSyncError();
        console.warn('Active session listener warning:', error);
      }
    );
  }

  static async clearActiveSession(userId: string, currentSessionToken?: string): Promise<void> {
    try {
      const sessionDocRef = doc(db, 'active_sessions', userId);
      await runTransaction(db, async transaction => {
        const snap = await transaction.get(sessionDocRef);
        if (snap.exists() && currentSessionToken && snap.data().sessionToken === currentSessionToken) {
          transaction.delete(sessionDocRef);
        }
      });
    } catch (e) {
      reportSyncError();
      console.warn('Error clearing active session:', e);
      throw e;
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
        getDocsFromServer(collection(db, 'teams')),
        getDocsFromServer(collection(db, 'employees')),
        getDocsFromServer(collection(db, 'configs')),
        getDocsFromServer(collection(db, 'attendance_records')),
        getDocsFromServer(collection(db, 'users')),
        getDocsFromServer(query(collection(db, 'audit_logs'), orderBy('thoiGian', 'desc'), limit(100))),
      ]);

      teamsSnap.forEach((d) => result.teams.push(d.data() as DoiNhanVien));
      empsSnap.forEach((d) => result.employees.push(d.data() as NhanVien));
      cfgsSnap.forEach((d) => result.configs.push(d.data() as CauHinhLuong));
      attSnap.forEach((d) => result.attendanceRecords.push(d.data() as BangChamCongNgay));
      usersSnap.forEach((d) => result.users.push(d.data() as UserAccount));
      auditSnap.forEach((d) => result.auditLogs.push(d.data() as NhatKyThayDoi));
    } catch (e) {
      reportSyncError();
      console.error('Error during syncAllDataFromCloud:', e);
      throw e;
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
            await setDoc(doc(db, 'users', u.id), cleanForFirestore(u));
          }
        }
        const configsSnap = await getDocs(collection(db, 'configs'));
        if (configsSnap.empty) {
          for (const c of params.defaultConfigs) {
            await setDoc(doc(db, 'configs', c.id), cleanForFirestore(c));
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
            await setDoc(doc(db, 'users', defaultAdmin.id), cleanForFirestore(defaultAdmin));
          }
        }
      }
    } catch (e) {
      reportSyncError();
      console.warn('ensureDefaultDataOnCloud notice:', e);
      throw e;
    }
  }
}
