import test from 'node:test';
import assert from 'node:assert/strict';
import { assignRole, moveEmployee, historicalEmployees, teamPrice, Organization } from '../src/utils/teamManagement';
import { BangChamCongNgay } from '../src/types';

const fixture = (): Organization => ({
  teams: [{ id: 'a', tenDoi: 'A', doiTruongUserId: 'u1' }, { id: 'b', tenDoi: 'B', doiTruongUserId: 'u2' }],
  employees: ['1', '2'].map((id, i) => ({ id, hoTen: 'Trùng tên', vaiTro: 'CHINH', doiId: i ? 'b' : 'a', ngayVaoLam: '2026-01-01', trangThai: 'DANG_LAM' })),
  users: ['1', '2'].map((id, i) => ({ id: 'u' + id, username: id, password: 'test', tenHienThi: 'Trùng tên', vaiTro: 'DOI_TRUONG', doiId: i ? 'b' : 'a', nhanVienId: id })),
});
test('replacing captain demotes previous captain and clears former team, using IDs despite equal names', () => {
  const before = fixture();
  const after = assignRole(before, 'u1', 'DOI_TRUONG', 'b');
  assert.equal(after.teams[0].doiTruongUserId, '');
  assert.equal(after.teams[1].doiTruongUserId, 'u1');
  assert.equal(after.users[1].vaiTro, 'NHAN_VIEN');
  assert.equal(after.employees[0].doiId, 'b');
  assert.equal(before.users[1].vaiTro, 'DOI_TRUONG');
});
test('moving or unassigning a captain revokes old leadership without replacing destination captain', () => {
  for (const destination of ['b', '']) {
    const after = moveEmployee(fixture(), '1', destination);
    assert.equal(after.users[0].vaiTro, 'NHAN_VIEN');
    assert.equal(after.users[0].doiId, destination);
    assert.equal(after.teams[0].doiTruongUserId, '');
    assert.equal(after.teams[1].doiTruongUserId, 'u2');
  }
});
test('reject missing team, missing employee and captain without active employee', () => {
  assert.throws(() => moveEmployee(fixture(), '1', 'missing'));
  assert.throws(() => moveEmployee(fixture(), 'missing', 'a'));
  assert.throws(() => assignRole(fixture(), 'u1', 'DOI_TRUONG', ''));
  const state = fixture(); state.employees[0].trangThai = 'DA_NGHI';
  assert.throws(() => assignRole(state, 'u1', 'DOI_TRUONG', 'a'));
});
test('daily prices override team defaults including zero, and do not change historical payroll', () => {
  assert.equal(teamPrice(undefined, '2026-09-17'), 1200);
  const team = { id: 'a', tenDoi: 'A', donGiaMacDinh: 1500, donGiaTheoNgay: { '2026-09-17': 0 } };
  assert.equal(teamPrice(team, '2026-09-17'), 0);
  assert.equal(teamPrice(team, '2026-09-18'), 1500);
});
test('monthly roster preserves transferred and deleted employees without merging identical names', () => {
  const record = { ngay: '2026-09-01', chiTiet: ['1', '2'].map(nhanVienId => ({ nhanVienId, hoTen: 'Trùng tên', vaiTro: 'CHINH', coMat: true, luongNhanDuoc: 600 })) } as BangChamCongNgay;
  const before = JSON.stringify(record);
  const roster = historicalEmployees([record], []);
  assert.deepEqual(roster.map(e => e.id), ['1', '2']);
  moveEmployee(fixture(), '1', 'b');
  assert.equal(JSON.stringify(record), before);
});
