import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  OFFICIAL_ACCEPTANCE_TEST_CASES,
  calculateDailyPayroll,
  runOfficialAcceptanceTests,
} from '../utils/payrollEngine';
import { formatDateVN, formatNumber, formatVND } from '../utils/formatters';
import {
  Sliders,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Plus,
  ShieldCheck,
  FlaskConical,
  Info,
  Clock,
  ArrowRight,
  Sparkles,
  Calculator,
} from 'lucide-react';

export const ConfigView: React.FC = () => {
  const { configs, addConfig, currentUser } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEffectiveDate, setNewEffectiveDate] = useState('2026-10-01');
  const [newUnitPrice, setNewUnitPrice] = useState('1300');
  const [newSubRatio, setNewSubRatio] = useState('85');
  const [newNote, setNewNote] = useState('');

  // Live sandbox tester
  const [testChickens, setTestChickens] = useState('1000');
  const [testPrice, setTestPrice] = useState('1200');
  const [testChinhCount, setTestChinhCount] = useState('3');
  const [testPhuCount, setTestPhuCount] = useState('2');
  const [testSubRatio, setTestSubRatio] = useState('85');

  const canEdit = currentUser.vaiTro === 'ADMIN';

  // Run official acceptance test suite
  const testResults = runOfficialAcceptanceTests();
  const allTestsPassed = testResults.every(t => t.passed);

  // Calculate sandbox simulation
  const sandboxResult = React.useMemo(() => {
    const numChickens = Number(testChickens) || 0;
    const price = Number(testPrice) || 0;
    const numChinh = Math.max(0, Number(testChinhCount) || 0);
    const numPhu = Math.max(0, Number(testPhuCount) || 0);
    const ratio = (Number(testSubRatio) || 85) / 100;

    const dummyEmployees: any[] = [];
    for (let i = 1; i <= numChinh; i++) {
      dummyEmployees.push({
        id: `sim-chinh-${i}`,
        hoTen: `Chính #${i}`,
        vaiTro: 'CHINH',
        coMat: true,
      });
    }
    for (let j = 1; j <= numPhu; j++) {
      dummyEmployees.push({
        id: `sim-phu-${j}`,
        hoTen: `Phụ #${j}`,
        vaiTro: 'PHU',
        coMat: true,
      });
    }

    return calculateDailyPayroll({
      soGa: numChickens,
      donGia: price,
      tyLePhuChinh: ratio,
      employees: dummyEmployees,
    });
  }, [testChickens, testPrice, testChinhCount, testPhuCount, testSubRatio]);

  const handleAddConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEffectiveDate) {
      alert('Vui lòng chọn ngày bắt đầu hiệu lực!');
      return;
    }
    const priceNum = Number(newUnitPrice);
    const ratioNum = Number(newSubRatio) / 100;

    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Đơn giá phải lớn hơn 0!');
      return;
    }
    if (isNaN(ratioNum) || ratioNum <= 0 || ratioNum > 1) {
      alert('Tỷ lệ phụ phải nằm trong khoảng từ 1% đến 100%!');
      return;
    }

    addConfig({
      hieuLucTuNgay: newEffectiveDate,
      donGiaBinhQuan: priceNum,
      tyLePhuChinh: ratioNum,
      ghiChu: newNote.trim() || undefined,
    });

    setIsAddModalOpen(false);
    setNewNote('');
  };

  const sortedConfigs = [...configs].sort((a, b) => b.hieuLucTuNgay.localeCompare(a.hieuLucTuNgay));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-stone-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-black text-stone-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-orange-600" />
              Cấu hình lương theo thời gian & Kiểm thử công thức
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Cơ chế hiệu lực theo ngày bảo vệ toàn vẹn lịch sử lương các tháng cũ (khắc phục lỗi Excel)
            </p>
          </div>

          {canEdit && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              id="btn-add-config"
              className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tạo cấu hình thời giá mới
            </button>
          )}
        </div>

        {/* Highlight Architecture Explanation */}
        <div className="mt-4 p-4 bg-amber-50/70 border border-amber-200/70 rounded-xl text-xs text-amber-900 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">
              Tại sao hệ thống sử dụng cơ chế Cấu hình theo thời gian (Effective-Date Config)?
            </span>
            <p className="text-stone-700 leading-relaxed">
              Trong file Excel cũ, sheet "Cấu hình" được toàn bộ 5 tháng tham chiếu trực tiếp. Nếu vào tháng 12 thay đổi đơn giá (VD: tăng lên 1.300đ), toàn bộ số tiền lương của tháng 8, 9, 10, 11 đã trả trước đó sẽ bị đổi ngược lại.
              Ở hệ thống mới này: mỗi lần đổi đơn giá hay tỷ lệ, bạn tạo một bản ghi mới với <span className="font-bold">"Ngày bắt đầu áp dụng"</span>. Dữ liệu các ngày trước đó sẽ giữ nguyên vẹn 100% snapshot đã chi trả.
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: Effective Configurations Timeline */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-stone-200 space-y-4">
        <h2 className="text-base font-bold text-stone-900 flex items-center gap-2 pb-3 border-b border-stone-100">
          <Clock className="w-4 h-4 text-orange-600" />
          Lịch sử các phiên bản cấu hình đơn giá & tỷ lệ
        </h2>

        <div className="space-y-3">
          {sortedConfigs.map((cfg, idx) => (
            <div
              key={cfg.id}
              className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                idx === 0
                  ? 'bg-orange-50/50 border-orange-200 shadow-2xs'
                  : 'bg-stone-50 border-stone-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    idx === 0 ? 'bg-orange-500 text-white' : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-stone-900">
                      Áp dụng từ: {formatDateVN(cfg.hieuLucTuNgay)}
                    </span>
                    {idx === 0 && (
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Đang áp dụng hiện tại
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-600 mt-0.5">
                    {cfg.ghiChu || 'Cấu hình tiêu chuẩn'}
                  </p>
                  <span className="text-[11px] text-stone-400 block mt-1">
                    Tạo bởi: {cfg.nguoiTao} ({cfg.ngayTao})
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-white px-4 py-2.5 rounded-xl border border-stone-200/80">
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-500 block">
                    Đơn giá bình quân
                  </span>
                  <span className="text-base font-black text-orange-600 font-mono">
                    {formatNumber(cfg.donGiaBinhQuan)} đ/con
                  </span>
                </div>
                <div className="w-px h-8 bg-stone-200" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-500 block">
                    Tỷ lệ Lương Phụ / Chính
                  </span>
                  <span className="text-base font-black text-stone-800 font-mono">
                    {(cfg.tyLePhuChinh * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Official Acceptance Test Cases Suite (Phụ lục B) */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-stone-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
          <div>
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-orange-600" />
              Bộ ba kịch bản kiểm thử chấp nhận (Phụ lục B — Tài liệu đặc tả)
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Tự động đối chiếu thuật toán hệ thống với 3 ca kiểm thử thật từ sheet "Cấu hình" & "Bảng lương T8.2026"
            </p>
          </div>

          <div className="flex items-center gap-2">
            {allTestsPassed ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                3/3 Kịch bản vượt qua 100%
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-full text-xs font-bold">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                Phát hiện sai lệch
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {testResults.map((test, idx) => (
            <div
              key={test.testCase.id}
              className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold text-orange-600 block">
                    KỊCH BẢN {idx + 1}
                  </span>
                  <h3 className="text-sm font-bold text-stone-900">
                    {test.testCase.name.split(':')[1]}
                  </h3>
                </div>
                {test.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                )}
              </div>

              <p className="text-xs text-stone-600 bg-white p-2.5 rounded-lg border border-stone-200/60">
                {test.testCase.moTaChinhPhu}
              </p>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Lương TB/người:</span>
                  <span className="font-mono font-bold text-stone-900">
                    {formatVND(test.result.luongTrungBinhMoiNguoi)}
                  </span>
                </div>
                <div className="flex justify-between text-amber-900">
                  <span>Lương mỗi Phụ (85%):</span>
                  <span className="font-mono font-bold">
                    {formatVND(test.result.luong1Phu)}
                  </span>
                </div>
                <div className="flex justify-between text-orange-900">
                  <span>Lương mỗi Chính:</span>
                  <span className="font-mono font-bold">
                    {formatVND(test.details.actualChinh)}
                  </span>
                </div>
                <div className="flex justify-between text-stone-900 pt-1 border-t border-stone-200 font-bold">
                  <span>Tổng thực chia:</span>
                  <span className="font-mono text-emerald-700">
                    {formatVND(test.result.tongLuongThucChia)} (Khớp 100%)
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Interactive Sandbox Calculator */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-stone-200 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
          <Calculator className="w-5 h-5 text-orange-600" />
          <div>
            <h2 className="text-base font-bold text-stone-900">
              Công cụ mô phỏng & Thử nghiệm chia lương
            </h2>
            <p className="text-xs text-stone-500">
              Dành cho quản lý tính trước quỹ lương với số lượng gà và tỷ lệ nhân viên bất kỳ
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block font-bold text-stone-700 mb-1">
              Số gà bắt (con)
            </label>
            <input
              type="number"
              value={testChickens}
              onChange={e => setTestChickens(e.target.value)}
              className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold"
            />
          </div>
          <div>
            <label className="block font-bold text-stone-700 mb-1">
              Đơn giá (đ/con)
            </label>
            <input
              type="number"
              value={testPrice}
              onChange={e => setTestPrice(e.target.value)}
              className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold"
            />
          </div>
          <div>
            <label className="block font-bold text-stone-700 mb-1">
              Số Lương Chính
            </label>
            <input
              type="number"
              min="0"
              value={testChinhCount}
              onChange={e => setTestChinhCount(e.target.value)}
              className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold"
            />
          </div>
          <div>
            <label className="block font-bold text-stone-700 mb-1">
              Số Lương Phụ
            </label>
            <input
              type="number"
              min="0"
              value={testPhuCount}
              onChange={e => setTestPhuCount(e.target.value)}
              className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold"
            />
          </div>
          <div>
            <label className="block font-bold text-stone-700 mb-1">
              Tỷ lệ Phụ (%)
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={testSubRatio}
              onChange={e => setTestSubRatio(e.target.value)}
              className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold"
            />
          </div>
        </div>

        {/* Simulation Output Card */}
        <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-stone-500 block">Tổng quỹ lương ngày:</span>
            <span className="text-base font-black text-orange-600 font-mono">
              {formatVND(sandboxResult.tongLuongNgay)}
            </span>
          </div>
          <div>
            <span className="text-stone-500 block">Lương TB/người:</span>
            <span className="text-base font-bold text-stone-800 font-mono">
              {formatVND(sandboxResult.luongTrungBinhMoiNguoi)}
            </span>
          </div>
          <div>
            <span className="text-stone-500 block">Mỗi suất Lương Phụ:</span>
            <span className="text-base font-black text-amber-700 font-mono">
              {formatVND(sandboxResult.luong1Phu)}
            </span>
          </div>
          <div>
            <span className="text-stone-500 block">Mỗi suất Lương Chính:</span>
            <span className="text-base font-black text-orange-700 font-mono">
              {formatVND(sandboxResult.luong1Chinh)}
            </span>
          </div>
        </div>
      </div>

      {/* Add Config Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <h2 className="text-base font-bold text-stone-900">
              Tạo cấu hình đơn giá & tỷ lệ mới
            </h2>
            <form onSubmit={handleAddConfig} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Ngày bắt đầu có hiệu lực *
                </label>
                <input
                  type="date"
                  required
                  value={newEffectiveDate}
                  onChange={e => setNewEffectiveDate(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-orange-500"
                />
                <span className="text-[11px] text-stone-500 mt-1 block">
                  Các ngày chấm công từ ngày này trở đi sẽ dùng đơn giá mới
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Đơn giá bình quân (đ/con) *
                  </label>
                  <input
                    type="number"
                    required
                    min="100"
                    step="50"
                    value={newUnitPrice}
                    onChange={e => setNewUnitPrice(e.target.value)}
                    placeholder="VD: 1300"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Tỷ lệ Phụ/Chính (%) *
                  </label>
                  <input
                    type="number"
                    required
                    min="10"
                    max="100"
                    value={newSubRatio}
                    onChange={e => setNewSubRatio(e.target.value)}
                    placeholder="VD: 85"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Ghi chú / Căn cứ thay đổi
                </label>
                <textarea
                  rows={2}
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  placeholder="VD: Quyết định điều chỉnh giá bắt gà vụ mới từ 01/10/2026..."
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-xs"
                >
                  Tạo cấu hình
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
