import { PayrollCalculationInput, PayrollCalculationResult, VaiTroNhanVien } from '../types';

/**
 * Thuật toán tính lương sản lượng theo ngày của COGAVA (Mục 4 - Tài liệu đặc tả)
 * 
 * Đầu vào:
 * - soGa: số con gà bắt được trong ngày
 * - donGia: đơn giá bình quân/con đang hiệu lực
 * - tyLePhuChinh: tỷ lệ % lương phụ/chính (mặc định 0.85)
 * - employees: danh sách nhân viên và trạng thái có mặt
 * 
 * Quy tắc làm tròn (Mục 4):
 * - Khi chia không chẵn, làm tròn từng suất lương đến đơn vị đồng (VND).
 * - Phần dư/thiếu do làm tròn được bù vào suất lương của người ĐẦU TIÊN
 *   trong danh sách CHÍNH có mặt hôm đó (hoặc PHỤ đầu tiên nếu ngày đó chỉ có Phụ).
 * - Đảm bảo tổng lương thực nhận của tất cả nhân viên luôn KHỚP TUYỆT ĐỐI 100% với tongLuongNgay.
 */
export function calculateDailyPayroll(input: PayrollCalculationInput): PayrollCalculationResult {
  const { soGa, donGia, tyLePhuChinh, employees } = input;
  
  const tongLuongNgay = Math.max(0, Math.round(soGa * donGia));

  const presentEmployees = employees.filter(e => e.coMat);
  const presentChinh = presentEmployees.filter(e => e.vaiTro === 'CHINH');
  const presentPhu = presentEmployees.filter(e => e.vaiTro === 'PHU');

  const soChinhDiLam = presentChinh.length;
  const soPhuDiLam = presentPhu.length;
  const soNguoiDiLam = soChinhDiLam + soPhuDiLam;

  // Trường hợp không có ai đi làm
  if (soNguoiDiLam === 0 || tongLuongNgay === 0) {
    return {
      tongLuongNgay,
      soChinhDiLam: 0,
      soPhuDiLam: 0,
      soNguoiDiLam: 0,
      luongTrungBinhMoiNguoi: 0,
      luong1Phu: 0,
      luong1Chinh: 0,
      phanDuLamTron: 0,
      chiTietLuong: employees.map(e => ({
        nhanVienId: e.id,
        hoTen: e.hoTen,
        vaiTro: e.vaiTro,
        coMat: e.coMat,
        luongNhanDuoc: 0,
        duocCongPhanDu: false,
      })),
      kiemTraHopLe: true,
      tongLuongThucChia: 0,
      chenhLech: 0,
    };
  }

  const luongTrungBinhMoiNguoi = tongLuongNgay / soNguoiDiLam;

  let luong1PhuChuan = 0;
  let luong1ChinhChuan = 0;
  const salaryMap: Record<string, { amount: number; duocCongPhanDu: boolean }> = {};

  if (soChinhDiLam === 0) {
    // Trường hợp ngày chỉ có PHỤ đi làm, không có CHÍNH nào để so sánh
    // Chia đều cho các Phụ có mặt, không áp tỷ lệ 85%
    const basePhu = Math.floor(tongLuongNgay / soPhuDiLam);
    let remainder = tongLuongNgay - (basePhu * soPhuDiLam);

    luong1PhuChuan = basePhu;
    luong1ChinhChuan = 0;

    presentPhu.forEach((p, idx) => {
      if (idx === 0 && remainder > 0) {
        salaryMap[p.id] = { amount: basePhu + remainder, duocCongPhanDu: true };
        remainder = 0;
      } else {
        salaryMap[p.id] = { amount: basePhu, duocCongPhanDu: false };
      }
    });
  } else {
    // Ngày có ít nhất 1 Chính đi làm
    // Lương 1 Phụ = Lương TB * tỷ lệ phụ/chính
    // Làm tròn lương 1 Phụ đến đơn vị đồng
    luong1PhuChuan = Math.round(luongTrungBinhMoiNguoi * tyLePhuChinh);

    // Gán lương cho từng Phụ có mặt
    presentPhu.forEach(p => {
      salaryMap[p.id] = { amount: luong1PhuChuan, duocCongPhanDu: false };
    });

    const tongTienTraChoPhu = luong1PhuChuan * soPhuDiLam;
    const phanConLaiChoChinh = tongLuongNgay - tongTienTraChoPhu;

    // Chia đều phần còn lại cho các Chính có mặt
    const baseChinh = Math.floor(phanConLaiChoChinh / soChinhDiLam);
    const remainder = phanConLaiChoChinh - (baseChinh * soChinhDiLam);

    luong1ChinhChuan = baseChinh;

    // Phân bổ cho các Chính: người đầu tiên nhận phần bù dư do chia không chẵn
    presentChinh.forEach((c, idx) => {
      if (idx === 0) {
        salaryMap[c.id] = {
          amount: baseChinh + remainder,
          duocCongPhanDu: remainder !== 0,
        };
      } else {
        salaryMap[c.id] = {
          amount: baseChinh,
          duocCongPhanDu: false,
        };
      }
    });
  }

  // Lắp ghép chi tiết lương cho tất cả nhân viên (kể cả người vắng mặt)
  const chiTietLuong = employees.map(e => {
    if (!e.coMat) {
      return {
        nhanVienId: e.id,
        hoTen: e.hoTen,
        vaiTro: e.vaiTro,
        coMat: false,
        luongNhanDuoc: 0,
        duocCongPhanDu: false,
      };
    }
    const info = salaryMap[e.id] || { amount: 0, duocCongPhanDu: false };
    return {
      nhanVienId: e.id,
      hoTen: e.hoTen,
      vaiTro: e.vaiTro,
      coMat: true,
      luongNhanDuoc: info.amount,
      duocCongPhanDu: info.duocCongPhanDu,
    };
  });

  const tongLuongThucChia = chiTietLuong.reduce((sum, item) => sum + item.luongNhanDuoc, 0);
  const chenhLech = tongLuongThucChia - tongLuongNgay;
  const kiemTraHopLe = chenhLech === 0;

  // Tính phần dư bù nếu có
  const phanDuLamTron = chiTietLuong.find(c => c.duocCongPhanDu)?.luongNhanDuoc 
    ? (chiTietLuong.find(c => c.duocCongPhanDu)!.luongNhanDuoc - (chiTietLuong.find(c => c.duocCongPhanDu)!.vaiTro === 'CHINH' ? luong1ChinhChuan : luong1PhuChuan))
    : 0;

  return {
    tongLuongNgay,
    soChinhDiLam,
    soPhuDiLam,
    soNguoiDiLam,
    luongTrungBinhMoiNguoi,
    luong1Phu: luong1PhuChuan,
    luong1Chinh: luong1ChinhChuan,
    phanDuLamTron,
    chiTietLuong,
    kiemTraHopLe,
    tongLuongThucChia,
    chenhLech,
  };
}

