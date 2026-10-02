import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  CheckSquare, 
  Square, 
  Download, 
  FileSpreadsheet, 
  Layers, 
  RotateCcw,
  Check,
  Building2,
  UserCheck,
  MapPin,
  Calendar,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { ExportOptions, ExportColumnOptions, BCSMatrixSummary } from '../types';
import { DEFAULT_EXPORT_OPTIONS, exportCleanSPOResultExcel } from '../utils/excelExporter';

interface ExportSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: BCSMatrixSummary;
  sourceFileName?: string;
}

export const ExportSettingsModal: React.FC<ExportSettingsModalProps> = ({
  isOpen,
  onClose,
  summary,
  sourceFileName
}) => {
  const [options, setOptions] = useState<ExportOptions>(() => {
    try {
      const saved = localStorage.getItem('MY_BCS_EXPORT_OPTIONS');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_EXPORT_OPTIONS, ...parsed };
      }
    } catch {}
    return DEFAULT_EXPORT_OPTIONS;
  });

  const [selectedCategories, setSelectedCategories] = useState<string[]>(options.selectedCategories || []);
  const [isExporting, setIsExporting] = useState(false);

  // Extract available categories
  const availableCategories = React.useMemo(() => {
    if (!summary?.serviceColumns) return [];
    const counts: Record<string, number> = {};
    summary.serviceColumns.forEach((col) => {
      const cat = summary.serviceColumnMeta?.[col]?.category || 'Diğer Hizmetler';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    return Object.keys(counts).sort().map((cat) => ({
      name: cat,
      count: counts[cat]
    }));
  }, [summary]);

  useEffect(() => {
    try {
      localStorage.setItem('MY_BCS_EXPORT_OPTIONS', JSON.stringify({
        ...options,
        selectedCategories
      }));
    } catch {}
  }, [options, selectedCategories]);

  if (!isOpen) return null;

  const toggleColumn = (key: keyof ExportColumnOptions) => {
    setOptions((prev) => ({
      ...prev,
      columns: {
        ...prev.columns,
        [key]: !prev.columns[key]
      }
    }));
  };

  const selectAllColumns = (val: boolean) => {
    setOptions((prev) => ({
      ...prev,
      columns: {
        customerId: val,
        crmCreateDate: val,
        regionManager: val,
        fieldResponsible: val,
        city: val,
        district: val,
        bcsFirmName: val,
        claimed: val,
        spoOnlineBooking: val
      }
    }));
  };

  const toggleCategory = (catName: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(catName)) {
        return prev.filter((c) => c !== catName);
      } else {
        return [...prev, catName];
      }
    });
  };

  const handleResetDefaults = () => {
    setOptions(DEFAULT_EXPORT_OPTIONS);
    setSelectedCategories([]);
    try {
      localStorage.removeItem('MY_BCS_EXPORT_OPTIONS');
    } catch {}
  };

  const handleConfirmExport = () => {
    setIsExporting(true);
    try {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const fileName = `My_BCS_Servis_Raporu_${dateStr}.xlsx`;

      exportCleanSPOResultExcel({
        summary,
        fileName,
        sourceFileName,
        options: {
          ...options,
          selectedCategories
        }
      });

      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 400);
    } catch (err) {
      console.error('Export failed:', err);
      setIsExporting(false);
    }
  };

  const columnLabels: { key: keyof ExportColumnOptions; title: string; desc: string; icon: React.ReactNode }[] = [
    { key: 'customerId', title: 'CUSTOMERID', desc: 'Müşteri / Dissap Kodu', icon: <Building2 className="w-4 h-4 text-red-400" /> },
    { key: 'crmCreateDate', title: 'CRM Kayıt Tarihi', desc: 'crm create date', icon: <Calendar className="w-4 h-4 text-blue-400" /> },
    { key: 'regionManager', title: 'Bölge Yöneticisi', desc: 'Sorumlu BÖLGE YÖNETİCİSİ', icon: <UserCheck className="w-4 h-4 text-emerald-400" /> },
    { key: 'fieldResponsible', title: 'Saha Sorumlusu', desc: 'SAHA Sorumlusu Adı', icon: <UserCheck className="w-4 h-4 text-amber-400" /> },
    { key: 'city', title: 'İl (Şehir)', desc: 'Servis İl Bilgisi', icon: <MapPin className="w-4 h-4 text-purple-400" /> },
    { key: 'district', title: 'İlçe', desc: 'Servis İlçe Bilgisi', icon: <MapPin className="w-4 h-4 text-indigo-400" /> },
    { key: 'bcsFirmName', title: 'BCS Tabela Adı', desc: 'Firma / Şube Adı', icon: <Building2 className="w-4 h-4 text-blue-300" /> },
    { key: 'claimed', title: 'Claimed Durumu', desc: 'claimed (EVET / HAYIR)', icon: <CheckCircle2 className="w-4 h-4 text-emerald-300" /> },
    { key: 'spoOnlineBooking', title: 'Online Booking', desc: 'SPO_ONLINEBOOKING', icon: <Sparkles className="w-4 h-4 text-amber-300" /> }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden ring-1 ring-white/10">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Settings className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Excel Dışa Aktarım Ayarları
              </h3>
              <p className="text-xs text-slate-400">
                Rapor dosyanızda yer almasını istediğiniz sütun, sekme ve kategorileri seçin.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar text-xs">
          
          {/* 1. Metadata Columns Toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                1. Dahil Edilecek Bilgi Sütunları
              </h4>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => selectAllColumns(true)}
                  className="text-[10px] text-emerald-400 hover:underline font-semibold"
                >
                  Tümünü Seç
                </button>
                <span className="text-slate-600">|</span>
                <button
                  type="button"
                  onClick={() => selectAllColumns(false)}
                  className="text-[10px] text-red-400 hover:underline font-semibold"
                >
                  Temizle
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {columnLabels.map((col) => {
                const isChecked = options.columns[col.key];
                return (
                  <button
                    key={col.key}
                    type="button"
                    onClick={() => toggleColumn(col.key)}
                    className={`p-3 rounded-2xl border text-left flex items-start justify-between gap-3 transition ${
                      isChecked
                        ? 'bg-slate-800/90 border-emerald-500/50 ring-1 ring-emerald-500/20'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 shrink-0">{col.icon}</div>
                      <div>
                        <div className="font-bold text-white text-xs">{col.title}</div>
                        <div className="text-[10px] text-slate-400">{col.desc}</div>
                      </div>
                    </div>
                    <div className={`mt-0.5 p-1 rounded-lg shrink-0 ${
                      isChecked ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-500'
                    }`}>
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Sheet Tabs Toggle */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-2 border-b border-slate-800 pb-2">
              <Layers className="w-4 h-4 text-blue-400" />
              2. Excel Sayfaları / Sekmeleri
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setOptions((p) => ({ ...p, includeMatrixSheet: !p.includeMatrixSheet }))}
                className={`p-3 rounded-2xl border text-left flex items-center justify-between gap-2 transition ${
                  options.includeMatrixSheet
                    ? 'bg-blue-950/40 border-blue-500/50 text-white'
                    : 'bg-slate-950/60 border-slate-800 opacity-50'
                }`}
              >
                <div>
                  <div className="font-bold text-xs">📊 BCS Matrix Raporu</div>
                  <div className="text-[10px] text-slate-400">Ana matris ve üst KPI oranları</div>
                </div>
                <div className={`p-1 rounded-lg ${options.includeMatrixSheet ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                  <Check className="w-3.5 h-3.5" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => setOptions((p) => ({ ...p, includeServiceStatsSheet: !p.includeServiceStatsSheet }))}
                className={`p-3 rounded-2xl border text-left flex items-center justify-between gap-2 transition ${
                  options.includeServiceStatsSheet
                    ? 'bg-amber-950/40 border-amber-500/50 text-white'
                    : 'bg-slate-950/60 border-slate-800 opacity-50'
                }`}
              >
                <div>
                  <div className="font-bold text-xs">📈 Hizmet Bazlı Fiyat Analizi</div>
                  <div className="text-[10px] text-slate-400">Min/Max/Ortalama ve kapsama</div>
                </div>
                <div className={`p-1 rounded-lg ${options.includeServiceStatsSheet ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                  <Check className="w-3.5 h-3.5" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => setOptions((p) => ({ ...p, includeUnpivotedSheet: !p.includeUnpivotedSheet }))}
                className={`p-3 rounded-2xl border text-left flex items-center justify-between gap-2 transition ${
                  options.includeUnpivotedSheet
                    ? 'bg-purple-950/40 border-purple-500/50 text-white'
                    : 'bg-slate-950/60 border-slate-800 opacity-50'
                }`}
              >
                <div>
                  <div className="font-bold text-xs">📑 Düz Detay Kataloğu</div>
                  <div className="text-[10px] text-slate-400">Unpivoted tüm fiyat satırları</div>
                </div>
                <div className={`p-1 rounded-lg ${options.includeUnpivotedSheet ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                  <Check className="w-3.5 h-3.5" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => setOptions((p) => ({ ...p, includeDroppedSheet: !p.includeDroppedSheet }))}
                className={`p-3 rounded-2xl border text-left flex items-center justify-between gap-2 transition ${
                  options.includeDroppedSheet
                    ? 'bg-red-950/40 border-red-500/50 text-white'
                    : 'bg-slate-950/60 border-slate-800 opacity-50'
                }`}
              >
                <div>
                  <div className="font-bold text-xs">🗑️ Çıkarılan Silme Adayları</div>
                  <div className="text-[10px] text-slate-400">DELETECANDIDATE = EVET kaydı</div>
                </div>
                <div className={`p-1 rounded-lg ${options.includeDroppedSheet ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                  <Check className="w-3.5 h-3.5" />
                </div>
              </button>
            </div>
          </div>

          {/* 3. Category Filter */}
          {availableCategories.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                  3. Hizmet Kategorileri Filtresi
                </h4>
                <button
                  type="button"
                  onClick={() => setSelectedCategories([])}
                  className="text-[10px] text-amber-400 hover:underline font-semibold"
                >
                  Tüm Kategoriler ({summary.serviceColumns.length} Hizmet)
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {availableCategories.map((cat) => {
                  const isSelected = selectedCategories.includes(cat.name);
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => toggleCategory(cat.name)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                          : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>{cat.name}</span>
                      <span className="px-1.5 py-0.2 text-[10px] bg-slate-800 rounded font-mono text-slate-300">
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/95 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Varsayılan Ayarlara Sıfırla</span>
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition"
            >
              İptal
            </button>

            <button
              type="button"
              onClick={handleConfirmExport}
              disabled={isExporting}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-950/50 transition transform active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Hazırlanıyor...' : 'Seçili Ayarlarla Excel İndir'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
