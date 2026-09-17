import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { UserSession } from '../types';
import { Logo } from './Logo';
import { ArrowRight, Eye, EyeOff, CalendarDays, Users, Wallet, ExternalLink } from 'lucide-react';

export const LoginView: React.FC<{ onLoginSuccess: (user: UserSession) => void }> = ({ onLoginSuccess }) => {
  const { loginWithCredentials } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setErrorMsg('');
    try {
      const result = loginWithCredentials(username, password);
      if (result.success && result.user) onLoginSuccess(result.user);
      else setErrorMsg('Tên đăng nhập hoặc mật khẩu chưa đúng. Vui lòng kiểm tra lại.');
    } catch {
      setErrorMsg('Chưa thể đăng nhập. Vui lòng thử lại.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f6f5f1] text-stone-900 font-sans">
      <div className="mx-auto max-w-7xl px-5 sm:px-10 lg:px-16 py-7 sm:py-10">
        <header className="flex items-center justify-between gap-4">
          <Logo size={44} />
          <a href="https://cogava.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-orange-700">
            <span className="hidden sm:inline">Về COGAVA</span><ExternalLink aria-hidden="true" size={16} /><span className="sr-only sm:hidden">Website COGAVA</span>
          </a>
        </header>
        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-20 items-center py-8 sm:py-20">
          <section className="max-w-xl">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-orange-700 mb-5">Không gian làm việc COGAVA</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.12]">Rõ từng ngày công.<br /><span className="text-orange-700">Trọn từng thành quả.</span></h1>
            <p className="hidden lg:block mt-6 text-base sm:text-lg leading-relaxed text-stone-600 max-w-md">Theo dõi đội ngũ, ghi nhận sản lượng và đối chiếu tiền lương trong một không gian làm việc thống nhất.</p>
            <div className="hidden lg:grid mt-9 grid-cols-3 gap-3 border-t border-stone-300/70 pt-7">
              {[{ icon: CalendarDays, title: 'Chấm công', text: 'Theo ngày & đội' }, { icon: Users, title: 'Nhân sự', text: 'Quản lý tập trung' }, { icon: Wallet, title: 'Tiền lương', text: 'Theo sản lượng' }].map(({icon: Icon, title, text}) => (
                <div key={title}><Icon aria-hidden="true" size={22} className="text-orange-700 mb-3" /><p className="text-sm font-bold">{title}</p><p className="mt-1 text-xs text-stone-500">{text}</p></div>
              ))}
            </div>
          </section>
          <section aria-labelledby="login-heading" className="bg-white rounded-3xl border border-stone-200 p-7 sm:p-10 shadow-[0_16px_60px_-30px_rgba(41,37,36,0.3)]">
            <span className="inline-flex rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-800 mb-6">Cổng nội bộ</span>
            <h2 id="login-heading" className="text-2xl font-bold tracking-tight">Chào mừng trở lại</h2>
            <p className="text-sm text-stone-500 mt-2 mb-8">Đăng nhập để bắt đầu ngày làm việc của bạn.</p>
            <form onSubmit={handleLogin} className="space-y-5" aria-busy={isLoggingIn}>
              <div>
                <label htmlFor="input-login-username" className="block text-sm font-semibold mb-2">Tên đăng nhập</label>
                <input id="input-login-username" name="username" autoComplete="username" required autoCapitalize="none" spellCheck={false} value={username} onChange={event => { setUsername(event.target.value); setErrorMsg(''); }} placeholder="Nhập tên đăng nhập" className="w-full rounded-xl border border-stone-300 bg-stone-50 px-4 py-3 text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-600" />
              </div>
              <div>
                <label htmlFor="input-login-password" className="block text-sm font-semibold mb-2">Mật khẩu</label>
                <div className="relative">
                  <input id="input-login-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={event => { setPassword(event.target.value); setErrorMsg(''); }} placeholder="Nhập mật khẩu" className="w-full rounded-xl border border-stone-300 bg-stone-50 pl-4 pr-12 py-3 text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-600" />
                  <button type="button" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)} className="absolute right-1 top-1 p-3 text-stone-500 hover:text-stone-900">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                </div>
              </div>
              {errorMsg && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{errorMsg}</p>}
              <button id="btn-submit-login" type="submit" disabled={isLoggingIn || !username.trim() || !password} className="w-full rounded-xl bg-orange-700 py-3.5 px-4 font-bold text-white flex items-center justify-center gap-3 hover:bg-orange-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">{isLoggingIn ? 'Đang đăng nhập…' : 'Đăng nhập'}<ArrowRight aria-hidden="true" size={18} /></button>
            </form>
            <p className="mt-7 border-t border-stone-100 pt-5 text-sm leading-relaxed text-stone-500">Cần cấp tài khoản hoặc hỗ trợ truy cập? Liên hệ quản trị viên của công ty.</p>
          </section>
        </div>
        <footer className="border-t border-stone-200 pt-5 flex flex-wrap justify-between gap-2 text-xs text-stone-500"><span>COGAVA · Hệ thống chấm công & tiền lương</span><span>Dành cho nhân sự được cấp quyền truy cập</span></footer>
      </div>
    </main>
  );
};
