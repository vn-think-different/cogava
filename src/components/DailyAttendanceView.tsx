import { teamPrice } from '../utils/teamManagement';
import { NhanVien, PayrollCalculationResult } from '../types';
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { calculateDailyPayroll } from '../utils/payrollEngine';
import { formatDateVN, formatNumber, formatVND, getDayOfWeekVN } from '../utils/formatters';
import { ConfirmModal } from './ConfirmModal';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Lock,
  Unlock,
  Save,
  Trash2,
  HelpCircle,
  Clock,
  Sparkles,
  Users,
  Users2,
  CheckSquare,
  Square,
  RefreshCw,
  Edit3,
  Info,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const DailyAttendanceView: React.FC = () => {
  const {
    updateTeam,
    attendanceRecords,
    employees,
    teams,
    configs,
    getConfigForDate,
    saveDailyAttendance,
    deleteDailyAttendance,
    currentUser,
    isMobileView,
    setActiveTab,
  } = useApp();

  // Current selected date (Default to 2026-09-13 or today)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }));
  
  // Selected Team: For DOI_TRUONG locked to their team, for ADMIN selectable
  const [selectedTeamId, setSelectedTeamId] = useState<string>(() => {
    if (currentUser.vaiTro === 'DOI_TRUONG' && currentUser.doiId) {
      return currentUser.doiId;
    }
    return teams[0]?.id || 'doi-1';
  });

  const currentTeamId = currentUser.vaiTro === 'DOI_TRUONG'
    ? (currentUser.doiId || '')
    : (currentUser.vaiTro === 'NHAN_VIEN' ? (currentUser.doiId || 'doi-1') : selectedTeamId);

  const currentTeam = teams.find(t => t.id === currentTeamId);

  const [chickenCount, setChickenCount] = useState<string>('');
  const [customUnitPrice, setCustomUnitPrice] = useState<string>('');
  const [priceOverrideReason, setPriceOverrideReason] = useState<string>('');
  const [showOverridePrice, setShowOverridePrice] = useState<boolean>(false);
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);
  const [isDeletingModalOpen, setIsDeletingModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });

  // Effective system config for the selected date
  const effectiveConfig = useMemo(() => {
    return getConfigForDate(selectedDate);
  }, [getConfigForDate, selectedDate]);

  // Current active unit price
  const activeUnitPrice = useMemo(() => {
    if (showOverridePrice && customUnitPrice !== '' && !isNaN(Number(customUnitPrice))) {
      return Number(customUnitPrice);
    }
    return teamPrice(currentTeam, selectedDate);
  }, [showOverridePrice, customUnitPrice, currentTeam, selectedDate]);

  // Existing record for this date & team (if any)
  const existingRecord = useMemo(() => {
    return attendanceRecords.find(
      r => r.ngay === selectedDate && (r.doiId === currentTeamId || (!r.doiId && currentTeamId === 'doi-1'))
    );
  }, [attendanceRecords, selectedDate, currentTeamId]);

  // Check if this date is locked
  const isLocked = existingRecord?.trangThai === 'DA_CHOT';
  const isAdmin = currentUser.vaiTro === 'ADMIN';
  const isDoiTruong = currentUser.vaiTro === 'DOI_TRUONG';
  const isEmployee = currentUser.vaiTro === 'NHAN_VIEN';

  // Quy định phân quyền:
  // - Admin: Toàn quyền chấm công, xem, sửa, điều chỉnh và xóa bảng chấm công.
  // - Đội trưởng: Mỗi đội chỉ chấm công 1 lần duy nhất trong ngày. Đội trưởng chỉ được chấm công khi CHƯA có bản ghi (!existingRecord && !isLocked). Sau khi đã chấm công, Đội trưởng chỉ được xem, KHÔNG được quyền sửa đổi.
  // - Nhân viên: Chế độ chỉ đọc.
  const canEdit = isAdmin ? !isLocked : (isDoiTruong ? (!existingRecord && !isLocked) : false);
  const canDelete = isAdmin && !!existingRecord && !isLocked;

  // Logged-in employee (for data isolation when role is NHAN_VIEN)
  const loggedInEmployee = useMemo(() => {
    if (!isEmployee) return null;
    return employees.find(e => e.id === currentUser.nhanVienId);
  }, [isEmployee, currentUser, employees]);

  // Filter employees belonging to the selected team
  const teamEmployees = useMemo<NhanVien[]>(() => {
    if (existingRecord) return existingRecord.chiTiet.map(c => ({ id: c.nhanVienId, hoTen: c.hoTen, vaiTro: c.vaiTro, trangThai: 'DANG_LAM' as const, ngayVaoLam: existingRecord.ngay, doiId: currentTeamId }));
    return employees.filter(
      e => e.doiId === currentTeamId || (!e.doiId && currentTeamId === 'doi-1')
    );
  }, [employees, currentTeamId, existingRecord]);

  // Load record data when date or team changes
  useEffect(() => {
    if (existingRecord) {
      setChickenCount(String(existingRecord.soGaBatDuoc));
      if (true) {
        setShowOverridePrice(true);
        setCustomUnitPrice(String(existingRecord.donGiaApDung));
        setPriceOverrideReason(existingRecord.ghiChuDonGia || '');
      } else {
        setShowOverridePrice(false);
        setCustomUnitPrice('');
        setPriceOverrideReason('');
      }
      // Populate present employee ids
      const present = existingRecord.chiTiet.filter(c => c.coMat).map(c => c.nhanVienId);
      setSelectedEmpIds(present);
    } else {
      // Default: empty chicken count for easy manual entry, and select all active employees in this team
      setChickenCount('');
      setShowOverridePrice(false);
      setCustomUnitPrice('');
      setPriceOverrideReason('');
      setSelectedEmpIds(teamEmployees.filter(e => e.trangThai === 'DANG_LAM').map(e => e.id));
    }
    setSaveStatus({ type: null, message: '' });
  }, [selectedDate, existingRecord, effectiveConfig, teamEmployees]);

  // Active employees in this team
  const activeEmployees = useMemo(() => {
    return teamEmployees.filter(
      e => e.trangThai === 'DANG_LAM' || selectedEmpIds.includes(e.id)
    );
  }, [teamEmployees, selectedEmpIds]);

  // Run real-time calculation preview
  const calculationPreview = useMemo<PayrollCalculationResult>(() => {
    const soGa = Number(chickenCount) || 0;
    const empInput = activeEmployees.map(e => ({
      id: e.id,
      hoTen: e.hoTen,
      vaiTro: e.vaiTro,
      coMat: selectedEmpIds.includes(e.id),
    }));

    const unchanged = existingRecord && soGa === existingRecord.soGaBatDuoc && activeUnitPrice === existingRecord.donGiaApDung && existingRecord.chiTiet.every(c => c.coMat === selectedEmpIds.includes(c.nhanVienId));
    const calculated = calculateDailyPayroll({
      soGa: Math.max(0, Number.isSafeInteger(soGa) ? soGa : 0),
      donGia: Math.max(0, Number.isSafeInteger(activeUnitPrice) ? activeUnitPrice : 0),
      tyLePhuChinh: existingRecord?.tyLePhuChinh ?? configs.find(c => c.id === existingRecord?.cauHinhId)?.tyLePhuChinh ?? effectiveConfig.tyLePhuChinh,
      employees: empInput,
    });
    return unchanged ? { ...calculated, chiTietLuong: existingRecord.chiTiet, tongLuongNgay: existingRecord.tongLuongNgay, tongLuongThucChia: existingRecord.chiTiet.reduce((sum, c) => sum + c.luongNhanDuoc, 0) } : calculated;
  }, [chickenCount, activeUnitPrice, effectiveConfig, activeEmployees, selectedEmpIds, existingRecord, configs]);

  // Quick select actions
  const selectAll = () => {
    setSelectedEmpIds(activeEmployees.map(e => e.id));
  };
  const selectOnlyChinh = () => {
    setSelectedEmpIds(activeEmployees.filter(e => e.vaiTro === 'CHINH').map(e => e.id));
  };
  const deselectAll = () => {
    setSelectedEmpIds([]);
  };

  const toggleEmployee = (empId: string) => {
    if (!canEdit) return;
    setSelectedEmpIds(prev =>
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  };

  // Date steppers
  const stepDate = (days: number) => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + days);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${d}`);
  };

  // Handle Save
  const handleSave = () => {
    if (!canEdit) return;
    const soGaNum = Number(chickenCount);
    if (isNaN(soGaNum) || soGaNum < 0) {
      setSaveStatus({ type: 'error', message: 'Vui lòng nhập số con gà hợp lệ!' });
      return;
    }

    if (soGaNum > 0 && selectedEmpIds.length === 0) {
      setSaveStatus({
        type: 'error',
        message: 'Có sản lượng gà bắt được nhưng chưa tick chọn nhân viên nào có mặt!',
      });
      return;
    }

    const res = saveDailyAttendance({
      ngay: selectedDate,
      doiId: currentTeamId,
      soGa: soGaNum,
      donGia: activeUnitPrice,
      ghiChuDonGia: showOverridePrice ? priceOverrideReason : undefined,
      presentEmployeeIds: selectedEmpIds,
    });

    if (res.success) {
      setSaveStatus({ type: 'success', message: res.message });
      try {
        confetti({
          particleCount: 30,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#FF8000', '#F97316', '#FBBF24'],
        });
      } catch (e) {
        // Safe fallback
      }
    } else {
      setSaveStatus({ type: 'error', message: res.message });
    }
  };

  // Handle Delete
  const handleDelete = () => {
    if (!existingRecord) return;
    setIsDeletingModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!existingRecord) return;
    deleteDailyAttendance(existingRecord.id);
    setIsDeletingModalOpen(false);
    setSaveStatus({ type: 'success', message: 'Đã xoá bản ghi chấm công ngày ' + formatDateVN(selectedDate) });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner: Date Selector & Lock Status */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-stone-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Date Picker with Steppers */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => stepDate(-1)}
              className="p-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer"
              title="Ngày trước"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="relative flex items-center">
              <input
                id="input-selected-date"
                type="date"
                aria-label="Chọn ngày chấm công"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="pl-10 pr-3 py-2 text-base font-bold text-stone-900 bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 cursor-pointer"
              />
              <Calendar className="w-4 h-4 text-orange-600 absolute left-3 pointer-events-none" />
            </div>

            <button
              onClick={() => stepDate(1)}
              className="p-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer"
              title="Ngày sau"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => setSelectedDate('2026-09-13')}
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
            >
              Hôm nay (13/09)
            </button>
          </div>

          {/* Date Details & Lock Badge */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-sm font-bold text-stone-900 block">
                {getDayOfWeekVN(selectedDate)}, {formatDateVN(selectedDate)}
              </span>
              <span className="text-xs text-stone-500">
                Tháng {selectedDate.substring(5, 7)} / {selectedDate.substring(0, 4)}
              </span>
            </div>

            {isLocked ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                Đã chốt sổ
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                Đang mở nhập
              </span>
            )}

            {/* Desktop Direct Quick Save Action */}
            {!isMobileView && canEdit && (
              <button
                type="button"
                id="btn-desktop-quick-save"
                onClick={handleSave}
                className="ml-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
                title="Lưu bảng chấm công ngày này"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{existingRecord ? 'Cập nhật' : 'Lưu chấm công'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Team Selector & Phân quyền chấm công theo Đội */}
        <div className="mt-4 pt-3.5 border-t border-stone-100">
          {currentUser.vaiTro === 'ADMIN' ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50 p-3 rounded-xl border border-stone-200/80">
              <div className="flex items-center gap-2">
                <Users2 className="w-4 h-4 text-orange-600 flex-shrink-0" />
                <div>
                  <span className="text-xs font-bold text-stone-900 block">
                    Đội bắt gà chấm công:
                  </span>
                  <span className="text-[10px] text-stone-500">
                    Chọn đội để chấm công hoặc xem bảng chấm công từng đội
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {teams.map(team => {
                  const isSelected = team.id === currentTeamId;
                  const memberCount = employees.filter(e => e.doiId === team.id && e.trangThai === 'DANG_LAM').length;
                  return (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => setSelectedTeamId(team.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-orange-500 text-white shadow-xs'
                          : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                      }`}
                    >
                      <span>{team.tenDoi}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                          isSelected ? 'bg-orange-700 text-white' : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {memberCount} NV
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : currentUser.vaiTro === 'DOI_TRUONG' ? (
            <div className="flex items-center justify-between bg-sky-50/80 border border-sky-200 p-3 rounded-xl text-xs text-sky-950">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-sky-500 text-white">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-sky-900">
                      {currentTeam?.tenDoi || 'Đội của bạn'}
                    </span>
                    {currentTeam?.khuVuc && (
                      <span className="text-[10px] font-semibold text-sky-700 bg-sky-100 px-2 py-0.5 rounded border border-sky-200">
                        {currentTeam.khuVuc}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-sky-700 mt-0.5">
                    Đội trưởng <strong>{currentUser.tenHienThi}</strong> phụ trách chấm công cho {teamEmployees.length} nhân viên trong đội của mình.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-sky-800 bg-white px-2.5 py-1 rounded-lg border border-sky-200 shadow-2xs whitespace-nowrap">
                {activeEmployees.length} nhân viên trong đội
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-stone-50 border border-stone-200 p-2.5 rounded-xl text-xs text-stone-700">
              <span className="font-semibold">
                Đội của bạn: <strong>{currentTeam?.tenDoi || 'Đội bắt gà'}</strong>
              </span>
              <span className="text-[11px] text-stone-500">
                Đội trưởng: {currentTeam?.doiTruongTen || 'Đang cập nhật'}
              </span>
            </div>
          )}
        </div>

        {/* Captain Attendance status banner */}
        {isDoiTruong && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-950 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">
                {existingRecord
                  ? `Đội trưởng đã hoàn thành chấm công ngày ${formatDateVN(selectedDate)}.`
                  : `Đội trưởng hãy tích chọn thành viên đi làm và nhập sản lượng bắt gà hôm nay để lưu chấm công (Mỗi ngày chấm công 1 lần duy nhất).`}
              </span>
              {existingRecord && (
                <p className="mt-0.5 text-[11px] text-blue-800">
                  Theo quy định phân quyền: Sau khi đã lưu chấm công, Đội trưởng ở chế độ chỉ đọc. Chỉ Quản trị viên mới có quyền điều chỉnh hoặc xóa bảng chấm công đã lưu.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Lock warning for field captain */}
        {isLocked && !isDoiTruong && (
          <div className="mt-4 p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2">
            <Lock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Bảng lương tháng này đã được Quản trị viên khoá sổ (chốt lương).</span>{' '}
              {currentUser.vaiTro === 'ADMIN' ? (
                <span>Bạn đang đăng nhập với tư cách Quản trị viên nên vẫn có thể điều chỉnh và ghi audit log.</span>
              ) : (
                <span>Chế độ chỉ đọc. Không thể sửa dữ liệu ngày đã chốt sổ.</span>
              )}
            </div>
          </div>
        )}

        {/* Info banner for Employee */}
        {isEmployee && (
          <div className="mt-4 p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Chế độ Chỉ đọc (Dành cho Nhân viên):</span>
              <p className="mt-0.5 text-[11px] text-sky-700">
                Bạn có thể xem lịch ra quân bắt gà của toàn đội. Để tra cứu chi tiết ngày công và in phiếu lương cá nhân của bạn, vui lòng truy cập tab <strong>Lương cá nhân</strong>.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Output & Attendance Form (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Chicken Catching Count & Applied Unit Price */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <span className="w-2 h-5 bg-orange-500 rounded-full inline-block"></span>
                1. Sản lượng bắt gà trong ngày
              </h2>
              <span className="text-xs font-medium text-stone-500">
                Tính lương = Số gà × Đơn giá
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Chicken Count Input */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5 uppercase tracking-wider">
                  Số con gà bắt được
                </label>
                <div className="relative">
                  <input
                    id="input-chicken-count"
                    type="number"
                    min="0"
                    step="10"
                    disabled={!canEdit}
                    value={chickenCount}
                    onChange={e => setChickenCount(e.target.value)}
                    placeholder="Nhập số con gà..."
                    className="w-full text-xl font-extrabold text-stone-900 bg-stone-50 border border-stone-300 rounded-xl px-4 py-3 focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:bg-white disabled:bg-stone-100 disabled:text-stone-500 font-mono"
                  />
                  <span className="absolute right-4 top-3.5 text-xs font-bold text-stone-500 uppercase">
                    con gà
                  </span>
                </div>
              </div>

              {/* Unit Price Display / Override */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                    Đơn giá áp dụng
                  </label>
                  {isAdmin && canEdit && (
                    <button
                      type="button"
                      onClick={() => setShowOverridePrice(!showOverridePrice)}
                      className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      {showOverridePrice ? 'Dùng giá chuẩn' : 'Tùy chỉnh giá'}
                    </button>
                  )}
                </div>

                {!showOverridePrice ? (
                  <div className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 flex items-center justify-between">
                    <div>
                      <span className="text-xl font-extrabold text-stone-900 font-mono">
                        {formatNumber(activeUnitPrice)}
                      </span>
                      <span className="text-xs text-stone-500 font-semibold ml-1">đ/con</span>
                    </div>
                    <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Theo cấu hình chuẩn
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        id="input-custom-price"
                        type="number"
                        min="0"
                        step="50"
                        disabled={!isAdmin || !canEdit}
                        value={customUnitPrice}
                        onChange={e => setCustomUnitPrice(e.target.value)}
                        placeholder="VD: 1250"
                        className="w-full text-xl font-extrabold text-orange-600 bg-orange-50/50 border border-orange-300 rounded-xl px-4 py-3 focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-mono"
                      />
                      <span className="absolute right-4 top-3.5 text-xs font-bold text-orange-700 uppercase">
                        đ/con
                      </span>
                    </div>
                    <input
                      id="input-override-reason"
                      type="text"
                      disabled={!isAdmin || !canEdit}
                      value={priceOverrideReason}
                      onChange={e => setPriceOverrideReason(e.target.value)}
                      placeholder="Lý do điều chỉnh đơn giá riêng hôm nay..."
                      className="w-full text-xs text-stone-700 bg-white border border-stone-200 rounded-lg px-3 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {isAdmin && !existingRecord && currentTeam && <button type="button" className="w-full border border-orange-300 rounded-xl px-4 py-2 text-orange-700 font-semibold" onClick={() => {
              const result = updateTeam(currentTeam.id, { donGiaTheoNgay: { ...currentTeam.donGiaTheoNgay, [selectedDate]: activeUnitPrice } });
              setSaveStatus({ type: result.success ? 'success' : 'error', message: result.success ? 'Đã đặt đơn giá cho ngày này. Đội trưởng sẽ dùng giá này khi chấm công.' : result.message });
            }}>Lưu đơn giá ngày cho đội (chưa lưu chấm công)</button>}
            {existingRecord && <p className="text-xs text-stone-500">Đang xem dữ liệu đã lưu. Thay đổi đơn giá mặc định hoặc chuyển đội không làm thay đổi bản ghi này.</p>}
            {/* Total Day Salary Highlight */}
            <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-orange-800 uppercase tracking-wider block">
                  Tổng quỹ lương ngày này:
                </span>
                <span className="text-xs text-orange-700/80">
                  {formatNumber(Number(chickenCount) || 0)} con × {formatNumber(activeUnitPrice)} đ/con
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-orange-600 font-mono">
                  {formatVND(calculationPreview.tongLuongNgay)}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Attendance Checklist (Touch-optimized for field use) */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-stone-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
              <div>
                <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <span className="w-2 h-5 bg-orange-500 rounded-full inline-block"></span>
                  2. Chấm công nhân viên có mặt ({selectedEmpIds.length}/{activeEmployees.length})
                </h2>
                <p className="text-xs text-stone-500">
                  Chạm vào từng nhân viên để đánh dấu có mặt đi bắt gà hôm nay
                </p>
              </div>

              {/* Quick Select Buttons */}
              {canEdit && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                  >
                    Tất cả
                  </button>
                  <button
                    type="button"
                    onClick={selectOnlyChinh}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 transition-colors cursor-pointer"
                  >
                    Chỉ Chính
                  </button>
                  <button
                    type="button"
                    onClick={deselectAll}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-500 transition-colors cursor-pointer"
                  >
                    Bỏ chọn
                  </button>
                </div>
              )}
            </div>

            {/* Empty State when team has 0 employees */}
            {activeEmployees.length === 0 ? (
              <div className="p-8 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-300 space-y-3">
                <Users className="w-10 h-10 text-stone-400 mx-auto" />
                <h3 className="text-sm font-bold text-stone-800">
                  Đội {currentTeam?.tenDoi || ''} hiện chưa có nhân viên nào
                </h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Để chấm công cho đội này, vui lòng gán nhân viên vào đội trong phần Quản lý Nhân sự.
                </p>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('employees')}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Users className="w-3.5 h-3.5" />
                    Đến Quản lý Nhân sự để gán nhân viên
                  </button>
                )}
              </div>
            ) : (
              /* Employee Cards - Large touch targets for phone screens */
              <div className="space-y-2.5">
                {activeEmployees.map(emp => {
                  const isSelected = selectedEmpIds.includes(emp.id);
                  const isChinh = emp.vaiTro === 'CHINH';
                  const empDetail = calculationPreview.chiTietLuong.find(c => c.nhanVienId === emp.id);
                  const wage = empDetail?.luongNhanDuoc || 0;

                  return (
                    <button
                      type="button"
                      key={emp.id}
                      id={`emp-attendance-${emp.id}`}
                      disabled={!canEdit}
                      onClick={() => toggleEmployee(emp.id)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer min-h-[56px] ${
                        isSelected
                          ? isChinh
                            ? 'bg-orange-50/70 border-orange-300 shadow-2xs'
                            : 'bg-amber-50/70 border-amber-300 shadow-2xs'
                          : 'bg-stone-50/60 border-stone-200 hover:bg-stone-100/60 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                            isSelected
                              ? isChinh
                                ? 'bg-orange-500 text-white'
                                : 'bg-amber-500 text-white'
                              : 'border-2 border-stone-300 bg-white text-transparent'
                          }`}
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-stone-900">
                              {emp.hoTen}
                            </span>
                            <span
                              className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                isChinh
                                  ? 'bg-orange-100 text-orange-800 border border-orange-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {isChinh ? 'Lương chính' : 'Lương phụ'}
                            </span>
                          </div>
                          <span className="text-xs text-stone-500">
                            {emp.tenNganHang ? `${emp.tenNganHang} - ${emp.stkNganHang}` : 'Chưa có STK'}
                          </span>
                        </div>
                      </div>

                      {/* Projected Daily Pay */}
                      <div className="text-right">
                        {isSelected ? (
                          <div>
                            {isEmployee && emp.id !== loggedInEmployee?.id ? (
                              <span className="text-xs font-bold text-stone-400 font-sans block py-0.5">
                                🔒 Bảo mật
                              </span>
                            ) : (
                              <span className="text-base font-extrabold text-stone-900 font-mono block">
                                {formatVND(wage)}
                              </span>
                            )}
                            <span className="text-[10px] font-medium text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded">
                              {isEmployee && emp.id === loggedInEmployee?.id ? 'Công của bạn' : 'Có mặt đi làm'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-stone-400">
                            {isEmployee && emp.id === loggedInEmployee?.id ? 'Bạn nghỉ (0 đ)' : 'Vắng mặt (0 đ)'}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Action Bar: Save & Delete */}
            <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              {canDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  Xoá chấm công ngày này
                </button>
              )}

              <div className="flex items-center gap-3 w-full sm:w-auto sm:ml-auto">
                {isDoiTruong && existingRecord ? (
                  <div className="text-xs font-bold text-stone-600 bg-stone-100 px-4 py-2.5 rounded-xl border border-stone-200 flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-stone-500" />
                    <span>Đã chấm công (Chỉ Quản trị viên mới được quyền sửa/xóa)</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    id="btn-save-attendance"
                    disabled={!canEdit || activeEmployees.length === 0}
                    onClick={handleSave}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-stone-300 text-white font-bold text-sm shadow-md shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    {existingRecord ? 'Cập nhật chấm công' : 'Lưu chấm công & Tính lương'}
                  </button>
                )}
              </div>
            </div>

            {/* Notification messages */}
            {saveStatus.type && (
              <div
                className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  saveStatus.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {saveStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                )}
                <span>{saveStatus.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Engine Calculation Breakdown (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Mathematical Engine Breakdown Card */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-stone-200 space-y-4 sticky top-20">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-orange-100 text-orange-700">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">
                    Bảng phân bổ lương chi tiết
                  </h3>
                  <span className="text-[11px] text-stone-500">
                    Khớp thuật toán chuẩn Mục 4 & Excel gốc
                  </span>
                </div>
              </div>

              {/* Validation Badge */}
              {calculationPreview.kiemTraHopLe ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Khớp 100%
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  Lệch {calculationPreview.chenhLech}đ
                </span>
              )}
            </div>

            {/* Formula Metrics Grid */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/70">
                <span className="text-[10px] uppercase font-bold text-stone-500 block">
                  Số Chính (K)
                </span>
                <span className="text-base font-extrabold text-orange-600 font-mono">
                  {calculationPreview.soChinhDiLam}
                </span>
              </div>
              <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/70">
                <span className="text-[10px] uppercase font-bold text-stone-500 block">
                  Số Phụ (L)
                </span>
                <span className="text-base font-extrabold text-amber-600 font-mono">
                  {calculationPreview.soPhuDiLam}
                </span>
              </div>
              <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/70">
                <span className="text-[10px] uppercase font-bold text-stone-500 block">
                  Tổng người (M)
                </span>
                <span className="text-base font-extrabold text-stone-800 font-mono">
                  {calculationPreview.soNguoiDiLam}
                </span>
              </div>
            </div>

            {/* Middle Formula Calculations or Employee Privacy Notice */}
            {isEmployee ? (
              <div className="p-3 bg-orange-50/70 border border-orange-200 rounded-xl text-xs text-orange-950 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="w-4 h-4 text-orange-600" />
                  <span>Bảo mật thu nhập nội bộ</span>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  Hệ thống bảo mật dữ liệu lương của từng nhân viên. Bạn chỉ có quyền xem chi tiết thu nhập ca làm việc của chính bạn.
                </p>
              </div>
            ) : (
              <div className="space-y-2 text-xs bg-stone-50/80 p-3.5 rounded-xl border border-stone-200/60">
                <div className="flex justify-between items-center">
                  <span className="text-stone-600">Lương TB/người (N = D / M):</span>
                  <span className="font-mono font-bold text-stone-900">
                    {formatVND(calculationPreview.luongTrungBinhMoiNguoi)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-stone-600">Tỷ lệ Lương Phụ / Chính:</span>
                  <span className="font-mono font-bold text-stone-900">
                    {(effectiveConfig.tyLePhuChinh * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="flex justify-between items-center text-amber-900 pt-1 border-t border-stone-200/60">
                  <span className="font-semibold">Mỗi suất Lương Phụ (O):</span>
                  <span className="font-mono font-extrabold text-amber-700">
                    {formatVND(calculationPreview.luong1Phu)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-orange-900">
                  <span className="font-semibold">Mỗi suất Lương Chính (P):</span>
                  <span className="font-mono font-extrabold text-orange-700">
                    {formatVND(calculationPreview.luong1Chinh)}
                  </span>
                </div>

                {calculationPreview.phanDuLamTron > 0 && (
                  <div className="text-[11px] text-stone-500 pt-1 border-t border-stone-200/60 flex items-center justify-between">
                    <span>Bù dư làm tròn (người Chính đầu tiên):</span>
                    <span className="font-mono font-bold text-emerald-600">
                      +{calculationPreview.phanDuLamTron} đ
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* List of payouts for each employee */}
            <div>
              <span className="text-xs font-bold text-stone-700 uppercase tracking-wider block mb-2">
                {isEmployee ? 'Tiền công ngày của bạn:' : 'Chi tiết lương thực nhận hôm nay:'}
              </span>
              <div className="space-y-2">
                {calculationPreview.chiTietLuong
                  .filter(c => c.coMat)
                  .filter(item => (!isEmployee ? true : item.nhanVienId === loggedInEmployee?.id))
                  .map(item => (
                    <div
                      key={item.nhanVienId}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900">{item.hoTen}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            item.vaiTro === 'CHINH'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.vaiTro === 'CHINH' ? 'Chính' : 'Phụ'}
                        </span>
                        {item.duocCongPhanDu && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded font-medium">
                            +1đ dư
                          </span>
                        )}
                      </div>
                      <span className="font-mono font-extrabold text-stone-900 text-sm">
                        {formatVND(item.luongNhanDuoc)}
                      </span>
                    </div>
                  ))}

                {isEmployee && !calculationPreview.chiTietLuong.some(c => c.nhanVienId === loggedInEmployee?.id && c.coMat) && (
                  <div className="p-3 bg-stone-50 rounded-xl text-stone-500 text-xs italic text-center border border-stone-200">
                    Hôm nay bạn không có mặt trong danh sách chấm công ca này.
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Balance Check (Excel Column V) */}
            <div className="p-3 bg-stone-900 text-white rounded-xl flex items-center justify-between">
              <span className="text-xs font-bold">
                {isEmployee ? 'Tiền công ngày của bạn:' : 'Tổng chi lương:'}
              </span>
              <span className="text-base font-black text-orange-400 font-mono">
                {formatVND(
                  isEmployee
                    ? calculationPreview.chiTietLuong.find(c => c.nhanVienId === loggedInEmployee?.id && c.coMat)?.luongNhanDuoc || 0
                    : calculationPreview.tongLuongThucChia
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Floating Save Bar for Field Captain & Admin (Mobile Only) */}
      {isMobileView && canEdit && (
        <div className="fixed bottom-14 left-0 right-0 z-30 px-4 py-2.5 bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-xl flex items-center justify-between gap-3 no-print">
          <div>
            <span className="text-[10px] text-stone-500 block uppercase font-bold">
              {selectedEmpIds.length} người đi làm:
            </span>
            <span className="text-sm font-black text-orange-600 font-mono">
              {formatVND(calculationPreview.tongLuongNgay)}
            </span>
          </div>

          <button
            type="button"
            id="btn-mobile-save-attendance"
            onClick={handleSave}
            className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{existingRecord ? 'Cập nhật' : 'Lưu chấm công'}</span>
          </button>
        </div>
      )}
      {/* Confirmation Modal for Deleting Attendance Record */}
      <ConfirmModal
        isOpen={isDeletingModalOpen}
        title="Xác nhận xóa Bảng chấm công ngày"
        message="Bạn có chắc chắn muốn xóa dữ liệu chấm công của ngày này? Thao tác này sẽ giải phóng dữ liệu và đặt ngày này về trạng thái chưa chấm công."
        itemName={`Ngày ${formatDateVN(selectedDate)} (${getDayOfWeekVN(selectedDate)}) - ${currentTeam?.tenDoi || 'Đội bắt gà'}`}
        itemDetail={`Sản lượng: ${formatNumber(existingRecord?.soGaBatDuoc || 0)} con gà | Tổng quỹ lương: ${formatVND(existingRecord?.tongLuongNgay || 0)}`}
        confirmText="Xác nhận xóa bản ghi"
        cancelText="Hủy bỏ"
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeletingModalOpen(false)}
      />
    </div>
  );
};
