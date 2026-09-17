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

  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoggingIn(true);
    setErrorMsg('');

    setTimeout(() => {
      // Check password using credential engine
      const res = loginWithCredentials(username, password);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMsg(res.message || 'Tài khoản hoặc mật khẩu không chính xác! Vui lòng thử lại.');
      }
      setIsLoggingIn(false);
    }, 200);
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col justify-center items-center p-3 sm:p-6 select-none font-sans">
      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-stone-300/60 border border-stone-200 overflow-hidden">
        {/* Right Column: Authentication Form */}
        <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6 bg-white">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="pb-3 border-b border-stone-100">
              <h2 className="text-lg font-black text-stone-900">
                Đăng nhập hệ thống
              </h2>
              <p className="text-xs text-stone-500">
                Nhập thông tin tài khoản để truy cập hệ thống
              </p>
            </div>

            {/* Username Input */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                Tên đăng nhập:
              </label>
              <input
                id="input-login-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={e => {
                  setUsername(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Nhập tên đăng nhập..."
                className="w-full pl-4 pr-4 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                Mật khẩu:
              </label>
              <div className="relative">
                <input
                  id="input-login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="Nhập mật khẩu..."
                  className="w-full pl-4 pr-10 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-mono"
                />
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
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
