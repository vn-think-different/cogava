import React, { useEffect } from 'react';
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
import { ErrorBoundary } from './components/ErrorBoundary';
import { Phone, Mail, MapPin, ShieldAlert, Cloud, RefreshCw } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const {
    companyInfo,
    isAuthenticated,
    login,
    currentUser,
    isMobileView,
    activeTab,
    setActiveTab,
    sessionConflictInfo,
    closeSessionConflictModal,
    isSyncingCloud,
  } = useApp();

  const currentTab = (activeTab as NavTab) || (currentUser.vaiTro === 'NHAN_VIEN' ? 'portal' : 'dashboard');

  // Sync activeTab if role changes
  useEffect(() => {
    if (currentUser.vaiTro === 'NHAN_VIEN') {
      if (currentTab === 'config' || currentTab === 'audit' || currentTab === 'employees' || currentTab === 'dashboard') {
        setActiveTab('portal');
      }
    } else if (currentUser.vaiTro === 'DOI_TRUONG') {
      if (currentTab === 'config' || currentTab === 'audit' || currentTab === 'portal') {
        setActiveTab('dashboard');
      }
    } else if (currentUser.vaiTro === 'ADMIN') {
      if (currentTab === 'portal') {
        setActiveTab('dashboard');
      }
    }
  }, [currentUser.vaiTro, currentTab, setActiveTab]);

  // If not authenticated, show login view first
  if (!isAuthenticated) {
    return (
      <>
        <LoginView
          onLoginSuccess={user => {
            login(user);
          }}
        />

        {/* Modal Cảnh báo Đăng nhập trên thiết bị khác */}
        {sessionConflictInfo.isOpen && (
          <div className="fixed inset-0 z-50 bg-stone-900/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-4 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-black text-stone-900">
                  Phát hiện đăng nhập trên thiết bị khác!
                </h2>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Tài khoản của bạn vừa được đăng nhập thành công từ một thiết bị hoặc trình duyệt khác (<strong>{sessionConflictInfo.deviceName}</strong> vào lúc {sessionConflictInfo.loginAt}).
                </p>
                <p className="text-[11px] text-stone-500 bg-stone-50 p-3 rounded-xl border border-stone-200">
                  Theo chính sách bảo mật của COGAVA, mỗi tài khoản chỉ được phép đăng nhập trên <strong>01 thiết bị duy nhất</strong> tại một thời điểm. Phiên làm việc trên thiết bị này đã được tự động kết thúc để bảo vệ số liệu chấm công & tiền lương.
                </p>
              </div>
              <button
                type="button"
                id="btn-confirm-session-conflict"
                onClick={closeSessionConflictModal}
                className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-orange-500/25 transition-colors cursor-pointer"
              >
                Đã hiểu, quay về màn hình đăng nhập
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans text-stone-900 selection:bg-orange-500 selection:text-white">
      {/* App Header & Navigation */}
      <Header
        activeTab={currentTab}
        setActiveTab={(tab: NavTab) => setActiveTab(tab)}
        onSelectTab={(tab: NavTab) => setActiveTab(tab)}
      />

      {/* Cloud Syncing Toast / Status Pill */}
      {isSyncingCloud && (
        <div className="fixed bottom-4 right-4 z-50 bg-stone-900/90 backdrop-blur-md text-white px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold border border-stone-700 pointer-events-none animate-pulse">
          <RefreshCw className="w-3.5 h-3.5 text-orange-400 animate-spin" />
          <span>Đang tự động đồng bộ dữ liệu với Cloud Firestore...</span>
        </div>
      )}

      {/* Main Content Area (extra pb on mobile to clear bottom nav) */}
      <main className={`flex-1 ${isMobileView ? 'pb-24' : 'pb-8'}`}>
        {currentTab === 'portal' && <EmployeePortalView />}
        {currentTab === 'dashboard' && <DashboardView onNavigate={(tab: string) => setActiveTab(tab)} />}
        {currentTab === 'daily' && <DailyAttendanceView />}
        {currentTab === 'monthly' && <MonthlyPayrollView />}
        {currentTab === 'employees' && <EmployeeManagementView />}
        {currentTab === 'config' && <ConfigView />}
        {currentTab === 'audit' && <AuditLogView />}
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
    <ErrorBoundary>
      <AppProvider>
        <MainAppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
