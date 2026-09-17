import test, { mock } from 'node:test';
import assert from 'node:assert/strict';

let failReads = false;
let sessionToken = 'new-device';
let deleted = false;
let batchWrites: string[] = [];
let commits = 0;
let snapshotCallback: Function;
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
  setDoc: async () => {}, deleteDoc: async () => {}, onSnapshot: (_ref: unknown, options: unknown, callback: Function) => { snapshotCallback = callback; return () => {}; },
  writeBatch: () => ({ set: (ref: string) => batchWrites.push('set:' + ref), delete: (ref: string) => batchWrites.push('delete:' + ref), commit: async () => { commits++; } }), query: (value: unknown) => value, orderBy: () => null, limit: () => null,
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

test('organization changes update linked collections in one commit without touching attendance', async () => {
  batchWrites = []; commits = 0;
  await FirestoreSyncService.saveOrganization({ teams: [{ id: 'old', tenDoi: 'Old' }], users: [], employees: [] }, { teams: [{ id: 'new', tenDoi: 'New' }], users: [], employees: [] });
  assert.deepEqual(batchWrites, ['delete:teams/old', 'set:teams/new']);
  assert.equal(commits, 1);
});

test('an empty offline cache cannot wipe local team data; authoritative empty server data can', () => {
  let callbacks = 0;
  FirestoreSyncService.subscribeTeams(() => { callbacks++; });
  snapshotCallback({ metadata: { fromCache: true }, forEach: () => {} });
  assert.equal(callbacks, 0);
  snapshotCallback({ metadata: { fromCache: false }, forEach: () => {} });
  assert.equal(callbacks, 1);
});