/**
 * Bộ kiểm thử tự động 3 ca kiểm thử gốc từ Phụ lục B (Test cases chấp nhận)
 */
export interface AcceptanceTestCase {
  id: string;
  name: string;
  soGa: number;
  donGia: number;
  tongLuongKyVong: number;
  moTaChinhPhu: string;
  employees: { id: string; hoTen: string; vaiTro: VaiTroNhanVien; coMat: boolean }[];
  expected: {
    luongTB: number;
    luongPhu: number;
    luongChinh: number;
    tongLuong: number;
  };
}

export const OFFICIAL_ACCEPTANCE_TEST_CASES: AcceptanceTestCase[] = [
  {
    id: 'case-1',
    name: 'Kịch bản 1: 1 Chính + 1 Phụ',
    soGa: 1000,
    donGia: 1000,
    tongLuongKyVong: 1000000,
    moTaChinhPhu: '1 Chính (Kiên) + 1 Phụ (Đạt) đi làm. Tổng lương ngày: 1.000.000đ',
    employees: [
      { id: 'kien', hoTen: 'Kiên', vaiTro: 'CHINH', coMat: true },
      { id: 'sang', hoTen: 'Sáng', vaiTro: 'CHINH', coMat: false },
      { id: 'vu', hoTen: 'Vũ', vaiTro: 'CHINH', coMat: false },
      { id: 'dat', hoTen: 'Đạt', vaiTro: 'PHU', coMat: true },
      { id: 'toi', hoTen: 'Tỏi', vaiTro: 'PHU', coMat: false },
    ],
    expected: {
      luongTB: 500000,
      luongPhu: 425000,
      luongChinh: 575000,
      tongLuong: 1000000,
    },
  },
  {
    id: 'case-2',
    name: 'Kịch bản 2: 1 Chính + 2 Phụ',
    soGa: 1000,
    donGia: 1000,
    tongLuongKyVong: 1000000,
    moTaChinhPhu: '1 Chính (Kiên) + 2 Phụ (Đạt, Tỏi) đi làm. Tổng lương ngày: 1.000.000đ',
    employees: [
      { id: 'kien', hoTen: 'Kiên', vaiTro: 'CHINH', coMat: true },
      { id: 'sang', hoTen: 'Sáng', vaiTro: 'CHINH', coMat: false },
      { id: 'vu', hoTen: 'Vũ', vaiTro: 'CHINH', coMat: false },
      { id: 'dat', hoTen: 'Đạt', vaiTro: 'PHU', coMat: true },
      { id: 'toi', hoTen: 'Tỏi', vaiTro: 'PHU', coMat: true },
    ],
    expected: {
      luongTB: 333333,
      luongPhu: 283333,
      luongChinh: 433334,
      tongLuong: 1000000,
    },
  },
  {
    id: 'case-3',
    name: 'Kịch bản 3: 3 Chính + 2 Phụ (Đủ đội)',
    soGa: 1000,
    donGia: 1000,
    tongLuongKyVong: 1000000,
    moTaChinhPhu: 'Cả đội đi đủ: 3 Chính (Kiên, Sáng, Vũ) + 2 Phụ (Đạt, Tỏi). Tổng lương ngày: 1.000.000đ',
    employees: [
      { id: 'kien', hoTen: 'Kiên', vaiTro: 'CHINH', coMat: true },
      { id: 'sang', hoTen: 'Sáng', vaiTro: 'CHINH', coMat: true },
      { id: 'vu', hoTen: 'Vũ', vaiTro: 'CHINH', coMat: true },
      { id: 'dat', hoTen: 'Đạt', vaiTro: 'PHU', coMat: true },
      { id: 'toi', hoTen: 'Tỏi', vaiTro: 'PHU', coMat: true },
    ],
    expected: {
      luongTB: 200000,
      luongPhu: 170000,
      luongChinh: 220000,
      tongLuong: 1000000,
    },
  },
];

export function runOfficialAcceptanceTests() {
  return OFFICIAL_ACCEPTANCE_TEST_CASES.map(testCase => {
    const result = calculateDailyPayroll({
      soGa: testCase.soGa,
      donGia: testCase.donGia,
      tyLePhuChinh: 0.85,
      employees: testCase.employees,
    });

    const passedSalaryMatch = result.kiemTraHopLe;
    const passedPhu = result.luong1Phu === testCase.expected.luongPhu;
    
    // Check first chinh
    const firstChinh = result.chiTietLuong.find(c => c.vaiTro === 'CHINH' && c.coMat);
    const passedChinh = firstChinh?.luongNhanDuoc === testCase.expected.luongChinh;

    return {
      testCase,
      result,
      passed: passedSalaryMatch && passedPhu && passedChinh,
      details: {
        expectedPhu: testCase.expected.luongPhu,
        actualPhu: result.luong1Phu,
        expectedChinh: testCase.expected.luongChinh,
        actualChinh: firstChinh?.luongNhanDuoc ?? 0,
        totalMatch: passedSalaryMatch,
      },
    };
  });
}
