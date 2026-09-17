import test, { mock } from 'node:test';
import assert from 'node:assert/strict';

let failReads = false;
let sessionToken = 'new-device';
let deleted = false;
mock.module('firebase/firestore', { namedExports: {
  initializeFirestore: () => ({}), getFirestore: () => ({}),
  collection: (_db: unknown, name: string) => name,
  doc: (_db: unknown, name: string, id: string) => `${name}/${id}`,
  getDoc: async () => ({ exists: () => false }),
  getDocs: async () => ({ empty: true, forEach: () => {} }),
  getDocsFromServer: async () => {
    if (failReads) throw new Error('offline');
    return { forEach: () => {} };
  },
  setDoc: async () => {}, deleteDoc: async () => {}, onSnapshot: () => () => {},
  writeBatch: () => ({}), query: (value: unknown) => value, orderBy: () => null, limit: () => null,
  runTransaction: async (_db: unknown, callback: Function) => callback({
    get: async () => ({ exists: () => true, data: () => ({ sessionToken }) }),
    delete: () => { deleted = true; },
  }),
} });
const { FirestoreSyncService } = await import('../src/services/firestoreSync');

test('failed cloud sync rejects instead of returning empty payroll data', async () => {
  failReads = true;
  const quiet = mock.method(console, 'error', () => {});
  await assert.rejects(FirestoreSyncService.syncAllDataFromCloud(), /offline/);
  quiet.mock.restore();
  failReads = false;
});
test('successful empty cloud sync remains an authoritative empty result', async () => {
  const result = await FirestoreSyncService.syncAllDataFromCloud();
  assert.deepEqual(result.attendanceRecords, []);
  assert.deepEqual(result.employees, []);
});
test('logout never deletes another device session or deletes without a token', async () => {
  deleted = false;
  await FirestoreSyncService.clearActiveSession('u', 'old-device');
  assert.equal(deleted, false);
  await FirestoreSyncService.clearActiveSession('u');
  assert.equal(deleted, false);
  await FirestoreSyncService.clearActiveSession('u', 'new-device');
  assert.equal(deleted, true);
});
