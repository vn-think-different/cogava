import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { NhanVien, VaiTroNhanVien, DoiNhanVien } from '../types';
import { formatDateVN } from '../utils/formatters';
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
} from 'lucide-react';

export const EmployeeManagementView: React.FC = () => {
  const {
    employees,
    teams,
    addEmployee,
    updateEmployee,
    toggleEmployeeStatus,
    assignEmployeeToTeam,
    addTeam,
    deleteTeam,
    currentUser,
  } = useApp();

  const isDoiTruong = currentUser.vaiTro === 'DOI_TRUONG';
  const canEdit = currentUser.vaiTro === 'ADMIN';

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'CHINH' | 'PHU'>('ALL');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<NhanVien | null>(null);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

  // Add/Edit Team Form
  const [newTeamData, setNewTeamData] = useState<{
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

  // Employee Form State
  const [formData, setFormData] = useState<{
    hoTen: string;
    vaiTro: VaiTroNhanVien;
    doiId: string;
    ngayVaoLam: string;
    sdt: string;
    stkNganHang: string;
    tenNganHang: string;
  }>({
    hoTen: '',
    vaiTro: 'CHINH',
    doiId: teams[0]?.id || 'doi-1',
    ngayVaoLam: new Date().toISOString().substring(0, 10),
    sdt: '',
    stkNganHang: '',
    tenNganHang: '',
  });

  // Active Team for Doi Truong
  const currentTeam = teams.find(t => t.id === (currentUser.doiId || 'doi-1'));

  // Filtered employees list based on search, role, and team permissions
  const filteredEmployees = employees.filter(emp => {
    // Role permissions: DOI_TRUONG only sees their team's members
    if (isDoiTruong) {
      const userTeamId = currentUser.doiId || 'doi-1';
      if (emp.doiId !== userTeamId && (emp.doiId || userTeamId !== 'doi-1')) {
        return false;
      }
    } else if (selectedTeamFilter !== 'ALL') {
      if (emp.doiId !== selectedTeamFilter && (emp.doiId || selectedTeamFilter !== 'doi-1')) {
        return false;
      }
    }

    const matchSearch =
      emp.hoTen.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.sdt && emp.sdt.includes(searchTerm)) ||
      (emp.stkNganHang && emp.stkNganHang.includes(searchTerm));
    const matchRole = roleFilter === 'ALL' || emp.vaiTro === roleFilter;

    return matchSearch && matchRole;
  });

  const openAddModal = () => {
    setFormData({
      hoTen: '',
      vaiTro: 'CHINH',
      doiId: selectedTeamFilter !== 'ALL' ? selectedTeamFilter : (teams[0]?.id || 'doi-1'),
      ngayVaoLam: new Date().toISOString().substring(0, 10),
      sdt: '',
      stkNganHang: '',
      tenNganHang: '',
    });
    setEditingEmp(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (emp: NhanVien) => {
    setFormData({
      hoTen: emp.hoTen,
      vaiTro: emp.vaiTro,
      doiId: emp.doiId || 'doi-1',
      ngayVaoLam: emp.ngayVaoLam,
      sdt: emp.sdt || '',
      stkNganHang: emp.stkNganHang || '',
      tenNganHang: emp.tenNganHang || '',
    });
    setEditingEmp(emp);
    setIsAddModalOpen(true);
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
      });
    } else {
      addEmployee({
        hoTen: formData.hoTen.trim(),
        vaiTro: formData.vaiTro,
        doiId: formData.doiId,
        ngayVaoLam: formData.ngayVaoLam,
        sdt: formData.sdt.trim() || undefined,
        stkNganHang: formData.stkNganHang.trim() || undefined,
        tenNganHang: formData.tenNganHang.trim() || undefined,
        trangThai: 'DANG_LAM',
      });
    }

    setIsAddModalOpen(false);
  };

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamData.tenDoi.trim()) {
      alert('Vui lòng nhập tên đội bắt gà!');
      return;
    }

    addTeam({
      tenDoi: newTeamData.tenDoi.trim(),
      doiTruongTen: newTeamData.doiTruongTen.trim() || undefined,
      khuVuc: newTeamData.khuVuc.trim() || undefined,
      moTa: newTeamData.moTa.trim() || undefined,
    });

    setNewTeamData({
      tenDoi: '',
      doiTruongTen: '',
      khuVuc: '',
      moTa: '',
    });
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
              Phân nhóm nhân viên theo đội, phân quyền chấm công và gán số tài khoản chuyển lương
            </p>
          </div>

          {canEdit && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsTeamModalOpen(true)}
                id="btn-manage-teams"
                className="px-3.5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 border border-stone-300 cursor-pointer"
              >
                <Users2 className="w-4 h-4 text-orange-600" />
                Quản lý Đội nhóm ({teams.length})
              </button>
              <button
                onClick={openAddModal}
                id="btn-add-employee"
                className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                Thêm nhân viên mới
              </button>
            </div>
          )}
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
                  Đội trưởng <strong>{currentUser.tenHienThi}</strong>: Bạn có quyền chấm công và theo dõi danh sách thành viên trong đội này.
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
        {canEdit && (
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
                placeholder="Tìm theo tên, SĐT, STK..."
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

      {/* Employee Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map(emp => {
          const isChinh = emp.vaiTro === 'CHINH';
          const isActive = emp.trangThai === 'DANG_LAM';
          const empTeam = teams.find(t => t.id === (emp.doiId || 'doi-1'));

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
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">
                        <Users2 className="w-3 h-3 text-orange-500" />
                        {empTeam?.tenDoi || 'Đội 1'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {canEdit && (
                    <button
                      onClick={() => openEditModal(emp)}
                      className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                      title="Chỉnh sửa thông tin"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Team Assignment Dropdown for Admin */}
              {canEdit && (
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-stone-600 flex items-center gap-1">
                    <Users2 className="w-3.5 h-3.5 text-orange-600" />
                    Gán vào đội:
                  </span>
                  <select
                    value={emp.doiId || 'doi-1'}
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

              {/* Contact & Banking Information */}
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

                {canEdit && (
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
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
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
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Team Assignment Selection */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Gán vào Đội bắt gà *
                </label>
                <select
                  value={formData.doiId}
                  onChange={e => setFormData({ ...formData, doiId: e.target.value })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-bold"
                >
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.tenDoi} {t.khuVuc ? `(${t.khuVuc})` : ''} - Đội trưởng: {t.doiTruongTen || 'Đang phân công'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Vai trò trong đội *
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
                    Lương chính
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
                    Lương phụ
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
                  Tên ngân hàng thụ hưởng & Chi nhánh
                </label>
                <input
                  type="text"
                  value={formData.tenNganHang}
                  onChange={e => setFormData({ ...formData, tenNganHang: e.target.value })}
                  placeholder="VD: Techcombank - CN Bình Dương"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
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

      {/* Team Management Modal for Admin */}
      {isTeamModalOpen && canEdit && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto">
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
                    Tạo mới đội, phân bổ đội trưởng và phân nhóm nhân viên
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

            {/* List of existing teams */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Danh sách Đội hiện tại ({teams.length})
              </h3>
              {teams.map(team => {
                const memberCount = employees.filter(e => e.doiId === team.id).length;
                return (
                  <div
                    key={team.id}
                    className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
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
                        <span>Đội trưởng: <strong>{team.doiTruongTen || 'Chưa gán'}</strong></span>
                        <span>•</span>
                        <span>Số thành viên: <strong className="text-orange-600">{memberCount} người</strong></span>
                      </div>
                    </div>

                    {memberCount === 0 && teams.length > 1 && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Xoá đội ${team.tenDoi}?`)) {
                            deleteTeam(team.id);
                          }
                        }}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                        title="Xoá đội trống"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add Team Form */}
            <div className="pt-4 border-t border-stone-100">
              <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-orange-600" />
                Thêm Đội Bắt Gà mới
              </h3>
              <form onSubmit={handleCreateTeam} className="space-y-3 text-xs">
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
                      placeholder="VD: Đội 4 - Tân Uyên"
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      Tên Đội trưởng
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
                      placeholder="VD: Tân Uyên, Bình Dương"
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
                      placeholder="VD: Chuyên bắt gà đồi ban đêm"
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    Tạo đội mới
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
