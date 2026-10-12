import React, { useState, useEffect } from 'react';
import { 
  WorkbookData, 
  Service18xItem, 
  BCSServiceMasterItem,
  BCSMatrixSummary,
  UserAccount
} from './types';
import { DEFAULT_BCS_MASTER_SERVICES, DEFAULT_18X_SERVICES, STANDARD_BCS_SERVICES } from './data/defaultCatalog';
import { DEFAULT_USERS } from './data/defaultUsers';
import { generateSampleSPOSPRWorkbook } from './utils/sampleGenerator';
import { parseExcelFile, executeSPOSPRPipeline, formatExcelDate, normalizeCustomerId, safeReadExcel } from './utils/dataEngine';
import { exportCleanSPOResultExcel } from './utils/excelExporter';
import { SPOSPRPipelineView } from './components/SPOSPRPipelineView';
import { LoginModal } from './components/LoginModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { CreateNewRecordModal } from './components/CreateNewRecordModal';
import { EmailApprovalModal } from './components/EmailApprovalModal';
import { Service18xDictionaryModal } from './components/Service18xDictionaryModal';
import { 
  sendApprovalSuccessEmail, 
  sendRejectionEmail,
  decodeApprovalToken 
} from './utils/notificationEngine';
import { 
  Sparkles, 
  Download, 
  FileSpreadsheet,
  Building2,
  FileCheck,
  KeyRound,
  LogOut,
  ShieldCheck,
  UserCheck,
  PlusCircle,
  UserPlus,
  Check,
  Mail,
  Inbox,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BookOpen
} from 'lucide-react';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

