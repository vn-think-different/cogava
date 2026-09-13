export function formatVND(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '0 đ';
  return new Intl.NumberFormat('vi-VN').format(Math.round(amount)) + ' đ';
}

export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return new Intl.NumberFormat('vi-VN').format(Math.round(num));
}

export function formatDateVN(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  return `${day}/${month}/${year}`;
}

export function getDayOfWeekVN(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayIndex = date.getDay();
  const dayNames = [
    'Chủ Nhật',
    'Thứ Hai',
    'Thứ Ba',
    'Thứ Tư',
    'Thứ Năm',
    'Thứ Sáu',
    'Thứ Bảy',
  ];
  return dayNames[dayIndex] || '';
}

export function getCurrentDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Chuyển đổi số tiền thành chữ tiếng Việt (phục vụ in phiếu lương)
 */
export function docSoTienThanhChu(soTien: number): string {
  if (!soTien || soTien === 0) return 'Không đồng chẵn';

  const ChuSo = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const Tien = ['', ' nghìn', ' triệu', ' tỷ', ' nghìn tỷ', ' triệu tỷ'];

  let str = Math.round(soTien).toString();
  let i = 0;
  let j = 0;
  let result = '';
  const ViTri: number[] = [];

  if (soTien < 0) return 'Số tiền âm';

  let totalDigits = str.length;
  if (totalDigits === 0) return '';

  let rem = totalDigits % 3;
  if (rem > 0) {
    str = '0'.repeat(3 - rem) + str;
    totalDigits = str.length;
  }

  const numBlocks = totalDigits / 3;
  for (i = numBlocks - 1; i >= 0; i--) {
    ViTri[i] = Number(str.substring(j, j + 3));
    j += 3;
  }

  function docBlock3(so: number, dayDu: boolean): string {
    let res = '';
    const tram = Math.floor(so / 100);
    const chuc = Math.floor((so % 100) / 10);
    const donvi = so % 10;

    if (dayDu || tram > 0) {
      res += ' ' + ChuSo[tram] + ' trăm';
      res += docChuc(chuc, donvi);
    } else {
      res += docChuc(chuc, donvi);
    }
    return res;
  }

  function docChuc(chuc: number, donvi: number): string {
    let res = '';
    if (chuc > 1) {
      res += ' ' + ChuSo[chuc] + ' mươi';
      if (donvi === 1) res += ' mốt';
      else if (donvi === 5) res += ' lăm';
      else if (donvi > 0) res += ' ' + ChuSo[donvi];
    } else if (chuc === 1) {
      res += ' mười';
      if (donvi === 1) res += ' một';
      else if (donvi === 5) res += ' lăm';
      else if (donvi > 0) res += ' ' + ChuSo[donvi];
    } else {
      if (donvi > 0) res += ' lẻ ' + ChuSo[donvi];
    }
    return res;
  }

  let lan = 0;
  for (let k = 0; k < numBlocks; k++) {
    const val = ViTri[k];
    if (val > 0) {
      const s = docBlock3(val, k < numBlocks - 1);
      result = s + Tien[lan] + result;
    }
    lan++;
  }

  result = result.trim();
  if (result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1) + ' đồng chẵn.';
  }
  return result;
}
