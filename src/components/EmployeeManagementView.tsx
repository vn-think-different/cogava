import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { NhanVien, VaiTroNhanVien, DoiNhanVien } from '../types';
import { formatDateVN } from '../utils/formatters';
import { ConfirmModal } from './ConfirmModal';
import {
  UserPlus,
  Users,
  UserCheck,
  UserX,
  Edit2,
  Phone,
  CreditCard,
  Calendar,
  Search,
  X,
  Users2,
  MapPin,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Award,
  FileText,
  Image as ImageIcon,
  Eye,
  Upload,
  AlertCircle,
} from 'lucide-react';

export const EmployeeManagementView: React.FC = () => {
  const {
    employees,
    teams,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    toggleEmployeeStatus,
    assignEmployeeToTeam,
    addTeam,
    updateTeam,
    deleteTeam,
    appointCaptain,
    currentUser,
  } = useApp();

  const isAdmin = currentUser.vaiTro === 'ADMIN';
  const isDoiTruong = currentUser.vaiTro === 'DOI_TRUONG';
  // Đội trưởng và Quản trị viên đều có thể thêm, sửa, xóa thành viên trong mỗi đội
  const canManageMembers = isAdmin || isDoiTruong;

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'CHINH' | 'PHU'>('ALL');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<NhanVien | null>(null);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [viewingCccdEmp, setViewingCccdEmp] = useState<NhanVien | null>(null);

  // Confirm Modals state
  const [deletingEmp, setDeletingEmp] = useState<NhanVien | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<DoiNhanVien | null>(null);

  // Toast notification feedback
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, message });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Add/Edit Team Form
  const [newTeamData, setNewTeamData] = useState<{
    id?: string;
    tenDoi: string;
    doiTruongTen: string;
    khuVuc: string;
    moTa: string;
  }>({
    tenDoi: '',
    doiTruongTen: '',
    khuVuc: '',
    moTa: '',
  });
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);

  // Employee Form State (Bao gồm đầy đủ Họ tên, Vai trò, Đội, SĐT, STK, CCCD và ảnh)
  const [formData, setFormData] = useState<{
    hoTen: string;
    vaiTro: VaiTroNhanVien;
    doiId: string;
    ngayVaoLam: string;
    sdt: string;
    stkNganHang: string;
    tenNganHang: string;
    soCccd: string;
    cccdNgayCap: string;
    cccdNoiCap: string;
    cccdMatTruoc: string;
    cccdMatSau: string;
  }>({
    hoTen: '',
    vaiTro: 'CHINH',
    doiId: teams[0]?.id || '',
    ngayVaoLam: new Date().toISOString().substring(0, 10),
    sdt: '',
    stkNganHang: '',
    tenNganHang: '',
    soCccd: '',
    cccdNgayCap: '',
    cccdNoiCap: 'Cục Cảnh sát QLHC về TTXH',
    cccdMatTruoc: '',
    cccdMatSau: '',
  });

  // Active Team for Doi Truong
  const currentTeam = teams.find(t => t.id === currentUser.doiId);

  // Filtered employees list based on search, role, and team permissions
  const filteredEmployees = employees.filter(emp => {
    // Role permissions: DOI_TRUONG only sees their team's members
    if (isDoiTruong) {
      const userTeamId = currentUser.doiId;
      if (emp.doiId !== userTeamId) {
        return false;
      }
    } else if (selectedTeamFilter !== 'ALL') {
      if (emp.doiId !== selectedTeamFilter) {
        return false;
      }
    }

    const matchSearch =
      emp.hoTen.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.sdt && emp.sdt.includes(searchTerm)) ||
      (emp.stkNganHang && emp.stkNganHang.includes(searchTerm)) ||
      (emp.soCccd && emp.soCccd.includes(searchTerm));
    const matchRole = roleFilter === 'ALL' || emp.vaiTro === roleFilter;

    return matchSearch && matchRole;
  });

  const openAddModal = () => {
    const defaultDoi = isDoiTruong
      ? (currentUser.doiId || teams[0]?.id || '')
      : (selectedTeamFilter !== 'ALL' ? selectedTeamFilter : (teams[0]?.id || ''));

    setFormData({
      hoTen: '',
      vaiTro: 'CHINH',
      doiId: defaultDoi,
      ngayVaoLam: new Date().toISOString().substring(0, 10),
      sdt: '',
      stkNganHang: '',
      tenNganHang: '',
      soCccd: '',
      cccdNgayCap: '',
      cccdNoiCap: 'Cục Cảnh sát QLHC về TTXH',
      cccdMatTruoc: '',
      cccdMatSau: '',
    });
    setEditingEmp(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (emp: NhanVien) => {
    setFormData({
      hoTen: emp.hoTen,
      vaiTro: emp.vaiTro,
      doiId: emp.doiId || teams[0]?.id || '',
      ngayVaoLam: emp.ngayVaoLam,
      sdt: emp.sdt || '',
      stkNganHang: emp.stkNganHang || '',
      tenNganHang: emp.tenNganHang || '',
      soCccd: emp.soCccd || '',
      cccdNgayCap: emp.cccdNgayCap || '',
      cccdNoiCap: emp.cccdNoiCap || 'Cục Cảnh sát QLHC về TTXH',
      cccdMatTruoc: emp.cccdMatTruoc || '',
      cccdMatSau: emp.cccdMatSau || '',
    });
    setEditingEmp(emp);
    setIsAddModalOpen(true);
  };

  // Helper xử lý upload ảnh CCCD
  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'cccdMatTruoc' | 'cccdMatSau'
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Kích thước ảnh tối đa là 2MB!');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setFormData(prev => ({ ...prev, [field]: reader.result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.hoTen.trim()) {
      alert('Vui lòng nhập họ và tên nhân viên!');
      return;
    }

    if (editingEmp) {
      updateEmployee(editingEmp.id, {
        hoTen: formData.hoTen.trim(),
        vaiTro: formData.vaiTro,
        doiId: formData.doiId,
        ngayVaoLam: formData.ngayVaoLam,
        sdt: formData.sdt.trim() || undefined,
        stkNganHang: formData.stkNganHang.trim() || undefined,
        tenNganHang: formData.tenNganHang.trim() || undefined,
        soCccd: formData.soCccd.trim() || undefined,
        cccdNgayCap: formData.cccdNgayCap || undefined,
        cccdNoiCap: formData.cccdNoiCap || undefined,
        cccdMatTruoc: formData.cccdMatTruoc || undefined,
        cccdMatSau: formData.cccdMatSau || undefined,
      });
      showToast(`Đã cập nhật thông tin nhân viên "${formData.hoTen.trim()}" thành công!`);
    } else {
      addEmployee({
        hoTen: formData.hoTen.trim(),
        vaiTro: formData.vaiTro,
        doiId: formData.doiId,
        ngayVaoLam: formData.ngayVaoLam,
        sdt: formData.sdt.trim() || undefined,
        stkNganHang: formData.stkNganHang.trim() || undefined,
        tenNganHang: formData.tenNganHang.trim() || undefined,
        soCccd: formData.soCccd.trim() || undefined,
        cccdNgayCap: formData.cccdNgayCap || undefined,
        cccdNoiCap: formData.cccdNoiCap || undefined,
        cccdMatTruoc: formData.cccdMatTruoc || undefined,
        cccdMatSau: formData.cccdMatSau || undefined,
        trangThai: 'DANG_LAM',
      });
      showToast(`Đã thêm nhân viên mới "${formData.hoTen.trim()}" thành công!`);
    }

    setIsAddModalOpen(false);
  };

  const handleSaveTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamData.tenDoi.trim()) {
      showToast('Vui lòng nhập tên đội bắt gà!', 'error');
      return;
    }

    if (editingTeamId) {
      const res = updateTeam(editingTeamId, {
        tenDoi: newTeamData.tenDoi.trim(),
        doiTruongTen: newTeamData.doiTruongTen.trim() || undefined,
        khuVuc: newTeamData.khuVuc.trim() || undefined,
        moTa: newTeamData.moTa.trim() || undefined,
      });
      showToast(res.message, res.success ? 'success' : 'error');
      setEditingTeamId(null);
    } else {
      const res = addTeam({
        tenDoi: newTeamData.tenDoi.trim(),
        doiTruongTen: newTeamData.doiTruongTen.trim() || undefined,
        khuVuc: newTeamData.khuVuc.trim() || undefined,
        moTa: newTeamData.moTa.trim() || undefined,
      });
      showToast(res.message, res.success ? 'success' : 'error');
    }

    setNewTeamData({
      tenDoi: '',
      doiTruongTen: '',
      khuVuc: '',
      moTa: '',
    });
  };

  const handleConfirmDeleteEmployee = () => {
    if (!deletingEmp) return;
    const res = deleteEmployee(deletingEmp.id);
    showToast(res.message, res.success ? 'success' : 'error');
    setDeletingEmp(null);
  };

  const handleConfirmDeleteTeam = () => {
    if (!deletingTeam) return;
    const res = deleteTeam(deletingTeam.id);
    showToast(res.message, res.success ? 'success' : 'error');
    setDeletingTeam(null);
  };

  const chinhCount = filteredEmployees.filter(e => e.vaiTro === 'CHINH' && e.trangThai === 'DANG_LAM').length;
  const phuCount = filteredEmployees.filter(e => e.vaiTro === 'PHU' && e.trangThai === 'DANG_LAM').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-stone-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-black text-stone-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-600" />
              Đội ngũ nhân viên bắt gà COGAVA
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Phân nhóm nhân viên theo đội, bổ nhiệm đội trưởng, phân quyền Lương chính/Lương phụ và CCCD
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => {
                  setEditingTeamId(null);
                  setNewTeamData({ tenDoi: '', doiTruongTen: '', khuVuc: '', moTa: '' });
                  setIsTeamModalOpen(true);
                }}
                id="btn-manage-teams"
                className="px-3.5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 border border-stone-300 cursor-pointer"
              >
                <Users2 className="w-4 h-4 text-orange-600" />
                Quản lý Đội nhóm ({teams.length})
              </button>
            )}

            {canManageMembers && (
              <button
                onClick={openAddModal}
                id="btn-add-employee"
                className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                Thêm nhân viên mới
              </button>
            )}
          </div>
        </div>

        {/* Team Banner for Doi Truong */}
        {isDoiTruong && (
          <div className="mt-4 p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-950 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-sky-500 text-white">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-sm text-sky-900 block">
                  {currentTeam?.tenDoi || 'Đội bắt gà của bạn'} ({filteredEmployees.length} nhân viên)
                </span>
                <span className="text-[11px] text-sky-700">
                  Đội trưởng <strong>{currentUser.tenHienThi}</strong>: Bạn có quyền thêm, sửa, xóa thành viên trong đội và chấm công cho đội.
                </span>
              </div>
            </div>
            {currentTeam?.khuVuc && (
              <span className="text-[10px] font-bold text-sky-800 bg-white px-2.5 py-1 rounded-lg border border-sky-200">
                Khu vực: {currentTeam.khuVuc}
              </span>
            )}
          </div>
        )}

        {/* Team Pills Selector for Admin */}
        {isAdmin && teams.length > 0 && (
          <div className="mt-4 pt-3.5 border-t border-stone-100 flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-bold text-stone-700 whitespace-nowrap flex items-center gap-1.5 mr-1">
              <Users2 className="w-4 h-4 text-orange-500" />
              Lọc theo đội:
            </span>
            <button
              onClick={() => setSelectedTeamFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedTeamFilter === 'ALL'
                  ? 'bg-orange-500 text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              Tất cả các đội ({employees.length})
            </button>
            {teams.map(team => {
              const count = employees.filter(e => e.doiId === team.id).length;
              const isSelected = selectedTeamFilter === team.id;
              return (
                <button
                  key={team.id}
                  onClick={() => setSelectedTeamFilter(team.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    isSelected
                      ? 'bg-orange-500 text-white shadow-2xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  <span>{team.tenDoi}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected ? 'bg-orange-700 text-white' : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Quick Stats & Search & Role Filters */}
        <div className="mt-4 pt-3.5 border-t border-stone-100 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-600">Đang hiển thị:</span>
            <span className="px-2.5 py-1 bg-orange-50 text-orange-800 rounded-lg text-xs font-bold border border-orange-200">
              {chinhCount} Lương chính
            </span>
            <span className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg text-xs font-bold border border-amber-200">
              {phuCount} Lương phụ
            </span>
            <span className="text-xs text-stone-400">
              (Tổng cộng: {filteredEmployees.length} nhân viên)
            </span>
          </div>

          {/* Search & Role Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Tìm theo tên, SĐT, STK, CCCD..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value as any)}
              className="text-xs py-1.5 px-2.5 bg-stone-50 border border-stone-200 rounded-xl font-medium cursor-pointer"
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="CHINH">Chỉ Lương chính</option>
              <option value="PHU">Chỉ Lương phụ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Empty State when no teams exist */}
      {teams.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-stone-300 space-y-3">
          <Users2 className="w-10 h-10 text-orange-500 mx-auto" />
          <h3 className="text-base font-bold text-stone-900">Chưa có Đội nhóm nào được tạo</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Quản trị viên hãy bấm vào nút <strong>Quản lý Đội nhóm</strong> bên trên để tạo đội mới và bổ nhiệm đội trưởng cho đội.
          </p>
          {isAdmin && (
            <button
              onClick={() => {
                setEditingTeamId(null);
                setNewTeamData({ tenDoi: '', doiTruongTen: '', khuVuc: '', moTa: '' });
                setIsTeamModalOpen(true);
              }}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Tạo Đội nhóm đầu tiên
            </button>
          )}
        </div>
      )}

      {/* Empty Employees state */}
      {teams.length > 0 && filteredEmployees.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-stone-300 space-y-3">
          <Users className="w-10 h-10 text-stone-400 mx-auto" />
          <h3 className="text-base font-bold text-stone-900">Chưa có nhân viên nào</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Bấm <strong>Thêm nhân viên mới</strong> để thêm thành viên vào đội, phân vai trò Lương chính / Lương phụ và cấp tài khoản.
          </p>
          {canManageMembers && (
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              Thêm nhân viên
            </button>
          )}
        </div>
      )}

      {/* Employee Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map(emp => {
          const isChinh = emp.vaiTro === 'CHINH';
          const isActive = emp.trangThai === 'DANG_LAM';
          const empTeam = teams.find(t => t.id === emp.doiId);
          const isCaptainOfTeam = empTeam?.doiTruongTen?.toLowerCase() === emp.hoTen.toLowerCase();

          return (
            <div
              key={emp.id}
              className={`bg-white rounded-2xl p-5 shadow-xs border transition-all space-y-4 ${
                isActive ? 'border-stone-200' : 'border-stone-200 bg-stone-50/70 opacity-60'
              }`}
            >
              {/* Header: Avatar, Name, Role, Team & Action */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg text-white shadow-2xs ${
                      isChinh
                        ? 'bg-gradient-to-br from-orange-500 to-orange-600'
                        : 'bg-gradient-to-br from-amber-500 to-amber-600'
                    }`}
                  >
                    {emp.hoTen.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-stone-900 flex items-center gap-1.5">
                      {emp.hoTen}
                      {isCaptainOfTeam && (
                        <span className="p-0.5 bg-amber-100 text-amber-800 rounded-md text-[10px] font-bold inline-flex items-center gap-0.5 border border-amber-300" title="Đội trưởng">
                          <Award className="w-3 h-3 text-amber-600" />
                          Đội trưởng
                        </span>
                      )}
                    </h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          isChinh
                            ? 'bg-orange-100 text-orange-800 border border-orange-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {isChinh ? 'Lương chính' : 'Lương phụ'}
                      </span>
                      {empTeam && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">
                          <Users2 className="w-3 h-3 text-orange-500" />
                          {empTeam.tenDoi}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {canManageMembers && (
                    <button
                      onClick={() => openEditModal(emp)}
                      className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                      title="Chỉnh sửa thông tin"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  {canManageMembers && (
                    <button
                      type="button"
                      onClick={() => setDeletingEmp(emp)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Xóa nhân viên khỏi hệ thống"
                      aria-label="Xóa nhân viên"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Admin Actions: Assign Team / Appoint Captain */}
              {isAdmin && teams.length > 1 && (
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-stone-600 flex items-center gap-1">
                    <Users2 className="w-3.5 h-3.5 text-orange-600" />
                    Gán vào đội:
                  </span>
                  <select
                    value={emp.doiId || ''}
                    onChange={e => assignEmployeeToTeam(emp.id, e.target.value)}
                    className="text-xs font-bold text-stone-800 bg-white border border-stone-200 rounded-lg px-2 py-1 focus:outline-hidden focus:ring-1 focus:ring-orange-500 cursor-pointer"
                  >
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.tenDoi}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Contact, Banking & CCCD Information */}
              <div className="space-y-2 text-xs bg-stone-50 p-3 rounded-xl border border-stone-200/70">
                <div className="flex items-center gap-2 text-stone-700">
                  <Phone className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                  <span className="font-mono">{emp.sdt || 'Chưa có số điện thoại'}</span>
                </div>

                <div className="flex items-start gap-2 text-stone-700">
                  <CreditCard className="w-3.5 h-3.5 text-stone-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-mono font-bold block">
                      {emp.stkNganHang || 'Chưa cập nhật STK'}
                    </span>
                    {emp.tenNganHang && (
                      <span className="text-[10px] text-stone-500 block">
                        {emp.tenNganHang}
                      </span>
                    )}
                  </div>
                </div>

                {/* CCCD Information badge */}
                <div className="flex items-center justify-between pt-1 border-t border-stone-200/50">
                  <div className="flex items-center gap-1.5 text-stone-600">
                    <FileText className="w-3.5 h-3.5 text-stone-400" />
                    <span>CCCD: <strong className="font-mono">{emp.soCccd || 'Chưa có'}</strong></span>
                  </div>
                  {(emp.soCccd || emp.cccdMatTruoc || emp.cccdMatSau) && (
                    <button
                      type="button"
                      onClick={() => setViewingCccdEmp(emp)}
                      className="px-2 py-0.5 bg-white border border-stone-200 hover:border-orange-400 text-[10px] font-bold text-orange-600 rounded-md cursor-pointer flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      Xem CCCD
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 text-stone-500 pt-1 border-t border-stone-200/50">
                  <Calendar className="w-3.5 h-3.5 text-stone-400" />
                  <span>Vào làm: {formatDateVN(emp.ngayVaoLam)}</span>
                </div>
              </div>

              {/* Status & Soft Delete Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
                <span
                  className={`inline-flex items-center gap-1 font-semibold ${
                    isActive ? 'text-emerald-700' : 'text-stone-500'
                  }`}
                >
                  {isActive ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Đang làm việc
                    </>
                  ) : (
                    <>
                      <UserX className="w-3.5 h-3.5 text-stone-400" />
                      Đã nghỉ việc ({formatDateVN(emp.ngayNghiViec || '')})
                    </>
                  )}
                </span>

                {canManageMembers && (
                  <button
                    type="button"
                    onClick={() => toggleEmployeeStatus(emp.id)}
                    className={`text-[11px] font-bold underline cursor-pointer ${
                      isActive ? 'text-stone-500 hover:text-rose-600' : 'text-emerald-700 hover:underline'
                    }`}
                  >
                    {isActive ? 'Báo nghỉ việc' : 'Kích hoạt lại'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h2 className="text-base font-bold text-stone-900">
                {editingEmp ? `Chỉnh sửa: ${editingEmp.hoTen}` : 'Thêm nhân viên bắt gà mới'}
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Họ và tên nhân viên *
                </label>
                <input
                  type="text"
                  required
                  value={formData.hoTen}
                  onChange={e => setFormData({ ...formData, hoTen: e.target.value })}
                  placeholder="VD: Nguyễn Văn A"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-bold"
                />
              </div>

              {/* Team Assignment Selection */}
              {teams.length > 0 && (
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Gán vào Đội bắt gà *
                  </label>
                  <select
                    value={formData.doiId}
                    disabled={isDoiTruong}
                    onChange={e => setFormData({ ...formData, doiId: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-bold"
                  >
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.tenDoi} {t.khuVuc ? `(${t.khuVuc})` : ''} - Đội trưởng: {t.doiTruongTen || 'Chưa phân công'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Vai trò Lương chính / Lương phụ */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Phân loại lương (Vai trò) *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, vaiTro: 'CHINH' })}
                    className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer ${
                      formData.vaiTro === 'CHINH'
                        ? 'bg-orange-500 text-white border-orange-500 shadow-2xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    Lương chính (100%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, vaiTro: 'PHU' })}
                    className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer ${
                      formData.vaiTro === 'PHU'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    Lương phụ (85%)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Ngày vào làm
                  </label>
                  <input
                    type="date"
                    value={formData.ngayVaoLam}
                    onChange={e => setFormData({ ...formData, ngayVaoLam: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={formData.sdt}
                    onChange={e => setFormData({ ...formData, sdt: e.target.value })}
                    placeholder="0912.xxx.xxx"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Ngân hàng */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Số tài khoản ngân hàng
                  </label>
                  <input
                    type="text"
                    value={formData.stkNganHang}
                    onChange={e => setFormData({ ...formData, stkNganHang: e.target.value })}
                    placeholder="VD: 190368888..."
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Ngân hàng & Chi nhánh
                  </label>
                  <input
                    type="text"
                    value={formData.tenNganHang}
                    onChange={e => setFormData({ ...formData, tenNganHang: e.target.value })}
                    placeholder="VD: Techcombank"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Phần Căn cước công dân (CCCD) */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                <div className="flex items-center gap-1.5 font-bold text-stone-800">
                  <FileText className="w-4 h-4 text-orange-600" />
                  <span>Căn cước công dân (CCCD - Không bắt buộc)</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-600 mb-1">
                      Số CCCD (12 số)
                    </label>
                    <input
                      type="text"
                      maxLength={12}
                      value={formData.soCccd}
                      onChange={e => setFormData({ ...formData, soCccd: e.target.value })}
                      placeholder="079095xxxxxx"
                      className="w-full p-2 bg-white border border-stone-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-orange-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-600 mb-1">
                      Ngày cấp
                    </label>
                    <input
                      type="date"
                      value={formData.cccdNgayCap}
                      onChange={e => setFormData({ ...formData, cccdNgayCap: e.target.value })}
                      className="w-full p-2 bg-white border border-stone-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-600 mb-1">
                    Nơi cấp
                  </label>
                  <input
                    type="text"
                    value={formData.cccdNoiCap}
                    onChange={e => setFormData({ ...formData, cccdNoiCap: e.target.value })}
                    placeholder="Cục Cảnh sát QLHC về TTXH"
                    className="w-full p-2 bg-white border border-stone-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                {/* Upload ảnh CCCD */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block font-semibold text-stone-600 mb-1">
                      Ảnh CCCD Mặt trước
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleImageUpload(e, 'cccdMatTruoc')}
                      className="w-full text-[11px] file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer"
                    />
                    {formData.cccdMatTruoc && (
                      <div className="mt-1.5 relative w-full h-16 bg-stone-200 rounded-lg overflow-hidden border border-stone-300">
                        <img src={formData.cccdMatTruoc} alt="Mặt trước" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-600 mb-1">
                      Ảnh CCCD Mặt sau
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleImageUpload(e, 'cccdMatSau')}
                      className="w-full text-[11px] file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer"
                    />
                    {formData.cccdMatSau && (
                      <div className="mt-1.5 relative w-full h-16 bg-stone-200 rounded-lg overflow-hidden border border-stone-300">
                        <img src={formData.cccdMatSau} alt="Mặt sau" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  {editingEmp ? 'Lưu thay đổi' : 'Tạo nhân viên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Viewing CCCD Modal */}
      {viewingCccdEmp && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-600" />
                  Hồ sơ CCCD: {viewingCccdEmp.hoTen}
                </h2>
                <p className="text-xs text-stone-500">
                  Số CCCD: <strong className="font-mono text-stone-900">{viewingCccdEmp.soCccd || 'Chưa cập nhật'}</strong>
                </p>
              </div>
              <button
                onClick={() => setViewingCccdEmp(null)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
                <div>
                  <span className="text-stone-500 block">Ngày cấp:</span>
                  <span className="font-semibold text-stone-900">{viewingCccdEmp.cccdNgayCap ? formatDateVN(viewingCccdEmp.cccdNgayCap) : 'Chưa cập nhật'}</span>
                </div>
                <div>
                  <span className="text-stone-500 block">Nơi cấp:</span>
                  <span className="font-semibold text-stone-900">{viewingCccdEmp.cccdNoiCap || 'Cục Cảnh sát QLHC về TTXH'}</span>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-orange-600" />
                  Hình ảnh Căn cước công dân
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-stone-600 block">Mặt trước:</span>
                    {viewingCccdEmp.cccdMatTruoc ? (
                      <div className="w-full h-40 bg-stone-100 rounded-xl overflow-hidden border border-stone-200 flex items-center justify-center">
                        <img src={viewingCccdEmp.cccdMatTruoc} alt="CCCD Mặt trước" className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-full h-40 bg-stone-100 rounded-xl border border-dashed border-stone-300 flex items-center justify-center text-stone-400">
                        Chưa có ảnh mặt trước
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-stone-600 block">Mặt sau:</span>
                    {viewingCccdEmp.cccdMatSau ? (
                      <div className="w-full h-40 bg-stone-100 rounded-xl overflow-hidden border border-stone-200 flex items-center justify-center">
                        <img src={viewingCccdEmp.cccdMatSau} alt="CCCD Mặt sau" className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-full h-40 bg-stone-100 rounded-xl border border-dashed border-stone-300 flex items-center justify-center text-stone-400">
                        Chưa có ảnh mặt sau
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingCccdEmp(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team Management Modal for Admin (Tạo đội, sửa tên đội, bổ nhiệm đội trưởng) */}
      {isTeamModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-100 text-orange-700 rounded-xl">
                  <Users2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-stone-900">
                    Quản lý Đội nhóm Bắt Gà
                  </h2>
                  <p className="text-xs text-stone-500">
                    Tạo mới đội, chỉnh sửa tên đội và bổ nhiệm Đội trưởng
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTeamModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of existing teams with Captain Appointment */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Danh sách Đội hiện tại ({teams.length})
              </h3>
              {teams.length === 0 ? (
                <p className="text-xs text-stone-400 italic p-3 bg-stone-50 rounded-xl">
                  Chưa có đội nào. Hãy điền form bên dưới để tạo đội mới!
                </p>
              ) : (
                teams.map(team => {
                  const teamMembers = employees.filter(e => e.doiId === team.id);
                  return (
                    <div
                      key={team.id}
                      className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-stone-900">
                              {team.tenDoi}
                            </span>
                            {team.khuVuc && (
                              <span className="text-[10px] font-semibold text-stone-600 bg-white px-2 py-0.5 rounded border border-stone-200">
                                {team.khuVuc}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-3">
                            <span>Đội trưởng: <strong className="text-orange-700">{team.doiTruongTen || 'Chưa bổ nhiệm'}</strong></span>
                            <span>•</span>
                            <span>Số thành viên: <strong className="text-stone-800">{teamMembers.length} người</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingTeamId(team.id);
                              setNewTeamData({
                                tenDoi: team.tenDoi,
                                doiTruongTen: team.doiTruongTen || '',
                                khuVuc: team.khuVuc || '',
                                moTa: team.moTa || '',
                              });
                            }}
                            className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-200 rounded-lg cursor-pointer"
                            title="Chỉnh sửa tên đội"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingTeam(team)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                            title="Xoá đội nhóm"
                            aria-label="Xóa đội"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Bổ nhiệm đội trưởng từ danh sách nhân viên trong đội */}
                      {teamMembers.length > 0 && (
                        <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold text-stone-600 flex items-center gap-1">
                            <Award className="w-3.5 h-3.5 text-amber-600" />
                            Bổ nhiệm Đội trưởng:
                          </span>
                          <select
                            value={teamMembers.find(m => m.hoTen.toLowerCase() === team.doiTruongTen?.toLowerCase())?.id || ''}
                            onChange={e => {
                              if (e.target.value) {
                                appointCaptain(team.id, e.target.value);
                              }
                            }}
                            className="text-xs font-bold text-stone-800 bg-white border border-stone-300 rounded-lg px-2 py-1 cursor-pointer"
                          >
                            <option value="">-- Chọn nhân viên làm Đội trưởng --</option>
                            {teamMembers.map(m => (
                              <option key={m.id} value={m.id}>
                                {m.hoTen} ({m.vaiTro === 'CHINH' ? 'Lương chính' : 'Lương phụ'})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Add / Edit Team Form */}
            <div className="pt-4 border-t border-stone-100">
              <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-orange-600" />
                {editingTeamId ? 'Chỉnh sửa thông tin Đội' : 'Thêm Đội Bắt Gà mới'}
              </h3>
              <form onSubmit={handleSaveTeam} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      Tên đội *
                    </label>
                    <input
                      type="text"
                      required
                      value={newTeamData.tenDoi}
                      onChange={e => setNewTeamData({ ...newTeamData, tenDoi: e.target.value })}
                      placeholder="VD: Đội 1 - Dĩ An"
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      Tên Đội trưởng (hoặc bổ nhiệm sau)
                    </label>
                    <input
                      type="text"
                      value={newTeamData.doiTruongTen}
                      onChange={e => setNewTeamData({ ...newTeamData, doiTruongTen: e.target.value })}
                      placeholder="VD: Nguyễn Văn Trưởng"
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      Khu vực hoạt động
                    </label>
                    <input
                      type="text"
                      value={newTeamData.khuVuc}
                      onChange={e => setNewTeamData({ ...newTeamData, khuVuc: e.target.value })}
                      placeholder="VD: Dĩ An, Thuận An, Bình Dương"
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      Ghi chú / Mô tả
                    </label>
                    <input
                      type="text"
                      value={newTeamData.moTa}
                      onChange={e => setNewTeamData({ ...newTeamData, moTa: e.target.value })}
                      placeholder="VD: Chuyên ca đêm..."
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  {editingTeamId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTeamId(null);
                        setNewTeamData({ tenDoi: '', doiTruongTen: '', khuVuc: '', moTa: '' });
                      }}
                      className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl cursor-pointer"
                    >
                      Hủy sửa
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    {editingTeamId ? 'Lưu cập nhật Đội' : 'Tạo đội mới'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-3 duration-200">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold ${
              toastMessage.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-700'
                : 'bg-rose-900 text-white border-rose-700'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-300 flex-shrink-0" />
            )}
            <span>{toastMessage.message}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="text-white/70 hover:text-white ml-2 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deleting Employee */}
      <ConfirmModal
        isOpen={!!deletingEmp}
        title="Xác nhận xóa Nhân viên"
        message="Bạn có chắc chắn muốn xóa nhân viên này khỏi hệ thống? Thao tác này sẽ xóa hồ sơ, gỡ bỏ quyền và tài khoản đăng nhập tương ứng."
        itemName={deletingEmp ? `${deletingEmp.hoTen} (${deletingEmp.vaiTro === 'CHINH' ? 'Lương chính' : 'Lương phụ'})` : ''}
        itemDetail={deletingEmp ? `SĐT: ${deletingEmp.sdt || 'Chưa có'} | CCCD: ${deletingEmp.soCccd || 'Chưa có'}` : ''}
        confirmText="Xóa nhân viên này"
        cancelText="Hủy bỏ"
        type="danger"
        onConfirm={handleConfirmDeleteEmployee}
        onCancel={() => setDeletingEmp(null)}
      />

      {/* Confirmation Modal for Deleting Team */}
      <ConfirmModal
        isOpen={!!deletingTeam}
        title="Xác nhận xóa Đội nhóm"
        message="Bạn có chắc chắn muốn xóa Đội bắt gà này? Các nhân viên đang thuộc đội sẽ được giữ nguyên hồ sơ và chuyển về trạng thái chờ phân công đội mới."
        itemName={deletingTeam ? deletingTeam.tenDoi : ''}
        itemDetail={
          deletingTeam
            ? `Khu vực: ${deletingTeam.khuVuc || 'Chưa có'} | Đội trưởng: ${deletingTeam.doiTruongTen || 'Chưa bổ nhiệm'} | Thành viên: ${
                employees.filter(e => e.doiId === deletingTeam.id).length
              } người`
            : ''
        }
        confirmText="Xóa đội nhóm này"
        cancelText="Hủy bỏ"
        type="danger"
        onConfirm={handleConfirmDeleteTeam}
        onCancel={() => setDeletingTeam(null)}
      />
    </div>
  );
};