export default function App() {
  const [workbookData, setWorkbookData] = useState<WorkbookData | null>(null);

  // Users Accounts Catalog State
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem('MY_BCS_USERS_CATALOG');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((u: any) => ({
            ...u,
            status: u.status || 'APPROVED',
            email: u.email || `${u.username}@bosch.com`,
            createdAt: u.createdAt || new Date().toISOString()
          }));
        }
      }
    } catch {
      // fallback
    }
    return DEFAULT_USERS;
  });

  const [currentUser, setCurrentUser] = useState<UserAccount>(() => {
    try {
      const savedUser = localStorage.getItem('MY_BCS_CURRENT_USER');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.id) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_USERS[0]; // Admin by default
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const sess = sessionStorage.getItem('MY_BCS_AUTH_SESSION');
      const rem = localStorage.getItem('MY_BCS_REMEMBER_ME');
      return sess === 'true' || rem === 'true';
    } catch {
      return false;
    }
  });

  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isCreateRecordOpen, setIsCreateRecordOpen] = useState(false);
  const [is18xDictionaryOpen, setIs18xDictionaryOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [actionOutcome, setActionOutcome] = useState<{
    type: 'APPROVED' | 'REJECTED';
    user: UserAccount;
    message: string;
  } | null>(null);

  // Check URL query parameters on load for direct email approval links (?action=approve&userId=...&token=...)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const action = params.get('action') || (params.get('approve') ? 'approve' : (params.get('reject') ? 'reject' : null));
      const userId = params.get('userId') || params.get('approve') || params.get('reject') || params.get('id');
      const token = params.get('token');

      if (action && (userId || token)) {
        // Read latest accounts catalog
        const savedRaw = localStorage.getItem('MY_BCS_USERS_CATALOG');
        let catalog: UserAccount[] = userAccounts;
        if (savedRaw) {
          try {
            const parsed = JSON.parse(savedRaw);
            if (Array.isArray(parsed) && parsed.length > 0) catalog = parsed;
          } catch {}
        }

        let targetUser = catalog.find((u) => u.id === userId);
        if (!targetUser && token) {
          const decoded = decodeApprovalToken(token);
          if (decoded && decoded.username) {
            targetUser = catalog.find((u) => u.username.toLowerCase() === decoded.username?.toLowerCase() || u.id === decoded.id);
          }
        }

        // If user not in catalog but token carries their full data, restore user
        if (!targetUser && token) {
          const decoded = decodeApprovalToken(token);
          if (decoded && decoded.username && decoded.id) {
            targetUser = {
              id: decoded.id,
              username: decoded.username,
              name: decoded.name || decoded.username,
              email: decoded.email || '',
              approverEmail: decoded.approverEmail || 'kuh6ib@bosch.com',
              password: decoded.password || '1234',
              role: decoded.role || 'FIELD_OPERATIONS',
              roleName: decoded.roleName || 'Saha & Operasyon',
              description: decoded.description || 'Kullanıcı hesabı',
              permissions: decoded.permissions || {
                canViewPricing: false,
                canExportExcel: true,
                canEditServiceCatalog: false,
                canEditDealerList: false,
                canViewDroppedRows: true
              },
              status: 'PENDING_APPROVAL',
              createdAt: new Date().toISOString()
            };
            catalog = [targetUser, ...catalog];
          }
        }

        if (targetUser) {
          if (action === 'approve') {
            const approver = 'E-Posta Doğrudan Onay Linki (Yetkili)';
            const updatedUser: UserAccount = {
              ...targetUser,
              status: 'APPROVED',
              approvedAt: new Date().toISOString(),
              approvedBy: approver
            };
            const updatedList = catalog.map((u) => (u.id === targetUser!.id ? updatedUser : u));
            setUserAccounts(updatedList);
            try {
              localStorage.setItem('MY_BCS_USERS_CATALOG', JSON.stringify(updatedList));
            } catch {}

            sendApprovalSuccessEmail(updatedUser, approver);
            setActionOutcome({
              type: 'APPROVED',
              user: updatedUser,
              message: `"${updatedUser.name}" (@${updatedUser.username}) kullanıcısının kayıt başvurusu başarıyla ONAYLANDI ve hesabı aktif edildi!`
            });
          } else if (action === 'reject') {
            const rejecter = 'E-Posta Bağlantısı (Yetkili)';
            const updatedUser: UserAccount = {
              ...targetUser,
              status: 'REJECTED',
              rejectionReason: 'Yetkili e-posta onay bağlantısı üzerinden başvuru reddedildi.'
            };
            const updatedList = catalog.map((u) => (u.id === targetUser!.id ? updatedUser : u));
            setUserAccounts(updatedList);
            try {
              localStorage.setItem('MY_BCS_USERS_CATALOG', JSON.stringify(updatedList));
            } catch {}

            sendRejectionEmail(updatedUser, rejecter);
            setActionOutcome({
              type: 'REJECTED',
              user: updatedUser,
              message: `"${updatedUser.name}" (@${updatedUser.username}) kullanıcısının kayıt başvurusu REDDEDİLDİ.`
            });
          }

          // Clean query parameters from URL bar cleanly
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    } catch (err) {
      console.error('URL approval processing error:', err);
    }
  }, []);

  const pendingApprovalCount = userAccounts.filter((a) => a.status === 'PENDING_APPROVAL').length;

  const handleRegisterAccount = (newAccount: UserAccount) => {
    const updatedAccounts = [newAccount, ...userAccounts.filter((u) => u.username !== newAccount.username)];
    setUserAccounts(updatedAccounts);
    try {
      localStorage.setItem('MY_BCS_USERS_CATALOG', JSON.stringify(updatedAccounts));
    } catch {
      // ignore
    }
    setToastMsg(
      `"${newAccount.name}" kayıt başvurusu alındı! ${newAccount.approverEmail || 'yönetici'} adresine onay talebi e-postası iletildi.`
    );
    setTimeout(() => setToastMsg(null), 6000);
  };

  const handleApproveUser = (userId: string) => {
    const user = userAccounts.find((u) => u.id === userId);
    if (!user) return;
    const approver = currentUser ? `${currentUser.name} (${currentUser.username})` : 'Sistem Yöneticisi';
    const updatedUser: UserAccount = {
      ...user,
      status: 'APPROVED',
      approvedAt: new Date().toISOString(),
      approvedBy: approver
    };
    const updatedAccounts = userAccounts.map((u) => (u.id === userId ? updatedUser : u));
    setUserAccounts(updatedAccounts);
    try {
      localStorage.setItem('MY_BCS_USERS_CATALOG', JSON.stringify(updatedAccounts));
    } catch {
      // ignore
    }

    // Send confirmation email to applicant
    sendApprovalSuccessEmail(updatedUser, approver);
    setToastMsg(`✅ "${updatedUser.name}" hesabı ONAYLANDI! Onay maili ${updatedUser.email} adresine gönderildi. Artık giriş yapabilir.`);
    setTimeout(() => setToastMsg(null), 6000);
  };

  const handleRejectUser = (userId: string, reason?: string) => {
    const user = userAccounts.find((u) => u.id === userId);
    if (!user) return;
    const rejecter = currentUser ? `${currentUser.name} (${currentUser.username})` : 'Sistem Yöneticisi';
    const updatedUser: UserAccount = {
      ...user,
      status: 'REJECTED',
      rejectionReason: reason || 'Yönetici onay prosedürlerine uygun görülmedi.'
    };
    const updatedAccounts = userAccounts.map((u) => (u.id === userId ? updatedUser : u));
    setUserAccounts(updatedAccounts);
    try {
      localStorage.setItem('MY_BCS_USERS_CATALOG', JSON.stringify(updatedAccounts));
    } catch {
      // ignore
    }

    // Send rejection email to applicant
    sendRejectionEmail(updatedUser, rejecter, reason);
    setToastMsg(`❌ "${updatedUser.name}" başvurusu REDDEDİLDİ. Bilgilendirme maili ${updatedUser.email} adresine gönderildi.`);
    setTimeout(() => setToastMsg(null), 6000);
  };

  const handleLoginSuccess = (user: UserAccount, rememberMe: boolean) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    try {
      localStorage.setItem('MY_BCS_CURRENT_USER', JSON.stringify(user));
      sessionStorage.setItem('MY_BCS_AUTH_SESSION', 'true');
      if (rememberMe) {
        localStorage.setItem('MY_BCS_REMEMBER_ME', 'true');
      } else {
        localStorage.removeItem('MY_BCS_REMEMBER_ME');
      }
    } catch {
      // ignore
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    try {
      sessionStorage.removeItem('MY_BCS_AUTH_SESSION');
      localStorage.removeItem('MY_BCS_REMEMBER_ME');
    } catch {
      // ignore
    }
  };

  const handleSaveNewPassword = (newPass: string) => {
    const updatedUser = { ...currentUser, password: newPass };
    setCurrentUser(updatedUser);

    const updatedAccounts = userAccounts.map((u) => (u.id === currentUser.id ? updatedUser : u));
    setUserAccounts(updatedAccounts);

    try {
      localStorage.setItem('MY_BCS_CURRENT_USER', JSON.stringify(updatedUser));
      localStorage.setItem('MY_BCS_USERS_CATALOG', JSON.stringify(updatedAccounts));
    } catch {
      // ignore
    }
  };
  
  // Track if user uploaded custom files
  const [is18xCustom, setIs18xCustom] = useState<boolean>(() => {
    try {
      return localStorage.getItem('MY_BCS_18X_IS_CUSTOM') === 'true';
    } catch {
      return false;
    }
  });

  const [isBcsMasterCustom, setIsBcsMasterCustom] = useState<boolean>(() => {
    try {
      return localStorage.getItem('MY_BCS_MASTER_IS_CUSTOM') === 'true';
    } catch {
      return false;
    }
  });

  // Initialize with persisted memory or default catalog (with automatic sync to new canonical list)
  const [service18xList, setService18xList] = useState<Service18xItem[]>(() => {
    try {
      const saved = localStorage.getItem('MY_BCS_18X_SERVICES');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // If saved list has old mapping (where 18003 was Fren Sistemi instead of Triger Kayışı), migrate immediately!
          const item18003 = parsed.find((s: any) => s.serviceCode === '18003');
          if (item18003 && item18003.serviceName !== 'Triger Kayışı Değişimi') {
            localStorage.setItem('MY_BCS_18X_SERVICES', JSON.stringify(DEFAULT_18X_SERVICES));
            return DEFAULT_18X_SERVICES;
          }
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return DEFAULT_18X_SERVICES;
  });

  const [bcsMasterList, setBcsMasterList] = useState<BCSServiceMasterItem[]>(() => {
    try {
      const isCustom = localStorage.getItem('MY_BCS_MASTER_IS_CUSTOM') === 'true';
      if (isCustom) {
        const saved = localStorage.getItem('MY_BCS_MASTER_DEALERS');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch {
      // fallback
    }
    return DEFAULT_BCS_MASTER_SERVICES;
  });

  const [matrixSummary, setMatrixSummary] = useState<BCSMatrixSummary | null>(null);

  // Keep in sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('MY_BCS_18X_SERVICES', JSON.stringify(service18xList));
    } catch {
      // ignore
    }
  }, [service18xList]);

  useEffect(() => {
    try {
      localStorage.setItem('MY_BCS_MASTER_DEALERS', JSON.stringify(bcsMasterList));
    } catch {
      // ignore
    }
  }, [bcsMasterList]);

  // Initialize on first mount: preserve custom memory if user uploaded earlier
  useEffect(() => {
    const { data, sampleBcsMasterList: generatedMasterList } = generateSampleSPOSPRWorkbook();
    setWorkbookData(data);

    const isCustom = localStorage.getItem('MY_BCS_MASTER_IS_CUSTOM') === 'true';
    const effectiveBcsMaster = isCustom && bcsMasterList.length > 0 ? bcsMasterList : generatedMasterList;
    const effective18x = service18xList.length > 0 ? service18xList : DEFAULT_18X_SERVICES;

    if (!isCustom) {
      setBcsMasterList(generatedMasterList);
    }

    const spoSheet = data.sheets['SPO'];
    const sprSheet = data.sheets['SPR'];

    if (spoSheet && sprSheet) {
      const summary = executeSPOSPRPipeline({
        spoSheet,
        sprSheet,
        service18xList: effective18x,
        bcsMasterList: effectiveBcsMaster
      });
      setMatrixSummary(summary);
    }
  }, []);

  const loadSampleData = () => {
    const { data, sampleBcsMasterList: generatedMasterList } = generateSampleSPOSPRWorkbook();
    setWorkbookData(data);
    setBcsMasterList(generatedMasterList);
    setIsBcsMasterCustom(false);
    try {
      localStorage.setItem('MY_BCS_MASTER_DEALERS', JSON.stringify(generatedMasterList));
      localStorage.setItem('MY_BCS_MASTER_IS_CUSTOM', 'false');
    } catch {}

    const effective18x = service18xList.length > 0 ? service18xList : DEFAULT_18X_SERVICES;

    const spoSheet = data.sheets['SPO'];
    const sprSheet = data.sheets['SPR'];

    if (spoSheet && sprSheet) {
      const summary = executeSPOSPRPipeline({
        spoSheet,
        sprSheet,
        service18xList: effective18x,
        bcsMasterList: generatedMasterList
      });
      setMatrixSummary(summary);
    }
  };

  const handleUploadWorkbook = async (file: File) => {
    try {
      const parsed = await parseExcelFile(file);
      setWorkbookData(parsed);

      const spoName = parsed.sheetNames.find((n) => n.toUpperCase().includes('SPO')) || parsed.sheetNames[0];
      const sprName = parsed.sheetNames.find((n) => n.toUpperCase().includes('SPR')) || (parsed.sheetNames.length > 1 ? parsed.sheetNames[1] : parsed.sheetNames[0]);

      const spoSheet = parsed.sheets[spoName];
      const sprSheet = parsed.sheets[sprName];

      if (spoSheet && sprSheet) {
        const summary = executeSPOSPRPipeline({
          spoSheet,
          sprSheet,
          service18xList,
          bcsMasterList
        });
        setMatrixSummary(summary);
      }
    } catch (err) {
      console.error('Workbook upload failed:', err);
    }
  };

  const handleUpload18xFile = async (file: File) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          if (!buffer || buffer.byteLength === 0) return;
          const wb = safeReadExcel(buffer);
          const firstSheet = wb.Sheets[wb.SheetNames[0]];

          const raw2D = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' }) as any[][];
          const rawObjects = XLSX.utils.sheet_to_json(firstSheet, { defval: '' }) as Record<string, any>[];

          const parsedList: Service18xItem[] = [];

          // If object format
          if (rawObjects.length > 0) {
            for (const r of rawObjects) {
              const keys = Object.keys(r);
              const codeKey = keys.find((k) => {
                const lk = k.toLowerCase();
                return lk.includes('kod') || lk.includes('18x') || lk.includes('code');
              });
              const nameKey = keys.find((k) => {
                const lk = k.toLowerCase();
                return lk.includes('tanım') || lk.includes('tanim') || lk.includes('hizmet') || lk.includes('name') || lk.includes('açıklama');
              });
              const catKey = keys.find((k) => {
                const lk = k.toLowerCase();
                return lk.includes('kategori') || lk.includes('grup') || lk.includes('category');
              });
              const priceKey = keys.find((k) => {
                const lk = k.toLowerCase();
                return lk.includes('fiyat') || lk.includes('tutar') || lk.includes('price') || lk.includes('birim');
              });

              const serviceCode = String(codeKey ? r[codeKey] : '').trim();
              const serviceName = String(nameKey ? r[nameKey] : '').trim();
              const serviceCategory = String(catKey ? r[catKey] : 'Genel Bakım').trim();
              const price = (priceKey && r[priceKey] !== undefined) ? r[priceKey] : 'NOPRICE';

              if (serviceCode || serviceName) {
                parsedList.push({
                  serviceCode,
                  serviceName: serviceName || serviceCode,
                  serviceCategory,
                  laborHours: 1.0,
                  price
                });
              }
            }
          }

          // Fallback to 2D rows if object parsing had no results
          if (parsedList.length === 0 && raw2D.length > 1) {
            for (let i = 1; i < raw2D.length; i++) {
              const row = raw2D[i];
              if (!row || row.length === 0) continue;
              const col0 = String(row[0] || '').trim();
              const col1 = String(row[1] || '').trim();
              const col2 = String(row[2] || '').trim();
              const col3 = row[3];

              if (col0 || col1) {
                parsedList.push({
                  serviceCode: col0,
                  serviceName: col1 || col0,
                  serviceCategory: col2 || 'Genel Bakım',
                  laborHours: 1.0,
                  price: col3 !== undefined ? col3 : 'NOPRICE'
                });
              }
            }
          }

          if (parsedList.length > 0) {
            setService18xList(parsedList);
            setIs18xCustom(true);
            try {
              localStorage.setItem('MY_BCS_18X_SERVICES', JSON.stringify(parsedList));
              localStorage.setItem('MY_BCS_18X_IS_CUSTOM', 'true');
            } catch {}
            reRun(parsedList, bcsMasterList);
          }
        } catch (err) {
          console.error('18x file parse error:', err);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error('18x upload failed:', err);
    }
  };

  const handleUploadBcsMasterFile = async (file: File) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          if (!buffer || buffer.byteLength === 0) return;
          const wb = safeReadExcel(buffer);
          const firstSheet = wb.Sheets[wb.SheetNames[0]];

          const raw2D = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' }) as any[][];
          const rawObjects = XLSX.utils.sheet_to_json(firstSheet, { defval: '' }) as Record<string, any>[];

          const parsedList: BCSServiceMasterItem[] = [];

          if (raw2D.length > 1) {
            const startIdx = (raw2D[0] && String(raw2D[0][0] || '').toLowerCase().includes('dissap')) ? 1 : 1;

            for (let i = startIdx; i < raw2D.length; i++) {
              const row = raw2D[i];
              if (!row || row.length === 0) continue;

              const dissap = normalizeCustomerId(row[0]);
              if (!dissap || dissap.toLowerCase().includes('dissap') || dissap.toLowerCase().includes('toplam')) continue;

              let rawDateVal = row[3];
              let rawFirmVal = row[4];

              const objRow = rawObjects[i - startIdx] || {};
              if (!rawFirmVal) {
                const fKey = Object.keys(objRow).find((k) => k.toLowerCase().includes('firma') || k.toLowerCase().includes('tabela') || k.toLowerCase().includes('bcs'));
                if (fKey) rawFirmVal = objRow[fKey];
              }
              if (!rawDateVal) {
                const dKey = Object.keys(objRow).find((k) => k.toLowerCase().includes('date') || k.toLowerCase().includes('tarih') || k.toLowerCase().includes('crm'));
                if (dKey) rawDateVal = objRow[dKey];
              }

              const dateStr = String(rawDateVal || '').trim();
              const firmStr = String(rawFirmVal || '').trim();

              let finalFirm = firmStr;
              let finalDate = formatExcelDate(rawDateVal);

              if (finalDate === '-' && dateStr && (dateStr.toLowerCase().includes('oto') || dateStr.toLowerCase().includes('motor') || dateStr.toLowerCase().includes('şube') || dateStr.toLowerCase().includes('servis'))) {
                finalFirm = dateStr;
                finalDate = formatExcelDate(rawFirmVal);
              }

              const district = String(row[9] || objRow['İLÇE'] || objRow['İlçe'] || objRow['Ilce'] || '').trim();
              const city = String(row[10] || objRow['İL'] || objRow['İl'] || objRow['Il'] || objRow['Şehir'] || '').trim();
              const regionManager = String(row[12] || objRow['BÖLGE YÖNETİCİSİ'] || objRow['Bölge Yöneticisi'] || '').trim();
              const fieldResponsible = String(row[13] || objRow['SAHA'] || objRow['Saha Sorumlusu'] || objRow['Saha'] || '').trim();
              const customerRelationsResp = String(row[15] || objRow['MÜŞTERİ İLİŞKİLERİ SORUMLUSU'] || objRow['Müşteri İlişkileri'] || '').trim();

              parsedList.push({
                dissap,
                crmCreateDate: finalDate,
                firmName: finalFirm,
                district,
                city,
                regionManager,
                fieldResponsible,
                customerRelationsResp
              });
            }
          }

          if (parsedList.length > 0) {
            setBcsMasterList(parsedList);
            setIsBcsMasterCustom(true);
            try {
              localStorage.setItem('MY_BCS_MASTER_DEALERS', JSON.stringify(parsedList));
              localStorage.setItem('MY_BCS_MASTER_IS_CUSTOM', 'true');
            } catch {}
            reRun(service18xList, parsedList);
          }
        } catch (err) {
          console.error('BCS Master file parse error:', err);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error('BCS Master upload failed:', err);
    }
  };

  const handleSave18xList = (updatedList: Service18xItem[]) => {
    setService18xList(updatedList);
    setIs18xCustom(true);
    try {
      localStorage.setItem('MY_BCS_18X_SERVICES', JSON.stringify(updatedList));
      localStorage.setItem('MY_BCS_18X_IS_CUSTOM', 'true');
    } catch {}
    reRun(updatedList, bcsMasterList);
    setToastMsg(`${updatedList.length} adet 18xxxxx hizmet kodu sözlüğü başarıyla kaydedildi ve analize uygulandı.`);
    setTimeout(() => setToastMsg(null), 5000);
  };

  const handleReset18xList = () => {
    setService18xList(DEFAULT_18X_SERVICES);
    setIs18xCustom(false);
    try {
      localStorage.setItem('MY_BCS_18X_SERVICES', JSON.stringify(DEFAULT_18X_SERVICES));
      localStorage.setItem('MY_BCS_18X_IS_CUSTOM', 'false');
    } catch {}
    reRun(DEFAULT_18X_SERVICES, bcsMasterList);
  };

  const handleResetBcsMasterList = () => {
    setBcsMasterList(DEFAULT_BCS_MASTER_SERVICES);
    setIsBcsMasterCustom(false);
    try {
      localStorage.setItem('MY_BCS_MASTER_DEALERS', JSON.stringify(DEFAULT_BCS_MASTER_SERVICES));
      localStorage.setItem('MY_BCS_MASTER_IS_CUSTOM', 'false');
    } catch {}
    reRun(service18xList, DEFAULT_BCS_MASTER_SERVICES);
  };

  const reRun = (services18x: Service18xItem[], masterList: BCSServiceMasterItem[]) => {
    if (workbookData) {
      const spoName = workbookData.sheetNames.find((n) => n.toUpperCase().includes('SPO')) || workbookData.sheetNames[0];
      const sprName = workbookData.sheetNames.find((n) => n.toUpperCase().includes('SPR')) || workbookData.sheetNames[1];
      const spoSheet = workbookData.sheets[spoName];
      const sprSheet = workbookData.sheets[sprName];

      if (spoSheet && sprSheet) {
        const summary = executeSPOSPRPipeline({
          spoSheet,
          sprSheet,
          service18xList: services18x,
          bcsMasterList: masterList
        });
        setMatrixSummary(summary);
      }
    }
  };

  const handleSaveRecord = (recordData: {
    customerId: string;
    bcsFirmName: string;
    city: string;
    district: string;
    regionManager: string;
    fieldResponsible: string;
    claimed: 'EVET' | 'HAYIR';
    spoOnlineBooking: 'EVET' | 'HAYIR';
    crmCreateDate: string;
    serviceValues: Record<string, { status: 'PRICED' | 'FREE' | 'NO_PRICE' | 'NOT_OFFERED' | 'OFFERED_YES'; price?: number }>;
  }) => {
    const normId = normalizeCustomerId(recordData.customerId);

    // 1. Update Master List
    const newMasterItem: BCSServiceMasterItem = {
      dissap: recordData.customerId,
      firmName: recordData.bcsFirmName,
      city: recordData.city,
      district: recordData.district,
      regionManager: recordData.regionManager,
      fieldResponsible: recordData.fieldResponsible,
      crmCreateDate: recordData.crmCreateDate
    };

    const updatedMaster = [newMasterItem, ...bcsMasterList.filter((b) => normalizeCustomerId(b.dissap) !== normId)];
    setBcsMasterList(updatedMaster);
    setIsBcsMasterCustom(true);
    try {
      localStorage.setItem('MY_BCS_MASTER_DEALERS', JSON.stringify(updatedMaster));
      localStorage.setItem('MY_BCS_MASTER_IS_CUSTOM', 'true');
    } catch {}

    // 2. Prepare or load Workbook
    let currentWb = workbookData;
    if (!currentWb) {
      const { data } = generateSampleSPOSPRWorkbook();
      currentWb = data;
    }

    const spoName = currentWb.sheetNames.find((n) => n.toUpperCase().includes('SPO')) || currentWb.sheetNames[0] || 'SPO';
    const sprName = currentWb.sheetNames.find((n) => n.toUpperCase().includes('SPR')) || (currentWb.sheetNames.length > 1 ? currentWb.sheetNames[1] : 'SPR');

    const spoSheet = currentWb.sheets[spoName] || { name: spoName, headers: [], rows: [], totalRawRows: 0 };
    const sprSheet = currentWb.sheets[sprName] || { name: sprName, headers: [], rows: [], totalRawRows: 0 };

    const spoRow: Record<string, any> = {
      CUSTOMERID: recordData.customerId,
      'crm create date': recordData.crmCreateDate,
      FİRMA: recordData.bcsFirmName,
      'BCS / FİRMA (TABELA)': recordData.bcsFirmName,
      İl: recordData.city,
      İL: recordData.city,
      İlçe: recordData.district,
      İLÇE: recordData.district,
      'BÖLGE YÖNETİCİSİ': recordData.regionManager,
      SAHA: recordData.fieldResponsible,
      'MÜŞTERİ İLİŞKİLERİ SORUMLUSU': recordData.fieldResponsible,
      SPO_ONLINEBOOKING: recordData.spoOnlineBooking,
      ONLINEBOOKING: recordData.spoOnlineBooking
    };

    const newSpoRows = [spoRow, ...spoSheet.rows.filter((r) => normalizeCustomerId(r['CUSTOMERID'] || r['CUSTOMER ID'] || r['MÜŞTERİ NO']) !== normId)];

    const sprRow: Record<string, any> = {
      CUSTOMERID: recordData.customerId,
      claimed: recordData.claimed,
      'SİLİNECEK Mİ?': 'HAYIR'
    };

    Object.keys(recordData.serviceValues).forEach((col) => {
      const sv = recordData.serviceValues[col];
      if (sv.status === 'PRICED') {
        sprRow[col] = `${sv.price || 0} TL`;
      } else if (sv.status === 'FREE') {
        sprRow[col] = '0 TL';
      } else if (sv.status === 'NO_PRICE') {
        sprRow[col] = 'NOPRICE';
      } else if (sv.status === 'OFFERED_YES') {
        sprRow[col] = 'EVET';
      } else {
        sprRow[col] = 'HAYIR';
      }
    });

    const newSprRows = [sprRow, ...sprSheet.rows.filter((r) => normalizeCustomerId(r['CUSTOMERID'] || r['CUSTOMER ID'] || r['MÜŞTERİ NO']) !== normId)];

    const updatedWb: WorkbookData = {
      ...currentWb,
      sheets: {
        ...currentWb.sheets,
        [spoName]: {
          ...spoSheet,
          rows: newSpoRows,
          totalRawRows: newSpoRows.length
        },
        [sprName]: {
          ...sprSheet,
          rows: newSprRows,
          totalRawRows: newSprRows.length
        }
      }
    };

    setWorkbookData(updatedWb);

    // 3. Re-execute pipeline
    const summary = executeSPOSPRPipeline({
      spoSheet: updatedWb.sheets[spoName],
      sprSheet: updatedWb.sheets[sprName],
      service18xList,
      bcsMasterList: updatedMaster
    });

    setMatrixSummary(summary);
    setToastMsg(`"${recordData.bcsFirmName}" (${recordData.city}) kaydı başarıyla oluşturuldu ve rapora eklendi.`);
    setTimeout(() => setToastMsg(null), 5000);
  };

  const handleDownloadSampleWorkbook = () => {
    const { blob } = generateSampleSPOSPRWorkbook();
    saveAs(blob, 'My_BCS_SPO_SPR_Ornek.xlsx');
  };

  const handleDownload18xTemplate = () => {
    const { sample18xWorkbookBlob } = generateSampleSPOSPRWorkbook();
    saveAs(sample18xWorkbookBlob, 'My_BCS_18xxxxx_Hizmet_Katalogu.xlsx');
  };

  const handleDownloadBcsMasterTemplate = () => {
    const { sampleBcsMasterBlob } = generateSampleSPOSPRWorkbook();
    saveAs(sampleBcsMasterBlob, 'My_BCS_Servis_Listesi_Dissap.xlsx');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-red-500/30 selection:text-white font-['Inter',sans-serif]">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <span className="text-xl font-black tracking-wider text-red-600">BOSCH</span>
              <div className="h-6 w-px bg-slate-800" />
              <div>
                <h1 className="text-base font-bold text-white">
                  MyBCS Veri Paneli
                </h1>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCreateRecordOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-600/30 transition transform active:scale-95"
              >
                <PlusCircle className="w-3.5 h-3.5 text-white" />
                <span>➕ Yeni Kayıt Oluştur</span>
              </button>

              <button
                type="button"
                onClick={() => setIs18xDictionaryOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 shadow-sm transition"
                title="18xxxxx Hizmet Kodları Sözlüğünü Aç ve Düzenle"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>18x Hizmet Sözlüğü</span>
                <span className="px-1.5 py-0.2 rounded bg-amber-500/30 text-[10px] font-mono font-extrabold text-amber-200">
                  {service18xList.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('upload-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700 transition shadow-sm"
              >
                <span>📤 Dosya Yükle</span>
              </button>

              <button
                type="button"
                onClick={loadSampleData}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600/20 text-red-300 hover:bg-red-600/30 border border-red-500/30 transition shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                <span className="hidden sm:inline">Örnek Veri Yükle</span>
              </button>

              {matrixSummary && (
                <button
                  type="button"
                  onClick={() => {
                    const canViewPricing = currentUser?.permissions?.canViewPricing ?? true;
                    exportCleanSPOResultExcel({
                      summary: matrixSummary,
                      fileName: 'My_BCS_Servis_Raporu.xlsx',
                      sourceFileName: workbookData?.fileName || 'SPO_SPR_Raporu.xlsx',
                      canViewPricing
                    });
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Temiz Excel İndir</span>
                </button>
              )}

              <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

              {isAuthenticated && (
                <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 shadow-inner">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-semibold text-white">{currentUser.name}</span>
                  <span className="text-slate-400 font-mono text-[11px]">({currentUser.roleName})</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsEmailModalOpen(true)}
                className="relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 transition"
                title="E-Posta Bildirimleri ve Onay Masası"
              >
                <Inbox className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden md:inline">Onay Masası</span>
                {pendingApprovalCount > 0 && (
                  <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 animate-pulse">
                    {pendingApprovalCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-950/60 text-blue-300 hover:bg-blue-900/80 border border-blue-800/50 transition"
                title="Yeni Kullanıcı / Hesap Kaydı Ekle"
              >
                <UserPlus className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden md:inline">Hesap Ekle</span>
              </button>

              <button
                type="button"
                onClick={() => setIsChangePasswordOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 transition"
                title="Giriş Şifresini Değiştir"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">Şifre Değiştir</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-950/60 text-red-300 hover:bg-red-900/80 border border-red-800/50 transition"
                title="Oturumu Kapat"
              >
                <LogOut className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden md:inline">Çıkış Yap</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="bg-emerald-600/90 text-white px-4 py-3 border-b border-emerald-500 shadow-lg backdrop-blur-md flex items-center justify-between transition-all animate-fadeIn">
          <div className="max-w-7xl mx-auto w-full flex items-center gap-2 text-xs font-extrabold">
            <Check className="w-4 h-4 bg-white text-emerald-600 rounded-full p-0.5" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-white/80 hover:text-white text-xs font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <SPOSPRPipelineView
          workbookData={workbookData}
          service18xList={service18xList}
          bcsMasterList={bcsMasterList}
          summary={matrixSummary}
          currentUser={currentUser}
          is18xCustom={is18xCustom}
          isBcsMasterCustom={isBcsMasterCustom}
          onOpenCreateRecordModal={() => setIsCreateRecordOpen(true)}
          onOpen18xDictionary={() => setIs18xDictionaryOpen(true)}
          onUploadWorkbook={handleUploadWorkbook}
          onUpload18xFile={handleUpload18xFile}
          onUploadBcsMasterFile={handleUploadBcsMasterFile}
          onReset18xList={handleReset18xList}
          onResetBcsMasterList={handleResetBcsMasterList}
          onLoadSample={loadSampleData}
          onDownloadSampleWorkbook={handleDownloadSampleWorkbook}
          onDownload18xTemplate={handleDownload18xTemplate}
          onDownloadBcsMasterTemplate={handleDownloadBcsMasterTemplate}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-5 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-semibold text-slate-300">
            BOSCH &copy; telif hakları saklıdır // SWS-2 için üretilmiştir
          </span>
          <span className="text-slate-500 text-[11px]">
            Bosch Car Service SPO + SPR + Dissap Standartlarına Uygundur
          </span>
        </div>
      </footer>

      {/* Login / Register Passcode Barrier Modal */}
      {!isAuthenticated && (
        <LoginModal
          accounts={userAccounts}
          onLoginSuccess={handleLoginSuccess}
          onRegisterAccount={handleRegisterAccount}
          onApproveUser={handleApproveUser}
          onOpenEmailModal={() => setIsEmailModalOpen(true)}
        />
      )}

      {/* Authenticated User Add Account Modal */}
      {isAuthenticated && isRegisterModalOpen && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setIsRegisterModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg">
            <button
              onClick={() => setIsRegisterModalOpen(false)}
              className="absolute -top-3 -right-3 z-20 w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-white flex items-center justify-center hover:bg-slate-700 shadow-lg text-sm"
            >
              ✕
            </button>
            <LoginModal
              accounts={userAccounts}
              onLoginSuccess={(user, rem) => {
                handleLoginSuccess(user, rem);
                setIsRegisterModalOpen(false);
              }}
              onRegisterAccount={(acc) => {
                handleRegisterAccount(acc);
                setIsRegisterModalOpen(false);
              }}
              onApproveUser={handleApproveUser}
              onOpenEmailModal={() => {
                setIsRegisterModalOpen(false);
                setIsEmailModalOpen(true);
              }}
              initialTab="register"
            />
          </div>
        </div>
      )}

      {/* One-Click Approval / Rejection Result Banner Modal */}
      {actionOutcome && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-fadeIn font-['Inter',sans-serif]">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            {actionOutcome.type === 'APPROVED' ? (
              <>
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white">Kayıt Başvurusu Onaylandı!</h3>
                  <p className="text-xs text-emerald-400 font-semibold">
                    Onay bağlantısı başarıyla doğrulandı ve hesap aktif edildi
                  </p>
                </div>
                <div className="p-3.5 bg-slate-800/80 rounded-xl text-xs text-slate-300 text-left space-y-2 border border-slate-700/60">
                  <div className="flex justify-between border-b border-slate-700/60 pb-1.5">
                    <span className="text-slate-400">Ad Soyad:</span>
                    <span className="font-bold text-white">{actionOutcome.user.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-700/60 pb-1.5">
                    <span className="text-slate-400">Kullanıcı Adı:</span>
                    <span className="font-mono text-cyan-300">@{actionOutcome.user.username}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-700/60 pb-1.5">
                    <span className="text-slate-400">Tanımlanan Rol:</span>
                    <span className="font-medium text-slate-200">{actionOutcome.user.roleName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Durum:</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      AKTİF &amp; ONAYLI
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Kullanıcı artık şifresiyle sisteme giriş yapabilir ve belirlenen yetkileriyle çalışmaya başlayabilir.
                </p>
                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setActionOutcome(null)}
                    className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition"
                  >
                    Tamam, Devam Et
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto shadow-lg shadow-red-500/20">
                  <XCircle className="w-9 h-9" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white">Başvuru Reddedildi</h3>
                  <p className="text-xs text-red-400 font-semibold">
                    E-posta bağlantısı üzerinden başvuru ret işlemi tamamlandı
                  </p>
                </div>
                <div className="p-3.5 bg-slate-800/80 rounded-xl text-xs text-slate-300 text-left space-y-1 border border-slate-700/60">
                  <div className="text-slate-400">Kullanıcı: <span className="text-white font-bold">{actionOutcome.user.name}</span></div>
                  <div className="text-slate-400">Kullanıcı Adı: <span className="font-mono text-slate-300">@{actionOutcome.user.username}</span></div>
                  <div className="text-slate-400">Durum: <span className="text-red-400 font-bold">REDDEDİLDİ</span></div>
                </div>
                <button
                  type="button"
                  onClick={() => setActionOutcome(null)}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                >
                  Pencereyi Kapat
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Email Notifications & Approval Portal Modal */}
      <EmailApprovalModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        accounts={userAccounts}
        onApproveUser={handleApproveUser}
        onRejectUser={handleRejectUser}
        currentUser={currentUser}
      />

      {/* Change Passcode Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        currentPassword={currentUser.password}
        onSaveNewPassword={handleSaveNewPassword}
      />

      {/* Create New Record / Save Point Modal */}
      <CreateNewRecordModal
        isOpen={isCreateRecordOpen}
        onClose={() => setIsCreateRecordOpen(false)}
        summary={matrixSummary}
        service18xList={service18xList}
        onSaveRecord={handleSaveRecord}
      />

      {/* 18xxxxx Service Dictionary Modal */}
      <Service18xDictionaryModal
        isOpen={is18xDictionaryOpen}
        onClose={() => setIs18xDictionaryOpen(false)}
        service18xList={service18xList}
        onSaveList={handleSave18xList}
        onResetDefault={handleReset18xList}
        isCustom={is18xCustom}
      />
    </div>
  );
}
