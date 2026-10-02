import React, { useState, useEffect } from 'react';
import { 
  WorkbookData, 
  Service18xItem, 
  BCSServiceMasterItem,
  BCSMatrixSummary 
} from './types';
import { DEFAULT_BCS_MASTER_SERVICES, DEFAULT_18X_SERVICES, STANDARD_BCS_SERVICES } from './data/defaultCatalog';
import { generateSampleSPOSPRWorkbook } from './utils/sampleGenerator';
import { parseExcelFile, executeSPOSPRPipeline, formatExcelDate, normalizeCustomerId, safeReadExcel } from './utils/dataEngine';
import { exportCleanSPOResultExcel } from './utils/excelExporter';
import { SPOSPRPipelineView } from './components/SPOSPRPipelineView';
import { 
  Sparkles, 
  Download, 
  FileSpreadsheet,
  Building2,
  FileCheck
} from 'lucide-react';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

export default function App() {
  const [workbookData, setWorkbookData] = useState<WorkbookData | null>(null);
  
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

  // Initialize with persisted memory or default catalog
  const [service18xList, setService18xList] = useState<Service18xItem[]>(() => {
    try {
      const saved = localStorage.getItem('MY_BCS_18X_SERVICES');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 via-red-500 to-amber-500 shadow-lg shadow-red-600/20 text-white font-black text-lg">
                <span className="tracking-tighter">BCS</span>
              </div>
              <div>
                <h1 className="text-base font-bold text-white flex items-center gap-2">
                  My BCS <span className="text-slate-400 font-normal">|</span> Servis &amp; Fiyat Matrisi Raporlama
                </h1>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  SPO + SPR + Dissap (Firma, Sorumlular, İl/İlçe) + 18xxxxx Hizmet Fiyatlandırma Matrisi
                </p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2">
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
                    exportCleanSPOResultExcel({
                      summary: matrixSummary,
                      fileName: 'My_BCS_Servis_Raporu.xlsx',
                      sourceFileName: workbookData?.fileName || 'SPO_SPR_Raporu.xlsx'
                    });
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Temiz Excel İndir</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <SPOSPRPipelineView
          workbookData={workbookData}
          service18xList={service18xList}
          bcsMasterList={bcsMasterList}
          summary={matrixSummary}
          is18xCustom={is18xCustom}
          isBcsMasterCustom={isBcsMasterCustom}
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
    </div>
  );
}
