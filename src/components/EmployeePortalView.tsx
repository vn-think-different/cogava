import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { NhanVien } from '../types';
import { formatDateVN, formatNumber, formatVND, getDayOfWeekVN } from '../utils/formatters';
import { PayslipModal } from './PayslipModal';
import {
  Calendar,
  CreditCard,
  Phone,
  Printer,
  CheckCircle2,
  Clock,
  Lock,
  Unlock,
  TrendingUp,
  FileText,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ChevronRight,
  User,
} from 'lucide-react';

export const EmployeePortalView: React.FC = () => {
  const {
    currentUser,
    employees,
    attendanceRecords,
    companyInfo,
    isMonthLocked,
  } = useApp();

  // Find the logged-in employee record
  const currentEmployee = useMemo(() => {
    if (currentUser.nhanVienId) {
      const found = employees.find(e => e.id === currentUser.nhanVienId);
      if (found) return found;
    }
    // Fallback if logged in by name or first employee
    const matchName = employees.find(e => e.hoTen === currentUser.tenHienThi);
    return matchName || employees[0];
  }, [currentUser, employees]);

  // Selected Month (default to 2026-09 or 2026-08)
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-09');
  const [showPayslipModal, setShowPayslipModal] = useState<boolean>(false);

  // Available months
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    attendanceRecords.forEach(r => set.add(r.ngay.substring(0, 7)));
    set.add('2026-08');
    set.add('2026-09');
    return Array.from(set).sort().reverse();
  }, [attendanceRecords]);

  // Records for this month
  const monthRecords = useMemo(() => {
    return attendanceRecords
      .filter(r => r.ngay.startsWith(selectedMonth))
      .sort((a, b) => a.ngay.localeCompare(b.ngay));
  }, [attendanceRecords, selectedMonth]);

  const monthLocked = useMemo(() => {
    return isMonthLocked(selectedMonth);
  }, [isMonthLocked, selectedMonth]);

  // Calculations for this employee in the chosen month
  const employeeStats = useMemo(() => {
    if (!currentEmployee) {
      return { totalWage: 0, daysPresent: 0, daysTotal: 0, workDays: [] };
    }

    let totalWage = 0;
    let daysPresent = 0;

    const workDays = monthRecords.map(rec => {
      const detail = rec.chiTiet.find(c => c.nhanVienId === currentEmployee.id);
      const isPresent = !!detail?.coMat;
      const wage = isPresent ? detail?.luongNhanDuoc || 0 : 0;

      if (isPresent) {
        daysPresent += 1;
        totalWage += wage;
      }

      return {
        record: rec,
        coMat: isPresent,
        luong: wage,
      };
    });

    const totalDaysInMonth = monthRecords.length;
    const avgWagePerDay = daysPresent > 0 ? Math.round(totalWage / daysPresent) : 0;
    const attendanceRate = totalDaysInMonth > 0 ? Math.round((daysPresent / totalDaysInMonth) * 100) : 0;

    return {
      totalWage,
      daysPresent,
      totalDaysInMonth,
      avgWagePerDay,
      attendanceRate,
      workDays,
    };
  }, [currentEmployee, monthRecords]);

  if (!currentEmployee) {
    return (
      <div className="p-8 text-center text-stone-500">
        Không tìm thấy hồ sơ nhân viên. Vui lòng liên hệ Quản trị viên.
      </div>
    );
  }

  const isChinh = currentEmployee.vaiTro === 'CHINH';
  const [yearStr, monthStr] = selectedMonth.split('-');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Employee Greeting & Banking Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-xs border border-stone-200 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-md ${
                isChinh
                  ? 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-orange-500/20'
                  : 'bg-gradient-to-br from-amber-500 to-amber-600 shadow-amber-500/20'
              }`}
            >
              {currentEmployee.hoTen.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-stone-900">
                  {currentEmployee.hoTen}
                </h1>
                <span
                  className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    isChinh
                      ? 'bg-orange-100 text-orange-800 border border-orange-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  {isChinh ? 'Lương chính' : 'Lương phụ'}
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-2">
                <span>Đội bắt gà COGAVA</span>
                <span>•</span>
                <span>Vào làm: {formatDateVN(currentEmployee.ngayVaoLam)}</span>
              </p>
            </div>
          </div>

          {/* Quick Payslip Trigger */}
          <button
            onClick={() => setShowPayslipModal(true)}
            id="btn-employee-open-payslip"
            className="w-full sm:w-auto px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Xem phiếu lương & In PDF</span>
          </button>
        </div>

        {/* Bank Account Verification Alert */}
        <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-stone-700">
            <CreditCard className="w-4 h-4 text-orange-600 flex-shrink-0" />
            <span>
              <strong>Tài khoản chuyển lương:</strong>{' '}
              {currentEmployee.stkNganHang ? (
                <span className="font-mono font-bold text-stone-900">
                  {currentEmployee.stkNganHang} ({currentEmployee.tenNganHang})
                </span>
              ) : (
                <span className="text-rose-600 italic font-semibold">
                  Chưa cập nhật — vui lòng báo đội trưởng!
                </span>
              )}
            </span>
          </div>
          {currentEmployee.sdt && (
            <div className="flex items-center gap-1.5 text-stone-500">
              <Phone className="w-3.5 h-3.5 text-stone-400" />
              <span className="font-mono">{currentEmployee.sdt}</span>
            </div>
          )}
        </div>
      </div>

      {/* Month Selector & Lock Status */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-orange-600" />
            <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
              Chọn kỳ lương:
            </span>
          </div>
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="text-sm font-black text-stone-900 bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-orange-500 cursor-pointer"
          >
            {availableMonths.map(m => {
              const [y, mo] = m.split('-');
              return (
                <option key={m} value={m}>
                  Tháng {mo}/{y}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          {monthLocked ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              Bảng lương đã chốt sổ chính thức
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
              <Unlock className="w-3.5 h-3.5 text-emerald-600" />
              Đang trong kỳ (Số liệu tạm tính theo ngày)
            </span>
          )}
        </div>
      </div>

      {/* Big Personal Metrics (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Salary Card */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-white shadow-md shadow-orange-500/20 sm:col-span-2 space-y-2">
          <div className="flex items-center justify-between text-orange-100">
            <span className="text-xs font-bold uppercase tracking-wider">
              Thu nhập thực nhận Tháng {monthStr}/{yearStr}
            </span>
            <Sparkles className="w-5 h-5 text-orange-200" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight">
              {formatVND(employeeStats.totalWage)}
            </span>
          </div>
          <p className="text-xs text-orange-100 font-medium">
            Đã tính theo sản lượng thực tế các ca có mặt bắt gà
          </p>
        </div>

        {/* Working Days Card */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-stone-200 space-y-2">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
            Số ngày công đi làm
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-stone-900 font-mono">
              {employeeStats.daysPresent}
            </span>
            <span className="text-xs font-bold text-stone-400">
              / {employeeStats.totalDaysInMonth} ngày ra quân
            </span>
          </div>
          <div className="text-xs text-stone-500 flex items-center justify-between pt-1 border-t border-stone-100">
            <span>Chuyên cần:</span>
            <span className="font-bold text-emerald-700 font-mono">
              {employeeStats.attendanceRate}%
            </span>
          </div>
        </div>
      </div>

      {/* Daily Attendance Breakdown List */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-stone-200 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <h2 className="text-base font-bold text-stone-900">
              Nhật ký ca làm & Lương từng ngày
            </h2>
            <p className="text-xs text-stone-500">
              Chi tiết các ngày trong tháng {monthStr}/{yearStr}
            </p>
          </div>
          <span className="text-xs font-bold text-stone-600">
            TB: {formatVND(employeeStats.avgWagePerDay)}/ca
          </span>
        </div>

        <div className="space-y-2">
          {employeeStats.workDays.map(item => (
            <div
              key={item.record.id}
              className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
                item.coMat
                  ? 'bg-orange-50/40 border-orange-200'
                  : 'bg-stone-50/60 border-stone-200/80 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                    item.coMat
                      ? 'bg-orange-500 text-white'
                      : 'bg-stone-200 text-stone-500'
                  }`}
                >
                  {item.coMat ? '✓' : '—'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-stone-900 font-mono">
                      {formatDateVN(item.record.ngay)}
                    </span>
                    <span className="text-xs text-stone-500">
                      ({item.record.thuTrongTuan})
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-500">
                    Sản lượng đội: {formatNumber(item.record.soGaBatDuoc)} con gà
                  </span>
                </div>
              </div>

              <div className="text-right">
                {item.coMat ? (
                  <div>
                    <span className="text-base font-extrabold text-stone-900 font-mono block">
                      {formatVND(item.luong)}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded">
                      Có mặt đi làm
                    </span>
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-stone-400">
                    Vắng mặt (0 đ)
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payslip Modal */}
      {showPayslipModal && (
        <PayslipModal
          employee={currentEmployee}
          month={selectedMonth}
          records={attendanceRecords}
          companyInfo={companyInfo}
          onClose={() => setShowPayslipModal(false)}
        />
      )}
    </div>
  );
};
