import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatDateVN, formatNumber, formatVND } from '../utils/formatters';
import {
  TrendingUp,
  Calendar,
  Users,
  CheckCircle2,
  Award,
  ArrowUpRight,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  CalendarCheck2,
} from 'lucide-react';
import { NavTab } from './Header';

interface DashboardViewProps {
  onNavigate: (tab: NavTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { attendanceRecords, employees, companyInfo, currentUser } = useApp();

  // Aggregate overall stats
  const stats = useMemo(() => {
    let totalChickens = 0;
    let totalPayroll = 0;
    let totalShifts = 0;
    const daysCount = attendanceRecords.length;

    attendanceRecords.forEach(r => {
      totalChickens += r.soGaBatDuoc;
      totalPayroll += r.tongLuongNgay;
      totalShifts += r.chiTiet.filter(c => c.coMat).length;
    });

    const avgChickensPerDay = daysCount > 0 ? Math.round(totalChickens / daysCount) : 0;
    const avgWagePerShift = totalShifts > 0 ? Math.round(totalPayroll / totalShifts) : 0;

    return {
      totalChickens,
      totalPayroll,
      daysCount,
      totalShifts,
      avgChickensPerDay,
      avgWagePerShift,
    };
  }, [attendanceRecords]);

  // Leaderboard of employees
  const leaderboard = useMemo(() => {
    return employees
      .map(emp => {
        let totalWage = 0;
        let daysPresent = 0;
        attendanceRecords.forEach(r => {
          const detail = r.chiTiet.find(c => c.nhanVienId === emp.id);
          if (detail && detail.coMat) {
            daysPresent += 1;
            totalWage += detail.luongNhanDuoc;
          }
        });
        return {
          emp,
          totalWage,
          daysPresent,
        };
      })
      .sort((a, b) => b.totalWage - a.totalWage);
  }, [employees, attendanceRecords]);

  // Recent 10 catching days
  const recentDays = useMemo(() => {
    return [...attendanceRecords]
      .sort((a, b) => b.ngay.localeCompare(a.ngay))
      .slice(0, 8);
  }, [attendanceRecords]);

  // Max daily chicken volume for progress bar scaling
  const maxChickenInRecent = useMemo(() => {
    return Math.max(...recentDays.map(d => d.soGaBatDuoc), 1500);
  }, [recentDays]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-orange-500/15 relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-white/10 pointer-events-none blur-2xl" />
        <div className="absolute right-20 top-0 w-32 h-32 rounded-full bg-white/10 pointer-events-none blur-xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-bold text-white uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              {companyInfo.tenCongTy}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Quản lý Chấm công & Tính lương Đội Bắt Gà
            </h1>
            <p className="text-sm text-orange-100 font-medium leading-relaxed">
              Tự động hóa hoàn toàn thuật toán chia lương sản lượng ngày cho đội Lương chính & Lương phụ. Chống sửa ngược lịch sử, khoá sổ an toàn và minh bạch 100%.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => onNavigate('daily')}
              id="btn-goto-daily"
              className="px-5 py-3 rounded-2xl bg-white text-orange-600 hover:bg-orange-50 font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CalendarCheck2 className="w-4 h-4" />
              Chấm công hôm nay
            </button>
            <button
              onClick={() => onNavigate('monthly')}
              id="btn-goto-monthly"
              className="px-4 py-3 rounded-2xl bg-orange-700/60 hover:bg-orange-700 text-white font-bold text-sm border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Xem bảng lương tháng
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI 4-Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Chickens */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-stone-200">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Tổng gà bắt được</span>
            <div className="p-2 rounded-xl bg-orange-100 text-orange-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-stone-900 font-mono">
              {formatNumber(stats.totalChickens)}
            </span>
            <span className="text-xs font-bold text-orange-600">con</span>
          </div>
          <p className="text-xs text-stone-400 mt-2">
            Bình quân: <span className="font-bold text-stone-700">{formatNumber(stats.avgChickensPerDay)}</span> con/ngày
          </p>
        </div>

        {/* Total Payroll */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-stone-200">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Tổng quỹ lương chi</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-orange-600 font-mono">
              {formatVND(stats.totalPayroll)}
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-2">
            Theo đúng đơn giá snapshot từng thời kỳ
          </p>
        </div>

        {/* Total Working Days */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-stone-200">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Số ngày ra quân</span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-stone-900 font-mono">
              {stats.daysCount}
            </span>
            <span className="text-xs font-bold text-stone-500">ngày</span>
          </div>
          <p className="text-xs text-stone-400 mt-2">
            Tổng cộng: <span className="font-bold text-stone-700">{stats.totalShifts}</span> lượt công
          </p>
        </div>

        {/* Avg Wage Per Shift */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-stone-200">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Lương TB / Lượt công</span>
            <div className="p-2 rounded-xl bg-sky-100 text-sky-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-stone-800 font-mono">
              {formatVND(stats.avgWagePerShift)}
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-2">
            Đội: {employees.filter(e => e.trangThai === 'DANG_LAM').length} nhân viên hoạt động
          </p>
        </div>
      </div>

      {/* Two Columns: Recent Days Volume & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Recent Catching Logs (lg:col-span-7) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 shadow-xs border border-stone-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <h2 className="text-base font-bold text-stone-900">
                Sản lượng gà bắt các ngày gần nhất
              </h2>
              <p className="text-xs text-stone-500">
                Biểu đồ thanh khối lượng bắt và quỹ lương tương ứng
              </p>
            </div>
            <button
              onClick={() => onNavigate('daily')}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
            >
              Chấm công ngay
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentDays.map(day => {
              const percentage = Math.min(100, Math.round((day.soGaBatDuoc / maxChickenInRecent) * 100));
              const presentCount = day.chiTiet.filter(c => c.coMat).length;

              return (
                <div
                  key={day.id}
                  onClick={() => onNavigate('daily')}
                  className="p-3 rounded-xl border border-stone-100 hover:border-orange-200 hover:bg-orange-50/20 transition-all cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900 font-mono">
                        {formatDateVN(day.ngay)}
                      </span>
                      <span className="text-stone-500">({day.thuTrongTuan})</span>
                      <span className="text-[10px] bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded font-medium">
                        {presentCount} người đi làm
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-stone-900 font-mono">
                        {formatNumber(day.soGaBatDuoc)} con
                      </span>
                      <span className="text-[11px] text-orange-600 font-bold ml-2 font-mono">
                        {formatVND(day.tongLuongNgay)}
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${percentage}%` }}
                      className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Team Attendance & Earnings Leaderboard (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 shadow-xs border border-stone-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <h2 className="text-base font-bold text-stone-900">
                Xếp hạng ngày công & Thu nhập
              </h2>
              <p className="text-xs text-stone-500">
                Tổng hợp thành viên trong đội bắt gà
              </p>
            </div>
            <Award className="w-5 h-5 text-amber-500" />
          </div>

          <div className="space-y-3">
            {leaderboard.map((item, idx) => {
              const isChinh = item.emp.vaiTro === 'CHINH';
              return (
                <div
                  key={item.emp.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-stone-50/70 border border-stone-200/80"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${
                        idx === 0
                          ? 'bg-amber-400 text-stone-900'
                          : idx === 1
                          ? 'bg-stone-300 text-stone-800'
                          : idx === 2
                          ? 'bg-amber-600/80 text-white'
                          : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-stone-900">
                          {item.emp.hoTen}
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            isChinh
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isChinh ? 'Chính' : 'Phụ'}
                        </span>
                      </div>
                      <span className="text-xs text-stone-500">
                        {item.daysPresent} ngày công
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-black text-sm text-orange-600 font-mono block">
                      {formatVND(item.totalWage)}
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">
                      {item.daysPresent > 0 ? formatVND(item.totalWage / item.daysPresent) + '/công' : '—'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigate('monthly')}
              className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Xem chi tiết bảng lương từng người
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
