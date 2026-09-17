import { BangChamCongNgay, DoiNhanVien, NhanVien, UserAccount, VaiTroNguoiDung } from '../types';

export interface Organization { teams: DoiNhanVien[]; employees: NhanVien[]; users: UserAccount[] }

export function teamPrice(team: DoiNhanVien | undefined, date: string): number {
  return team?.donGiaTheoNgay?.[date] ?? team?.donGiaMacDinh ?? 1200;
}

/** A single identity-based transition; historical attendance is deliberately not an input. */
export function assignRole(state: Organization, userId: string, role: VaiTroNguoiDung, teamId = ''): Organization {
  const user = state.users.find(u => u.id === userId);
  if (!user) throw new Error('Không tìm thấy tài khoản.');
  if (teamId && !state.teams.some(t => t.id === teamId)) throw new Error('Đội không tồn tại.');
  if (role === 'DOI_TRUONG' && (!teamId || !state.employees.some(e => e.id === user.nhanVienId && e.trangThai === 'DANG_LAM'))) {
    throw new Error('Đội trưởng phải có hồ sơ đang làm việc và được phân đội.');
  }
  const assignedTeam = role === 'ADMIN' ? '' : teamId;
  return {
    users: state.users.map(u => u.id === userId ? { ...u, vaiTro: role, doiId: assignedTeam }
      : role === 'DOI_TRUONG' && u.vaiTro === 'DOI_TRUONG' && u.doiId === teamId ? { ...u, vaiTro: 'NHAN_VIEN' } : u),
    employees: state.employees.map(e => e.id === user.nhanVienId ? { ...e, doiId: assignedTeam } : e),
    teams: state.teams.map(t => t.id === assignedTeam && role === 'DOI_TRUONG'
      ? { ...t, doiTruongUserId: user.id, doiTruongTen: user.tenHienThi }
      : t.doiTruongUserId === userId ? { ...t, doiTruongUserId: '', doiTruongTen: '' } : t),
  };
}

export function moveEmployee(state: Organization, employeeId: string, teamId: string): Organization {
  if (!state.employees.some(e => e.id === employeeId)) throw new Error('Không tìm thấy nhân viên.');
  if (teamId && !state.teams.some(t => t.id === teamId)) throw new Error('Đội không tồn tại.');
  let next = state;
  for (const user of state.users.filter(u => u.nhanVienId === employeeId)) {
    const role = user.vaiTro === 'DOI_TRUONG' && user.doiId !== teamId ? 'NHAN_VIEN' : user.vaiTro;
    next = assignRole(next, user.id, role, teamId);
  }
  return { ...next, employees: next.employees.map(e => e.id === employeeId ? { ...e, doiId: teamId } : e) };
}

export function historicalEmployees(records: BangChamCongNgay[], current: NhanVien[]): NhanVien[] {
  const result = new Map(current.map(e => [e.id, e]));
  for (const record of records) for (const detail of record.chiTiet) {
    const employee = result.get(detail.nhanVienId);
    result.set(detail.nhanVienId, {
      ...employee, id: detail.nhanVienId, hoTen: detail.hoTen, vaiTro: detail.vaiTro,
      ngayVaoLam: employee?.ngayVaoLam ?? record.ngay, trangThai: employee?.trangThai ?? 'DA_NGHI',
    });
  }
  return [...result.values()];
}
