import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  BangChamCongNgay,
  CauHinhLuong,
  DoiNhanVien,
  NhanVien,
  NhatKyThayDoi,
  ThongTinDoanhNghiep,
  UserAccount,
} from '../types';

export class FirestoreSyncService {
  // 1. Teams
  static subscribeTeams(callback: (teams: DoiNhanVien[]) => void) {
    const colRef = collection(db, 'teams');
    return onSnapshot(colRef, (snapshot) => {
      const items: DoiNhanVien[] = [];
      snapshot.forEach((d) => items.push(d.data() as DoiNhanVien));
      if (items.length > 0) {
        callback(items);
      }
    }, (error) => {
      console.warn('Firestore teams sync warning:', error);
    });
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

  // 2. Employees
  static subscribeEmployees(callback: (employees: NhanVien[]) => void) {
    const colRef = collection(db, 'employees');
    return onSnapshot(colRef, (snapshot) => {
      const items: NhanVien[] = [];
      snapshot.forEach((d) => items.push(d.data() as NhanVien));
      if (items.length > 0) {
        callback(items);
      }
    }, (error) => {
      console.warn('Firestore employees sync warning:', error);
    });
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

  // 3. Attendance Records
  static subscribeAttendance(callback: (records: BangChamCongNgay[]) => void) {
    const colRef = collection(db, 'attendance_records');
    return onSnapshot(colRef, (snapshot) => {
      const items: BangChamCongNgay[] = [];
      snapshot.forEach((d) => items.push(d.data() as BangChamCongNgay));
      callback(items);
    }, (error) => {
      console.warn('Firestore attendance sync warning:', error);
    });
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

  // 4. Configs
  static subscribeConfigs(callback: (configs: CauHinhLuong[]) => void) {
    const colRef = collection(db, 'configs');
    return onSnapshot(colRef, (snapshot) => {
      const items: CauHinhLuong[] = [];
      snapshot.forEach((d) => items.push(d.data() as CauHinhLuong));
      if (items.length > 0) {
        callback(items);
      }
    }, (error) => {
      console.warn('Firestore configs sync warning:', error);
    });
  }

  static async saveConfig(cfg: CauHinhLuong) {
    try {
      await setDoc(doc(db, 'configs', cfg.id), cfg);
    } catch (e) {
      console.error('Error saving config to Firestore:', e);
    }
  }

  // 5. User Accounts
  static subscribeUsers(callback: (users: UserAccount[]) => void) {
    const colRef = collection(db, 'users');
    return onSnapshot(colRef, (snapshot) => {
      const items: UserAccount[] = [];
      snapshot.forEach((d) => items.push(d.data() as UserAccount));
      if (items.length > 0) {
        callback(items);
      }
    }, (error) => {
      console.warn('Firestore users sync warning:', error);
    });
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

  // 6. Audit Logs
  static subscribeAuditLogs(callback: (logs: NhatKyThayDoi[]) => void) {
    const colRef = collection(db, 'audit_logs');
    return onSnapshot(colRef, (snapshot) => {
      const items: NhatKyThayDoi[] = [];
      snapshot.forEach((d) => items.push(d.data() as NhatKyThayDoi));
      if (items.length > 0) {
        callback(items);
      }
    }, (error) => {
      console.warn('Firestore audit logs sync warning:', error);
    });
  }

  static async saveAuditLog(log: NhatKyThayDoi) {
    try {
      await setDoc(doc(db, 'audit_logs', log.id), log);
    } catch (e) {
      console.error('Error saving audit log to Firestore:', e);
    }
  }

  // Initial Sync / Seed helper
  static async initializeAndSyncSeed(params: {
    initialTeams: DoiNhanVien[];
    initialEmployees: NhanVien[];
    initialConfigs: CauHinhLuong[];
    initialUsers: UserAccount[];
    initialAuditLogs: NhatKyThayDoi[];
  }) {
    try {
      // 1. Teams
      const teamsSnap = await getDocs(collection(db, 'teams'));
      if (teamsSnap.empty) {
        const batch = writeBatch(db);
        for (const t of params.initialTeams) {
          batch.set(doc(db, 'teams', t.id), t);
        }
        await batch.commit();
      }

      // 2. Employees
      const empSnap = await getDocs(collection(db, 'employees'));
      if (empSnap.empty) {
        const batch = writeBatch(db);
        for (const emp of params.initialEmployees) {
          batch.set(doc(db, 'employees', emp.id), emp);
        }
        await batch.commit();
      }

      // 3. Configs
      const cfgSnap = await getDocs(collection(db, 'configs'));
      if (cfgSnap.empty) {
        const batch = writeBatch(db);
        for (const c of params.initialConfigs) {
          batch.set(doc(db, 'configs', c.id), c);
        }
        await batch.commit();
      }

      // 4. Users
      const userSnap = await getDocs(collection(db, 'users'));
      if (userSnap.empty) {
        const batch = writeBatch(db);
        for (const u of params.initialUsers) {
          batch.set(doc(db, 'users', u.id), u);
        }
        await batch.commit();
      }

      // 5. Audit
      const auditSnap = await getDocs(collection(db, 'audit_logs'));
      if (auditSnap.empty) {
        const batch = writeBatch(db);
        for (const a of params.initialAuditLogs) {
          batch.set(doc(db, 'audit_logs', a.id), a);
        }
        await batch.commit();
      }
    } catch (e) {
      console.warn('Firestore initial seeding error:', e);
    }
  }
}
