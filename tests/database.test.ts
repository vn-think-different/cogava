import test from 'node:test';
import assert from 'node:assert/strict';
import { PayrollDatabase, DEFAULT_USER_ACCOUNTS } from '../src/services/payrollDatabase';

const data = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', { value: {
  getItem: (key: string) => data.get(key) ?? null,
  setItem: (key: string, value: string) => data.set(key, value),
}, configurable: true });

test('a new browser store seeds initial accounts only once', () => {
  data.clear();
  assert.equal(PayrollDatabase.getUserAccounts().length, DEFAULT_USER_ACCOUNTS.length);
  const remaining = PayrollDatabase.getUserAccounts().filter(user => user.id !== 'usr-thach');
  PayrollDatabase.saveUserAccounts(remaining);
  assert.deepEqual(PayrollDatabase.getUserAccounts(), remaining);
});
test('an explicitly empty account collection never recreates default administrators', () => {
  PayrollDatabase.saveUserAccounts([]);
  assert.deepEqual(PayrollDatabase.getUserAccounts(), []);
});
