import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDailyPayroll, runOfficialAcceptanceTests } from '../src/utils/payrollEngine';
import { canManageTeam, isValidDate } from '../src/utils/attendanceValidation';

const employee = (id: string, vaiTro: 'CHINH' | 'PHU' = 'CHINH', coMat = true) => ({ id, hoTen: id, vaiTro, coMat });
const input = { soGa: 1000, donGia: 1200, tyLePhuChinh: 0.85, employees: [employee('a'), employee('b', 'PHU')] };

test('all original payroll acceptance scenarios pass', () => {
  assert.ok(runOfficialAcceptanceTests().every(result => result.passed));
});
test('a fund with no attendees is not marked balanced', () => {
  const result = calculateDailyPayroll({ ...input, employees: [] });
  assert.equal(result.kiemTraHopLe, false);
  assert.equal(result.chenhLech, -1200000);
});
test('zero production preserves attendance counts', () => {
  const result = calculateDailyPayroll({ ...input, soGa: 0 });
  assert.equal(result.soNguoiDiLam, 2);
  assert.equal(result.soChinhDiLam, 1);
  assert.equal(result.soPhuDiLam, 1);
  assert.equal(result.kiemTraHopLe, true);
});
test('reject invalid production, rates, ratios and unsafe amounts', () => {
  for (const value of [-1, NaN, Infinity, 1.5]) assert.throws(() => calculateDailyPayroll({ ...input, soGa: value }));
  for (const value of [-1, NaN, Infinity]) assert.throws(() => calculateDailyPayroll({ ...input, donGia: value }));
  for (const value of [-1, NaN, Infinity, 1.1]) assert.throws(() => calculateDailyPayroll({ ...input, tyLePhuChinh: value }));
  assert.throws(() => calculateDailyPayroll({ ...input, donGia: Number.MAX_SAFE_INTEGER }));
});
test('reject duplicate employee IDs', () => {
  assert.throws(() => calculateDailyPayroll({ ...input, employees: [employee('a'), employee('a')] }));
});
test('fund conservation and nonnegative integer salaries across 4,360 distributions', () => {
  for (let chinh = 0; chinh <= 10; chinh++) for (let phu = 0; phu <= 9; phu++) {
    if (!chinh && !phu) continue;
    const employees = [...Array.from({ length: chinh }, (_, i) => employee(`c${i}`)), ...Array.from({ length: phu }, (_, i) => employee(`p${i}`, 'PHU')), employee('absent', 'CHINH', false)];
    for (const total of [0, 1, 2, 3, 5, 7, 11, 101, 1000000, 9999999]) for (const ratio of [0, 0.5, 0.85, 1]) {
      const result = calculateDailyPayroll({ soGa: total, donGia: 1, tyLePhuChinh: ratio, employees });
      assert.equal(result.tongLuongThucChia, total);
      assert.ok(result.chiTietLuong.every(item => Number.isSafeInteger(item.luongNhanDuoc) && item.luongNhanDuoc >= 0));
      assert.equal(result.chiTietLuong.at(-1)?.luongNhanDuoc, 0);
    }
  }
});
test('calendar validation handles leap years and impossible dates', () => {
  assert.ok(isValidDate('2024-02-29'));
  for (const date of ['2026-02-29', '2026-04-31', '2026-13-01', '2026-1-1', '', 'invalid']) assert.equal(isValidDate(date), false);
});
test('team leaders only manage their assigned team; employees cannot manage payroll', () => {
  const user = { id: 'u', username: 'u', tenHienThi: 'U', vaiTro: 'DOI_TRUONG' as const, doiId: 'a' };
  assert.ok(canManageTeam(user, 'a'));
  assert.equal(canManageTeam(user, 'b'), false);
  assert.equal(canManageTeam({ ...user, doiId: undefined }, 'a'), false);
  assert.equal(canManageTeam({ ...user, vaiTro: 'NHAN_VIEN' }, 'a'), false);
  assert.ok(canManageTeam({ ...user, vaiTro: 'ADMIN' }, 'b'));
});
