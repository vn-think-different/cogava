import React from 'react';
import { AlertTriangle, Trash2, X, Check } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  itemLabel?: string;
  itemName?: string;
  itemDetail?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Xác nhận xóa',
  cancelText = 'Hủy bỏ',
  type = 'danger',
  itemLabel,
  itemName,
  itemDetail,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  // Default item label based on modal purpose
  const defaultLabel =
    itemLabel ||
    (type === 'danger'
      ? 'Đối tượng thực hiện xóa:'
      : type === 'warning'
      ? 'Tài khoản / Đối tượng áp dụng:'
      : 'Thông tin xác nhận:');

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with Icon */}
        <div className="flex items-start gap-3.5">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
              type === 'danger'
                ? 'bg-rose-100 text-rose-600 border border-rose-200'
                : type === 'warning'
                ? 'bg-amber-100 text-amber-600 border border-amber-200'
                : 'bg-blue-100 text-blue-600 border border-blue-200'
            }`}
          >
            {type === 'danger' ? (
              <Trash2 className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-black text-stone-900 leading-snug">
              {title}
            </h2>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              {message}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Item highlighted box */}
        {itemName && (
          <div
            className={`p-3 rounded-xl space-y-1 border ${
              type === 'danger'
                ? 'bg-rose-50/70 border-rose-200'
                : type === 'warning'
                ? 'bg-amber-50/70 border-amber-200'
                : 'bg-blue-50/70 border-blue-200'
            }`}
          >
            <div
              className={`text-[11px] font-bold uppercase tracking-wider ${
                type === 'danger'
                  ? 'text-rose-800'
                  : type === 'warning'
                  ? 'text-amber-800'
                  : 'text-blue-800'
              }`}
            >
              {defaultLabel}
            </div>
            <div className="text-sm font-extrabold text-stone-900 break-words">
              {itemName}
            </div>
            {itemDetail && (
              <div className="text-xs text-stone-600 font-medium">
                {itemDetail}
              </div>
            )}
          </div>
        )}

        <div className="text-[11px] text-stone-500 bg-stone-50 p-2.5 rounded-lg border border-stone-200 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
          <span>Hành động này sẽ ghi lại nhật ký kiểm toán hệ thống.</span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-white font-bold rounded-xl text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
              type === 'danger'
                ? 'bg-rose-600 hover:bg-rose-700'
                : type === 'warning'
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {type === 'danger' ? <Trash2 className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
