import React from 'react';
import { BangChamCongNgay, NhanVien, ThongTinDoanhNghiep } from '../types';
import { docSoTienThanhChu, formatDateVN, formatNumber, formatVND, getDayOfWeekVN } from '../utils/formatters';
import { Printer, X, Building2, Phone, Calendar, User, CreditCard } from 'lucide-react';
import { Logo } from './Logo';

interface PayslipModalProps {
  employee: NhanVien;
  month: string; // YYYY-MM
  records: BangChamCongNgay[];
  companyInfo: ThongTinDoanhNghiep;
  onClose: () => void;
}

export const PayslipModal: React.FC<PayslipModalProps> = ({
  employee,
  month,
  records,
  companyInfo,
  onClose,
}) => {
  // Filter records for this month and where employee was present
  const monthRecords = records
    .filter(r => r.ngay.startsWith(month))
    .sort((a, b) => a.ngay.localeCompare(b.ngay));

  const workDays = monthRecords.map(rec => {
    const detail = rec.chiTiet.find(c => c.nhanVienId === employee.id);
    return {
      record: rec,
      coMat: !!detail?.coMat,
      luong: detail?.luongNhanDuoc || 0,
    };
  });

  const presentDays = workDays.filter(d => d.coMat);
  const totalDays = presentDays.length;
  const totalSalary = presentDays.reduce((sum, d) => sum + d.luong, 0);

  const [yearStr, monthStr] = month.split('-');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-stone-200 overflow-hidden my-auto">
        {/* Modal Top Action Bar (hidden when printing) */}
        <div className="p-4 bg-stone-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
              Xem trước phiếu lương
            </span>
            <span className="text-stone-400 text-xs">|</span>
            <span className="text-stone-200 text-xs font-medium">
              {employee.hoTen} — Tháng {monthStr}/{yearStr}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              id="btn-print-payslip"
              className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              In phiếu / Xuất PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Payslip Body */}
        <div className="p-6 sm:p-8 bg-white printable-area text-stone-900 space-y-6">
          {/* Company Header */}
          <div className="flex items-start justify-between border-b-2 border-stone-800 pb-4">
            <div className="flex items-center gap-3">
              <Logo size={42} showText={false} />
              <div>
                <h1 className="text-lg font-black text-stone-900 tracking-tight leading-tight">
                  {companyInfo.tenCongTy}
                </h1>
                <p className="text-xs text-stone-600">
                  {companyInfo.vanPhong}
                </p>
                <div className="text-[11px] text-stone-500 flex items-center gap-3 mt-0.5 font-mono">
                  <span>MST: {companyInfo.mst}</span>
                  <span>Hotline: {companyInfo.hotline[0]}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-1 bg-orange-100 text-orange-800 rounded-md text-xs font-extrabold uppercase tracking-wider border border-orange-200">
                Kỳ lương {monthStr}/{yearStr}
              </span>
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-1">
            <h2 className="text-xl font-black uppercase tracking-wider text-stone-900">
              PHIẾU LƯƠNG NHÂN VIÊN
            </h2>
            <p className="text-xs text-stone-500 italic">
              (Thanh toán theo sản lượng gà bắt thực tế trong kỳ)
            </p>
          </div>

          {/* Employee Info Box */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-xs">
            <div>
              <span className="text-stone-500 block">Họ và tên:</span>
              <span className="font-extrabold text-sm text-stone-900">{employee.hoTen}</span>
            </div>
            <div>
              <span className="text-stone-500 block">Vai trò trong đội:</span>
              <span className="font-bold text-orange-700">
                {employee.vaiTro === 'CHINH' ? 'Lương chính' : 'Lương phụ'}
              </span>
            </div>
            <div>
              <span className="text-stone-500 block">Số điện thoại:</span>
              <span className="font-mono font-medium text-stone-800">{employee.sdt || '—'}</span>
            </div>
            <div className="col-span-2 sm:col-span-3">
              <span className="text-stone-500 block">Tài khoản ngân hàng thụ hưởng:</span>
              <span className="font-mono font-bold text-stone-900">
                {employee.tenNganHang ? `${employee.tenNganHang} — ${employee.stkNganHang}` : 'Chưa cập nhật'}
              </span>
            </div>
          </div>

          {/* Table of Daily Work */}
          <div>
            <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Bảng kê chi tiết ngày công & tiền lương:
            </h3>
            <div className="border border-stone-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200">
                  <tr>
                    <th className="py-2 px-3">Ngày</th>
                    <th className="py-2 px-3">Thứ</th>
                    <th className="py-2 px-3 text-right">Sản lượng đội (con)</th>
                    <th className="py-2 px-3 text-center">Chấm công</th>
                    <th className="py-2 px-3 text-right">Tiền lương ngày</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {workDays.map((item, idx) => (
                    <tr
                      key={item.record.id}
                      className={item.coMat ? 'bg-white' : 'bg-stone-50/50 text-stone-400'}
                    >
                      <td className="py-1.5 px-3 font-mono">{formatDateVN(item.record.ngay)}</td>
                      <td className="py-1.5 px-3">{getDayOfWeekVN(item.record.ngay)}</td>
                      <td className="py-1.5 px-3 text-right font-mono">
                        {formatNumber(item.record.soGaBatDuoc)}
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        {item.coMat ? (
                          <span className="text-emerald-700 font-bold">Đi làm (x)</span>
                        ) : (
                          <span className="text-stone-400 italic">Vắng</span>
                        )}
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold">
                        {item.coMat ? formatVND(item.luong) : '0 đ'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals & In-Words Summary */}
          <div className="p-4 bg-orange-50/80 border border-orange-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-stone-700">Tổng số ngày công trong tháng:</span>
              <span className="font-extrabold text-orange-900 font-mono text-base">
                {totalDays} ngày công
              </span>
            </div>
            <div className="flex items-center justify-between text-base border-t border-orange-200 pt-2">
              <span className="font-black text-stone-900">TỔNG LƯƠNG THỰC NHẬN:</span>
              <span className="font-black text-xl text-orange-600 font-mono">
                {formatVND(totalSalary)}
              </span>
            </div>
            <div className="text-xs text-stone-600 italic border-t border-orange-200/60 pt-1.5">
              <span className="font-semibold not-italic text-stone-800">Bằng chữ: </span>
              {docSoTienThanhChu(totalSalary)}
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-4 pt-4 text-center text-xs">
            <div className="space-y-12">
              <span className="font-bold text-stone-800 block">NGƯỜI LẬP BIỂU</span>
              <span className="text-stone-400 text-[11px] block">(Ký & ghi rõ họ tên)</span>
            </div>
            <div className="space-y-12">
              <span className="font-bold text-stone-800 block">KẾ TOÁN / QUẢN LÝ</span>
              <span className="text-stone-400 text-[11px] block">(Ký & ghi rõ họ tên)</span>
            </div>
            <div className="space-y-12">
              <span className="font-bold text-stone-800 block">NGƯỜI NHẬN TIỀN</span>
              <span className="text-stone-900 font-bold block">{employee.hoTen}</span>
            </div>
          </div>

          {/* Print Footer note */}
          <div className="text-center text-[10px] text-stone-400 pt-6 border-t border-stone-100">
            Hệ thống Quản lý Chấm công & Tính lương CÔNG TY TNHH COGAVA — Xuất ngày {formatDateVN(new Date().toISOString().substring(0, 10))}
          </div>
        </div>
      </div>
    </div>
  );
};
