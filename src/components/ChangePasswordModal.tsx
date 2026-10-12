import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, KeyRound, X } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPassword: string;
  onSaveNewPassword: (newPass: string) => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  currentPassword,
  onSaveNewPassword
}) => {
  const [oldInput, setOldInput] = useState('');
  const [newInput, setNewInput] = useState('');
  const [confirmInput, setConfirmInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (oldInput.trim() !== currentPassword) {
      setErrorMsg('Mevcut şifre hatalı! Lütfen kontrol ediniz.');
      return;
    }

    if (!newInput.trim() || newInput.trim().length < 4) {
      setErrorMsg('Yeni şifre en az 4 karakter olmalıdır.');
      return;
    }

    if (newInput.trim() !== confirmInput.trim()) {
      setErrorMsg('Yeni şifre ile şifre tekrarı uyuşmuyor.');
      return;
    }

    onSaveNewPassword(newInput.trim());
    setSuccessMsg('Şifreniz başarıyla güncellendi!');
    setTimeout(() => {
      setSuccessMsg('');
      setOldInput('');
      setNewInput('');
      setConfirmInput('');
      onClose();
    }, 1200);
  };

  const handleResetToDefault = () => {
    onSaveNewPassword('abc123');
    setSuccessMsg('Şifre varsayılan başlangıç şifresine sıfırlandı!');
    setTimeout(() => {
      setSuccessMsg('');
      setOldInput('');
      setNewInput('');
      setConfirmInput('');
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 font-['Inter',sans-serif]">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Giriş Şifresini Değiştir</h3>
              <p className="text-xs text-slate-400">Sistem erişim şifrenizi güncelleyin</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-emerald-300 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2.5 text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Mevcut Şifre</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={oldInput}
              onChange={(e) => setOldInput(e.target.value)}
              placeholder="Mevcut şifrenizi giriniz..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-red-500 transition font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Yeni Şifre</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={newInput}
              onChange={(e) => setNewInput(e.target.value)}
              placeholder="Yeni şifrenizi giriniz..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-red-500 transition font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Yeni Şifre (Tekrar)</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder="Yeni şifrenizi tekrar giriniz..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-red-500 transition font-mono"
            />
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-slate-400 hover:text-slate-200 transition flex items-center gap-1.5"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPassword ? 'Şifreleri Gizle' : 'Şifreleri Göster'}</span>
            </button>

            <button
              type="button"
              onClick={handleResetToDefault}
              className="text-amber-400 hover:text-amber-300 underline font-medium"
            >
              Varsayılana Sıfırla
            </button>
          </div>

          <div className="flex items-center gap-2 pt-3 border-t border-slate-800 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow transition"
            >
              Şifreyi Güncelle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
