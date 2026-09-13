import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserSession, VaiTroNguoiDung } from '../types';
import { Logo } from './Logo';
import {
  ShieldCheck,
  UserCheck,
  Users,
  ArrowRight,
  Phone,
  Building2,
  KeyRound,
  Info,
  CheckCircle2,
  Lock,
  FileSpreadsheet,
  CalendarCheck2,
  Monitor,
  Smartphone,
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: UserSession) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const { employees, companyInfo } = useApp();

  const [selectedRole, setSelectedRole] = useState<VaiTroNguoiDung>('ADMIN');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    employees[0]?.id || 'emp-kien'
  );
  const [password, setPassword] = useState<string>('123456');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoggingIn(true);
    setErrorMsg('');

    setTimeout(() => {
      let session: UserSession;

      if (selectedRole === 'ADMIN') {
        session = {
          id: 'usr-admin',
          tenHienThi: 'Thạch',
          vaiTro: 'ADMIN',
        };
      } else if (selectedRole === 'DOI_TRUONG') {
        session = {
          id: 'usr-captain',
          tenHienThi: 'Lê Đội Trưởng',
          vaiTro: 'DOI_TRUONG',
        };
      } else {
        const emp = employees.find(e => e.id === selectedEmployeeId) || employees[0];
        session = {
          id: `usr-${emp.id}`,
          tenHienThi: emp.hoTen,
          vaiTro: 'NHAN_VIEN',
          nhanVienId: emp.id,
        };
      }

      onLoginSuccess(session);
      setIsLoggingIn(false);
    }, 200);
  };

  const handleQuickRoleSelect = (role: VaiTroNguoiDung, empId?: string) => {
    setSelectedRole(role);
    if (empId) setSelectedEmployeeId(empId);
  };

  return (
    <div className="min-h-screen bg-stone-100 bg-radial-[at_top_center] from-orange-100/40 via-stone-100 to-stone-200 flex flex-col justify-center items-center p-3 sm:p-6 select-none font-sans">
      {/* Main Login Card - Desktop Wide Split (md:max-w-4xl) vs Mobile Compact (w-full) */}
      <div className="w-full max-w-md md:max-w-4xl bg-white rounded-3xl shadow-2xl shadow-stone-300/60 border border-stone-200 overflow-hidden grid grid-cols-1 md:grid-cols-12 transition-all">
        {/* Left Column: Brand Showcase (Desktop Prominent / Mobile Header) */}
        <div className="md:col-span-5 bg-gradient-to-br from-orange-600 via-orange-500 to-amber-600 p-6 sm:p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -left-12 -top-12 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />

          {/* Top Brand */}
          <div className="relative z-10 space-y-4 text-center md:text-left">
            <div className="inline-block p-3 bg-white rounded-2xl shadow-lg shadow-orange-950/20">
              <Logo size={54} showText={false} />
            </div>

            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-orange-200 px-2 py-0.5 rounded-full bg-orange-700/40 border border-orange-400/30 inline-block mb-1.5">
                Phần mềm Quản lý Nội bộ
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
                {companyInfo.tenCongTy}
              </h1>
              <p className="text-xs text-orange-100 mt-1 font-medium leading-relaxed">
                Hệ thống Chấm công & Tự động Phân bổ Lương Đội Bắt Gà Chuyên Nghiệp
              </p>
            </div>
          </div>

          {/* Desktop Feature Highlights (Hidden on small mobile to save vertical space) */}
          <div className="hidden md:block relative z-10 my-6 space-y-3 border-y border-white/15 py-5 text-xs text-orange-50">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-orange-200 flex-shrink-0" />
              <span>Chấm công theo ngày & chia lương theo sản lượng bắt gà</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-orange-200 flex-shrink-0" />
              <span>Tỷ lệ phân bổ lương chính / lương phụ chuẩn xác 100%</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-orange-200 flex-shrink-0" />
              <span>Khoá sổ lương an toàn & xuất phiếu lương PDF cá nhân</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-orange-200 flex-shrink-0" />
              <span>Tương thích tối ưu cho cả Máy tính (PC/Laptop) & Điện thoại</span>
            </div>
          </div>

          {/* Bottom Legal & Contacts */}
          <div className="relative z-10 text-[11px] text-orange-100/90 pt-3 md:pt-0 space-y-1 text-center md:text-left border-t border-white/15 md:border-t-0">
            <div className="flex items-center justify-center md:justify-start gap-1.5 font-mono">
              <Building2 className="w-3.5 h-3.5 text-orange-300 flex-shrink-0" />
              <span>MST: {companyInfo.mst}</span>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-1.5">
              <Phone className="w-3.5 h-3.5 text-orange-300 flex-shrink-0" />
              <span>Hotline: {companyInfo.hotline[0]}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Authentication Form (md:col-span-7) */}
        <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6 bg-white">
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h2 className="text-lg font-black text-stone-900">
                  Đăng nhập hệ thống
                </h2>
                <p className="text-xs text-stone-500">
                  Chọn phân quyền vai trò để bắt đầu phiên làm việc
                </p>
              </div>

              <div className="hidden sm:flex items-center gap-1 text-[11px] text-stone-400 font-medium">
                <Monitor className="w-3.5 h-3.5 text-stone-500" />
                <span>Giao diện Máy tính & Điện thoại</span>
              </div>
            </div>

            {/* Step 1: Role Selection Cards */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                1. Chọn vai trò công việc:
              </label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {/* Admin */}
                <button
                  type="button"
                  id="btn-login-role-admin"
                  onClick={() => handleQuickRoleSelect('ADMIN')}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer min-h-[82px] justify-center ${
                    selectedRole === 'ADMIN'
                      ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20 ring-2 ring-orange-400/30'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span className="text-xs font-black block leading-tight">Quản trị</span>
                  <span
                    className={`text-[10px] font-semibold ${
                      selectedRole === 'ADMIN' ? 'text-orange-100' : 'text-stone-400'
                    }`}
                  >
                    Toàn quyền
                  </span>
                </button>

                {/* Field Captain */}
                <button
                  type="button"
                  id="btn-login-role-captain"
                  onClick={() => handleQuickRoleSelect('DOI_TRUONG')}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer min-h-[82px] justify-center ${
                    selectedRole === 'DOI_TRUONG'
                      ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20 ring-2 ring-orange-400/30'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                >
                  <UserCheck className="w-5 h-5" />
                  <span className="text-xs font-black block leading-tight">Đội trưởng</span>
                  <span
                    className={`text-[10px] font-semibold ${
                      selectedRole === 'DOI_TRUONG' ? 'text-orange-100' : 'text-stone-400'
                    }`}
                  >
                    Chấm công
                  </span>
                </button>

                {/* Worker / Employee */}
                <button
                  type="button"
                  id="btn-login-role-employee"
                  onClick={() => handleQuickRoleSelect('NHAN_VIEN')}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer min-h-[82px] justify-center ${
                    selectedRole === 'NHAN_VIEN'
                      ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20 ring-2 ring-orange-400/30'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                >
                  <Users className="w-5 h-5" />
                  <span className="text-xs font-black block leading-tight">Nhân viên</span>
                  <span
                    className={`text-[10px] font-semibold ${
                      selectedRole === 'NHAN_VIEN' ? 'text-orange-100' : 'text-stone-400'
                    }`}
                  >
                    Tra cứu lương
                  </span>
                </button>
              </div>
            </div>

            {/* If Employee is chosen, allow picking which staff member */}
            {selectedRole === 'NHAN_VIEN' && (
              <div className="space-y-1.5 p-3.5 bg-orange-50/60 border border-orange-200 rounded-2xl">
                <label className="block text-[11px] font-bold text-orange-900 uppercase tracking-wider">
                  Chọn tên nhân viên trong đội:
                </label>
                <select
                  id="select-employee-user"
                  aria-label="Chọn tên nhân viên"
                  value={selectedEmployeeId}
                  onChange={e => setSelectedEmployeeId(e.target.value)}
                  className="w-full text-sm font-bold text-stone-900 bg-white border border-orange-300 rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-orange-500 cursor-pointer shadow-2xs"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.hoTen} ({emp.vaiTro === 'CHINH' ? 'Lương chính' : 'Lương phụ'})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-orange-800 italic">
                  * Nhân viên có cổng xem riêng: Xem ngày công đi làm, tổng lương và in phiếu lương cá nhân.
                </p>
              </div>
            )}

            {/* Role Capabilities Explanations */}
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-600 space-y-1">
              <div className="flex items-center gap-1.5 text-stone-900 font-bold">
                <Info className="w-3.5 h-3.5 text-orange-600" />
                <span>Quyền hạn theo vai trò:</span>
              </div>
              {selectedRole === 'ADMIN' && (
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  <strong>Quản trị viên:</strong> Toàn quyền xem & sửa dữ liệu, chốt sổ/mở sổ tháng, đổi đơn giá cấu hình, quản lý nhân sự và xem nhật ký audit log.
                </p>
              )}
              {selectedRole === 'DOI_TRUONG' && (
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  <strong>Đội trưởng:</strong> Nhập số lượng gà và chấm công hàng ngày tại hiện trường chuồng trại, xem bảng tổng hợp tháng. Không thể chốt sổ hay sửa cấu hình.
                </p>
              )}
              {selectedRole === 'NHAN_VIEN' && (
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  <strong>Nhân viên:</strong> Cổng thông tin cá nhân. Xem tổng ngày công, ước tính thu nhập, chi tiết các ca đi làm và tự xuất/in phiếu lương của mình.
                </p>
              )}
            </div>

            {/* Password / PIN Input */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                  Mật khẩu / Mã PIN
                </label>
                <span className="text-[10px] text-orange-600 font-medium">Mặc định: 123456</span>
              </div>
              <div className="relative">
                <input
                  id="input-login-password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Nhập mã PIN hoặc mật khẩu..."
                  className="w-full pl-10 pr-3 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-mono"
                />
                <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl font-semibold border border-rose-200">
                {errorMsg}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="button"
              id="btn-submit-login"
              disabled={isLoggingIn}
              onClick={() => handleLogin()}
              className="w-full py-3.5 px-4 bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white font-black text-sm rounded-xl shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoggingIn ? (
                <span className="inline-block animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <span>Truy cập hệ thống</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            <p className="text-[11px] text-center text-stone-400 mt-2">
              Bảo mật dữ liệu nội bộ • Tối ưu hoá hiển thị cho cả PC & Thiết bị di động
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
