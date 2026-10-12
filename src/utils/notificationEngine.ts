import { UserAccount, EmailNotification } from '../types';

const EMAILS_STORAGE_KEY = 'MY_BCS_EMAILS_LOG';

export const getStoredEmails = (): EmailNotification[] => {
  try {
    const raw = localStorage.getItem(EMAILS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fallback
  }
  return [];
};

export const saveStoredEmails = (emails: EmailNotification[]): void => {
  try {
    localStorage.setItem(EMAILS_STORAGE_KEY, JSON.stringify(emails));
  } catch {
    // ignore
  }
};

/**
 * Dispatches an email notification and records it in storage
 */
export const dispatchEmail = (notification: Omit<EmailNotification, 'id' | 'timestamp' | 'status'>): EmailNotification => {
  const newEmail: EmailNotification = {
    ...notification,
    id: `email-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    status: 'DELIVERED'
  };

  const currentEmails = getStoredEmails();
  const updatedEmails = [newEmail, ...currentEmails];
  saveStoredEmails(updatedEmails);

  return newEmail;
};

/**
 * Encodes user account data into a portable base64 token
 */
export const encodeApprovalToken = (user: UserAccount): string => {
  try {
    const payload = JSON.stringify({
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      approverEmail: user.approverEmail,
      role: user.role,
      roleName: user.roleName,
      permissions: user.permissions,
      password: user.password,
      description: user.description
    });
    return btoa(encodeURIComponent(payload));
  } catch {
    return user.id;
  }
};

/**
 * Decodes user account data from token if provided
 */
export const decodeApprovalToken = (token: string): Partial<UserAccount> | null => {
  try {
    const raw = decodeURIComponent(atob(token));
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

/**
 * Constructs direct one-click approval URL
 */
export const getApprovalLink = (user: UserAccount, customBaseUrl?: string): string => {
  let base = customBaseUrl;
  if (!base && typeof window !== 'undefined') {
    base = window.location.origin + window.location.pathname;
  }
  if (!base) {
    base = 'https://ais-dev-uzuwh3tnlfbkwbytj3musn-164367981389.europe-west2.run.app';
  }
  const token = encodeApprovalToken(user);
  return `${base}?action=approve&userId=${encodeURIComponent(user.id)}&token=${encodeURIComponent(token)}`;
};

/**
 * Constructs direct rejection URL
 */
export const getRejectionLink = (user: UserAccount, customBaseUrl?: string): string => {
  let base = customBaseUrl;
  if (!base && typeof window !== 'undefined') {
    base = window.location.origin + window.location.pathname;
  }
  if (!base) {
    base = 'https://ais-dev-uzuwh3tnlfbkwbytj3musn-164367981389.europe-west2.run.app';
  }
  const token = encodeApprovalToken(user);
  return `${base}?action=reject&userId=${encodeURIComponent(user.id)}&token=${encodeURIComponent(token)}`;
};

/**
 * Creates and dispatches approval request email sent to specified approver
 */
export const sendApprovalRequestEmail = (user: UserAccount, approverEmail: string, customBaseUrl?: string): EmailNotification => {
  const approveLink = getApprovalLink(user, customBaseUrl);
  const rejectLink = getRejectionLink(user, customBaseUrl);

  const body = `Sayın Yönetici / Yetkili (${approverEmail}),

BCS Bayi ve Servis Ağı Yönetim Portalı'na yeni bir kullanıcı kayıt başvurusu gerçekleştirilmiştir.

--- BAŞVURU SAHİBİ DETAYLARI ---
• Ad Soyad: ${user.name}
• Kullanıcı Adı: ${user.username}
• E-Posta Adresi: ${user.email}
• Talep Edilen Rol: ${user.roleName}
• Başvuru Notu / Görevi: ${user.description || 'Belirtilmedi'}
• Başvuru Tarihi: ${new Date().toLocaleString('tr-TR')}

============================================================
👉 BAŞVURUYU TEK TIKLA ONAYLAMAK İÇİN BAĞLANTIYA TIKLAYINIZ:
${approveLink}
============================================================

❌ BAŞVURUYU REDDETMEK İÇİN:
${rejectLink}

--- BİLGİLENDİRME ---
Yukarıdaki doğrudan ONAY bağlantısına tıkladığınızda kullanıcının hesabı anında onaylanacak, sisteme erişimi açılacak ve ${user.email} adresine onay maili iletilecektir.
Ayrıca sistem portalındaki "E-Posta & Onay Masası" ekranından da onay veya ret kararı verebilirsiniz.`;

  return dispatchEmail({
    to: approverEmail,
    from: 'sistem-guvenlik@bcs.bosch.com',
    subject: `🔔 Yeni Kullanıcı Kayıt Onay Talebi: ${user.name} (${user.roleName})`,
    body,
    type: 'APPROVAL_REQUEST',
    relatedUserId: user.id
  });
};

/**
 * Creates and dispatches approval confirmation email to the applicant
 */
export const sendApprovalSuccessEmail = (user: UserAccount, approvedBy: string): EmailNotification => {
  const body = `Sayın ${user.name},

BCS Bayi ve Servis Ağı Yönetim Portalı için yapmış olduğunuz kullanıcı hesabı başvurusu ONAYLANMIŞTIR.

--- ONAYLANAN HESAP BİLGİLERİ ---
• Ad Soyad: ${user.name}
• Kullanıcı Adı: ${user.username}
• E-Posta Adresiniz: ${user.email}
• Tanımlanan Rol: ${user.roleName}
• Fiyat Görüntüleme Yetkisi: ${user.permissions.canViewPricing ? 'Açık (Yetkili)' : 'Kısıtlı (Fiyatlar Gizli)'}
• Excel Raporlama: ${user.permissions.canExportExcel ? 'Aktif' : 'Pasif'}
• Onaylayan Yönetici: ${approvedBy}
• Onay Tarihi: ${new Date().toLocaleString('tr-TR')}

Artık kullanıcı adınız (${user.username}) ve şifreniz ile BCS Portalı'na giriş yaparak çalışmaya başlayabilirsiniz.`;

  return dispatchEmail({
    to: user.email,
    from: 'onay-merkezi@bcs.bosch.com',
    subject: `✅ Tebrikler! BCS Portal Erişim Hesabınız Onaylandı: ${user.username}`,
    body,
    type: 'REGISTRATION_APPROVED',
    relatedUserId: user.id
  });
};

/**
 * Creates and dispatches rejection email to the applicant
 */
export const sendRejectionEmail = (user: UserAccount, rejectedBy: string, reason?: string): EmailNotification => {
  const actualReason = reason?.trim() || 'Güvenlik ve departman yetkilendirme prosedürleri gereğince uygun görülmedi.';
  const body = `Sayın ${user.name},

BCS Bayi ve Servis Ağı Yönetim Portalı için yapmış olduğunuz kullanıcı hesabı başvurusu incelenmiş ve REDDEDİLMİŞTİR.

--- BAŞVURU DETAYLARI ---
• Ad Soyad: ${user.name}
• Kullanıcı Adı: ${user.username}
• E-Posta Adresiniz: ${user.email}
• Talep Edilen Rol: ${user.roleName}
• İnceleyen Yönetici: ${rejectedBy}
• Karar Tarihi: ${new Date().toLocaleString('tr-TR')}
• Ret Gerekçesi: ${actualReason}

Bu karar doğrultusunda belirtilen kullanıcı adı ve şifre ile panele giriş yapılamaz ve işlem gerçekleştirilemez. Bir hata olduğunu düşünüyorsanız lütfen bağlı bulunduğunuz amiriniz veya sistem yöneticisi ile iletişime geçiniz.`;

  return dispatchEmail({
    to: user.email,
    from: 'guvenlik-bildirim@bcs.bosch.com',
    subject: `❌ Bilgilendirme: BCS Portal Erişim Başvurunuz Reddedildi: ${user.username}`,
    body,
    type: 'REGISTRATION_REJECTED',
    relatedUserId: user.id
  });
};

/**
 * Generates a mailto: URL for launching system default email client (Outlook, Apple Mail, etc.)
 */
export const getMailtoUrl = (to: string, subject: string, body: string): string => {
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

/**
 * Generates an Outlook 365 Web deeplink compose URL
 */
export const getOutlookWebUrl = (to: string, subject: string, body: string): string => {
  return `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(to)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

/**
 * Generates a Gmail Web compose URL
 */
export const getGmailWebUrl = (to: string, subject: string, body: string): string => {
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};
