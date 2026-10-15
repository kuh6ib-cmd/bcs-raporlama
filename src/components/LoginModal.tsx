import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  AlertCircle, 
  ArrowRight, 
  CheckCircle2, 
  UserPlus, 
  LogIn, 
  Sparkles,
  KeyRound,
  ShieldAlert,
  UserCheck,
  Mail,
  Send,
  Clock,
  XCircle,
  Inbox,
  ExternalLink,
  Copy,
  Check,
  Link as LinkIcon
} from 'lucide-react';
import { UserAccount, UserRole } from '../types';

interface LoginModalProps {
  accounts: UserAccount[];
  onLoginSuccess: (user: UserAccount, rememberMe: boolean) => void;
  onRegisterAccount?: (newAccount: UserAccount) => void;
  onApproveUser?: (userId: string) => void;
  initialTab?: 'login' | 'register';
}

export const LoginModal: React.FC<LoginModalProps> = ({ 
  accounts, 
  onLoginSuccess, 
  onRegisterAccount,
  onApproveUser,
  onOpenEmailModal,
  initialTab = 'login' 
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);

  // Login Form States
  const [usernameInput, setUsernameInput] = useState('admin');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register Form States
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regRole, setRegRole] = useState<UserRole>('FIELD_OPERATIONS');
  const [regDescription, setRegDescription] = useState('');

  // Status & Feedback States
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [rejectedNoticeUser, setRejectedNoticeUser] = useState<UserAccount | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showOutlookDraft, setShowOutlookDraft] = useState(false);

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  // Handle Login Submit
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setRejectedNoticeUser(null);

    if (!usernameInput.trim()) {
      setErrorMsg('Lütfen kullanıcı adını giriniz.');
      triggerShake();
      return;
    }

    if (!passwordInput.trim()) {
      setErrorMsg('Lütfen şifre giriniz.');
      triggerShake();
      return;
    }

    const matchedUser = accounts.find(
      (u) => u.username.toLowerCase().trim() === usernameInput.trim().toLowerCase()
    );

    if (!matchedUser) {
      setErrorMsg('Kullanıcı bulunamadı. Kullanıcı adını kontrol ediniz veya "Kayıt Ol" sekmesinden yeni hesap oluşturunuz.');
      triggerShake();
      return;
    }

    if (matchedUser.password !== passwordInput.trim()) {
      setErrorMsg('Hatalı şifre! Lütfen şifrenizi kontrol ediniz.');
      triggerShake();
      return;
    }

    if (matchedUser.status === 'PENDING_APPROVAL') {
      setErrorMsg(
        '⚠️ Bu hesap henüz ONAY BEKLİYOR! Yönetici onayı sonrasında sisteme giriş yapabileceksiniz.'
      );
      triggerShake();
      return;
    }

    if (matchedUser.status === 'REJECTED') {
      setRejectedNoticeUser(matchedUser);
      setErrorMsg(
        `🚫 Bu hesap başvurusu REDDEDİLMİŞTİR! "${matchedUser.email || matchedUser.username}" adresine ret tebliği gönderilmiştir. Gerekçe: ${matchedUser.rejectionReason || 'Kriterlere uygun görülmedi'}. Sisteme erişim yetkiniz bulunmamaktadır.`
      );
      triggerShake();
      return;
    }

    onLoginSuccess(matchedUser, rememberMe);
  };

  // Handle Register Submit
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setRejectedNoticeUser(null);

    const cleanUsername = regUsername.toLowerCase().trim().replace(/[^a-z0-9_.-]/g, '');
    const cleanFullName = regFullName.trim();
    const cleanEmail = regEmail.toLowerCase().trim();
    const cleanPass = regPassword.trim();

    if (!cleanFullName) {
      setErrorMsg('Lütfen Ad & Soyad veya Unvan giriniz.');
      triggerShake();
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMsg('Lütfen geçerli bir e-posta adresi giriniz (Örn: adiniz@bosch.com).');
      triggerShake();
      return;
    }

    if (!cleanUsername || cleanUsername.length < 3) {
      setErrorMsg('Kullanıcı adı en az 3 karakter olmalı ve Türkçe/özel boşluk karakter içermemelidir.');
      triggerShake();
      return;
    }

    // Check uniqueness
    const exists = accounts.some(
      (u) => u.username.toLowerCase().trim() === cleanUsername
    );
    if (exists) {
      setErrorMsg(`"${cleanUsername}" kullanıcı adı zaten kayıtlı! Lütfen farklı bir kullanıcı adı seçiniz.`);
      triggerShake();
      return;
    }

    if (!cleanPass || cleanPass.length < 4) {
      setErrorMsg('Şifre en az 4 karakter uzunluğunda olmalıdır.');
      triggerShake();
      return;
    }

    if (cleanPass !== regPasswordConfirm.trim()) {
      setErrorMsg('Girdiğiniz şifreler eşleşmiyor! Lütfen iki kutuya da aynı şifreyi yazınız.');
      triggerShake();
      return;
    }

    // Configure permissions based on role
    let roleName = 'Saha & Operasyon (Fiyatlar Kısıtlı)';
    let permissions = {
      canViewPricing: false,
      canExportExcel: true,
      canEditServiceCatalog: false,
      canEditDealerList: false,
      canViewDroppedRows: true
    };

    if (regRole === 'ADMIN') {
      roleName = 'Yönetici (Tam Yetkili)';
      permissions = {
        canViewPricing: true,
        canExportExcel: true,
        canEditServiceCatalog: true,
        canEditDealerList: true,
        canViewDroppedRows: true
      };
    } else if (regRole === 'REGIONAL_MANAGER') {
      roleName = 'Bölge Yöneticisi';
      permissions = {
        canViewPricing: true,
        canExportExcel: true,
        canEditServiceCatalog: false,
        canEditDealerList: false,
        canViewDroppedRows: true
      };
    }

    const newAccount: UserAccount = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      username: cleanUsername,
      name: cleanFullName,
      email: cleanEmail,
      password: cleanPass,
      role: regRole,
      roleName,
      description: regDescription.trim() || `${cleanFullName} (${roleName}) kullanıcı hesabı`,
      permissions,
      status: 'PENDING_APPROVAL',
      createdAt: new Date().toISOString()
    };

    if (onRegisterAccount) {
      onRegisterAccount(newAccount);
    }

    setSuccessMsg(
      `"${cleanUsername}" hesabı oluşturuldu ve yönetici onayı bekleniyor durumuna alındı.`
    );
    setUsernameInput(cleanUsername);
    setPasswordInput(cleanPass);
    setActiveTab('login');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-4 font-['Inter',sans-serif] overflow-y-auto">
      {/* Background Ambient Lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <div className={`w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 my-auto transition-transform ${
        isShaking ? 'animate-[bounce_0.2s_ease-in-out_2]' : ''
      }`}>
        {/* Quick Email & Approval Center Link */}
        {onOpenEmailModal && (
          <div className="flex justify-end mb-2">
            <button
              type="button"
              onClick={onOpenEmailModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-950/60 hover:bg-blue-900/80 border border-blue-500/40 text-[11px] font-bold text-blue-300 hover:text-white transition shadow-sm"
              title="Yönetici E-Postalarını ve Gelen Onay İsteklerini Gör"
            >
              <Inbox className="w-3.5 h-3.5 text-blue-400" />
              <span>E-Posta &amp; Onay Masası</span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Header Badge */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 via-red-500 to-amber-500 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-red-600/30 mb-2.5">
            <span>BCS</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Güvenli Yetkilendirme &amp; E-Posta Onay Portalı</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            My BCS Sistem Portalı
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed max-w-sm">
            {activeTab === 'login' 
              ? 'Hesabınızla giriş yapınız veya yeni hesap başvurusunda bulununuz.' 
              : 'Yeni kayıt oluşturarak hemen sisteme giriş yapabilirsiniz.'}
          </p>
        </div>

        {/* Tab Switcher: Giriş Yap / Kayıt Ol */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-950 border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMsg('');
              setSuccessMsg('');
              setRejectedNoticeUser(null);
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'login'
                ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md shadow-red-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Giriş Yap</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setErrorMsg('');
              setSuccessMsg('');
              setRejectedNoticeUser(null);
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'register'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Yeni Kayıt Ol</span>
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs animate-fadeIn flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium leading-relaxed">{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs animate-fadeIn flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* TAB 1: GİRİŞ YAP FORM */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-red-400" />
                Kullanıcı Adı
              </label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => {
                  setUsernameInput(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="Örn: admin, saha veya yeni kullanıcı adı"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-red-400" />
                Şifre
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="Şifrenizi giriniz..."
                  className="w-full pl-4 pr-11 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition p-1"
                  title={showPassword ? 'Şifreyi Gizle' : 'Şifreyi Göster'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200 transition">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-red-600 focus:ring-red-500 focus:ring-offset-slate-900"
                />
                <span>Beni Hatırla (Oturumu Sakla)</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-lg shadow-red-600/30 transition flex items-center justify-center gap-2 group active:scale-[0.99]"
            >
              <span>Panele Giriş Yap</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </form>
        )}

        {/* TAB 2: KAYIT OL FORM */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                Ad Soyad / Unvan
              </label>
              <input
                type="text"
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                placeholder="Örn: Ahmet Yılmaz (Operasyon Sorumlusu)"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                E-Posta Adresi
              </label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="ahmet@bosch.com"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  Kullanıcı Adı (Giriş ID)
                </label>
                <input
                  type="text"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="Örn: ahmetyilmaz"
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
                  Erişim Rolü &amp; Yetki
                </label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as UserRole)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-blue-500"
                >
                  <option value="FIELD_OPERATIONS">📊 Saha &amp; Operasyon (Fiyatlar Gizli)</option>
                  <option value="ADMIN">🛡️ Yönetici (Admin - Tam Yetkili)</option>
                  <option value="REGIONAL_MANAGER">🗺️ Bölge Yöneticisi (Fiyatlar Görünür)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-400" />
                  Şifre Belirleyin
                </label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="En az 4 karakter"
                    className="w-full pl-3 pr-8 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                  >
                    {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                  Şifre Tekrarı
                </label>
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  value={regPasswordConfirm}
                  onChange={(e) => setRegPasswordConfirm(e.target.value)}
                  placeholder="Şifreyi tekrar yazınız"
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <span>Açıklama / Görev Notu (Opsiyonel)</span>
              </label>
              <input
                type="text"
                value={regDescription}
                onChange={(e) => setRegDescription(e.target.value)}
                placeholder="Örn: Saha operasyonları ve randevu takibi için yetki talep ediyorum"
                className="w-full px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 group active:scale-[0.99] mt-1"
            >
              <Send className="w-4 h-4" />
              <span>Başvuruyu Tamamla &amp; Onay Maili Gönder</span>
            </button>
          </form>
        )}

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3 text-red-400" />
          <span>BOSCH &copy; BCS Servis Ağı Yönetim &amp; Yetki Portalı</span>
        </div>
      </div>
    </div>
  );
};
