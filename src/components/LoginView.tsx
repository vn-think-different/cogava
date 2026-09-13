import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserSession, VaiTroNguoiDung } from '../types';
import { Logo } from './Logo';
import { UserAvatar } from './UserAvatar';
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
  Eye,
  EyeOff,
  Sparkles,
  User,
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: UserSession) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const { employees, companyInfo, userAccounts, loginWithCredentials } = useApp();

  const [selectedRole, setSelectedRole] = useState<VaiTroNguoiDung>('ADMIN');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    employees[0]?.id || 'emp-kien'
  );
  const [password, setPassword] = useState<string>('123456');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Find corresponding user account from CSDL based on selection
  let targetAccount = userAccounts.find(u => u.vaiTro === 'ADMIN');
  if (selectedRole === 'DOI_TRUONG') {
    targetAccount = userAccounts.find(u => u.vaiTro === 'DOI_TRUONG') || userAccounts[1];
  } else if (selectedRole === 'NHAN_VIEN') {
    targetAccount =
      userAccounts.find(u => u.nhanVienId === selectedEmployeeId) ||
      userAccounts.find(u => u.vaiTro === 'NHAN_VIEN') ||
      userAccounts[2];
  }

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoggingIn(true);
    setErrorMsg('');

    setTimeout(() => {
      if (!targetAccount) {
        setErrorMsg('Không tìm thấy thông tin tài khoản!');
        setIsLoggingIn(false);
        return;
      }

      // Check password using credential engine
      const res = loginWithCredentials(targetAccount.username, password);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMsg(res.message || 'Mật khẩu không chính xác! Vui lòng thử lại.');
      }
      setIsLoggingIn(false);
    }, 200);
  };

  const handleQuickRoleSelect = (role: VaiTroNguoiDung, empId?: string) => {
    setSelectedRole(role);
    setErrorMsg('');
    if (empId) setSelectedEmployeeId(empId);
  };

  return (
    <div className="min-h-screen bg-stone-100 bg-radial-[at_top_center] from-orange-100/40 via-stone-100 to-stone-200 flex flex-col justify-center items-center p-3 sm:p-6 select-none font-sans">
      {/* Main Login Card */}
      <div className="w-full max-w-md md:max-w-4xl bg-white rounded-3xl shadow-2xl shadow-stone-300/60 border border-stone-200 overflow-hidden grid grid-cols-1 md:grid-cols-12 transition-all">
        {/* Left Column: Brand Showcase */}
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
                CƠ SỞ DỮ LIỆU & QUẢN TRỊ BẢNG LƯƠNG
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
                {companyInfo.tenCongTy}
              </h1>
              <p className="text-xs text-orange-100 mt-1 font-medium leading-relaxed">
                Hệ thống Chấm công & Tự động Phân bổ Lương Đội Bắt Gà Chuyên Nghiệp
              </p>
            </div>
          </div>

          {/* Desktop Feature Highlights */}
          <div className="hidden md:block relative z-10 my-6 space-y-3 border-y border-white/15 py-5 text-xs text-orange-50">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-orange-200 flex-shrink-0" />
              <span>Phân quyền rõ ràng: Quản trị (Thạch), Đội trưởng & Nhân viên</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-orange-200 flex-shrink-0" />
              <span>Bảo mật tuyệt đối: Nhân viên chỉ được xem bảng lương của chính mình</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-orange-200 flex-shrink-0" />
              <span>Hỗ trợ CSDL Trắng để kiểm thử độc lập độ chính xác</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-orange-200 flex-shrink-0" />
              <span>Hỗ trợ Avatar cá nhân, đổi mật khẩu và quản trị tài khoản</span>
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

        {/* Right Column: Authentication Form */}
        <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6 bg-white">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h2 className="text-lg font-black text-stone-900">
                  Đăng nhập hệ thống
                </h2>
                <p className="text-xs text-stone-500">
                  Xác thực phân quyền và bảo mật số liệu lương nội bộ
                </p>
              </div>

              {targetAccount && (
                <UserAvatar
                  avatar={targetAccount.avatar}
                  name={targetAccount.tenHienThi}
                  role={targetAccount.vaiTro}
                  size="md"
                />
              )}
            </div>

            {/* Step 1: Role Selection Cards */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                1. Chọn phân quyền vai trò:
              </label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {/* Admin */}
                <button
                  type="button"
                  id="btn-login-role-admin"
                  onClick={() => handleQuickRoleSelect('ADMIN')}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer min-h-[86px] justify-center ${
                    selectedRole === 'ADMIN'
                      ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20 ring-2 ring-orange-400/30'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span className="text-xs font-black block leading-tight">Quản trị (Thạch)</span>
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
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer min-h-[86px] justify-center ${
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
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer min-h-[86px] justify-center ${
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
                    Xem lương mình
                  </span>
                </button>
              </div>
            </div>

            {/* If Employee is chosen, allow picking which staff member */}
            {selectedRole === 'NHAN_VIEN' && (
              <div className="space-y-1.5 p-3.5 bg-orange-50/60 border border-orange-200 rounded-2xl">
                <label className="block text-[11px] font-bold text-orange-900 uppercase tracking-wider">
                  Chọn hồ sơ nhân viên tra cứu:
                </label>
                <select
                  id="select-employee-user"
                  aria-label="Chọn tên nhân viên"
                  value={selectedEmployeeId}
                  onChange={e => {
                    setSelectedEmployeeId(e.target.value);
                    setErrorMsg('');
                  }}
                  className="w-full text-sm font-bold text-stone-900 bg-white border border-orange-300 rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-orange-500 cursor-pointer shadow-2xs"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.hoTen} ({emp.vaiTro === 'CHINH' ? 'Lương chính' : 'Lương phụ'})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-orange-800 font-medium">
                  🔒 Nhân viên chỉ được xem bảng lương và phiếu lương của riêng mình; không được xem số liệu của người khác.
                </p>
              </div>
            )}

            {/* Target Account Summary Banner */}
            {targetAccount && (
              <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-2xl border border-stone-200">
                <UserAvatar
                  avatar={targetAccount.avatar}
                  name={targetAccount.tenHienThi}
                  role={targetAccount.vaiTro}
                  size="sm"
                />
                <div className="overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-stone-900">
                      {targetAccount.tenHienThi}
                    </span>
                    <span className="text-[10px] font-mono text-stone-500">
                      (@{targetAccount.username})
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-500 block">
                    {targetAccount.vaiTro === 'ADMIN'
                      ? 'Quản trị viên Thạch • Toàn quyền CSDL'
                      : targetAccount.vaiTro === 'DOI_TRUONG'
                      ? 'Đội trưởng • Nhập chấm công tại chuồng'
                      : 'Nhân viên • Tra cứu bảng lương cá nhân'}
                  </span>
                </div>
              </div>
            )}

            {/* Password Input */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                  Mật khẩu đăng nhập:
                </label>
                <span className="text-[10px] text-orange-600 font-medium">Mặc định: 123456</span>
              </div>
              <div className="relative">
                <input
                  id="input-login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="Nhập mật khẩu tài khoản..."
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-mono"
                />
                <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl font-semibold border border-rose-200">
                {errorMsg}
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                id="btn-submit-login"
                disabled={isLoggingIn}
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
          </form>
        </div>
      </div>
    </div>
  );
};
