import React, { useState, useRef, useEffect } from 'react';
import { Logo } from './Logo';
import { useApp } from '../context/AppContext';
import { UserAvatar } from './UserAvatar';
import { AccountSettingsModal } from './AccountSettingsModal';
import { ConfirmModal } from './ConfirmModal';
import {
  BarChart3,
  CalendarCheck2,
  FileSpreadsheet,
  Users,
  Sliders,
  History,
  ShieldCheck,
  UserCheck,
  RotateCcw,
  Menu,
  X,
  Building2,
  Phone,
  LogOut,
  User,
  Sparkles,
  Monitor,
  Smartphone,
  Laptop,
  ChevronDown,
  Check,
  Settings,
  KeyRound,
  Database,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'daily'
  | 'monthly'
  | 'employees'
  | 'config'
  | 'audit'
  | 'portal';

interface HeaderProps {
  activeTab: NavTab;
  onSelectTab?: (tab: NavTab) => void;
  setActiveTab?: (tab: NavTab) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  setActiveTab: setActiveTabProp,
}) => {
  const changeTab = onSelectTab || setActiveTabProp || (() => {});
  const {
    currentUser,
    teams,
    resetToSampleData,
    companyInfo,
    logout,
    deviceMode,
    setDeviceMode,
    isMobileView,
    isSyncingCloud,
    isCloudSynced,
    syncFromCloud,
  } = useApp();

  const userTeam = teams.find(t => t.id === currentUser.doiId);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showCompanyInfo, setShowCompanyInfo] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [accountModalTab, setAccountModalTab] = useState<'profile' | 'password' | 'accounts' | 'database'>('profile');
  const userDropdownRef = useRef<HTMLDivElement>(null);

  const openAccountModal = (tab: 'profile' | 'password' | 'accounts' | 'database') => {
    setAccountModalTab(tab);
    setAccountModalOpen(true);
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  // Close dropdown on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setUserDropdownOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setUserDropdownOpen(false);
      }
    };

    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [userDropdownOpen]);

  // Primary Operational Navigation Items (Clean & spacious on top bar)
  const navItems: {
    id: NavTab;
    label: string;
    icon: React.ReactNode;
    visibleRoles: string[];
  }[] = [
    {
      id: 'portal',
      label: 'Lương cá nhân',
      icon: <User className="w-4 h-4" />,
      visibleRoles: ['NHAN_VIEN'],
    },
    {
      id: 'dashboard',
      label: 'Tổng quan',
      icon: <BarChart3 className="w-4 h-4" />,
      visibleRoles: ['ADMIN', 'DOI_TRUONG'],
    },
    {
      id: 'daily',
      label: 'Chấm công ngày',
      icon: <CalendarCheck2 className="w-4 h-4" />,
      visibleRoles: ['ADMIN', 'DOI_TRUONG', 'NHAN_VIEN'],
    },
    {
      id: 'monthly',
      label: 'Bảng lương tháng',
      icon: <FileSpreadsheet className="w-4 h-4" />,
      visibleRoles: ['ADMIN', 'DOI_TRUONG', 'NHAN_VIEN'],
    },
    {
      id: 'employees',
      label: 'Nhân viên',
      icon: <Users className="w-4 h-4" />,
      visibleRoles: ['ADMIN', 'DOI_TRUONG'],
    },
  ];

  const visibleNavItems = navItems.filter(item =>
    item.visibleRoles.includes(currentUser.vaiTro)
  );

  const getRoleBadge = () => {
    switch (currentUser.vaiTro) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded border border-orange-200 whitespace-nowrap">
            <ShieldCheck className="w-3 h-3 text-orange-600" />
            Quản trị
          </span>
        );
      case 'DOI_TRUONG':
        return (
          <div className="inline-flex items-center gap-1 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-800 bg-sky-100 px-1.5 py-0.5 rounded border border-sky-200 whitespace-nowrap">
              <UserCheck className="w-3 h-3 text-sky-600" />
              Đội trưởng
            </span>
            {userTeam && (
              <span className="inline-flex items-center text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200 whitespace-nowrap">
                {userTeam.tenDoi}
              </span>
            )}
          </div>
        );
      case 'NHAN_VIEN':
        return (
          <div className="inline-flex items-center gap-1 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200 whitespace-nowrap">
              <User className="w-3 h-3 text-emerald-600" />
              Nhân viên
            </span>
            {userTeam && (
              <span className="inline-flex items-center text-[10px] font-bold text-stone-700 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200 whitespace-nowrap">
                {userTeam.tenDoi}
              </span>
            )}
          </div>
        );
    }
  };

  const handleResetData = () => {
    setUserDropdownOpen(false);
    setShowResetConfirm(true);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs no-print">
        {/* Top micro bar: Company info & Device view mode selector */}
        <div className="bg-stone-900 text-stone-300 text-xs px-3 sm:px-6 py-1 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="flex items-center gap-1 font-medium text-stone-200 truncate">
              <Building2 className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
              <span className="truncate">{companyInfo.tenCongTy} (MST: {companyInfo.mst})</span>
            </span>
            <span className="text-stone-600 hidden md:inline">|</span>
            <span className="text-stone-400 hidden md:inline truncate">{companyInfo.linhVuc}</span>
            <span className="text-stone-600 hidden lg:inline">|</span>
            
            {/* Clickable Cloud Firestore sync button */}
            <button
              type="button"
              onClick={() => syncFromCloud()}
              disabled={isSyncingCloud}
              title="Nhấn để đồng bộ dữ liệu ngay lập tức với Cloud Firestore"
              className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 text-[11px] font-medium bg-emerald-950/60 hover:bg-emerald-900/60 px-2 py-0.5 rounded-md border border-emerald-800/60 transition-colors cursor-pointer"
            >
              {isSyncingCloud ? (
                <RotateCcw className="w-3 h-3 text-emerald-400 animate-spin" />
              ) : (
                <span className={`w-1.5 h-1.5 rounded-full ${isCloudSynced ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              )}
              <span className="hidden sm:inline">{isSyncingCloud ? 'Đang đồng bộ Cloud...' : isCloudSynced ? 'Đã tải dữ liệu Cloud' : 'Chưa xác nhận đồng bộ'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Device Display Mode Switcher */}
            <div className="flex items-center bg-stone-800 p-0.5 rounded-lg border border-stone-700 text-[11px]">
              <button
                type="button"
                id="btn-mode-auto"
                onClick={() => setDeviceMode('auto')}
                className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                  deviceMode === 'auto'
                    ? 'bg-orange-500 text-white font-bold shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="Tự động nhận diện thiết bị"
              >
                <span>⚡ Tự động</span>
              </button>
              <button
                type="button"
                id="btn-mode-desktop"
                onClick={() => setDeviceMode('desktop')}
                className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all cursor-pointer ${
                  deviceMode === 'desktop'
                    ? 'bg-orange-500 text-white font-bold shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="Chế độ Máy tính / Laptop (Desktop ERP)"
              >
                <Monitor className="w-3 h-3" />
                <span className="hidden sm:inline">Máy tính</span>
              </button>
              <button
                type="button"
                id="btn-mode-mobile"
                onClick={() => setDeviceMode('mobile')}
                className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all cursor-pointer ${
                  deviceMode === 'mobile'
                    ? 'bg-orange-500 text-white font-bold shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="Chế độ Điện thoại di động (Mobile App)"
              >
                <Smartphone className="w-3 h-3" />
                <span className="hidden sm:inline">Điện thoại</span>
              </button>
            </div>

            <button
              onClick={() => setShowCompanyInfo(!showCompanyInfo)}
              className="text-stone-400 hover:text-white underline text-[11px] cursor-pointer hidden sm:inline"
            >
              Liên hệ
            </button>
          </div>
        </div>

        {/* Main Header Container */}
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-5 lg:px-6">
          <div className="flex items-center justify-between h-15 gap-2 lg:gap-3">
            {/* Brand Logo */}
            <div className="flex items-center flex-shrink-0">
              <button
                onClick={() =>
                  changeTab(currentUser.vaiTro === 'NHAN_VIEN' ? 'portal' : 'dashboard')
                }
                className="text-left focus:outline-hidden cursor-pointer"
              >
                <Logo size={34} />
              </button>
            </div>

            {/* Desktop Navigation Links (Clean, Single Horizontal Row, Never Wraps) */}
            {!isMobileView && (
              <nav className="flex items-center gap-1 lg:gap-1.5 flex-nowrap overflow-x-auto no-scrollbar py-1">
                {visibleNavItems.map(item => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`nav-tab-${item.id}`}
                      onClick={() => changeTab(item.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs xl:text-sm font-bold whitespace-nowrap transition-all cursor-pointer flex-shrink-0 ${
                        isActive
                          ? 'bg-orange-500 text-white shadow-xs shadow-orange-500/25'
                          : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                      }`}
                    >
                      {item.icon}
                      <span className="whitespace-nowrap">{item.label}</span>
                    </button>
                  );
                })}

                {/* When an Admin configuration tab is active, show contextual tab badge */}
                {activeTab === 'config' && (
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs xl:text-sm font-bold bg-amber-500 text-white shadow-xs flex-shrink-0">
                    <Sliders className="w-4 h-4" />
                    <span>Cấu hình đơn giá</span>
                    <button
                      onClick={() => changeTab('dashboard')}
                      title="Đóng cấu hình về Tổng quan"
                      className="ml-1 hover:bg-amber-600 rounded p-0.5 cursor-pointer text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {activeTab === 'audit' && (
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs xl:text-sm font-bold bg-stone-800 text-white shadow-xs flex-shrink-0">
                    <History className="w-4 h-4" />
                    <span>Nhật ký audit</span>
                    <button
                      onClick={() => changeTab('dashboard')}
                      title="Đóng nhật ký về Tổng quan"
                      className="ml-1 hover:bg-stone-700 rounded p-0.5 cursor-pointer text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </nav>
            )}

            {/* Right Action: Admin Dropdown Menu & Quick Controls */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Consolidated Admin & User Dropdown */}
              <div className="relative" ref={userDropdownRef}>
                <button
                  type="button"
                  id="btn-user-admin-dropdown"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                    userDropdownOpen
                      ? 'bg-orange-50 border-orange-300 ring-2 ring-orange-500/20 shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-800'
                  }`}
                  title="Menu quản trị & tài khoản"
                  aria-expanded={userDropdownOpen}
                >
                  {/* Avatar */}
                  <UserAvatar
                    avatar={currentUser.avatar}
                    name={currentUser.tenHienThi}
                    role={currentUser.vaiTro}
                    size="sm"
                  />

                  {/* Name & Role */}
                  <div className="hidden sm:flex flex-col text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-stone-900 leading-none whitespace-nowrap">
                        {currentUser.tenHienThi}
                      </span>
                      {getRoleBadge()}
                    </div>
                    <span className="text-[10px] text-stone-500 font-medium leading-tight mt-0.5">
                      {currentUser.vaiTro === 'ADMIN'
                        ? 'Quản trị viên hệ thống'
                        : currentUser.vaiTro === 'DOI_TRUONG'
                        ? 'Đội trưởng hiện trường'
                        : 'Nhân viên bắt gà'}
                    </span>
                  </div>

                  {/* Arrow Indicator */}
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${
                      userDropdownOpen ? 'rotate-180 text-orange-600' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu Panel */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-76 sm:w-84 bg-white rounded-2xl shadow-2xl border border-stone-200 py-1.5 z-50 animate-fadeIn divide-y divide-stone-100 max-h-[85vh] overflow-y-auto">
                    {/* User Profile Header Card */}
                    <div className="p-3.5 bg-gradient-to-br from-stone-50 to-orange-50/40 rounded-t-2xl">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          avatar={currentUser.avatar}
                          name={currentUser.tenHienThi}
                          role={currentUser.vaiTro}
                          size="lg"
                        />
                        <div className="overflow-hidden flex-1">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-extrabold text-sm text-stone-900 truncate">
                              {currentUser.tenHienThi}
                            </h4>
                            {getRoleBadge()}
                          </div>
                          <p className="text-[11px] text-stone-500 truncate mt-0.5">
                            @{currentUser.username || 'admin'} • {currentUser.vaiTro === 'ADMIN' ? 'Toàn quyền CSDL' : currentUser.vaiTro === 'DOI_TRUONG' ? 'Chấm công' : 'Xem lương cá nhân'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Account Settings & Security Options */}
                    <div className="p-2 space-y-1">
                      <div className="px-2 py-1 flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider">
                          Tài khoản & Bảo mật
                        </span>
                        <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">
                          {currentUser.tenHienThi}
                        </span>
                      </div>

                      {/* Đổi Avatar & Hồ sơ */}
                      <button
                        type="button"
                        onClick={() => openAccountModal('profile')}
                        className="w-full text-left p-2.5 rounded-xl flex items-center gap-2.5 text-xs text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
                      >
                        <div className="p-2 rounded-lg bg-orange-100 text-orange-700">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold block text-stone-800">
                            Hồ sơ & Đổi Avatar
                          </span>
                          <span className="text-[10px] text-stone-500 font-normal">
                            Chọn avatar đẹp hoặc tải ảnh cá nhân
                          </span>
                        </div>
                      </button>

                      {/* Đổi mật khẩu */}
                      <button
                        type="button"
                        onClick={() => openAccountModal('password')}
                        className="w-full text-left p-2.5 rounded-xl flex items-center gap-2.5 text-xs text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
                      >
                        <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                          <KeyRound className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold block text-stone-800">
                            Đổi mật khẩu tài khoản
                          </span>
                          <span className="text-[10px] text-stone-500 font-normal">
                            Bảo mật tài khoản cá nhân
                          </span>
                        </div>
                      </button>

                      {/* Admin: Quản lý tài khoản & phân quyền */}
                      {currentUser.vaiTro === 'ADMIN' && (
                        <button
                          type="button"
                          onClick={() => openAccountModal('accounts')}
                          className="w-full text-left p-2.5 rounded-xl flex items-center gap-2.5 text-xs text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
                        >
                          <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold block text-stone-800">
                              Quản lý tài khoản & phân quyền
                            </span>
                            <span className="text-[10px] text-stone-500 font-normal">
                              Cấp tài khoản & đặt lại mật khẩu nhân viên
                            </span>
                          </div>
                        </button>
                      )}

                      {/* Quản trị CSDL Bảng lương & Kiểm thử (Chỉ dành cho Quản trị viên) */}
                      {currentUser.vaiTro === 'ADMIN' && (
                        <button
                          type="button"
                          onClick={() => openAccountModal('database')}
                          className="w-full text-left p-2.5 rounded-xl flex items-center gap-2.5 text-xs text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
                        >
                          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                            <Database className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold block text-stone-800">
                              CSDL Bảng lương & Kiểm thử
                            </span>
                            <span className="text-[10px] text-stone-500 font-normal">
                              Xóa trắng CSDL để test độ chính xác
                            </span>
                          </div>
                        </button>
                      )}
                    </div>

                    {/* Admin Configuration Shortcuts (Only for ADMIN role) */}
                    {currentUser.vaiTro === 'ADMIN' && (
                      <div className="p-2 space-y-1">
                        <div className="px-2 py-1 flex items-center justify-between">
                          <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider">
                            Quyền Quản trị viên
                          </span>
                        </div>

                        {/* Cấu hình đơn giá & công thức */}
                        <button
                          id="btn-admin-config"
                          onClick={() => {
                            changeTab('config');
                            setUserDropdownOpen(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between text-xs transition-colors cursor-pointer ${
                            activeTab === 'config'
                              ? 'bg-orange-50 text-orange-950 font-bold border border-orange-200'
                              : 'text-stone-700 hover:bg-stone-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`p-2 rounded-lg ${
                                activeTab === 'config'
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-orange-100 text-orange-700'
                              }`}
                            >
                              <Sliders className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-bold block">Cấu hình Đơn giá & Hệ thống</span>
                              <span className="text-[10px] text-stone-500 font-normal">
                                Thiết lập đơn giá đ/con, tỷ lệ Lương Phụ / Chính
                              </span>
                            </div>
                          </div>
                          {activeTab === 'config' && (
                            <span className="text-[10px] bg-orange-200 text-orange-800 font-bold px-1.5 py-0.5 rounded whitespace-nowrap">
                              Đang mở
                            </span>
                          )}
                        </button>

                        {/* Nhật ký audit log */}
                        <button
                          id="btn-admin-audit"
                          onClick={() => {
                            changeTab('audit');
                            setUserDropdownOpen(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between text-xs transition-colors cursor-pointer ${
                            activeTab === 'audit'
                              ? 'bg-stone-100 text-stone-900 font-bold border border-stone-300'
                              : 'text-stone-700 hover:bg-stone-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`p-2 rounded-lg ${
                                activeTab === 'audit'
                                  ? 'bg-stone-800 text-white'
                                  : 'bg-stone-100 text-stone-700'
                              }`}
                            >
                              <History className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-bold block">Nhật ký kiểm toán (Audit Log)</span>
                              <span className="text-[10px] text-stone-500 font-normal">
                                Lịch sử chốt sổ, chấm công & truy vết sửa đổi
                              </span>
                            </div>
                          </div>
                          {activeTab === 'audit' && (
                            <span className="text-[10px] bg-stone-300 text-stone-800 font-bold px-1.5 py-0.5 rounded whitespace-nowrap">
                              Đang mở
                            </span>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Logout Button */}
                    <div className="p-2">
                      <button
                        id="btn-dropdown-logout"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-rose-700 bg-rose-50/60 hover:bg-rose-100 hover:text-rose-800 rounded-xl transition-colors cursor-pointer border border-rose-200"
                      >
                        <LogOut className="w-4 h-4 text-rose-600" />
                        <span>Đăng xuất khỏi hệ thống</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Hamburger Menu Button (Only when in Mobile View) */}
              {isMobileView && (
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 rounded-xl text-stone-700 hover:bg-stone-100 focus:outline-hidden cursor-pointer"
                  aria-label="Toggle Navigation"
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Drawer Menu */}
        {isMobileView && mobileMenuOpen && (
          <div className="border-t border-stone-200 bg-white px-4 pt-3 pb-4 space-y-3 shadow-lg animate-fadeIn">
            {/* User Profile in Mobile Drawer */}
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <UserAvatar
                  avatar={currentUser.avatar}
                  name={currentUser.tenHienThi}
                  role={currentUser.vaiTro}
                  size="md"
                />
                <div>
                  <span className="text-xs text-stone-500 block leading-tight">Đang đăng nhập:</span>
                  <span className="text-sm font-extrabold text-stone-900 block leading-tight">
                    {currentUser.tenHienThi}
                  </span>
                  <div className="mt-1">{getRoleBadge()}</div>
                </div>
              </div>
              <div className="flex flex-col gap-1 items-end">
                <button
                  onClick={() => openAccountModal('profile')}
                  className="px-2 py-1 text-[11px] font-bold text-stone-700 bg-white border border-stone-200 rounded-lg hover:bg-stone-100"
                >
                  Hồ sơ
                </button>
                <button
                  onClick={() => openAccountModal('password')}
                  className="px-2 py-1 text-[11px] font-bold text-stone-700 bg-white border border-stone-200 rounded-lg hover:bg-stone-100"
                >
                  Đổi MK
                </button>
              </div>
            </div>

            {/* Menu items */}
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider block px-1">
                Chức năng chính
              </span>
              {visibleNavItems.map(item => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      changeTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-orange-500 text-white shadow-xs'
                        : 'text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Mobile Admin Section */}
            {currentUser.vaiTro === 'ADMIN' && (
              <div className="pt-2 border-t border-stone-100 space-y-1">
                <span className="text-[10px] font-extrabold text-orange-600 uppercase tracking-wider block px-1">
                  Quyền Quản trị viên (Thạch)
                </span>
                <button
                  onClick={() => {
                    changeTab('config');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                    activeTab === 'config'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                  <span>Cấu hình đơn giá & Hệ thống</span>
                </button>

                <button
                  onClick={() => {
                    changeTab('audit');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                    activeTab === 'audit'
                      ? 'bg-stone-800 text-white shadow-xs'
                      : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <History className="w-4 h-4" />
                  <span>Nhật ký audit log</span>
                </button>

                <button
                  onClick={() => {
                    handleResetData();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-stone-500" />
                  <span>Đặt lại dữ liệu gốc từ Excel</span>
                </button>
              </div>
            )}

            {/* Mobile Drawer Logout */}
            <div className="pt-2 border-t border-stone-100">
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl cursor-pointer border border-rose-200"
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất tài khoản
              </button>
            </div>
          </div>
        )}

        {/* Modal: Company Legal & Operational Details */}
        {showCompanyInfo && (
          <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-stone-200">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-3">
                  <Logo size={36} showText={false} />
                  <div>
                    <h3 className="text-base font-extrabold text-stone-900">
                      {companyInfo.tenCongTy}
                    </h3>
                    <p className="text-xs text-stone-500">Mã số thuế: {companyInfo.mst}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCompanyInfo(false)}
                  className="p-2 text-stone-400 hover:text-stone-700 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-stone-600">
                <div>
                  <strong className="text-stone-900 block font-bold">Lĩnh vực hoạt động:</strong>
                  <span>{companyInfo.linhVuc}</span>
                </div>
                <div>
                  <strong className="text-stone-900 block font-bold">Văn phòng chính:</strong>
                  <span>{companyInfo.vanPhong}</span>
                </div>
                <div>
                  <strong className="text-stone-900 block font-bold">Tổng kho tập kết:</strong>
                  <span>{companyInfo.tongKho}</span>
                </div>
                <div>
                  <strong className="text-stone-900 block font-bold">Email chính thức:</strong>
                  <span className="font-mono text-orange-600">{companyInfo.email}</span>
                </div>
                <div>
                  <strong className="text-stone-900 block font-bold">Hotlines hỗ trợ:</strong>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {companyInfo.hotline.map(phone => (
                      <span
                        key={phone}
                        className="bg-orange-50 text-orange-800 border border-orange-200 font-mono font-bold px-2 py-0.5 rounded"
                      >
                        {phone}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-end">
                <button
                  onClick={() => setShowCompanyInfo(false)}
                  className="px-5 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-800 cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* MOBILE BOTTOM NAVIGATION BAR (Sticky thumb-friendly app navigation - ONLY in Mobile View) */}
      {isMobileView && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-2 py-1 shadow-lg flex items-center justify-around no-print pb-safe">
          {visibleNavItems.slice(0, 5).map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => changeTab(item.id)}
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer min-w-[58px] ${
                  isActive
                    ? 'text-orange-600 font-bold'
                    : 'text-stone-500 hover:text-stone-900 font-medium'
                }`}
              >
                <div
                  className={`p-1 rounded-lg ${
                    isActive ? 'bg-orange-100 text-orange-600' : 'text-stone-500'
                  }`}
                >
                  {item.icon}
                </div>
                <span className="text-[10px] tracking-tight leading-none mt-1">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      )}

      {/* Account Settings & Database Management Modal */}
      <AccountSettingsModal
        isOpen={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
        initialTab={accountModalTab}
      />

      {/* Modal xác nhận Đặt lại Dữ liệu Mẫu gốc */}
      <ConfirmModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={() => {
          setShowResetConfirm(false);
          resetToSampleData();
        }}
        title="Khôi phục dữ liệu mẫu gốc?"
        message="Thao tác này sẽ đặt lại dữ liệu nhân sự, bảng lương và cấu hình về trạng thái mẫu chuẩn từ file Excel COGAVA. Bạn có chắc chắn muốn tiếp tục?"
        confirmText="Đồng ý khôi phục"
        cancelText="Hủy bỏ"
        type="danger"
      />
    </>
  );
};
