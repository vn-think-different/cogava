import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { HanhDongAudit } from '../types';
import {
  History,
  ShieldCheck,
  Search,
  Filter,
  ArrowRight,
  Clock,
  User,
  Database,
} from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const { auditLogs } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  const filteredLogs = auditLogs.filter(log => {
    const matchSearch =
      log.moTa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.nguoiThucHien.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.bang.toLowerCase().includes(searchTerm.toLowerCase());
    const matchAction = actionFilter === 'ALL' || log.hanhDong === actionFilter;
    return matchSearch && matchAction;
  });

  const getActionBadge = (action: HanhDongAudit) => {
    switch (action) {
      case 'TAO':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            TẠO MỚI
          </span>
        );
      case 'SUA':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
            CẬP NHẬT
          </span>
        );
      case 'XOA':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            XOÁ
          </span>
        );
      case 'CHOT_SO':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            CHỐT SỔ
          </span>
        );
      case 'MO_LAI':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
            MỞ LẠI SỔ
          </span>
        );
      case 'CAP_NHAT_CAU_HINH':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
            CẤU HÌNH
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-stone-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-black text-stone-900 flex items-center gap-2">
              <History className="w-5 h-5 text-orange-600" />
              Nhật ký kiểm toán & Thay đổi dữ liệu (Audit Log)
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Ghi nhận toàn bộ thao tác: ai sửa, sửa gì, khi nào, giá trị cũ → giá trị mới
            </p>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-100 text-stone-700 text-xs font-bold rounded-xl border border-stone-200">
            <ShieldCheck className="w-4 h-4 text-orange-600" />
            Chế độ Quản trị viên
          </span>
        </div>

        {/* Filter Controls */}
        <div className="mt-4 pt-4 border-t border-stone-100 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full md:max-w-md">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm nhật ký..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-3.5 h-3.5 text-stone-500" />
            <select
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              className="text-xs py-1.5 px-3 bg-stone-50 border border-stone-200 rounded-xl font-medium cursor-pointer"
            >
              <option value="ALL">Tất cả hành động</option>
              <option value="TAO">Tạo mới</option>
              <option value="SUA">Cập nhật</option>
              <option value="XOA">Xoá</option>
              <option value="CHOT_SO">Chốt sổ</option>
              <option value="MO_LAI">Mở lại sổ</option>
              <option value="CAP_NHAT_CAU_HINH">Đổi cấu hình</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-700 font-bold uppercase tracking-wider border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4">Người thực hiện</th>
                <th className="py-3 px-4">Hành động</th>
                <th className="py-3 px-4">Đối tượng</th>
                <th className="py-3 px-4">Mô tả chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-stone-50/70 transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap font-mono text-stone-500">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-stone-400" />
                      {log.thoiGian}
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap font-bold text-stone-800">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-stone-400" />
                      {log.nguoiThucHien}
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {getActionBadge(log.hanhDong)}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap font-mono text-stone-600">
                    <div className="flex items-center gap-1">
                      <Database className="w-3 h-3 text-stone-400" />
                      {log.bang}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-stone-800 leading-relaxed">
                    <div>{log.moTa}</div>
                    {(log.giaTriCu || log.giaTriMoi) && (
                      <div className="mt-1 text-[11px] text-stone-500 font-mono bg-stone-50 p-1.5 rounded-lg border border-stone-200/50">
                        {log.giaTriCu && (
                          <span className="text-rose-700">
                            Cũ: {JSON.stringify(log.giaTriCu)}{' '}
                          </span>
                        )}
                        {log.giaTriCu && log.giaTriMoi && <span>→ </span>}
                        {log.giaTriMoi && (
                          <span className="text-emerald-700">
                            Mới: {JSON.stringify(log.giaTriMoi)}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
