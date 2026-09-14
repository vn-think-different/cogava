import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserAvatar, AVATAR_PRESETS } from './UserAvatar';
import { VaiTroNguoiDung, UserAccount } from '../types';
import { ConfirmModal } from './ConfirmModal';
import {
  X,
  User,
  KeyRound,
  ShieldCheck,
  Database,
  CheckCircle2,
  AlertCircle,
  Upload,
  RefreshCw,
  Plus,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Info,
  Check,
  FileSpreadsheet,
} from 'lucide-react';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'profile' | 'password' | 'accounts' | 'database';
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'profile',
}) => {
  const {
    currentUser,
    userAccounts,
    employees,
    teams,
    attendanceRecords,
    updateCurrentUserAvatar,
    updateCurrentUserProfile,
    changeUserPassword,
    adminResetUserPassword,
    addUserAccount,
    updateUserRoleAndTeam,
    deleteUserAccount,
    clearAttendanceToBlank,
    loadSampleExcelAttendance,
  } = useApp();

  const effectiveInitialTab = 
    (initialTab === 'database' || initialTab === 'accounts') && currentUser.vaiTro !== 'ADMIN'
      ? 'profile'
      : initialTab;

  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'accounts' | 'database'>(effectiveInitialTab);

  // Profile Form State
  const [profileName, setProfileName] = useState<string>(currentUser.tenHienThi);
  const [selectedAvatarPreset, setSelectedAvatarPreset] = useState<string>(currentUser.avatar || 'preset-admin');
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showCurrentPass, setShowCurrentPass] = useState<boolean>(false);
  const [showNewPass, setShowNewPass] = useState<boolean>(false);

  // Modals for confirmation
  const [deletingAccount, setDeletingAccount] = useState<UserAccount | null>(null);
  const [resettingAccount, setResettingAccount] = useState<UserAccount | null>(null);
  const [showClearBlankConfirm, setShowClearBlankConfirm] = useState(false);
  const [showLoadSampleConfirm, setShowLoadSampleConfirm] = useState(false);

  // Add Account Modal (Admin)
  const [showAddAccountModal, setShowAddAccountModal] = useState<boolean>(false);
  const [newAccData, setNewAccData] = useState<{
    username: string;
    tenHienThi: string;
    password: string;
    vaiTro: VaiTroNguoiDung;
    nhanVienId: string;
    doiId: string;
  }>({
    username: '',
    tenHienThi: '',
    password: '123456',
    vaiTro: 'NHAN_VIEN',
    nhanVienId: '',
    doiId: 'doi-1',
  });

  if (!isOpen) return null;

  // Handle Save Profile & Avatar
  const handleSaveProfile = () => {
    let chosenAvatar = selectedAvatarPreset;
    if (customAvatarUrl.trim()) {
      chosenAvatar = customAvatarUrl.trim();
    }

    const resAvatar = updateCurrentUserAvatar(chosenAvatar);
    const resProfile = updateCurrentUserProfile({ tenHienThi: profileName.trim() });

    if (resAvatar.success || resProfile.success) {
      setStatusMsg({
        type: 'success',
        message: 'Đã lưu cài đặt hồ sơ & ảnh đại diện thành công!',
      });
      setTimeout(() => setStatusMsg({ type: null, message: '' }), 3000);
    }
  };

  // Handle Custom Image Upload via File Reader
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1.5 * 1024 * 1024) {
      setStatusMsg({
        type: 'error',
        message: 'Kích thước file ảnh không được vượt quá 1.5 MB!',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCustomAvatarUrl(reader.result);
        setSelectedAvatarPreset('');
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Change Password
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setStatusMsg({ type: 'error', message: 'Vui lòng nhập mật khẩu hiện tại!' });
      return;
    }
    if (newPassword.length < 4) {
      setStatusMsg({ type: 'error', message: 'Mật khẩu mới phải có tối thiểu 4 ký tự!' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatusMsg({ type: 'error', message: 'Mật khẩu mới và xác nhận mật khẩu không trùng khớp!' });
      return;
    }

    const res = changeUserPassword(currentPassword, newPassword);
    if (res.success) {
      setStatusMsg({ type: 'success', message: res.message });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setStatusMsg({ type: null, message: '' }), 4000);
    } else {
      setStatusMsg({ type: 'error', message: res.message });
    }
  };

  // Handle Admin Reset Password
  const handleAdminReset = (account: UserAccount) => {
    setResettingAccount(account);
  };

  const handleConfirmResetPassword = () => {
    if (!resettingAccount) return;
    const res = adminResetUserPassword(resettingAccount.id, '123456');
    setStatusMsg({
      type: res.success ? 'success' : 'error',
      message: res.message,
    });
    setResettingAccount(null);
    setTimeout(() => setStatusMsg({ type: null, message: '' }), 3500);
  };

  const handleConfirmDeleteAccount = () => {
    if (!deletingAccount) return;
    const res = deleteUserAccount(deletingAccount.id);
    setStatusMsg({
      type: res.success ? 'success' : 'error',
      message: res.message,
    });
    setDeletingAccount(null);
    setTimeout(() => setStatusMsg({ type: null, message: '' }), 3500);
  };

  // Handle Admin Create Account
  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccData.username.trim() || !newAccData.tenHienThi.trim()) {
      alert('Vui lòng nhập đầy đủ Tên đăng nhập và Họ tên!');
      return;
    }

    const res = addUserAccount({
      username: newAccData.username.trim().toLowerCase(),
      tenHienThi: newAccData.tenHienThi.trim(),
      password: newAccData.password || '123456',
      vaiTro: newAccData.vaiTro,
      nhanVienId: newAccData.nhanVienId || undefined,
      doiId: newAccData.doiId || (teams[0]?.id || 'doi-1'),
      avatar: newAccData.vaiTro === 'ADMIN' ? 'preset-admin' : newAccData.vaiTro === 'DOI_TRUONG' ? 'preset-captain' : 'preset-worker-kien',
    });

    if (res.success) {
      setShowAddAccountModal(false);
      setNewAccData({
        username: '',
        tenHienThi: '',
        password: '123456',
        vaiTro: 'NHAN_VIEN',
        nhanVienId: '',
        doiId: teams[0]?.id || 'doi-1',
      });
      setStatusMsg({ type: 'success', message: res.message });
      setTimeout(() => setStatusMsg({ type: null, message: '' }), 3500);
    } else {
      alert(res.message);
    }
  };

  // Handle Clear Database to Blank
  const handleClearToBlank = () => {
    setShowClearBlankConfirm(true);
  };

  const handleConfirmClearBlank = () => {
    const res = clearAttendanceToBlank();
    setStatusMsg({ type: 'success', message: res.message });
    setShowClearBlankConfirm(false);
    setTimeout(() => setStatusMsg({ type: null, message: '' }), 4000);
  };

  // Handle Load Sample Records
  const handleLoadSample = () => {
    setShowLoadSampleConfirm(true);
  };

  const handleConfirmLoadSample = () => {
    loadSampleExcelAttendance();
    setStatusMsg({
      type: 'success',
      message: 'Đã nạp thành công 28 bản ghi mẫu từ Excel để đối chiếu!',
    });
    setShowLoadSampleConfirm(false);
    setTimeout(() => setStatusMsg({ type: null, message: '' }), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-100 text-orange-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-stone-900">
                Cấu hình Quản trị & Tài khoản
              </h2>
              <p className="text-xs text-stone-500">
                Ảnh đại diện (Avatar), Đổi mật khẩu, Phân quyền & CSDL kiểm thử
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-200 px-5 pt-2 gap-1 sm:gap-2 bg-stone-50/50 overflow-x-auto">
          <button
            onClick={() => { setActiveTab('profile'); setStatusMsg({ type: null, message: '' }); }}
            className={`px-3 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'profile'
                ? 'border-orange-500 text-orange-600 bg-white shadow-2xs'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Hồ sơ & Avatar</span>
          </button>

          <button
            onClick={() => { setActiveTab('password'); setStatusMsg({ type: null, message: '' }); }}
            className={`px-3 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'password'
                ? 'border-orange-500 text-orange-600 bg-white shadow-2xs'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Đổi mật khẩu</span>
          </button>

          {currentUser.vaiTro === 'ADMIN' && (
            <button
              onClick={() => { setActiveTab('accounts'); setStatusMsg({ type: null, message: '' }); }}
              className={`px-3 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'accounts'
                  ? 'border-orange-500 text-orange-600 bg-white shadow-2xs'
                  : 'border-transparent text-stone-600 hover:text-stone-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Quản lý Tài khoản ({userAccounts.length})</span>
            </button>
          )}

          {currentUser.vaiTro === 'ADMIN' && (
            <button
              onClick={() => { setActiveTab('database'); setStatusMsg({ type: null, message: '' }); }}
              className={`px-3 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'database'
                  ? 'border-orange-500 text-orange-600 bg-white shadow-2xs'
                  : 'border-transparent text-stone-600 hover:text-stone-900'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>CSDL & Kiểm thử {attendanceRecords.length === 0 ? '(CSDL Trắng)' : ''}</span>
            </button>
          )}
        </div>

        {/* Notification Toast */}
        {statusMsg.message && (
          <div
            className={`mx-5 mt-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{statusMsg.message}</span>
          </div>
        )}

        {/* Tab Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: PROFILE & AVATAR */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Current Avatar Preview */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-stone-50 rounded-2xl border border-stone-200">
                <UserAvatar
                  avatar={customAvatarUrl || selectedAvatarPreset}
                  name={profileName || currentUser.tenHienThi}
                  role={currentUser.vaiTro}
                  size="xl"
                />
                <div className="text-center sm:text-left space-y-1">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h3 className="text-base font-black text-stone-900">
                      {profileName || currentUser.tenHienThi}
                    </h3>
                    <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                      {currentUser.vaiTro === 'ADMIN' ? 'Quản trị viên' : currentUser.vaiTro === 'DOI_TRUONG' ? 'Đội trưởng' : 'Nhân viên'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">
                    Tên đăng nhập: <strong className="font-mono text-stone-700">@{currentUser.username || 'admin'}</strong>
                  </p>
                  <p className="text-[11px] text-stone-400">
                    Ảnh đại diện hiển thị trên menu, bảng chấm công, phiếu lương và lịch sử thao tác.
                  </p>
                </div>
              </div>

              {/* Choose Preset Avatar */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                  1. Chọn từ bộ sưu tập Avatar có sẵn:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {AVATAR_PRESETS.map(preset => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setSelectedAvatarPreset(preset.id);
                        setCustomAvatarUrl('');
                      }}
                      className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                        selectedAvatarPreset === preset.id && !customAvatarUrl
                          ? 'border-orange-500 bg-orange-50/70 ring-2 ring-orange-500/20 shadow-xs'
                          : 'border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      <UserAvatar avatar={preset.id} name={preset.name} size="md" />
                      <div className="overflow-hidden">
                        <span className="text-xs font-bold text-stone-900 block truncate">
                          {preset.name}
                        </span>
                        {selectedAvatarPreset === preset.id && !customAvatarUrl && (
                          <span className="text-[10px] text-orange-600 font-bold flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> Đang chọn
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload Custom Avatar */}
              <div className="space-y-3 p-4 bg-stone-50 rounded-2xl border border-stone-200">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                  2. Hoặc tải ảnh đại diện từ máy tính / Điện thoại:
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <label className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-stone-100 text-stone-800 text-xs font-bold rounded-xl border border-stone-300 shadow-2xs flex items-center justify-center gap-2 cursor-pointer transition-all">
                    <Upload className="w-4 h-4 text-orange-600" />
                    <span>Chọn file ảnh (PNG, JPG)</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageFileUpload}
                    />
                  </label>
                  <span className="text-xs text-stone-400">hoặc</span>
                  <input
                    type="url"
                    value={customAvatarUrl}
                    onChange={e => {
                      setCustomAvatarUrl(e.target.value);
                      setSelectedAvatarPreset('');
                    }}
                    placeholder="Dán đường dẫn link ảnh (https://...)"
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Edit Display Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                  3. Tên hiển thị cá nhân:
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={e => setProfileName(e.target.value)}
                  className="w-full text-sm font-bold px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Submit Save Profile Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black rounded-xl shadow-md shadow-orange-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Lưu thay đổi hồ sơ & Avatar</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CHANGE PASSWORD */}
          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className="max-w-md mx-auto space-y-4 py-2">
              <div className="p-4 bg-orange-50/60 rounded-2xl border border-orange-200 text-xs text-orange-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-orange-600" />
                  <span>Bảo mật tài khoản:</span>
                </div>
                <p className="text-[11px] text-orange-800 leading-relaxed">
                  Thay đổi mật khẩu thường xuyên giúp bảo vệ bảng chấm công và số liệu lương nội bộ của đội. Mật khẩu mới tối thiểu 4 ký tự.
                </p>
              </div>

              {/* Current Password */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-stone-700">
                  Mật khẩu hiện tại:
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="Nhập mật khẩu đang sử dụng..."
                    className="w-full text-sm px-3.5 py-2.5 pr-10 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-3 text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[10px] text-stone-400 italic">Mật khẩu mặc định hệ thống ban đầu là: 123456</span>
              </div>

              {/* New Password */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-stone-700">
                  Mật khẩu mới:
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới..."
                    className="w-full text-sm px-3.5 py-2.5 pr-10 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-3 text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-stone-700">
                  Xác nhận lại mật khẩu mới:
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới..."
                  className="w-full text-sm px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-mono"
                />
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Xác nhận đổi mật khẩu</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: ACCOUNT & ROLE MANAGEMENT (ADMIN ONLY) */}
          {activeTab === 'accounts' && currentUser.vaiTro === 'ADMIN' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-stone-900">
                    Danh sách tài khoản & Phân quyền truy cập
                  </h3>
                  <p className="text-xs text-stone-500">
                    Quản lý mật khẩu và quyền đăng nhập của Quản trị, Đội trưởng và từng Nhân viên
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddAccountModal(true)}
                  className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm tài khoản</span>
                </button>
              </div>

              {/* Table of User Accounts */}
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200 uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Người dùng</th>
                        <th className="py-2.5 px-3">Tên đăng nhập</th>
                        <th className="py-2.5 px-3">Phân quyền</th>
                        <th className="py-2.5 px-3">Đội nhóm</th>
                        <th className="py-2.5 px-3">Mật khẩu</th>
                        <th className="py-2.5 px-3 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {userAccounts.map(account => {
                        const isMasterAdmin = account.username === 'admin' || account.username === 'thach';
                        return (
                          <tr key={account.id} className="hover:bg-stone-50/70 transition-colors">
                            <td className="py-2.5 px-3 flex items-center gap-2.5">
                              <UserAvatar
                                avatar={account.avatar}
                                name={account.tenHienThi}
                                role={account.vaiTro}
                                size="sm"
                              />
                              <div>
                                <span className="font-bold text-stone-900 block">
                                  {account.tenHienThi}
                                </span>
                                {account.nhanVienId && (
                                  <span className="text-[10px] text-stone-400">
                                    Mã NV: {account.nhanVienId}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-stone-700">
                              @{account.username}
                            </td>
                            <td className="py-2.5 px-3">
                              {isMasterAdmin ? (
                                <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-extrabold uppercase bg-amber-100 text-amber-900 border border-amber-300">
                                  Quản trị (Gốc)
                                </span>
                              ) : (
                                <select
                                  value={account.vaiTro}
                                  onChange={(e) => {
                                    const newRole = e.target.value as VaiTroNguoiDung;
                                    const res = updateUserRoleAndTeam(
                                      account.id,
                                      newRole,
                                      newRole === 'ADMIN' ? undefined : (account.doiId || teams[0]?.id)
                                    );
                                    setStatusMsg({
                                      type: res.success ? 'success' : 'error',
                                      message: res.message,
                                    });
                                  }}
                                  className="px-2 py-1 bg-white border border-stone-300 rounded-lg text-xs font-bold text-stone-800 hover:border-orange-400 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 cursor-pointer"
                                >
                                  <option value="NHAN_VIEN">Nhân viên</option>
                                  <option value="DOI_TRUONG">Đội trưởng</option>
                                  <option value="ADMIN">Quản trị viên</option>
                                </select>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              {account.vaiTro === 'ADMIN' ? (
                                <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-stone-100 text-stone-600 border border-stone-200">
                                  Toàn công ty
                                </span>
                              ) : (
                                <select
                                  value={account.doiId || ''}
                                  onChange={(e) => {
                                    const newDoiId = e.target.value;
                                    const res = updateUserRoleAndTeam(account.id, account.vaiTro, newDoiId);
                                    setStatusMsg({
                                      type: res.success ? 'success' : 'error',
                                      message: res.message,
                                    });
                                  }}
                                  className="px-2 py-1 bg-white border border-stone-300 rounded-lg text-xs font-medium text-stone-800 hover:border-orange-400 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 cursor-pointer max-w-[160px]"
                                >
                                  <option value="">-- Chưa phân đội --</option>
                                  {teams.map(t => (
                                    <option key={t.id} value={t.id}>
                                      {t.tenDoi} {t.khuVuc ? `(${t.khuVuc})` : ''}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-stone-500">
                              ••••••
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleAdminReset(account)}
                                  className="px-2 py-1 bg-stone-100 hover:bg-amber-100 hover:text-amber-900 text-stone-700 rounded-lg text-[11px] font-semibold border border-stone-200 cursor-pointer transition-colors"
                                  title="Đặt lại mật khẩu về 123456"
                                >
                                  Đặt lại MK
                                </button>
                                {account.id !== currentUser.id && !isMasterAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => setDeletingAccount(account)}
                                    className="p-1 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                                    title="Xóa tài khoản"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Add Account Modal Sub-form */}
              {showAddAccountModal && (
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                    <span className="font-bold text-xs text-stone-900">
                      Tạo tài khoản người dùng mới:
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddAccountModal(false)}
                      className="text-stone-400 hover:text-stone-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <form onSubmit={handleCreateAccount} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-stone-600 font-bold mb-1">Họ và tên:</label>
                      <input
                        type="text"
                        required
                        value={newAccData.tenHienThi}
                        onChange={e => setNewAccData({ ...newAccData, tenHienThi: e.target.value })}
                        placeholder="VD: Trần Văn Nam"
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-600 font-bold mb-1">Tên đăng nhập (Username):</label>
                      <input
                        type="text"
                        required
                        value={newAccData.username}
                        onChange={e => setNewAccData({ ...newAccData, username: e.target.value })}
                        placeholder="VD: namtv"
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-600 font-bold mb-1">Phân quyền vai trò:</label>
                      <select
                        value={newAccData.vaiTro}
                        onChange={e => setNewAccData({ ...newAccData, vaiTro: e.target.value as VaiTroNguoiDung })}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-bold"
                      >
                        <option value="NHAN_VIEN">Nhân viên (Chỉ xem lương của mình)</option>
                        <option value="DOI_TRUONG">Đội trưởng (Chấm công đội mình)</option>
                        <option value="ADMIN">Quản trị viên (Toàn quyền hệ thống)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-stone-600 font-bold mb-1">Đội phụ trách / Làm việc:</label>
                      <select
                        value={newAccData.doiId}
                        onChange={e => setNewAccData({ ...newAccData, doiId: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-bold"
                      >
                        {teams.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.tenDoi} {t.khuVuc ? `(${t.khuVuc})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-stone-600 font-bold mb-1">Mật khẩu ban đầu:</label>
                      <input
                        type="text"
                        value={newAccData.password}
                        onChange={e => setNewAccData({ ...newAccData, password: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-mono"
                      />
                    </div>
                    <div className="sm:col-span-2 pt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddAccountModal(false)}
                        className="px-4 py-2 bg-stone-200 text-stone-700 rounded-xl font-bold"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold cursor-pointer"
                      >
                        Tạo tài khoản
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DATABASE ENGINE & BLANK DB TESTING (CHỈ QUẢN TRỊ VIÊN) */}
          {currentUser.vaiTro === 'ADMIN' && activeTab === 'database' && (
            <div className="space-y-5">
              {/* Status Box */}
              <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-2">
                <div className="flex items-center gap-2 text-emerald-950 font-bold">
                  <Database className="w-5 h-5 text-emerald-600" />
                  <span>Trạng thái CSDL Đám mây (Firebase Firestore Cloud)</span>
                </div>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  Hệ thống đã kích hoạt cơ chế <strong>Đồng bộ Đám mây Firebase Firestore thời gian thực</strong>. Toàn bộ nhân sự, đội nhóm, tài khoản và lịch sử chấm công được lưu trữ vĩnh viễn trên Cloud Server, đảm bảo an toàn tuyệt đối 100% qua các lần publish/cập nhật hệ thống hoặc chuyển đổi thiết bị.
                </p>
              </div>

              {/* Database Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
                  <span className="text-[10px] uppercase font-bold text-stone-500 block">Số nhân sự</span>
                  <span className="text-xl font-black text-stone-900 font-mono">{employees.length}</span>
                  <span className="text-[10px] text-stone-400 block mt-0.5">3 Chính + 2 Phụ</span>
                </div>
                <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
                  <span className="text-[10px] uppercase font-bold text-stone-500 block">Bản ghi chấm công</span>
                  <span className={`text-xl font-black font-mono ${attendanceRecords.length === 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                    {attendanceRecords.length}
                  </span>
                  <span className="text-[10px] text-stone-400 block mt-0.5">
                    {attendanceRecords.length === 0 ? 'CSDL Trắng (0 bản ghi)' : 'Bản ghi hiện có'}
                  </span>
                </div>
                <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
                  <span className="text-[10px] uppercase font-bold text-stone-500 block">Tài khoản User</span>
                  <span className="text-xl font-black text-stone-900 font-mono">{userAccounts.length}</span>
                  <span className="text-[10px] text-stone-400 block mt-0.5">Admin & Nhân viên</span>
                </div>
                <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
                  <span className="text-[10px] uppercase font-bold text-stone-500 block">Đơn giá áp dụng</span>
                  <span className="text-xl font-black text-stone-900 font-mono">1.200 đ</span>
                  <span className="text-[10px] text-stone-400 block mt-0.5">Phụ 85% lương chính</span>
                </div>
              </div>

              {/* Testing Controls: Reset to Blank & Load Sample */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                <span className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                  Công cụ kiểm thử độ chính xác:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Button: Clear to Blank */}
                  <div className="p-3.5 bg-white rounded-xl border border-rose-200 shadow-2xs space-y-2">
                    <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                      <Trash2 className="w-4 h-4 text-rose-600" />
                      <span>Xóa trắng CSDL chấm công</span>
                    </div>
                    <p className="text-[11px] text-stone-500 leading-tight">
                      Xóa toàn bộ các ngày chấm công đã nhập, đưa CSDL về trạng thái trắng 0 ngày để bắt đầu chu kỳ kiểm thử mới.
                    </p>
                    <button
                      type="button"
                      onClick={handleClearToBlank}
                      className="w-full py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Xác nhận xóa về CSDL Trắng
                    </button>
                  </div>

                  {/* Button: Load Sample Excel */}
                  <div className="p-3.5 bg-white rounded-xl border border-emerald-200 shadow-2xs space-y-2">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>Nạp 28 ngày mẫu Excel đối chiếu</span>
                    </div>
                    <p className="text-[11px] text-stone-500 leading-tight">
                      Nạp 28 ngày thực tế từ file Excel mẫu (Tháng 8/2026) để kiểm tra độ khớp 100% của thuật toán và các công thức.
                    </p>
                    <button
                      type="button"
                      onClick={handleLoadSample}
                      className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Nạp dữ liệu mẫu Excel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
          <span className="text-[11px] text-stone-400">
            Hệ thống Quản trị & Tính Lương CÔNG TY TNHH COGAVA
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs rounded-xl cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Confirmation Modals inside AccountSettings */}
      <ConfirmModal
        isOpen={!!deletingAccount}
        title="Xác nhận xóa tài khoản người dùng"
        message="Bạn có chắc muốn xóa tài khoản đăng nhập này? Người dùng này sẽ không thể đăng nhập vào hệ thống được nữa."
        itemName={deletingAccount ? `@${deletingAccount.username} (${deletingAccount.tenHienThi})` : ''}
        itemDetail={deletingAccount ? `Vai trò: ${deletingAccount.vaiTro}` : ''}
        confirmText="Xác nhận xóa tài khoản"
        cancelText="Hủy"
        type="danger"
        onConfirm={handleConfirmDeleteAccount}
        onCancel={() => setDeletingAccount(null)}
      />

      <ConfirmModal
        isOpen={!!resettingAccount}
        title="Đặt lại mật khẩu mặc định"
        message="Mật khẩu của tài khoản sẽ được đưa về mật khẩu ban đầu là: 123456"
        itemName={resettingAccount ? `@${resettingAccount.username} (${resettingAccount.tenHienThi})` : ''}
        itemLabel="Tài khoản được đặt lại mật khẩu:"
        itemDetail="Mật khẩu mới sau khi đặt lại: 123456"
        confirmText="Đặt lại mật khẩu"
        cancelText="Hủy"
        type="warning"
        onConfirm={handleConfirmResetPassword}
        onCancel={() => setResettingAccount(null)}
      />

      <ConfirmModal
        isOpen={showClearBlankConfirm}
        title="CẢNH BÁO: Xóa sạch dữ liệu chấm công"
        message="Toàn bộ các ngày chấm công trong CSDL sẽ được xóa về 0 bản ghi (CSDL Trắng hoàn toàn) để bạn tiến hành kiểm thử nhập liệu thực tế từ đầu."
        itemName={`Xóa toàn bộ ${attendanceRecords.length} ngày chấm công`}
        itemLabel="Dữ liệu sẽ bị xóa hoàn toàn:"
        confirmText="Xác nhận xóa sạch"
        cancelText="Hủy"
        type="danger"
        onConfirm={handleConfirmClearBlank}
        onCancel={() => setShowClearBlankConfirm(false)}
      />

      <ConfirmModal
        isOpen={showLoadSampleConfirm}
        title="Nạp dữ liệu chấm công mẫu từ Excel"
        message="Hệ thống sẽ nạp lại 28 bản ghi chấm công thực tế từ file Excel mẫu COGAVA để bạn đối chiếu kiểm tra công thức."
        itemName="28 ngày chấm công mẫu (Tháng 8 & Tháng 9/2026)"
        itemLabel="Dữ liệu mẫu nạp vào CSDL:"
        confirmText="Nạp dữ liệu mẫu"
        cancelText="Hủy"
        type="info"
        onConfirm={handleConfirmLoadSample}
        onCancel={() => setShowLoadSampleConfirm(false)}
      />
    </div>
  );
};
