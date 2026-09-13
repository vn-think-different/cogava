import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header, NavTab } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { DailyAttendanceView } from './components/DailyAttendanceView';
import { MonthlyPayrollView } from './components/MonthlyPayrollView';
import { EmployeeManagementView } from './components/EmployeeManagementView';
import { ConfigView } from './components/ConfigView';
import { AuditLogView } from './components/AuditLogView';
import { EmployeePortalView } from './components/EmployeePortalView';
import { LoginView } from './components/LoginView';
import { Logo } from './components/Logo';
import { Phone, Mail, MapPin } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { companyInfo, isAuthenticated, login, currentUser, isMobileView } = useApp();
  const [activeTab, setActiveTab] = useState<NavTab>(() =>
    currentUser.vaiTro === 'NHAN_VIEN' ? 'portal' : 'dashboard'
  );

  // Sync activeTab if role changes
  useEffect(() => {
    if (currentUser.vaiTro === 'NHAN_VIEN') {
      if (activeTab === 'config' || activeTab === 'audit' || activeTab === 'employees' || activeTab === 'dashboard') {
        setActiveTab('portal');
      }
    } else if (currentUser.vaiTro === 'DOI_TRUONG') {
      if (activeTab === 'config' || activeTab === 'audit' || activeTab === 'portal') {
        setActiveTab('dashboard');
      }
    } else if (currentUser.vaiTro === 'ADMIN') {
      if (activeTab === 'portal') {
        setActiveTab('dashboard');
      }
    }
  }, [currentUser.vaiTro, activeTab]);

  // If not authenticated, show login view first
  if (!isAuthenticated) {
    return (
      <LoginView
        onLoginSuccess={user => {
          login(user);
          setActiveTab(user.vaiTro === 'NHAN_VIEN' ? 'portal' : 'dashboard');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans text-stone-900 selection:bg-orange-500 selection:text-white">
      {/* App Header & Navigation */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} onSelectTab={setActiveTab} />

      {/* Main Content Area (extra pb on mobile to clear bottom nav) */}
      <main className={`flex-1 ${isMobileView ? 'pb-24' : 'pb-8'}`}>
        {activeTab === 'portal' && <EmployeePortalView />}
        {activeTab === 'dashboard' && <DashboardView onNavigate={setActiveTab} />}
        {activeTab === 'daily' && <DailyAttendanceView />}
        {activeTab === 'monthly' && <MonthlyPayrollView />}
        {activeTab === 'employees' && <EmployeeManagementView />}
        {activeTab === 'config' && <ConfigView />}
        {activeTab === 'audit' && <AuditLogView />}
      </main>

      {/* Footer - Formal Company Legal Details from Specs (Section 0) */}
      <footer className={`bg-stone-900 text-stone-400 text-xs border-t border-stone-800 py-8 no-print ${isMobileView ? 'pb-24' : 'pb-8'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1: Company Profile */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Logo size={28} showText={false} />
                <span className="text-white font-extrabold text-sm tracking-wide">
                  {companyInfo.tenCongTy}
                </span>
              </div>
              <p className="text-stone-400 text-[11px] leading-relaxed">
                Hệ thống Quản lý Chấm công & Tự động Phân bổ Lương Đội Bắt Gà COGAVA.
                Đảm bảo tính chính xác 100%, bảo vệ lịch sử lương và khoá sổ an toàn.
              </p>
              <div className="text-[11px] font-mono text-stone-400">
                <span>Mã số thuế: </span>
                <span className="text-white font-bold">{companyInfo.mst}</span>
              </div>
            </div>

            {/* Column 2: Offices & Warehouses */}
            <div className="space-y-2">
              <span className="text-white font-bold text-xs uppercase tracking-wider block">
                Địa chỉ & Cơ sở
              </span>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-stone-300">Văn phòng:</strong> {companyInfo.vanPhong}
                  </span>
                </div>
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-stone-300">Tổng kho:</strong> {companyInfo.tongKho}
                  </span>
                </div>
              </div>
            </div>

            {/* Column 3: Contacts */}
            <div className="space-y-2">
              <span className="text-white font-bold text-xs uppercase tracking-wider block">
                Liên hệ hỗ trợ
              </span>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                  <span className="font-mono text-stone-300">
                    Hotline: {companyInfo.hotline.join(' – ')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                  <span className="text-stone-300">{companyInfo.email}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-stone-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-stone-400">
            <span>
              © 2026 CÔNG TY TNHH COGAVA. Bản quyền hệ thống phần mềm nội bộ.
            </span>
            <div className="flex items-center gap-1">
              <span>Được tối ưu hoá trải nghiệm di động & máy tính</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
