import React, { useState, useEffect } from 'react';
import {
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  UserCheck,
  UserX,
  AlertTriangle,
  Send,
  Inbox,
  ArrowRight,
  ExternalLink,
  Search,
  RefreshCw,
  Eye,
  FileText,
  Building2,
  BadgeCheck,
  X,
  Copy,
  Check
} from 'lucide-react';
import { UserAccount, EmailNotification } from '../types';
import { 
  getStoredEmails, 
  getApprovalLink,
  getMailtoUrl, 
  getOutlookWebUrl, 
  getGmailWebUrl 
} from '../utils/notificationEngine';

interface EmailApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: UserAccount[];
  onApproveUser: (userId: string) => void;
  onRejectUser: (userId: string, reason?: string) => void;
  currentUser?: UserAccount | null;
  initialTab?: 'pending' | 'emails' | 'all';
}

export const EmailApprovalModal: React.FC<EmailApprovalModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onApproveUser,
  onRejectUser,
  currentUser,
  initialTab = 'pending'
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'emails' | 'all'>(initialTab);
  const [emails, setEmails] = useState<EmailNotification[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailNotification | null>(null);
  const [rejectingUserId, setRejectingUserId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);

  // Reload emails when opened or accounts change
  useEffect(() => {
    if (isOpen) {
      const stored = getStoredEmails();
      setEmails(stored);
      if (stored.length > 0 && !selectedEmail) {
        setSelectedEmail(stored[0]);
      }
    }
  }, [isOpen, accounts]);

  if (!isOpen) return null;

  const pendingUsers = accounts.filter((a) => a.status === 'PENDING_APPROVAL');
  const rejectedUsers = accounts.filter((a) => a.status === 'REJECTED');
  const approvedUsers = accounts.filter((a) => a.status === 'APPROVED');

  const handleApprove = (userId: string) => {
    onApproveUser(userId);
    setTimeout(() => {
      setEmails(getStoredEmails());
    }, 200);
  };

  const handleStartReject = (userId: string) => {
    setRejectingUserId(userId);
    setRejectionReason('Firma ve rol yetkilendirme prosedürlerine uygun bulunmamıştır.');
  };

  const handleConfirmReject = (userId: string) => {
    onRejectUser(userId, rejectionReason);
    setRejectingUserId(null);
    setRejectionReason('');
    setTimeout(() => {
      setEmails(getStoredEmails());
    }, 200);
  };

  const filteredEmails = emails.filter((em) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      em.subject.toLowerCase().includes(q) ||
      em.to.toLowerCase().includes(q) ||
      em.from.toLowerCase().includes(q) ||
      em.body.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-6 font-['Inter',sans-serif] overflow-y-auto">
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">E-Posta &amp; Kayıt Onay Masası</h3>
                {pendingUsers.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold animate-pulse">
                    {pendingUsers.length} Onay Bekliyor
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Yeni kayıt başvuruları, yönetici onay akışı ve giden/gelen e-posta bildirimleri
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'pending'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Onay Bekleyenler</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              pendingUsers.length > 0 ? 'bg-amber-500/30 text-amber-300' : 'bg-slate-800 text-slate-400'
            }`}>
              {pendingUsers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('emails')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'emails'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>E-Posta Kutusu &amp; İletiler</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
              {emails.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'all'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Tüm Hesaplar ({accounts.length})</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-900/60">
          {/* TAB 1: PENDING APPROVALS */}
          {activeTab === 'pending' && (
            <div className="space-y-4">
              <div className="bg-amber-950/20 border border-amber-600/30 rounded-xl p-3.5 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-200/90 leading-relaxed">
                  <span className="font-bold text-amber-300">Yönetici Onay Kuralı:</span> Yeni kayıt olan kullanıcılar sisteme onay verilene kadar <strong>giriş yapamazlar</strong>. Onaylandığında otomatik olarak aktifleşir ve e-posta adreslerine onay maili gider. Reddedilirse "Reddedildi" maili iletilir ve giriş engellenir.
                </div>
              </div>

              {pendingUsers.length === 0 ? (
                <div className="text-center py-12 px-4 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500/40 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-300">Şu anda onay bekleyen yeni kayıt başvurusu bulunmamaktadır.</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Giriş ekranındaki "Kayıt Ol" sekmesinden yeni kullanıcı eklendiğinde burada onayınıza sunulacaktır.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {pendingUsers.map((user) => (
                    <div
                      key={user.id}
                      className="bg-slate-800/70 border border-slate-700 hover:border-slate-600 rounded-xl p-4 sm:p-5 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-bold text-white">{user.name}</span>
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                            @{user.username}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            {user.roleName}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Onay Bekliyor
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-300">
                          <div>
                            <span className="text-slate-400">Kullanıcı E-Postası:</span>{' '}
                            <span className="text-blue-300 font-semibold">{user.email || 'Belirtilmedi'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Onay Bildirimi Giden Mail:</span>{' '}
                            <span className="text-amber-300 font-semibold">{user.approverEmail || 'kuh6ib@bosch.com'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Başvuru Tarihi:</span>{' '}
                            <span className="text-slate-300">{new Date(user.createdAt || Date.now()).toLocaleString('tr-TR')}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Fiyat Yetkisi:</span>{' '}
                            <span className={user.permissions.canViewPricing ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                              {user.permissions.canViewPricing ? 'Fiyatlar Açık' : 'Fiyatlar Gizli (Kısıtlı)'}
                            </span>
                          </div>
                        </div>

                        {user.description && (
                          <div className="text-xs text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800 italic">
                            "{user.description}"
                          </div>
                        )}

                        {/* Direct Approval Link Bar */}
                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-2 text-xs">
                          <span className="text-[11px] font-mono text-cyan-300 truncate select-all">
                            🔗 Onay Linki: {getApprovalLink(user)}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(getApprovalLink(user));
                              setCopiedUserId(user.id);
                              setTimeout(() => setCopiedUserId(null), 2000);
                            }}
                            className="shrink-0 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold border border-slate-700 flex items-center gap-1 transition"
                          >
                            {copiedUserId === user.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-300">Kopyalandı</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-slate-400" />
                                <span>Linki Kopyala</span>
                              </>
                            )}
                          </button>
                        </div>

                        {rejectingUserId === user.id && (
                          <div className="p-3 bg-red-950/30 border border-red-500/30 rounded-xl space-y-2 mt-2">
                            <label className="text-xs font-semibold text-red-300 block">
                              Ret Gerekçesi (Kullanıcıya mail ile iletilecektir):
                            </label>
                            <input
                              type="text"
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              className="w-full bg-slate-900 border border-red-500/40 rounded-lg px-3 py-1.5 text-xs text-white"
                              placeholder="Ret gerekçesi yazınız..."
                            />
                            <div className="flex gap-2 justify-end">
                              <button
                                type="button"
                                onClick={() => setRejectingUserId(null)}
                                className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                              >
                                Vazgeç
                              </button>
                              <button
                                type="button"
                                onClick={() => handleConfirmReject(user.id)}
                                className="px-3 py-1 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-500 text-white"
                              >
                                Reddet ve Mail Gönder
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {rejectingUserId !== user.id && (
                        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartReject(user.id)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-red-300 bg-red-950/60 hover:bg-red-900/80 border border-red-700/50 transition"
                          >
                            <XCircle className="w-4 h-4 text-red-400" />
                            <span>Reddet</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleApprove(user.id)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 transition"
                          >
                            <CheckCircle2 className="w-4 h-4 text-white" />
                            <span>Onayla (Çalışabilir)</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EMAIL INBOX & LOGS */}
          {activeTab === 'emails' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full">
              {/* Email List Left Column */}
              <div className="lg:col-span-5 flex flex-col space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="E-postalar içinde ara..."
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2 overflow-y-auto max-h-[500px] pr-1">
                  {filteredEmails.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-500">
                      Henüz e-posta bildirimi kaydı yok.
                    </div>
                  ) : (
                    filteredEmails.map((email) => {
                      const isSelected = selectedEmail?.id === email.id;
                      const isApproval = email.type === 'APPROVAL_REQUEST';
                      const isApproved = email.type === 'REGISTRATION_APPROVED';
                      const isRejected = email.type === 'REGISTRATION_REJECTED';

                      return (
                        <div
                          key={email.id}
                          onClick={() => setSelectedEmail(email)}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                            isSelected
                              ? 'bg-blue-950/40 border-blue-500/50 shadow-md'
                              : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/70 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="font-semibold text-slate-300 truncate max-w-[170px]">
                              {isApproval ? 'Amir Bildirimi ➔ ' : 'Kullanıcıya ➔ '} {email.to}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {new Date(email.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div className="text-xs font-bold text-white truncate flex items-center gap-1.5 mb-1">
                            {isApproved && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                            {isRejected && <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                            {isApproval && <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                            <span className="truncate">{email.subject}</span>
                          </div>

                          <p className="text-[11px] text-slate-400 line-clamp-2">
                            {email.body.replace(/\n/g, ' ')}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Email Detail Right Column */}
              <div className="lg:col-span-7 bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                {selectedEmail ? (
                  <div className="space-y-4">
                    {/* Mail Header Box */}
                    <div className="border-b border-slate-800 pb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                          {selectedEmail.type === 'APPROVAL_REQUEST' && 'Onay Bekleme İletisi'}
                          {selectedEmail.type === 'REGISTRATION_APPROVED' && 'Onay Tebliğ İletisi'}
                          {selectedEmail.type === 'REGISTRATION_REJECTED' && 'Ret Tebliğ İletisi'}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {new Date(selectedEmail.timestamp).toLocaleString('tr-TR')}
                        </span>
                      </div>

                      <h4 className="text-sm sm:text-base font-bold text-white mb-2">
                        {selectedEmail.subject}
                      </h4>

                      <div className="space-y-1 text-xs">
                        <div className="flex gap-2">
                          <span className="text-slate-500 w-16">Kimden:</span>
                          <span className="text-slate-300 font-mono">{selectedEmail.from}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-slate-500 w-16">Kime:</span>
                          <span className="text-blue-400 font-mono font-semibold">{selectedEmail.to}</span>
                        </div>
                      </div>
                    </div>

                    {/* Mail Body */}
                    <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-[260px] overflow-y-auto">
                      {selectedEmail.body}
                    </div>

                    {/* Real Email Dispatch Actions & Copy */}
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                          <Send className="w-3.5 h-3.5 text-blue-400" />
                          Gerçek E-Posta Gönderim Seçenekleri:
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedEmail.body);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                        >
                          {copied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-300">Metin Kopyalandı</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-slate-400" />
                              <span>Metni Kopyala</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <a
                          href={getMailtoUrl(selectedEmail.to, selectedEmail.subject, selectedEmail.body)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition text-center"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Outlook / İstemcide Aç</span>
                        </a>

                        <a
                          href={getOutlookWebUrl(selectedEmail.to, selectedEmail.subject, selectedEmail.body)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition text-center"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Outlook Web (365)</span>
                        </a>

                        <a
                          href={getGmailWebUrl(selectedEmail.to, selectedEmail.subject, selectedEmail.body)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-red-300 border border-red-500/30 text-xs font-semibold transition text-center"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Gmail ile Gönder</span>
                        </a>
                      </div>

                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        ℹ️ Bu butonlarla kurumsal Outlook veya webmail istemcinizi alıcı ({selectedEmail.to}), konu ve hazır metin dolu şekilde açıp doğrudan gerçek mail atabilirsiniz.
                      </p>
                    </div>

                    {/* Interactive action buttons if it is an approval mail and related user is still pending */}
                    {selectedEmail.type === 'APPROVAL_REQUEST' && (() => {
                      const relatedUser = accounts.find((a) => a.id === selectedEmail.relatedUserId);
                      if (relatedUser && relatedUser.status === 'PENDING_APPROVAL') {
                        return (
                          <div className="p-3 bg-amber-950/30 border border-amber-600/30 rounded-xl flex items-center justify-between">
                            <div>
                              <div className="text-xs font-bold text-amber-300">
                                Bu Başvuru Henüz Yanıtlanmadı
                              </div>
                              <div className="text-[11px] text-amber-200/80">
                                Kullanıcı: {relatedUser.name} (@{relatedUser.username})
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleStartReject(relatedUser.id)}
                                className="px-3 py-1.5 text-xs font-bold text-red-300 bg-red-950/80 hover:bg-red-900 border border-red-700/50 rounded-lg"
                              >
                                Reddet
                              </button>
                              <button
                                type="button"
                                onClick={() => handleApprove(relatedUser.id)}
                                className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm"
                              >
                                Onayla
                              </button>
                            </div>
                          </div>
                        );
                      }
                      if (relatedUser) {
                        return (
                          <div className="text-xs text-slate-400 flex items-center gap-2 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                            {relatedUser.status === 'APPROVED' ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>Bu başvuru onaylandı. Kullanıcı sisteme erişebilir.</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4 text-red-400" />
                                <span>Bu başvuru reddedildi. Kullanıcı sisteme erişemez.</span>
                              </>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                ) : (
                  <div className="text-center py-20 text-slate-500 text-xs">
                    Görüntülemek için soldaki listeden bir e-posta seçiniz.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ALL USERS LIST */}
          {activeTab === 'all' && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-800/80 text-slate-300 border-b border-slate-700">
                      <th className="p-3 font-semibold">Kullanıcı</th>
                      <th className="p-3 font-semibold">E-Posta</th>
                      <th className="p-3 font-semibold">Onay Maili</th>
                      <th className="p-3 font-semibold">Yetki Rolü</th>
                      <th className="p-3 font-semibold">Fiyat Erişimi</th>
                      <th className="p-3 font-semibold">Durum</th>
                      <th className="p-3 font-semibold text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {accounts.map((acc) => (
                      <tr key={acc.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-medium text-white">
                          <div>{acc.name}</div>
                          <div className="text-[11px] font-mono text-slate-400">@{acc.username}</div>
                        </td>
                        <td className="p-3 text-slate-300 font-mono">{acc.email || '-'}</td>
                        <td className="p-3 text-slate-400 font-mono text-[11px]">{acc.approverEmail || '-'}</td>
                        <td className="p-3 text-slate-300">{acc.roleName}</td>
                        <td className="p-3">
                          {acc.permissions.canViewPricing ? (
                            <span className="text-emerald-400 font-semibold">Açık</span>
                          ) : (
                            <span className="text-slate-500">Gizli (Kısıtlı)</span>
                          )}
                        </td>
                        <td className="p-3">
                          {acc.status === 'APPROVED' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" /> Onaylandı
                            </span>
                          )}
                          {acc.status === 'PENDING_APPROVAL' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              <Clock className="w-3 h-3" /> Onay Bekliyor
                            </span>
                          )}
                          {acc.status === 'REJECTED' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                              <XCircle className="w-3 h-3" /> Reddedildi
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {acc.status === 'PENDING_APPROVAL' && (
                            <div className="flex gap-1.5 justify-end">
                              <button
                                type="button"
                                onClick={() => handleApprove(acc.id)}
                                className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
                              >
                                Onayla
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStartReject(acc.id)}
                                className="px-2.5 py-1 text-[11px] font-bold bg-red-950 hover:bg-red-900 text-red-300 border border-red-700/50 rounded-lg"
                              >
                                Reddet
                              </button>
                            </div>
                          )}
                          {acc.status === 'APPROVED' && acc.username !== 'admin' && (
                            <button
                              type="button"
                              onClick={() => handleStartReject(acc.id)}
                              className="px-2 py-0.5 text-[10px] text-slate-400 hover:text-red-300 hover:bg-red-950/40 rounded transition"
                            >
                              Yetkiyi Askıya Al
                            </button>
                          )}
                          {acc.status === 'REJECTED' && (
                            <button
                              type="button"
                              onClick={() => handleApprove(acc.id)}
                              className="px-2.5 py-1 text-[11px] font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
                            >
                              Yeniden Onayla
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Toplam: <span className="text-white font-semibold">{accounts.length}</span> kullanıcı kayıtlı
            {' '}({approvedUsers.length} Onaylı, {pendingUsers.length} Bekleyen, {rejectedUsers.length} Reddedilen)
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
