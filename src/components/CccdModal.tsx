import React, { useState, useRef } from 'react';
import {
  X,
  CreditCard,
  Upload,
  Trash2,
  Download,
  Maximize2,
  Copy,
  Check,
  AlertCircle,
  FileCheck,
  ShieldCheck,
  RotateCw,
  Eye,
  Info,
} from 'lucide-react';
import { compressImageFileToDataUrl, formatCccdNumber } from '../utils/cccdHelper';

interface CccdModalProps {
  isOpen: boolean;
  onClose: () => void;
  hoTen: string;
  vaiTroLabel?: string;
  soCccd?: string;
  cccdNgayCap?: string;
  cccdNoiCap?: string;
  cccdMatTruoc?: string;
  cccdMatSau?: string;
  canEdit?: boolean;
  onSave?: (data: {
    soCccd?: string;
    cccdNgayCap?: string;
    cccdNoiCap?: string;
    cccdMatTruoc?: string;
    cccdMatSau?: string;
  }) => void;
}

export const CccdModal: React.FC<CccdModalProps> = ({
  isOpen,
  onClose,
  hoTen,
  vaiTroLabel,
  soCccd = '',
  cccdNgayCap = '',
  cccdNoiCap = '',
  cccdMatTruoc = '',
  cccdMatSau = '',
  canEdit = false,
  onSave,
}) => {
  const [activeSide, setActiveSide] = useState<'both' | 'front' | 'back'>('both');
  const [copied, setCopied] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<{ url: string; title: string } | null>(null);

  // Edit states if canEdit is enabled
  const [isEditing, setIsEditing] = useState(false);
  const [editSoCccd, setEditSoCccd] = useState(soCccd);
  const [editNgayCap, setEditNgayCap] = useState(cccdNgayCap);
  const [editNoiCap, setEditNoiCap] = useState(cccdNoiCap);
  const [editMatTruoc, setEditMatTruoc] = useState(cccdMatTruoc);
  const [editMatSau, setEditMatSau] = useState(cccdMatSau);
  const [isUploading, setIsUploading] = useState<'front' | 'back' | null>(null);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentMatTruoc = isEditing ? editMatTruoc : cccdMatTruoc;
  const currentMatSau = isEditing ? editMatSau : cccdMatSau;
  const currentSoCccd = isEditing ? editSoCccd : soCccd;
  const currentNgayCap = isEditing ? editNgayCap : cccdNgayCap;
  const currentNoiCap = isEditing ? editNoiCap : cccdNoiCap;

  const handleCopyNumber = () => {
    if (!currentSoCccd) return;
    navigator.clipboard.writeText(currentSoCccd.replace(/\s+/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = async (side: 'front' | 'back', file: File) => {
    try {
      setIsUploading(side);
      const dataUrl = await compressImageFileToDataUrl(file, 960, 640, 0.85);
      if (side === 'front') {
        setEditMatTruoc(dataUrl);
      } else {
        setEditMatSau(dataUrl);
      }
      // If not currently in explicit edit mode, auto-save if onSave provided
      if (!isEditing && onSave) {
        onSave({
          soCccd,
          cccdNgayCap,
          cccdNoiCap,
          cccdMatTruoc: side === 'front' ? dataUrl : cccdMatTruoc,
          cccdMatSau: side === 'back' ? dataUrl : cccdMatSau,
        });
      }
    } catch (err) {
      alert('Lỗi xử lý file ảnh: ' + (err as Error).message);
    } finally {
      setIsUploading(null);
    }
  };

  const handleDownload = (dataUrl: string, sideName: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `CCCD_${hoTen.replace(/\s+/g, '_')}_${sideName}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveModal = () => {
    if (onSave) {
      onSave({
        soCccd: editSoCccd.trim(),
        cccdNgayCap: editNgayCap,
        cccdNoiCap: editNoiCap.trim(),
        cccdMatTruoc: editMatTruoc,
        cccdMatSau: editMatSau,
      });
    }
    setIsEditing(false);
  };

  const hasBothPhotos = !!(currentMatTruoc && currentMatSau);
  const hasAtLeastOne = !!(currentMatTruoc || currentMatSau);

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  Căn cước công dân (CCCD) — {hoTen}
                </h2>
                {vaiTroLabel && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700">
                    {vaiTroLabel}
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Thông tin và hình ảnh 2 mặt CCCD phục vụ đối chiếu & chuyển khoản (Không bắt buộc)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && !isEditing && (
              <button
                type="button"
                onClick={() => {
                  setEditSoCccd(soCccd);
                  setEditNgayCap(cccdNgayCap);
                  setEditNoiCap(cccdNoiCap);
                  setEditMatTruoc(cccdMatTruoc);
                  setEditMatSau(cccdMatSau);
                  setIsEditing(true);
                }}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-stone-700"
              >
                Chỉnh sửa / Cập nhật
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Mode Tabs & Number Bar */}
        <div className="px-5 py-3 bg-stone-50 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="inline-flex p-1 bg-stone-200/70 rounded-xl text-xs font-bold text-stone-700">
              <button
                type="button"
                onClick={() => setActiveSide('both')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeSide === 'both' ? 'bg-white text-stone-900 shadow-2xs' : 'hover:text-stone-900'
                }`}
              >
                Cả 2 mặt
              </button>
              <button
                type="button"
                onClick={() => setActiveSide('front')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeSide === 'front' ? 'bg-white text-stone-900 shadow-2xs' : 'hover:text-stone-900'
                }`}
              >
                Mặt trước
              </button>
              <button
                type="button"
                onClick={() => setActiveSide('back')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeSide === 'back' ? 'bg-white text-stone-900 shadow-2xs' : 'hover:text-stone-900'
                }`}
              >
                Mặt sau
              </button>
            </div>

            <span
              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                hasBothPhotos
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : hasAtLeastOne
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-stone-100 text-stone-600 border-stone-200'
              }`}
            >
              {hasBothPhotos ? (
                <>
                  <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Đủ 2 mặt ảnh
                </>
              ) : hasAtLeastOne ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  Có 1 mặt ảnh
                </>
              ) : (
                <>Chưa có ảnh CCCD</>
              )}
            </span>
          </div>

          {/* Quick Copy CCCD Number */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500 font-medium">Số CCCD:</span>
            {currentSoCccd ? (
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-stone-200 shadow-2xs">
                <span className="font-mono font-bold text-xs text-stone-900">
                  {formatCccdNumber(currentSoCccd)}
                </span>
                <button
                  type="button"
                  onClick={handleCopyNumber}
                  className="p-1 text-stone-400 hover:text-stone-700 rounded-md transition-colors cursor-pointer"
                  title="Sao chép số CCCD"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ) : (
              <span className="text-xs text-stone-400 italic">Chưa cập nhật số CCCD</span>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* Edit Form Header if in Edit Mode */}
          {isEditing && (
            <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-orange-950 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-orange-600" />
                  Chỉnh sửa thông tin Căn cước công dân
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1 bg-white border border-stone-200 text-stone-700 text-xs font-bold rounded-lg hover:bg-stone-50 cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveModal}
                    className="px-3.5 py-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
                  >
                    Lưu thông tin
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Số CCCD (12 chữ số)
                  </label>
                  <input
                    type="text"
                    value={editSoCccd}
                    onChange={e => setEditSoCccd(e.target.value.replace(/[^\d\s]/g, ''))}
                    placeholder="VD: 079095012345"
                    maxLength={16}
                    className="w-full p-2 bg-white border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Ngày cấp CCCD
                  </label>
                  <input
                    type="date"
                    value={editNgayCap}
                    onChange={e => setEditNgayCap(e.target.value)}
                    className="w-full p-2 bg-white border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Nơi cấp
                  </label>
                  <input
                    type="text"
                    value={editNoiCap}
                    onChange={e => setEditNoiCap(e.target.value)}
                    placeholder="VD: Cục Cảnh sát QLHC về TTXH"
                    className="w-full p-2 bg-white border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Hidden File Inputs for quick upload */}
          <input
            type="file"
            ref={frontInputRef}
            accept="image/*"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload('front', file);
            }}
          />
          <input
            type="file"
            ref={backInputRef}
            accept="image/*"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload('back', file);
            }}
          />

          {/* Image Cards Display */}
          <div
            className={`grid gap-6 ${
              activeSide === 'both' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 max-w-xl mx-auto'
            }`}
          >
            {/* FRONT CARD (MẶT TRƯỚC) */}
            {(activeSide === 'both' || activeSide === 'front') && (
              <div className="bg-stone-50 rounded-2xl border border-stone-200 p-4 space-y-3 flex flex-col">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                    <span className="text-xs font-black uppercase text-stone-800 tracking-wider">
                      Mặt trước CCCD
                    </span>
                  </div>
                  {currentMatTruoc && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setFullscreenImage({
                            url: currentMatTruoc,
                            title: `Mặt trước CCCD — ${hoTen}`,
                          })
                        }
                        className="p-1 text-stone-500 hover:text-stone-800 hover:bg-stone-200/70 rounded-lg transition-colors cursor-pointer"
                        title="Phóng to ảnh"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownload(currentMatTruoc, 'MatTruoc')}
                        className="p-1 text-stone-500 hover:text-stone-800 hover:bg-stone-200/70 rounded-lg transition-colors cursor-pointer"
                        title="Tải ảnh về máy"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Xóa ảnh mặt trước CCCD này?')) {
                              setEditMatTruoc('');
                              if (!isEditing && onSave) {
                                onSave({
                                  soCccd,
                                  cccdNgayCap,
                                  cccdNoiCap,
                                  cccdMatTruoc: '',
                                  cccdMatSau,
                                });
                              }
                            }
                          }}
                          className="p-1 text-rose-500 hover:bg-rose-100/70 rounded-lg transition-colors cursor-pointer"
                          title="Xóa ảnh"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Canvas or Dropzone */}
                <div className="flex-1 flex flex-col items-center justify-center min-h-[220px]">
                  {currentMatTruoc ? (
                    <div className="relative group w-full rounded-xl overflow-hidden border border-stone-200 shadow-sm bg-white aspect-[1.58/1]">
                      <img
                        src={currentMatTruoc}
                        alt="CCCD Mặt trước"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain cursor-pointer transition-transform duration-300 group-hover:scale-[1.02]"
                        onClick={() =>
                          setFullscreenImage({
                            url: currentMatTruoc,
                            title: `Mặt trước CCCD — ${hoTen}`,
                          })
                        }
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setFullscreenImage({
                              url: currentMatTruoc,
                              title: `Mặt trước CCCD — ${hoTen}`,
                            })
                          }
                          className="px-3 py-1.5 bg-white/90 hover:bg-white text-stone-900 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Xem rõ
                        </button>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => frontInputRef.current?.click()}
                            className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            Đổi ảnh
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        if (canEdit) frontInputRef.current?.click();
                      }}
                      className={`w-full aspect-[1.58/1] rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center transition-all ${
                        canEdit
                          ? 'border-stone-300 hover:border-orange-500 hover:bg-orange-50/30 cursor-pointer'
                          : 'border-stone-200 bg-stone-100/50'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-stone-200 text-stone-400 flex items-center justify-center mb-2">
                        <CreditCard className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-stone-700">
                        Chưa có ảnh mặt trước
                      </span>
                      {canEdit ? (
                        <>
                          <p className="text-[11px] text-stone-400 mt-1">
                            Bấm để chọn file ảnh hoặc kéo thả vào đây
                          </p>
                          <button
                            type="button"
                            className="mt-3 px-3.5 py-1.5 bg-white border border-stone-300 hover:border-orange-500 text-orange-600 text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            {isUploading === 'front' ? 'Đang nén ảnh...' : 'Tải ảnh mặt trước'}
                          </button>
                        </>
                      ) : (
                        <p className="text-[11px] text-stone-400 mt-1">
                          Nhân viên hoặc Quản trị viên chưa cập nhật ảnh
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-stone-500 flex items-center justify-between pt-1">
                  <span>Mặt trước có: Ảnh chân dung, Số CCCD, Họ tên, Ngày sinh</span>
                  {currentMatTruoc && (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Đã lưu ảnh
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* BACK CARD (MẶT SAU) */}
            {(activeSide === 'both' || activeSide === 'back') && (
              <div className="bg-stone-50 rounded-2xl border border-stone-200 p-4 space-y-3 flex flex-col">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-xs font-black uppercase text-stone-800 tracking-wider">
                      Mặt sau CCCD
                    </span>
                  </div>
                  {currentMatSau && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setFullscreenImage({
                            url: currentMatSau,
                            title: `Mặt sau CCCD — ${hoTen}`,
                          })
                        }
                        className="p-1 text-stone-500 hover:text-stone-800 hover:bg-stone-200/70 rounded-lg transition-colors cursor-pointer"
                        title="Phóng to ảnh"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownload(currentMatSau, 'MatSau')}
                        className="p-1 text-stone-500 hover:text-stone-800 hover:bg-stone-200/70 rounded-lg transition-colors cursor-pointer"
                        title="Tải ảnh về máy"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Xóa ảnh mặt sau CCCD này?')) {
                              setEditMatSau('');
                              if (!isEditing && onSave) {
                                onSave({
                                  soCccd,
                                  cccdNgayCap,
                                  cccdNoiCap,
                                  cccdMatTruoc,
                                  cccdMatSau: '',
                                });
                              }
                            }
                          }}
                          className="p-1 text-rose-500 hover:bg-rose-100/70 rounded-lg transition-colors cursor-pointer"
                          title="Xóa ảnh"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Canvas or Dropzone */}
                <div className="flex-1 flex flex-col items-center justify-center min-h-[220px]">
                  {currentMatSau ? (
                    <div className="relative group w-full rounded-xl overflow-hidden border border-stone-200 shadow-sm bg-white aspect-[1.58/1]">
                      <img
                        src={currentMatSau}
                        alt="CCCD Mặt sau"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain cursor-pointer transition-transform duration-300 group-hover:scale-[1.02]"
                        onClick={() =>
                          setFullscreenImage({
                            url: currentMatSau,
                            title: `Mặt sau CCCD — ${hoTen}`,
                          })
                        }
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setFullscreenImage({
                              url: currentMatSau,
                              title: `Mặt sau CCCD — ${hoTen}`,
                            })
                          }
                          className="px-3 py-1.5 bg-white/90 hover:bg-white text-stone-900 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Xem rõ
                        </button>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => backInputRef.current?.click()}
                            className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            Đổi ảnh
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        if (canEdit) backInputRef.current?.click();
                      }}
                      className={`w-full aspect-[1.58/1] rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center transition-all ${
                        canEdit
                          ? 'border-stone-300 hover:border-orange-500 hover:bg-orange-50/30 cursor-pointer'
                          : 'border-stone-200 bg-stone-100/50'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-stone-200 text-stone-400 flex items-center justify-center mb-2">
                        <CreditCard className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-stone-700">
                        Chưa có ảnh mặt sau
                      </span>
                      {canEdit ? (
                        <>
                          <p className="text-[11px] text-stone-400 mt-1">
                            Bấm để chọn file ảnh hoặc kéo thả vào đây
                          </p>
                          <button
                            type="button"
                            className="mt-3 px-3.5 py-1.5 bg-white border border-stone-300 hover:border-orange-500 text-orange-600 text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            {isUploading === 'back' ? 'Đang nén ảnh...' : 'Tải ảnh mặt sau'}
                          </button>
                        </>
                      ) : (
                        <p className="text-[11px] text-stone-400 mt-1">
                          Nhân viên hoặc Quản trị viên chưa cập nhật ảnh
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-stone-500 flex items-center justify-between pt-1">
                  <span>Mặt sau có: Vân tay, Đặc điểm nhân dạng, Ngày cấp, Mã MRZ</span>
                  {currentMatSau && (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Đã lưu ảnh
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Legal / Informational Strip */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-800">Thông tin trích xuất:</span>
                <span className="font-mono text-stone-900 font-extrabold">
                  {currentSoCccd ? formatCccdNumber(currentSoCccd) : 'Chưa có số CCCD'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-stone-500 text-[11px]">
                <span>Ngày cấp: {currentNgayCap || 'Chưa cập nhật'}</span>
                <span>•</span>
                <span>Nơi cấp: {currentNoiCap || 'Cục Cảnh sát QLHC về TTXH'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-stone-400 text-[11px]">
              <Info className="w-4 h-4 text-stone-400 flex-shrink-0" />
              <span>Dữ liệu lưu trữ bảo mật cục bộ trên hệ thống COGAVA</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
          <span className="text-xs text-stone-500 italic">
            * Phần Căn cước công dân là tiện ích hỗ trợ, không bắt buộc điền
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs rounded-xl cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setFullscreenImage(null)}
        >
          <div className="w-full max-w-5xl flex items-center justify-between text-white pb-3">
            <span className="font-bold text-sm">{fullscreenImage.title}</span>
            <button
              type="button"
              onClick={() => setFullscreenImage(null)}
              className="p-2 text-stone-400 hover:text-white rounded-xl bg-stone-800/80 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="relative max-w-5xl max-h-[85vh] overflow-hidden rounded-2xl bg-stone-900 border border-stone-800 p-2">
            <img
              src={fullscreenImage.url}
              alt="Phóng to CCCD"
              referrerPolicy="no-referrer"
              className="max-h-[80vh] max-w-full object-contain rounded-xl"
              onClick={e => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};
