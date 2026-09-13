import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { NhanVien } from '../types';
import {
  formatDateVN,
  formatNumber,
  formatVND,
  getDayOfWeekVN,
} from '../utils/formatters';
import { PayslipModal } from './PayslipModal';
import {
  FileSpreadsheet,
  Lock,
  Unlock,
  Download,
  Printer,
  Eye,
  CheckCircle2,
  AlertCircle,
  Copy,
  Calendar,
  Layers,
  Table,
  TrendingUp,
  ShieldAlert,
  LayoutGrid,
  Smartphone,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const MonthlyPayrollView: React.FC = () => {
  const {
    attendanceRecords,
    employees,
    companyInfo,
    isMonthLocked,
    lockMonth,
    unlockMonth,
    currentUser,
    isMobileView,
  } = useApp();

  // Selected Month (YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-08');
  const [activeSubTab, setActiveSubTab] = useState<'summary' | 'matrix'>('summary');
  
  // Mobile display mode toggles: 'card' (default on mobile) or 'table'
  const [mobileSummaryMode, setMobileSummaryMode] = useState<'card' | 'table'>('card');
  const [mobileMatrixMode, setMobileMatrixMode] = useState<'card' | 'table'>('card');
  
  // Modals
  const [selectedEmployeeForPayslip, setSelectedEmployeeForPayslip] = useState<NhanVien | null>(null);
  const [showUnlockDialog, setShowUnlockDialog] = useState<boolean>(false);
  const [unlockReason, setUnlockReason] = useState<string>('');
  const [copyNotification, setCopyNotification] = useState<string | null>(null);

  // Available months extracted from attendance records
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    attendanceRecords.forEach(r => {
      monthSet.add(r.ngay.substring(0, 7));
    });
    // Ensure 2026-08 and 2026-09 are present
    monthSet.add('2026-08');
    monthSet.add('2026-09');
    return Array.from(monthSet).sort().reverse();
  }, [attendanceRecords]);

  // Records for current selected month
  const monthRecords = useMemo(() => {
    return attendanceRecords
      .filter(r => r.ngay.startsWith(selectedMonth))
      .sort((a, b) => a.ngay.localeCompare(b.ngay));
  }, [attendanceRecords, selectedMonth]);

  const monthLocked = useMemo(() => {
    return isMonthLocked(selectedMonth);
  }, [isMonthLocked, selectedMonth]);

  // Monthly Aggregation Totals
  const monthlyMetrics = useMemo(() => {
    let totalChickens = 0;
    let totalPayroll = 0;
    let totalShifts = 0;
    const workingDaysCount = monthRecords.length;

    monthRecords.forEach(rec => {
      totalChickens += rec.soGaBatDuoc;
      totalPayroll += rec.tongLuongNgay;
      totalShifts += rec.chiTiet.filter(c => c.coMat).length;
    });

    return {
      totalChickens,
      totalPayroll,
      workingDaysCount,
      totalShifts,
      avgChickensPerDay: workingDaysCount > 0 ? Math.round(totalChickens / workingDaysCount) : 0,
      avgSalaryPerShift: totalShifts > 0 ? Math.round(totalPayroll / totalShifts) : 0,
    };
  }, [monthRecords]);

  // Aggregation per employee (Sheet "Tổng hợp")
  const employeeSummaries = useMemo(() => {
    return employees.map(emp => {
      let daysCount = 0;
      let totalSalary = 0;

      monthRecords.forEach(rec => {
        const detail = rec.chiTiet.find(c => c.nhanVienId === emp.id);
        if (detail && detail.coMat) {
          daysCount += 1;
          totalSalary += detail.luongNhanDuoc;
        }
      });

      const avgWagePerDay = daysCount > 0 ? Math.round(totalSalary / daysCount) : 0;
      const workRatio = monthlyMetrics.workingDaysCount > 0
        ? (daysCount / monthlyMetrics.workingDaysCount) * 100
        : 0;

      return {
        employee: emp,
        daysCount,
        totalSalary,
        avgWagePerDay,
        workRatio,
      };
    });
  }, [employees, monthRecords, monthlyMetrics.workingDaysCount]);

  // Automatic balance check: Sum of employee salaries === Total daily wages paid
  const sumEmployeeSalaries = useMemo(() => {
    return employeeSummaries.reduce((sum, e) => sum + e.totalSalary, 0);
  }, [employeeSummaries]);

  const isBalanceVerified = sumEmployeeSalaries === monthlyMetrics.totalPayroll;

  // Handle Month Lock / Close
  const handleLock = () => {
    if (currentUser.vaiTro !== 'ADMIN') {
      alert('Chỉ Quản trị viên mới có quyền chốt sổ lương!');
      return;
    }
    if (window.confirm(`Bạn có chắc chắn muốn chốt sổ bảng lương tháng ${selectedMonth}? Sau khi chốt, dữ liệu sẽ ở trạng thái CHỈ ĐỌC.`)) {
      lockMonth(selectedMonth);
      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10B981', '#059669', '#34D399'],
        });
      } catch (e) {}
    }
  };

  // Handle Month Unlock
  const handleUnlock = () => {
    if (!unlockReason.trim()) {
      alert('Vui lòng nhập lý do mở lại sổ!');
      return;
    }
    unlockMonth(selectedMonth, unlockReason.trim());
    setShowUnlockDialog(false);
    setUnlockReason('');
  };

  // Export CSV / Excel compatible file
  const handleExportCSV = () => {
    const [year, month] = selectedMonth.split('-');
    let csvContent = '\uFEFF'; // UTF-8 BOM for Excel Vietnamese compatibility
    csvContent += `BẢNG TỔNG HỢP LƯƠNG ĐỘI BẮT GÀ - CÔNG TY TNHH COGAVA\n`;
    csvContent += `Kỳ lương: Tháng ${month}/${year}\n`;
    csvContent += `Tổng sản lượng: ${monthlyMetrics.totalChickens.toLocaleString('vi-VN')} con gà | Tổng quỹ lương: ${monthlyMetrics.totalPayroll.toLocaleString('vi-VN')} đ\n\n`;

    // Header
    csvContent += `STT,Họ và tên,Vai trò,Số ngày công,Tỷ lệ công (%),Tổng lương thực nhận (VNĐ),Lương TB/ngày (VNĐ),Số tài khoản,Ngân hàng thụ hưởng\n`;

    // Rows
    employeeSummaries.forEach((row, idx) => {
      csvContent += `${idx + 1},"${row.employee.hoTen}","${row.employee.vaiTro === 'CHINH' ? 'Lương chính' : 'Lương phụ'}",${row.daysCount},${row.workRatio.toFixed(1)}%,${row.totalSalary},${row.avgWagePerDay},"${row.employee.stkNganHang || ''}","${row.employee.tenNganHang || ''}"\n`;
    });

    csvContent += `\nTỔNG CỘNG,,,"${monthlyMetrics.totalShifts}",,${sumEmployeeSalaries},,,\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bang_luong_COGAVA_T${month}_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Quick copy bank account
  const copyBankAccount = (stk: string, bank: string, name: string) => {
    if (!stk) return;
    navigator.clipboard.writeText(`${stk} ${bank} (${name})`);
    setCopyNotification(`Đã sao chép STK của ${name}!`);
    setTimeout(() => setCopyNotification(null), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Controller Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-stone-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Month Selector */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-bold text-stone-800">Kỳ lương:</span>
            </div>
            <select
              id="select-payroll-month"
              aria-label="Chọn tháng bảng lương"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="text-base font-extrabold text-stone-900 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 focus:outline-hidden focus:ring-2 focus:ring-orange-500 cursor-pointer"
            >
              {availableMonths.map(m => {
                const [y, mo] = m.split('-');
                return (
                  <option key={m} value={m}>
                    Tháng {mo} / Năm {y}
                  </option>
                );
              })}
            </select>

            {/* Lock Status Badge */}
            {monthLocked ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                Đã chốt sổ (Chỉ đọc)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                Đang mở nhập liệu
              </span>
            )}
          </div>

          {/* Action Buttons (Lock, Export, Print) */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Lock / Unlock button (Admin only) */}
            {currentUser.vaiTro === 'ADMIN' && (
              <>
                {!monthLocked ? (
                  <button
                    onClick={handleLock}
                    id="btn-lock-month"
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Chốt sổ lương tháng
                  </button>
                ) : (
                  <button
                    onClick={() => setShowUnlockDialog(true)}
                    id="btn-unlock-month"
                    className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-colors flex items-center gap-1.5 border border-stone-300 cursor-pointer"
                  >
                    <Unlock className="w-3.5 h-3.5 text-amber-600" />
                    Mở lại sổ (Cần lý do)
                  </button>
                )}
              </>
            )}

            {/* Export CSV / Excel */}
            <button
              onClick={handleExportCSV}
              id="btn-export-excel"
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Xuất Excel / CSV
            </button>

            {/* Print Entire Sheet */}
            <button
              onClick={() => window.print()}
              className="px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer no-print"
            >
              <Printer className="w-3.5 h-3.5" />
              In bảng
            </button>
          </div>
        </div>

        {/* Copy Notification Toast */}
        {copyNotification && (
          <div className="mt-3 p-2 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {copyNotification}
          </div>
        )}
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Chickens */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-stone-200">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
            Tổng sản lượng gà
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-stone-900 font-mono">
              {formatNumber(monthlyMetrics.totalChickens)}
            </span>
            <span className="text-xs text-orange-600 font-bold">con gà</span>
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">
            TB: {formatNumber(monthlyMetrics.avgChickensPerDay)} con/ngày
          </span>
        </div>

        {/* Total Payroll */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-stone-200">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
            Tổng quỹ lương chi trả
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-orange-600 font-mono">
              {formatVND(monthlyMetrics.totalPayroll)}
            </span>
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">
            Đơn vị tính: VNĐ
          </span>
        </div>

        {/* Working Days */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-stone-200">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
            Số ngày đi bắt
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-stone-900 font-mono">
              {monthlyMetrics.workingDaysCount}
            </span>
            <span className="text-xs text-stone-500 font-bold">ngày công</span>
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">
            Tổng {monthlyMetrics.totalShifts} lượt công nhân
          </span>
        </div>

        {/* Automatic Balance Validation Badge */}
        <div className={`rounded-2xl p-4 shadow-xs border ${
          isBalanceVerified
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
            : 'bg-rose-50/70 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider">
              Đối chiếu số liệu
            </span>
            {isBalanceVerified ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
          </div>
          <div className="mt-1">
            <span className="text-lg font-black block leading-tight font-mono">
              {isBalanceVerified ? '100% Khớp quỹ' : 'Chưa cân bằng!'}
            </span>
            <span className="text-[11px] opacity-80 mt-1 block">
              {isBalanceVerified
                ? 'Tổng lương nhân viên = Tổng quỹ lương ngày'
                : `Lệch: ${formatVND(sumEmployeeSalaries - monthlyMetrics.totalPayroll)}`}
            </span>
          </div>
        </div>
      </div>

      {/* Sub Tab Switcher: "Bảng tổng hợp (Tổng hợp Tx)" vs "Ma trận ngày (Bảng lương Tx)" */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2 no-print">
        <button
          onClick={() => setActiveSubTab('summary')}
          id="tab-sub-summary"
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'summary'
              ? 'bg-orange-500 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          Bảng tổng hợp theo nhân viên (Sheet "Tổng hợp")
        </button>

        <button
          onClick={() => setActiveSubTab('matrix')}
          id="tab-sub-matrix"
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'matrix'
              ? 'bg-orange-500 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Table className="w-4 h-4" />
          Bảng nhập liệu chi tiết từng ngày (Sheet "Bảng lương")
        </button>
      </div>

      {/* VIEW 1: SUMMARY BY EMPLOYEE (Sheet "Tổng hợp") */}
      {activeSubTab === 'summary' && (
        <div className="bg-white rounded-2xl shadow-xs border border-stone-200 overflow-hidden printable-area">
          <div className="p-4 sm:p-5 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-stone-900">
                Bảng thanh toán lương tháng {selectedMonth.substring(5, 7)}/{selectedMonth.substring(0, 4)}
              </h2>
              <p className="text-xs text-stone-500">
                Cộng dồn số ngày công và tổng thu nhập thực nhận của từng nhân viên
              </p>
            </div>

            {/* View switcher on Mobile */}
            {isMobileView ? (
              <div className="flex items-center justify-between sm:justify-end gap-2 bg-stone-100 p-1 rounded-xl">
                <span className="text-[11px] font-bold text-stone-600 pl-1">Hiển thị di động:</span>
                <div className="flex items-center bg-white rounded-lg p-0.5 border border-stone-200 text-xs shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setMobileSummaryMode('card')}
                    className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      mobileSummaryMode === 'card'
                        ? 'bg-orange-500 text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Dạng thẻ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileSummaryMode('table')}
                    className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      mobileSummaryMode === 'table'
                        ? 'bg-orange-500 text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Table className="w-3.5 h-3.5" />
                    <span>Dạng bảng</span>
                  </button>
                </div>
              </div>
            ) : (
              <span className="text-xs font-bold text-orange-600 font-mono">
                Tổng chi: {formatVND(sumEmployeeSalaries)}
              </span>
            )}
          </div>

          {/* Conditional Mobile Card View or Desktop/Mobile Table */}
          {isMobileView && mobileSummaryMode === 'card' ? (
            /* MOBILE CARD VIEW: Zero horizontal scrolling, fits 100% width cleanly */
            <div className="p-3 sm:p-4 space-y-3 bg-stone-50/50">
              {employeeSummaries.map((item) => (
                <div
                  key={item.employee.id}
                  className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs space-y-3"
                >
                  {/* Top: Avatar, Name, Role Badge, Big Total Salary */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-800 font-black text-sm flex items-center justify-center flex-shrink-0 shadow-2xs">
                        {item.employee.hoTen.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-base font-black text-stone-900">
                            {item.employee.hoTen}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                              item.employee.vaiTro === 'CHINH'
                                ? 'bg-orange-100 text-orange-800 border border-orange-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {item.employee.vaiTro === 'CHINH' ? 'Lương chính' : 'Lương phụ'}
                          </span>
                        </div>
                        <span className="text-xs text-stone-500 font-medium">
                          {item.daysCount} ngày công ({item.workRatio.toFixed(0)}% tỷ lệ)
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-[10px] uppercase font-bold text-stone-400 block leading-none">
                        Tổng lương
                      </span>
                      <span className="text-base font-black text-orange-600 font-mono">
                        {formatVND(item.totalSalary)}
                      </span>
                    </div>
                  </div>

                  {/* 2-Column Metrics */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-100 text-xs">
                    <div className="bg-stone-50 rounded-xl p-2.5 border border-stone-100">
                      <span className="text-[10px] text-stone-500 block font-medium">Số ngày công</span>
                      <span className="font-mono font-bold text-stone-900 text-sm">
                        {item.daysCount} <span className="text-xs font-normal text-stone-500">công</span>
                      </span>
                    </div>
                    <div className="bg-stone-50 rounded-xl p-2.5 border border-stone-100 text-right">
                      <span className="text-[10px] text-stone-500 block font-medium">Lương TB / ngày</span>
                      <span className="font-mono font-bold text-stone-800 text-sm">
                        {formatVND(item.avgWagePerDay)}
                      </span>
                    </div>
                  </div>

                  {/* Banking Info with 1-Tap Copy */}
                  <div className="bg-stone-50 rounded-xl p-2.5 border border-stone-100 flex items-center justify-between text-xs">
                    <div className="overflow-hidden pr-2">
                      <span className="text-[10px] text-stone-500 block font-medium">Tài khoản nhận lương:</span>
                      {item.employee.stkNganHang ? (
                        <span className="font-mono font-bold text-stone-900 text-xs block truncate">
                          {item.employee.stkNganHang} - {item.employee.tenNganHang}
                        </span>
                      ) : (
                        <span className="text-stone-400 italic text-xs">Chưa cập nhật STK</span>
                      )}
                    </div>
                    {item.employee.stkNganHang && (
                      <button
                        type="button"
                        onClick={() =>
                          copyBankAccount(
                            item.employee.stkNganHang || '',
                            item.employee.tenNganHang || '',
                            item.employee.hoTen
                          )
                        }
                        className="p-1.5 text-stone-500 hover:text-stone-900 bg-white border border-stone-200 rounded-lg shadow-2xs flex-shrink-0 cursor-pointer"
                        title="Sao chép STK"
                      >
                        <Copy className="w-3.5 h-3.5 text-orange-600" />
                      </button>
                    )}
                  </div>

                  {/* Payslip Action Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedEmployeeForPayslip(item.employee)}
                    className="w-full py-2.5 bg-stone-100 hover:bg-orange-50 hover:text-orange-600 text-stone-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-stone-200 cursor-pointer"
                  >
                    <Eye className="w-4 h-4 text-orange-600" />
                    <span>Xem & In Phiếu Lương Chi Tiết</span>
                  </button>
                </div>
              ))}

              {/* Total Summary Card on Mobile */}
              <div className="bg-stone-900 text-white rounded-2xl p-4 shadow-md space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-extrabold text-stone-400">
                    TỔNG CỘNG THÁNG {selectedMonth.substring(5, 7)}:
                  </span>
                  <span className="text-xs font-mono font-bold text-orange-400">
                    {monthlyMetrics.totalShifts} lượt công
                  </span>
                </div>
                <div className="flex items-baseline justify-between border-t border-stone-800 pt-2">
                  <span className="text-xs text-stone-300">Tổng quỹ chi lương:</span>
                  <span className="text-xl font-black text-orange-400 font-mono">
                    {formatVND(sumEmployeeSalaries)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* TABLE VIEW: With Sticky First Column for Smooth Horizontal Scrolling */
            <div className="overflow-x-auto relative">
              {isMobileView && (
                <div className="text-[11px] text-stone-600 px-4 py-1.5 bg-orange-50/70 border-b border-orange-100 flex items-center gap-1.5">
                  <span className="flex-shrink-0">👈👉</span>
                  <span>Vuốt ngang để xem đủ cột số liệu. Cột <strong>Tên nhân viên</strong> đã được cố định.</span>
                </div>
              )}
              <table className="w-full text-left text-xs min-w-[720px] border-collapse">
                <thead className="bg-stone-50 text-stone-700 font-bold uppercase tracking-wider border-b border-stone-200">
                  <tr>
                    <th className="py-3 px-4 sticky left-0 z-20 bg-stone-50 border-r border-stone-200 shadow-[2px_0_5px_rgba(0,0,0,0.04)] whitespace-nowrap">
                      Nhân viên
                    </th>
                    <th className="py-3 px-4 whitespace-nowrap">Vai trò</th>
                    <th className="py-3 px-4 text-center whitespace-nowrap">Số ngày công</th>
                    <th className="py-3 px-4 text-center whitespace-nowrap">Tỷ lệ công</th>
                    <th className="py-3 px-4 text-right whitespace-nowrap">Tổng lương tháng</th>
                    <th className="py-3 px-4 text-right whitespace-nowrap">Lương TB / ngày</th>
                    <th className="py-3 px-4 whitespace-nowrap">Tài khoản thụ hưởng</th>
                    <th className="py-3 px-4 text-center no-print whitespace-nowrap">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {employeeSummaries.map((item) => (
                    <tr key={item.employee.id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-sm text-stone-900 sticky left-0 z-10 bg-white border-r border-stone-200 shadow-[2px_0_5px_rgba(0,0,0,0.04)] whitespace-nowrap">
                        {item.employee.hoTen}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block text-[11px] font-bold uppercase px-2 py-0.5 rounded-md ${
                            item.employee.vaiTro === 'CHINH'
                              ? 'bg-orange-100 text-orange-800 border border-orange-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {item.employee.vaiTro === 'CHINH' ? 'Lương chính' : 'Lương phụ'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold font-mono text-sm text-stone-900 whitespace-nowrap">
                        {item.daysCount} <span className="text-stone-400 text-xs font-normal">công</span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="font-mono font-semibold text-stone-700">
                          {item.workRatio.toFixed(0)}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-sm text-orange-600 font-mono whitespace-nowrap">
                        {formatVND(item.totalSalary)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-stone-600 font-semibold whitespace-nowrap">
                        {formatVND(item.avgWagePerDay)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.employee.stkNganHang ? (
                          <div className="flex items-center gap-1.5">
                            <div className="font-mono text-stone-800">
                              <span className="block font-bold">{item.employee.stkNganHang}</span>
                              <span className="text-[10px] text-stone-500">{item.employee.tenNganHang}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                copyBankAccount(
                                  item.employee.stkNganHang || '',
                                  item.employee.tenNganHang || '',
                                  item.employee.hoTen
                                )
                              }
                              title="Sao chép STK để chuyển tiền"
                              className="p-1 text-stone-400 hover:text-stone-700 rounded transition-colors no-print cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-stone-400 italic">Chưa có STK</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center no-print whitespace-nowrap">
                        <button
                          onClick={() => setSelectedEmployeeForPayslip(item.employee)}
                          className="px-2.5 py-1.5 bg-stone-100 hover:bg-orange-50 hover:text-orange-600 border border-stone-200 rounded-lg font-bold text-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Phiếu lương
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-stone-100 font-bold border-t-2 border-stone-300">
                  <tr>
                    <td className="py-3 px-4 font-black uppercase text-stone-900 sticky left-0 z-10 bg-stone-100 border-r border-stone-200 shadow-[2px_0_5px_rgba(0,0,0,0.04)] whitespace-nowrap" colSpan={2}>
                      TỔNG CỘNG
                    </td>
                    <td className="py-3 px-4 text-center font-black font-mono text-sm text-stone-900 whitespace-nowrap">
                      {monthlyMetrics.totalShifts} công
                    </td>
                    <td className="py-3 px-4 text-center font-mono whitespace-nowrap">100%</td>
                    <td className="py-3 px-4 text-right font-black text-base text-orange-600 font-mono whitespace-nowrap">
                      {formatVND(sumEmployeeSalaries)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono" colSpan={3}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: MATRIX BY DAY (Sheet "Bảng lương") */}
      {activeSubTab === 'matrix' && (
        <div className="bg-white rounded-2xl shadow-xs border border-stone-200 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-stone-900">
                Nhật ký sản lượng & Chia lương từng ngày (Tháng {selectedMonth.substring(5, 7)}/{selectedMonth.substring(0, 4)})
              </h2>
              <p className="text-xs text-stone-500">
                Tương đương sheet "Bảng lương Tx" trong Excel với kiểm tra tự động khớp 100%
              </p>
            </div>

            {/* View switcher on Mobile for Matrix tab */}
            {isMobileView && (
              <div className="flex items-center justify-between sm:justify-end gap-2 bg-stone-100 p-1 rounded-xl">
                <span className="text-[11px] font-bold text-stone-600 pl-1">Hiển thị di động:</span>
                <div className="flex items-center bg-white rounded-lg p-0.5 border border-stone-200 text-xs shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setMobileMatrixMode('card')}
                    className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      mobileMatrixMode === 'card'
                        ? 'bg-orange-500 text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Thẻ ngày</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileMatrixMode('table')}
                    className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      mobileMatrixMode === 'table'
                        ? 'bg-orange-500 text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Table className="w-3.5 h-3.5" />
                    <span>Bảng đầy đủ</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Conditional Mobile Card View or Matrix Table */}
          {isMobileView && mobileMatrixMode === 'card' ? (
            /* MOBILE DAY CARDS: Clear day-by-day logs for phone screens */
            <div className="p-3 sm:p-4 space-y-3 bg-stone-50/50">
              {monthRecords.map(rec => {
                const sumRow = rec.chiTiet.reduce((s, c) => s + c.luongNhanDuoc, 0);
                const isMatch = sumRow === rec.tongLuongNgay;
                const workingEmployees = rec.chiTiet.filter(c => c.coMat);

                return (
                  <div
                    key={rec.id}
                    className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs space-y-3"
                  >
                    {/* Header: Date + Day of week + Total Day Salary */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-black text-stone-900">
                            {formatDateVN(rec.ngay)}
                          </span>
                          <span className="text-xs font-semibold text-stone-500">
                            ({rec.thuTrongTuan})
                          </span>
                        </div>
                        <span className="text-xs text-stone-500">
                          {formatNumber(rec.soGaBatDuoc)} gà × {formatNumber(rec.donGiaApDung)} đ/con
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-black text-orange-600 font-mono block">
                          {formatVND(rec.tongLuongNgay)}
                        </span>
                        {isMatch ? (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold font-sans">
                            ✓ Khớp 100%
                          </span>
                        ) : (
                          <span className="text-[10px] text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded font-bold font-sans">
                            ⚠ Lệch {formatVND(rec.tongLuongNgay - sumRow)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Employee wage chips for this day */}
                    <div className="pt-2 border-t border-stone-100">
                      <span className="text-[11px] font-bold text-stone-500 block mb-1.5">
                        {workingEmployees.length} nhân viên đi làm & tiền công:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {employees.map(emp => {
                          const detail = rec.chiTiet.find(c => c.nhanVienId === emp.id);
                          const isPresent = detail && detail.coMat;
                          return (
                            <div
                              key={emp.id}
                              className={`flex items-center justify-between p-2 rounded-xl text-xs border ${
                                isPresent
                                  ? 'bg-orange-50/40 border-orange-200/60 text-stone-900 font-semibold'
                                  : 'bg-stone-50/50 border-stone-100 text-stone-400'
                              }`}
                            >
                              <span className="truncate">
                                {emp.hoTen} ({emp.vaiTro === 'CHINH' ? 'Chính' : 'Phụ'}):
                              </span>
                              <span className={`font-mono ${isPresent ? 'text-stone-900 font-bold' : 'text-stone-300'}`}>
                                {isPresent ? `${formatNumber(detail.luongNhanDuoc)} đ` : 'Nghỉ'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* MATRIX TABLE: With Sticky Date Column */
            <div className="overflow-x-auto max-h-[600px] relative">
              {isMobileView && (
                <div className="text-[11px] text-stone-600 px-4 py-1.5 bg-orange-50/70 border-b border-orange-100 flex items-center gap-1.5">
                  <span className="flex-shrink-0">👈👉</span>
                  <span>Vuốt ngang để xem đủ nhân viên. Cột <strong>Ngày</strong> đã được cố định.</span>
                </div>
              )}
              <table className="w-full text-left text-xs min-w-[900px]">
                <thead className="bg-stone-50 text-stone-700 font-bold uppercase tracking-wider border-b border-stone-200 sticky top-0 z-10 shadow-2xs">
                  <tr>
                    <th className="py-2.5 px-3 whitespace-nowrap sticky left-0 z-20 bg-stone-50 border-r border-stone-200 shadow-[2px_0_5px_rgba(0,0,0,0.04)]">
                      Ngày
                    </th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Thứ</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">Số con gà (C)</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">Đơn giá (E)</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">Tổng lương ngày (D)</th>
                    {employees.map(emp => (
                      <th key={emp.id} className="py-2.5 px-3 text-right whitespace-nowrap">
                        {emp.hoTen} ({emp.vaiTro === 'CHINH' ? 'C' : 'P'})
                      </th>
                    ))}
                    <th className="py-2.5 px-3 text-center whitespace-nowrap">Kiểm tra (V)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono">
                  {monthRecords.map(rec => {
                    const sumRow = rec.chiTiet.reduce((s, c) => s + c.luongNhanDuoc, 0);
                    const isMatch = sumRow === rec.tongLuongNgay;

                    return (
                      <tr key={rec.id} className="hover:bg-stone-50 transition-colors">
                        <td className="py-2 px-3 font-bold text-stone-900 whitespace-nowrap sticky left-0 z-10 bg-white border-r border-stone-200 shadow-[2px_0_5px_rgba(0,0,0,0.04)]">
                          {formatDateVN(rec.ngay)}
                        </td>
                        <td className="py-2 px-3 text-stone-600 font-sans whitespace-nowrap">
                          {rec.thuTrongTuan}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-stone-800">
                          {formatNumber(rec.soGaBatDuoc)}
                        </td>
                        <td className="py-2 px-3 text-right text-stone-600">
                          {formatNumber(rec.donGiaApDung)}
                        </td>
                        <td className="py-2 px-3 text-right font-black text-orange-600">
                          {formatVND(rec.tongLuongNgay)}
                        </td>
                        {employees.map(emp => {
                          const detail = rec.chiTiet.find(c => c.nhanVienId === emp.id);
                          const isPresent = detail && detail.coMat;
                          return (
                            <td
                              key={emp.id}
                              className={`py-2 px-3 text-right font-semibold ${
                                isPresent ? 'text-stone-900 bg-orange-50/20' : 'text-stone-300'
                              }`}
                            >
                              {isPresent ? formatNumber(detail.luongNhanDuoc) : '—'}
                            </td>
                          );
                        })}
                        <td className="py-2 px-3 text-center">
                          {isMatch ? (
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold font-sans">
                              Khớp
                            </span>
                          ) : (
                            <span className="text-[10px] text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded font-bold font-sans">
                              Lệch
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Unlock Confirmation Modal */}
      {showUnlockDialog && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-base font-bold text-stone-900">
                Xác nhận mở lại sổ tháng {selectedMonth}
              </h3>
            </div>
            <p className="text-xs text-stone-600">
              Thao tác này sẽ chuyển dữ liệu tháng về trạng thái <span className="font-bold text-stone-800">ĐANG NHẬP</span>. Bạn bắt buộc phải ghi rõ lý do để lưu vào nhật ký kiểm toán (Audit Log).
            </p>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Lý do mở lại sổ:
              </label>
              <textarea
                id="textarea-unlock-reason"
                rows={3}
                value={unlockReason}
                onChange={e => setUnlockReason(e.target.value)}
                placeholder="VD: Điều chỉnh lại sản lượng ngày 15 do tính thiếu 100 con gà..."
                className="w-full text-xs p-3 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowUnlockDialog(false)}
                className="px-3.5 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleUnlock}
                className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl cursor-pointer shadow-xs"
              >
                Xác nhận mở sổ & Ghi log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payslip Modal */}
      {selectedEmployeeForPayslip && (
        <PayslipModal
          employee={selectedEmployeeForPayslip}
          month={selectedMonth}
          records={attendanceRecords}
          companyInfo={companyInfo}
          onClose={() => setSelectedEmployeeForPayslip(null)}
        />
      )}
    </div>
  );
};
