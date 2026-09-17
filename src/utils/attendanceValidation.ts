import type { UserSession } from '../types';

export function canManageTeam(user: UserSession, teamId: string): boolean {
  return user.vaiTro === 'ADMIN' || (user.vaiTro === 'DOI_TRUONG' && !!user.doiId && user.doiId === teamId);
}

export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validatePayrollNumbers(soGa: number, donGia: number, ratio: number): string | null {
  if (!Number.isSafeInteger(soGa) || soGa < 0) return 'Sản lượng phải là số nguyên không âm.';
  if (!Number.isFinite(donGia) || donGia < 0) return 'Đơn giá phải là số không âm hợp lệ.';
  if (!Number.isFinite(ratio) || ratio < 0 || ratio > 1) return 'Tỷ lệ lương phụ phải nằm trong khoảng 0 đến 100%.';
  if (!Number.isSafeInteger(Math.round(soGa * donGia))) return 'Quỹ lương vượt giới hạn tính toán an toàn.';
  return null;
}
