import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Sparkles, 
  Download, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Layers, 
  Building2, 
  Search, 
  Wrench, 
  FileCheck,
  DollarSign,
  Ban,
  Tag,
  ChevronLeft,
  ChevronRight,
  Eye,
  FolderUp,
  FileUp,
  ArrowDownCircle,
  Filter,
  Check,
  SlidersHorizontal,
  RotateCcw,
  Settings,
  MapPin
} from 'lucide-react';
import { WorkbookData, Service18xItem, BCSServiceMasterItem, BCSMatrixSummary, BCSMatrixRow } from '../types';
import { exportCleanSPOResultExcel } from '../utils/excelExporter';
import { ExportSettingsModal } from './ExportSettingsModal';
import { TurkeyMapFilter } from './TurkeyMapFilter';

interface SPOSPRPipelineViewProps {
  workbookData: WorkbookData | null;
  service18xList: Service18xItem[];
  bcsMasterList: BCSServiceMasterItem[];
  summary: BCSMatrixSummary | null;
  is18xCustom?: boolean;
  isBcsMasterCustom?: boolean;
  onUploadWorkbook: (file: File) => void;
  onUpload18xFile: (file: File) => void;
  onUploadBcsMasterFile: (file: File) => void;
  onReset18xList?: () => void;
  onResetBcsMasterList?: () => void;
  onLoadSample: () => void;
  onDownloadSampleWorkbook: () => void;
  onDownload18xTemplate: () => void;
  onDownloadBcsMasterTemplate: () => void;
}

export const SPOSPRPipelineView: React.FC<SPOSPRPipelineViewProps> = ({
  workbookData,
  service18xList,
  bcsMasterList,
  summary,
  is18xCustom = false,
  isBcsMasterCustom = false,
  onUploadWorkbook,
  onUpload18xFile,
  onUploadBcsMasterFile,
  onReset18xList,
  onResetBcsMasterList,
  onLoadSample,
  onDownloadSampleWorkbook,
  onDownload18xTemplate,
  onDownloadBcsMasterTemplate
}) => {
  const [isDragOver1, setIsDragOver1] = useState(false);
  const [isDragOver2, setIsDragOver2] = useState(false);
  const [isDragOver3, setIsDragOver3] = useState(false);

  const [activeTab, setActiveTab] = useState<'matrix' | 'servicePricing' | 'dealerInspector' | 'dropped'>('matrix');
  const [searchTerm, setSearchTerm] = useState('');
  const [claimedFilter, setClaimedFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [managerFilter, setManagerFilter] = useState<string>('all');
  const [priceAvailabilityFilter, setPriceAvailabilityFilter] = useState<'all' | 'pricing_complete' | 'pricing_incomplete' | 'no_pricing' | 'has_price' | 'has_noprice' | 'has_no_service'>('all');
  const [tab3StatusFilter, setTab3StatusFilter] = useState<string>('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [tab2CategoryFilter, setTab2CategoryFilter] = useState<string>('all');
  const [pageSizeOption, setPageSizeOption] = useState<number | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [showMapFilter, setShowMapFilter] = useState(true);

  const [selectedDealer, setSelectedDealer] = useState<BCSMatrixRow | null>(null);
  const [selectedServiceToCompare, setSelectedServiceToCompare] = useState<string>('');

  const cities = Array.from(new Set((summary?.activeRows || []).map((r) => r.city).filter((c) => c && c !== '#YOK')));
  const managers = Array.from(new Set((summary?.activeRows || []).map((r) => r.regionManager).filter((m) => m && m !== '#YOK')));

  // Extract all unique service categories with service counts
  const availableCategories = useMemo(() => {
    if (!summary?.serviceColumns) return [];
    const counts: Record<string, number> = {};
    summary.serviceColumns.forEach((col) => {
      const meta = summary.serviceColumnMeta?.[col];
      const cat = meta?.category || 'Diğer Hizmetler';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    return Object.keys(counts).sort().map((cat) => ({
      name: cat,
      count: counts[cat]
    }));
  }, [summary?.serviceColumns, summary?.serviceColumnMeta]);

  // Compute visible service columns based on selected category filter
  const displayedServiceColumns = useMemo(() => {
    if (!summary?.serviceColumns) return [];
    if (selectedCategories.length === 0) return summary.serviceColumns;
    return summary.serviceColumns.filter((col) => {
      const meta = summary.serviceColumnMeta?.[col];
      const cat = meta?.category || 'Diğer Hizmetler';
      return selectedCategories.includes(cat);
    });
  }, [summary?.serviceColumns, summary?.serviceColumnMeta, selectedCategories]);

  const toggleCategory = (catName: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(catName)) {
        const next = prev.filter((c) => c !== catName);
        return next;
      } else {
        return [...prev, catName];
      }
    });
  };

  const selectAllCategories = () => {
    setSelectedCategories([]);
  };

  const filteredRows = useMemo(() => {
    return (summary?.activeRows || []).filter((r) => {
      const matchesSearch = !searchTerm || Object.values(r).some((v) => 
        String(v).toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchesClaimed = claimedFilter === 'all' || r.claimed === claimedFilter;
      const matchesCity = cityFilter === 'all' || r.city === cityFilter;
      const matchesManager = managerFilter === 'all' || r.regionManager === managerFilter;

      let matchesPriceAvail = true;
      if (priceAvailabilityFilter === 'pricing_complete') {
        matchesPriceAvail = r.pricingStatus === 'COMPLETE';
      } else if (priceAvailabilityFilter === 'pricing_incomplete') {
        matchesPriceAvail = r.pricingStatus === 'INCOMPLETE';
      } else if (priceAvailabilityFilter === 'no_pricing') {
        matchesPriceAvail = r.pricingStatus === 'NO_PRICING';
      } else if (priceAvailabilityFilter === 'has_price') {
        matchesPriceAvail = r.totalPricedServicesCount > 0;
      } else if (priceAvailabilityFilter === 'has_noprice') {
        matchesPriceAvail = r.totalNoPriceCount > 0;
      } else if (priceAvailabilityFilter === 'has_no_service') {
        matchesPriceAvail = r.totalNotOfferedCount > 0;
      }

      return matchesSearch && matchesClaimed && matchesCity && matchesManager && matchesPriceAvail;
    });
  }, [summary?.activeRows, searchTerm, claimedFilter, cityFilter, managerFilter, priceAvailabilityFilter]);

  const effectivePageSize = pageSizeOption === 'all' ? (filteredRows.length || 1) : pageSizeOption;
  const totalPages = Math.ceil(filteredRows.length / effectivePageSize) || 1;
  const paginatedRows = pageSizeOption === 'all' 
    ? filteredRows 
    : filteredRows.slice((currentPage - 1) * effectivePageSize, currentPage * effectivePageSize);

  const activeServiceAnalysis = useMemo(() => {
    return summary?.serviceAnalysisList.find((s) => s.serviceName === selectedServiceToCompare || s.rawKey === selectedServiceToCompare) || summary?.serviceAnalysisList[0];
  }, [summary?.serviceAnalysisList, selectedServiceToCompare]);

  const handleExport = () => {
    if (!summary) return;
    setIsExporting(true);
    try {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      exportCleanSPOResultExcel({
        summary,
        fileName: `My_BCS_Servis_Fiyat_Raporu_${dateStr}.xlsx`,
        sourceFileName: workbookData?.fileName || 'SPO_SPR_Raporu.xlsx'
      });
    } finally {
      setTimeout(() => setIsExporting(false), 500);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Quick Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <FileCheck className="w-3.5 h-3.5" /> Bosch Car Service Servis Fiyat &amp; Raporlama Platformu
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              My BCS Dosya Yükleme &amp; Analiz Paneli
            </h2>
            <p className="text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
              Aşağıdaki <strong className="text-white">3 adet yükleme kutusuna</strong> dosyalarınızı yükleyebilir veya <strong className="text-red-400">"Örnek Veriyle Çalıştır"</strong> butonuna basarak tüm sistemi anında hazır örnekle test edebilirsiniz.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onLoadSample}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-500 shadow-lg shadow-red-950/50 transition transform active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>Örnek Veriyi Yükle ve Başlat</span>
            </button>

            {summary && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-3 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition shadow"
                  title="Excel Dışa Aktarım Ayarları (Sütunlar, Sekmeler ve Kategoriler)"
                >
                  <Settings className="w-4 h-4 text-emerald-400" />
                  <span>Excel Ayarları</span>
                </button>

                <button
                  type="button"
                  onClick={handleExport}
                  disabled={isExporting}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-950/50 transition transform active:scale-95"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>{isExporting ? 'Excel Hazırlanıyor...' : 'Temiz Excel İndir (.xlsx)'}</span>
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. PROMINENT FILE UPLOAD SECTION (Dosya Yükleme Alanları) */}
      <div id="upload-section" className="bg-slate-900/95 border-2 border-red-500/30 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl shadow-red-950/20 ring-1 ring-red-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2.5">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <FolderUp className="w-6 h-6 text-amber-400" />
              <span>Dosyalarınızı Yükleyin (3 Adet Excel Alanı)</span>
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Aşağıdaki <strong className="text-white">1, 2 veya 3 numaralı</strong> kutulara tıklayarak veya dosyalarınızı sürükleyip bırakarak yükleyebilirsiniz.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-emerald-400 font-semibold bg-emerald-950/70 border border-emerald-700/60 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
              <CheckCircle2 className="w-4 h-4" />
              💾 Kalıcı Hafıza Aktif
            </span>
          </div>
        </div>

        {/* Persistent Memory Notification Banner */}
        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-emerald-300">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </span>
            <span>
              <strong>Kalıcı Hafıza:</strong> Hizmet Listeniz (<strong className="text-amber-300">{service18xList.length} Hizmet</strong>) ve BCS Bayi Listeniz (<strong className="text-blue-300">{bcsMasterList.length} Bayi</strong>) tarayıcıda kalıcı olarak saklanmaktadır. <strong>Tekrar yüklemenize gerek yoktur;</strong> artık sadece <strong>1. Kutudan SPO &amp; SPR dosyanızı</strong> yüklemeniz yeterlidir.
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Box 1: SPO + SPR File */}
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragOver1(true); }}
            onDragLeave={() => setIsDragOver1(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver1(false);
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                onUploadWorkbook(e.dataTransfer.files[0]);
              }
            }}
            className={`relative rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 border-2 ${
              isDragOver1 
                ? 'border-red-400 bg-red-950/40 ring-4 ring-red-500/30 scale-[1.02]' 
                : 'border-red-500/40 bg-gradient-to-b from-slate-800/80 to-slate-900/90 hover:border-red-400/80'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-red-900/50">
                    1
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">SPO &amp; SPR Dosyası</h4>
                    <p className="text-[10px] text-red-300 font-medium">Zorunlu Ana Dosya</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onDownloadSampleWorkbook}
                  className="text-[10px] text-slate-300 hover:text-white px-2 py-1 bg-slate-800/90 rounded-lg border border-slate-700 flex items-center gap-1 hover:bg-slate-700 transition"
                  title="Örnek SPO + SPR dosyasını bilgisayara indir"
                >
                  <Download className="w-3 h-3" />
                  <span>Şablon İndir</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-400 mb-3">
                İçerisinde <code className="text-red-300 font-mono">SPO</code> ve <code className="text-red-300 font-mono">SPR</code> sekmeleri olan ana Excel dosyası.
              </p>

              <label className="border-2 border-dashed border-red-500/50 hover:border-red-400 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer bg-slate-950/70 hover:bg-red-950/30 transition min-h-[130px] text-center group">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      onUploadWorkbook(e.target.files[0]);
                    }
                  }}
                />
                <FileUp className="w-9 h-9 text-red-400 mb-2 group-hover:scale-110 group-hover:text-red-300 transition transform" />
                <span className="text-xs font-bold text-white block mb-0.5 max-w-[200px] truncate">
                  {workbookData ? workbookData.fileName : 'Dosya Seç veya Buraya Sürükle'}
                </span>
                <span className="text-[10px] text-slate-400 group-hover:text-slate-300">
                  .xlsx / .xls formatında yükleyin
                </span>
                <span className="mt-2 text-[10px] px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition shadow">
                  📁 Dosya Seç
                </span>
              </label>
            </div>

            {workbookData ? (
              <div className="mt-3 text-[11px] px-3 py-2 rounded-xl bg-emerald-950/60 border border-emerald-600/50 text-emerald-300 flex items-center justify-between">
                <span>Sekmeler: <strong>{workbookData.sheetNames.join(', ')}</strong></span>
                <span className="font-bold flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Yüklendi
                </span>
              </div>
            ) : (
              <div className="mt-3 text-[10px] text-slate-500 text-center">
                Henüz dosya seçilmedi
              </div>
            )}
          </div>

          {/* Box 2: 18xxxxx Service List */}
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragOver2(true); }}
            onDragLeave={() => setIsDragOver2(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver2(false);
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                onUpload18xFile(e.dataTransfer.files[0]);
              }
            }}
            className={`relative rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 border-2 ${
              isDragOver2 
                ? 'border-amber-400 bg-amber-950/40 ring-4 ring-amber-500/30 scale-[1.02]' 
                : 'border-amber-500/40 bg-gradient-to-b from-slate-800/80 to-slate-900/90 hover:border-amber-400/80'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-amber-900/50">
                    2
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">18xxxxx Hizmet Listesi</h4>
                    <p className="text-[10px] text-amber-300 font-medium">Hizmet &amp; Fiyat Kataloğu</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {is18xCustom && onReset18xList && (
                    <button
                      type="button"
                      onClick={onReset18xList}
                      className="text-[10px] text-amber-300 hover:text-white px-2 py-1 bg-amber-950/80 rounded-lg border border-amber-800/80 flex items-center gap-1 hover:bg-amber-900 transition"
                      title="Varsayılan Bosch Hizmet Kataloğuna Sıfırla"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Sıfırla</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onDownload18xTemplate}
                    className="text-[10px] text-slate-300 hover:text-white px-2 py-1 bg-slate-800/90 rounded-lg border border-slate-700 flex items-center gap-1 hover:bg-slate-700 transition"
                    title="18xxxxx Hizmet Listesi Şablonunu İndir"
                  >
                    <Download className="w-3 h-3" />
                    <span>Şablon İndir</span>
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 mb-3">
                18xxxxx kodlu hizmet tanımları listesi. <strong>Hafızada saklanır, bir kez yüklemeniz yeterlidir.</strong>
              </p>

              <label className="border-2 border-dashed border-amber-500/50 hover:border-amber-400 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer bg-slate-950/70 hover:bg-amber-950/30 transition min-h-[130px] text-center group">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      onUpload18xFile(e.target.files[0]);
                    }
                  }}
                />
                <Wrench className="w-9 h-9 text-amber-400 mb-2 group-hover:scale-110 group-hover:text-amber-300 transition transform" />
                <span className="text-xs font-bold text-white block mb-0.5">
                  {is18xCustom ? '💾 Özel Liste Hafızada' : '2. Dosyayı Seçin (18xxxxx)'}
                </span>
                <span className="text-[10px] text-slate-400 group-hover:text-slate-300">
                  {is18xCustom ? 'Güncellemek için yeni dosya seçebilirsiniz' : 'Fiyat & hizmet listesi Excel dosyası'}
                </span>
                <span className="mt-2 text-[10px] px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition shadow">
                  {is18xCustom ? '🔄 Listeyi Güncelle' : '📁 Dosya Seç'}
                </span>
              </label>
            </div>

            <div className="mt-3 text-[11px] px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-amber-300 flex items-center justify-between">
              <span>💾 Hafızada: <strong>{service18xList.length} Hizmet</strong> {is18xCustom && <span className="text-[10px] text-emerald-400 font-normal ml-1">(Özel Liste)</span>}</span>
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saklanıyor
              </span>
            </div>
          </div>

          {/* Box 3: BCS Master Service List */}
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragOver3(true); }}
            onDragLeave={() => setIsDragOver3(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver3(false);
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                onUploadBcsMasterFile(e.dataTransfer.files[0]);
              }
            }}
            className={`relative rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 border-2 ${
              isDragOver3 
                ? 'border-blue-400 bg-blue-950/40 ring-4 ring-blue-500/30 scale-[1.02]' 
                : 'border-blue-500/40 bg-gradient-to-b from-slate-800/80 to-slate-900/90 hover:border-blue-400/80'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-blue-900/50">
                    3
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">BCS Servis Listesi</h4>
                    <p className="text-[10px] text-blue-300 font-medium">Dissap, Firma, Sorumlular</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {isBcsMasterCustom && onResetBcsMasterList && (
                    <button
                      type="button"
                      onClick={onResetBcsMasterList}
                      className="text-[10px] text-blue-300 hover:text-white px-2 py-1 bg-blue-950/80 rounded-lg border border-blue-800/80 flex items-center gap-1 hover:bg-blue-900 transition"
                      title="Varsayılan BCS Bayi Listesine Sıfırla"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Sıfırla</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onDownloadBcsMasterTemplate}
                    className="text-[10px] text-slate-300 hover:text-white px-2 py-1 bg-slate-800/90 rounded-lg border border-slate-700 flex items-center gap-1 hover:bg-slate-700 transition"
                    title="BCS Servis Listesi Şablonunu İndir"
                  >
                    <Download className="w-3 h-3" />
                    <span>Şablon İndir</span>
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 mb-3">
                Dissap (CUSTOMERID), Firma, İl/İlçe ve Sorumlu listesi. <strong>Hafızada saklanır, bir kez yüklemeniz yeterlidir.</strong>
              </p>

              <label className="border-2 border-dashed border-blue-500/50 hover:border-blue-400 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer bg-slate-950/70 hover:bg-blue-950/30 transition min-h-[130px] text-center group">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      onUploadBcsMasterFile(e.target.files[0]);
                    }
                  }}
                />
                <Building2 className="w-9 h-9 text-blue-400 mb-2 group-hover:scale-110 group-hover:text-blue-300 transition transform" />
                <span className="text-xs font-bold text-white block mb-0.5">
                  {isBcsMasterCustom ? '💾 Özel Bayi Listesi Hafızada' : '3. Dosyayı Seçin (BCS Bayiler)'}
                </span>
                <span className="text-[10px] text-slate-400 group-hover:text-slate-300">
                  {isBcsMasterCustom ? 'Güncellemek için yeni dosya seçebilirsiniz' : 'Dissap & Sorumlular Excel dosyası'}
                </span>
                <span className="mt-2 text-[10px] px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition shadow">
                  {isBcsMasterCustom ? '🔄 Listeyi Güncelle' : '📁 Dosya Seç'}
                </span>
              </label>
            </div>

            <div className="mt-3 text-[11px] px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-blue-300 flex items-center justify-between">
              <span>💾 Hafızada: <strong>{bcsMasterList.length} BCS Bayisi</strong> {isBcsMasterCustom && <span className="text-[10px] text-emerald-400 font-normal ml-1">(Özel Liste)</span>}</span>
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saklanıyor
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Top Summary KPI Ratios */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 space-y-1">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Kayıt Olanların Oranı
            </span>
            <div className="text-2xl font-extrabold text-white">{summary.registeredRatio}</div>
            <span className="text-[10px] text-emerald-400 block truncate">{summary.claimedYesCount} Kayıtlı / {summary.finalActiveRowCount} Servis</span>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 space-y-1">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              Online Olanların Oranı
            </span>
            <div className="text-2xl font-extrabold text-blue-400">{summary.onlineRatio}</div>
            <span className="text-[10px] text-slate-400 block truncate">{summary.onlineYesCount} Online Booking Aktif</span>
          </div>

          <div className="bg-slate-800/60 border border-emerald-500/30 ring-1 ring-emerald-500/20 rounded-2xl p-4 space-y-1">
            <span className="text-[11px] text-emerald-300 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Fiyat Kuralı %100 Tam
            </span>
            <div className="text-2xl font-extrabold text-emerald-400">{summary.pricingCompleteRatio}</div>
            <span className="text-[10px] text-emerald-300 block truncate">{summary.pricingCompleteCount} Bayide Eksiksiz</span>
          </div>

          <div className="bg-slate-800/60 border border-amber-500/30 ring-1 ring-amber-500/20 rounded-2xl p-4 space-y-1">
            <span className="text-[11px] text-amber-300 font-medium flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" />
              Fiyat Kuralı 100% Olmayan
            </span>
            <div className="text-2xl font-extrabold text-amber-400">{summary.pricingIncompleteRatio}</div>
            <span className="text-[10px] text-amber-300 block truncate">{summary.pricingIncompleteCount} Bayide NOPRICE Var</span>
          </div>

          <div className="bg-slate-800/60 border border-red-500/30 ring-1 ring-red-500/20 rounded-2xl p-4 space-y-1">
            <span className="text-[11px] text-red-300 font-medium flex items-center gap-1.5">
              <Ban className="w-3.5 h-3.5 text-red-400" />
              Fiyatı Hiç Girilmemiş
            </span>
            <div className="text-2xl font-extrabold text-red-400">{summary.noPricingRatio}</div>
            <span className="text-[10px] text-red-300 block truncate">{summary.noPricingCount} Bayide %0 Fiyat</span>
          </div>

          <div className="bg-slate-800/60 border border-sky-500/30 rounded-2xl p-4 space-y-1">
            <span className="text-[11px] text-sky-300 font-medium flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-sky-400" />
              Ağ Fiyat Doluluk Oranı
            </span>
            <div className="text-2xl font-extrabold text-sky-300">%{summary.overallPricingCoveragePct}</div>
            <span className="text-[10px] text-slate-400 block truncate">{summary.totalPricedOfferingsCount} / {summary.totalServicesOfferedAcrossNetwork} Fiyat</span>
          </div>
        </div>
      )}

      {/* 4. Visual Legend Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="font-bold text-white flex items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-400" />
            Hizmet Durumu Renk Göstergeleri:
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 text-amber-300 font-semibold bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-800/60">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Fiyatlı Hizmet (Örn: 1.500 TL)
            </span>
            <span className="flex items-center gap-1.5 text-emerald-300 font-semibold bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-800/60">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              0 TL (Ücretsiz / Dahil)
            </span>
            <span className="flex items-center gap-1.5 text-red-400 font-semibold bg-red-950/40 px-2.5 py-1 rounded-lg border border-red-800/60">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              HAYIR (Hizmet Verilmiyor)
            </span>
            <span className="flex items-center gap-1.5 text-slate-400 font-semibold bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              NOPRICE (Fiyat Girilmemiş)
            </span>
          </div>
        </div>
      </div>

      {/* 5. Results & Matrix Table */}
      {summary && (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-4">
          {/* Tab Navigation */}
          <div className="flex border-b border-slate-700/80 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => { setActiveTab('matrix'); setCurrentPage(1); }}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-xs whitespace-nowrap transition ${
                activeTab === 'matrix'
                  ? 'border-emerald-500 text-white bg-slate-800/60'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Tam Matris Tablosu ({summary.finalActiveRowCount} Servis)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('servicePricing')}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-xs whitespace-nowrap transition ${
                activeTab === 'servicePricing'
                  ? 'border-amber-500 text-white bg-slate-800/60'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <DollarSign className="w-4 h-4 text-amber-400" />
              <span>Hizmet Bazlı Fiyat Kıyaslama ({summary.serviceColumns.length} Hizmet)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('dealerInspector')}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-xs whitespace-nowrap transition ${
                activeTab === 'dealerInspector'
                  ? 'border-blue-500 text-white bg-slate-800/60'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building2 className="w-4 h-4 text-blue-400" />
              <span>Servis Fiyat Kartı İncele</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('dropped')}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-xs whitespace-nowrap transition ${
                activeTab === 'dropped'
                  ? 'border-red-500 text-white bg-slate-800/60'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <XCircle className="w-4 h-4 text-red-400" />
              <span>Silinen Satırlar ({summary.deletedCandidateCount})</span>
            </button>
          </div>

          {/* TAB 1: Exact Matrix Table */}
          {activeTab === 'matrix' && (
            <div className="space-y-5">
              
              {/* Interactive Turkey Map Filter Header Toggle */}
              <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-5 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      İnteraktif Harita Filtresi
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Haritada illere tıklayarak tüm matris ve fiyat raporunu o şehre filtreleyin.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowMapFilter((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
                >
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>{showMapFilter ? 'Haritayı Gizle' : 'Harita Filtresini Göster'}</span>
                </button>
              </div>

              {/* Turkey Map Component */}
              {showMapFilter && (
                <TurkeyMapFilter
                  summary={summary}
                  selectedCity={cityFilter}
                  onSelectCity={(city) => {
                    setCityFilter(city);
                    setCurrentPage(1);
                  }}
                  onInspectDealer={(dealer) => {
                    setSelectedDealer(dealer);
                    setActiveTab('dealerInspector');
                  }}
                />
              )}

              {/* Row Filters & Search Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="relative w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                      placeholder="CUSTOMERID, BCS, İl, Saha..."
                      className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-lg pl-8 pr-3 py-2 outline-none focus:border-red-500"
                    />
                  </div>

                  <select
                    value={cityFilter}
                    onChange={(e) => { setCityFilter(e.target.value); setCurrentPage(1); }}
                    className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-2 outline-none"
                  >
                    <option value="all">Tüm İller</option>
                    {cities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>

                  <select
                    value={managerFilter}
                    onChange={(e) => { setManagerFilter(e.target.value); setCurrentPage(1); }}
                    className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-2 outline-none"
                  >
                    <option value="all">Tüm Bölge Yöneticileri</option>
                    {managers.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>

                  <select
                    value={claimedFilter}
                    onChange={(e) => { setClaimedFilter(e.target.value); setCurrentPage(1); }}
                    className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-2 outline-none"
                  >
                    <option value="all">Tüm claimed</option>
                    <option value="EVET">claimed = EVET</option>
                    <option value="HAYIR">claimed = HAYIR</option>
                  </select>

                  <select
                    value={priceAvailabilityFilter}
                    onChange={(e) => { setPriceAvailabilityFilter(e.target.value as any); setCurrentPage(1); }}
                    className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-2 outline-none font-medium"
                  >
                    <option value="all">Tüm Fiyat Durumları</option>
                    <option value="pricing_complete">✓ %100 Tam Fiyatlılar ({summary.pricingCompleteCount})</option>
                    <option value="pricing_incomplete">⚠️ Fiyat Kuralı Eksikler ({summary.pricingIncompleteCount})</option>
                    <option value="no_pricing">✕ Fiyatı Hiç Girilmemişler ({summary.noPricingCount})</option>
                    <option value="has_price">Fiyat Tanımlı Hizmeti Olanlar</option>
                    <option value="has_noprice">NOPRICE İçerenler</option>
                    <option value="has_no_service">HAYIR İçerenler</option>
                  </select>

                  <select
                    value={pageSizeOption}
                    onChange={(e) => {
                      const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                      setPageSizeOption(val);
                      setCurrentPage(1);
                    }}
                    className="bg-slate-900 border border-amber-500/60 text-amber-300 font-semibold text-xs rounded-lg px-3 py-2 outline-none shadow-sm"
                  >
                    <option value="all">Tüm Satırlar (Hepsini Tek Listede Göster)</option>
                    <option value={20}>Sayfa Başına 20 Satır</option>
                    <option value={50}>Sayfa Başına 50 Satır</option>
                    <option value={100}>Sayfa Başına 100 Satır</option>
                  </select>
                </div>

                <div className="text-xs text-slate-400 font-medium">
                  <span className="text-emerald-400 font-bold">{filteredRows.length}</span> / {summary.activeRows.length} servis
                  {pageSizeOption === 'all' && <span className="text-amber-400 font-bold ml-1.5">(Tek Listede)</span>}
                </div>
              </div>

              {/* Service Category / Group Filter Panel */}
              {availableCategories.length > 0 && (
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                        <SlidersHorizontal className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          Hizmet Grubu / Kategori Filtresi
                        </span>
                        <span className="text-[11px] text-slate-400 ml-2 hidden sm:inline">
                          (Tabloda görmek istediğiniz hizmet gruplarını açıp kapatın)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-slate-300 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                        <span className="text-amber-400 font-bold">{displayedServiceColumns.length}</span> / {summary.serviceColumns.length} Hizmet Sütunu
                      </span>
                      {selectedCategories.length > 0 && (
                        <button
                          type="button"
                          onClick={selectAllCategories}
                          className="inline-flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 font-medium px-2 py-1 rounded hover:bg-slate-800 transition"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Tümünü Göster</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Category Toggle Pills */}
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <button
                      type="button"
                      onClick={selectAllCategories}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition shadow-sm ${
                        selectedCategories.length === 0
                          ? 'bg-red-600 text-white shadow-red-900/30'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                      }`}
                    >
                      <span>Tüm Kategoriler</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        selectedCategories.length === 0 ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {summary.serviceColumns.length}
                      </span>
                    </button>

                    {availableCategories.map(({ name, count }) => {
                      const isSelected = selectedCategories.includes(name);

                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => toggleCategory(name)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-950/20'
                              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/80'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          <span>{name}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                            isSelected ? 'bg-black/20 text-slate-950 font-bold' : 'bg-slate-700/80 text-slate-400'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Exact Matrix Grid Table */}
              {displayedServiceColumns.length === 0 ? (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
                  <div className="inline-flex p-3 rounded-full bg-amber-500/10 text-amber-400 mb-1">
                    <Filter className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Seçili Kategoriye Ait Hizmet Bulunamadı</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Kategori filtresinde en az bir kategori seçebilir veya tüm hizmetleri tekrar görüntülemek için aşağıdaki butona basabilirsiniz.
                  </p>
                  <button
                    type="button"
                    onClick={selectAllCategories}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-500 shadow transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Tüm Hizmet Sütunlarını Göster ({summary.serviceColumns.length})</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-700/70 rounded-xl bg-slate-950 max-h-[70vh] shadow-inner">
                  <table className="w-full text-left text-xs text-slate-300 whitespace-nowrap">
                    <thead className="bg-slate-800/95 text-slate-200 border-b border-slate-700 font-semibold sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-3 py-2.5">CUSTOMERID</th>
                        <th className="px-3 py-2.5">crm create date</th>
                        <th className="px-3 py-2.5">BÖLGE YÖNETİCİSİ</th>
                        <th className="px-3 py-2.5">SAHA</th>
                        <th className="px-3 py-2.5">İL</th>
                        <th className="px-3 py-2.5">İLÇE</th>
                        <th className="px-3 py-2.5">BCS</th>
                        <th className="px-3 py-2.5 text-center">claimed</th>
                        <th className="px-3 py-2.5 text-center">SPO_ONLINEBOOKING</th>
                        <th className="px-3 py-2.5 text-center bg-slate-900 border-l border-slate-700/80 text-amber-300 min-w-[150px]">
                          FİYAT KURALI / KAPSAMA
                        </th>
                        {displayedServiceColumns.map((col) => {
                          const meta = summary.serviceColumnMeta?.[col];
                          const title = meta?.displayName || meta?.serviceName || col;
                          const code = meta?.serviceCode;
                          const cat = meta?.category;

                          return (
                            <th key={col} className="px-3 py-2.5 font-medium border-l border-slate-800 text-center min-w-[140px]">
                              <div className="flex flex-col items-center justify-center gap-0.5">
                                <span className="font-semibold text-slate-100">{title}</span>
                                <div className="flex items-center gap-1">
                                  {code && code !== title && (
                                    <span className="text-[10px] text-amber-400/90 font-mono font-normal">({code})</span>
                                  )}
                                  {cat && (
                                    <span className="text-[9px] text-slate-400 bg-slate-700/60 px-1 py-0.2 rounded font-normal">
                                      {cat}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                      {paginatedRows.map((r) => (
                        <tr 
                          key={r._id} 
                          onClick={() => setSelectedDealer(r)}
                          className="hover:bg-slate-800/50 cursor-pointer transition group"
                          title="Bu servisin detaylı fiyat kartını görmek için tıklayın"
                        >
                          <td className="px-3 py-2 text-white font-bold group-hover:text-red-400">
                            {r.customerId}
                          </td>
                          <td className="px-3 py-2 text-slate-400 font-sans">
                            {r.crmCreateDate}
                          </td>
                          <td className={`px-3 py-2 font-sans font-medium ${r.regionManager === '#YOK' ? 'text-red-400 font-bold' : 'text-slate-200'}`}>
                            {r.regionManager}
                          </td>
                          <td className={`px-3 py-2 font-sans ${r.fieldResponsible === '#YOK' ? 'text-red-400 font-bold' : 'text-slate-300'}`}>
                            {r.fieldResponsible}
                          </td>
                          <td className={`px-3 py-2 font-sans ${r.city === '#YOK' ? 'text-red-400 font-bold' : 'text-slate-300'}`}>
                            {r.city}
                          </td>
                          <td className={`px-3 py-2 font-sans ${r.district === '#YOK' ? 'text-red-400 font-bold' : 'text-slate-400'}`}>
                            {r.district}
                          </td>
                          <td className={`px-3 py-2 font-sans font-semibold flex items-center justify-between gap-2 ${r.bcsFirmName === '#YOK' ? 'text-red-400 font-bold' : 'text-blue-300'}`}>
                            <span>{r.bcsFirmName}</span>
                            <Eye className="w-3.5 h-3.5 text-slate-600 group-hover:text-white" />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              r.claimed === 'EVET'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'text-slate-500'
                            }`}>
                              {r.claimed}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              r.spoOnlineBooking === 'EVET'
                                ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                : 'text-slate-500'
                            }`}>
                              {r.spoOnlineBooking}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center border-l border-slate-800/80 bg-slate-900/30">
                            <div className="flex flex-col items-center justify-center gap-0.5">
                              {r.pricingStatus === 'COMPLETE' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                                  ✓ %100 Tam ({r.totalPricedServicesCount}/{r.totalOfferedServicesCount})
                                </span>
                              ) : r.pricingStatus === 'INCOMPLETE' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-700">
                                  ⚠️ %{r.pricingCoveragePct} ({r.totalPricedServicesCount}/{r.totalOfferedServicesCount})
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-950 text-red-300 border border-red-800">
                                  ✕ %0 Fiyat Yok
                                </span>
                              )}
                              {r.averagePrice > 0 && (
                                <span className="text-[10px] text-slate-400 font-sans font-medium">
                                  Ort: <strong className="text-amber-300/90">{r.averagePrice.toLocaleString('tr-TR')} TL</strong>
                                </span>
                              )}
                            </div>
                          </td>
                          {displayedServiceColumns.map((col) => {
                            const statusObj = r.serviceStatuses[col] || { status: 'NOT_OFFERED', displayValue: 'HAYIR', priceNumeric: null };
                            const { status, displayValue, priceNumeric } = statusObj;

                            return (
                              <td
                                key={col}
                                className={`px-3 py-2 text-center border-l border-slate-800/60 ${
                                  status === 'PRICED'
                                    ? 'text-amber-300 font-bold bg-amber-950/20'
                                    : status === 'FREE'
                                    ? 'text-emerald-400 font-bold bg-emerald-950/20'
                                    : status === 'OFFERED_YES'
                                    ? 'text-emerald-300 font-bold'
                                    : status === 'NO_PRICE'
                                    ? 'text-slate-400 bg-slate-900/60'
                                    : 'text-red-400/60 opacity-60'
                                }`}
                              >
                                {status === 'PRICED' ? (
                                  <span className="inline-flex items-center gap-0.5">
                                    {priceNumeric?.toLocaleString('tr-TR')}
                                  </span>
                                ) : status === 'FREE' ? (
                                  <span>0</span>
                                ) : status === 'NOT_OFFERED' ? (
                                  <span className="text-red-400 font-sans text-[10px] font-medium">HAYIR</span>
                                ) : (
                                  <span>{displayValue}</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination & Table Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-400 border-t border-slate-800/80">
                <div className="flex items-center gap-2">
                  {pageSizeOption === 'all' ? (
                    <span className="text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/60 px-3 py-1 rounded-lg flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Tüm Satırlar Gösteriliyor ({filteredRows.length} Servis Tek Listede)</span>
                    </span>
                  ) : (
                    <span>Sayfa {currentPage} / {totalPages} ({filteredRows.length} Servis)</span>
                  )}
                </div>

                {pageSizeOption !== 'all' && totalPages > 1 && (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1 bg-slate-800 rounded hover:bg-slate-700 disabled:opacity-40 flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Önceki</span>
                    </button>
                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="px-3 py-1 bg-slate-800 rounded hover:bg-slate-700 disabled:opacity-40 flex items-center gap-1"
                    >
                      <span>Sonraki</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Service-by-Service Pricing & Availability Comparison */}
          {activeTab === 'servicePricing' && (
            <div className="space-y-5">
              {/* Category Filter for Tab 2 */}
              {availableCategories.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5 text-amber-400" />
                    Kategori:
                  </span>
                  <button
                    type="button"
                    onClick={() => setTab2CategoryFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                      tab2CategoryFilter === 'all'
                        ? 'bg-red-600 text-white font-semibold'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    Tümü ({summary.serviceColumns.length})
                  </button>
                  {availableCategories.map(({ name, count }) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setTab2CategoryFilter(name)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                        tab2CategoryFilter === name
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      <span>{name}</span>
                      <span className="ml-1 opacity-70 font-mono text-[10px]">({count})</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Service Selector Buttons */}
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider block mb-2">
                  İncelemek İstediğiniz Hizmeti Seçin:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {summary.serviceColumns
                    .filter((sCol) => {
                      if (tab2CategoryFilter === 'all') return true;
                      const meta = summary.serviceColumnMeta?.[sCol];
                      return (meta?.category || 'Diğer Hizmetler') === tab2CategoryFilter;
                    })
                    .map((sCol) => {
                      const meta = summary.serviceColumnMeta?.[sCol];
                      const title = meta?.displayName || meta?.serviceName || sCol;
                      const code = meta?.serviceCode;

                      return (
                        <button
                          key={sCol}
                          type="button"
                          onClick={() => setSelectedServiceToCompare(sCol)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                            selectedServiceToCompare === sCol || selectedServiceToCompare === title
                              ? 'bg-amber-500 text-slate-950 font-bold shadow'
                              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700'
                          }`}
                        >
                          <span>{title}</span>
                          {code && code !== title && (
                            <span className="ml-1 opacity-75 font-mono text-[10px]">({code})</span>
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Active Service Pricing Overview Card */}
              {activeServiceAnalysis && (
                <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xl">
                  {/* Top Service Title & Benchmark Badges */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Hizmet Analizi & Fiyat Kıyaslama</span>
                        {activeServiceAnalysis.serviceCode && (
                          <span className="bg-slate-800 text-slate-300 font-mono text-[11px] px-2 py-0.5 rounded border border-slate-700">
                            Kod: {activeServiceAnalysis.serviceCode}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">{activeServiceAnalysis.serviceName}</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Türkiye geneli {activeServiceAnalysis.totalOfferCount} bayi tarafından sunulmakta, {activeServiceAnalysis.pricedCount} bayide aktif fiyat tanımlı.
                      </p>
                    </div>

                    {/* Quick KPI stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      {/* Catalog Reference Price */}
                      <div className="bg-slate-800/90 px-3.5 py-2.5 rounded-xl border border-slate-700/80">
                        <div className="text-slate-400 text-[10px] font-semibold flex items-center justify-between">
                          <span>18x Liste Fiyatı</span>
                          {activeServiceAnalysis.priceVariancePct !== undefined && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              activeServiceAnalysis.priceVariancePct > 0 
                                ? 'bg-amber-500/20 text-amber-300' 
                                : activeServiceAnalysis.priceVariancePct < 0 
                                ? 'bg-emerald-500/20 text-emerald-300' 
                                : 'bg-slate-700 text-slate-300'
                            }`}>
                              {activeServiceAnalysis.priceVariancePct > 0 ? `+${activeServiceAnalysis.priceVariancePct}%` : `${activeServiceAnalysis.priceVariancePct}%`}
                            </span>
                          )}
                        </div>
                        <div className="text-base sm:text-lg font-black text-sky-300 font-mono mt-0.5">
                          {activeServiceAnalysis.catalogRefPrice !== undefined 
                            ? `${activeServiceAnalysis.catalogRefPrice.toLocaleString('tr-TR')} TL` 
                            : 'Tanımsız'}
                        </div>
                      </div>

                      {/* Average Market Price */}
                      <div className="bg-slate-800/90 px-3.5 py-2.5 rounded-xl border border-amber-500/30 ring-1 ring-amber-500/20">
                        <div className="text-slate-400 text-[10px] font-semibold">Bayi Ortalaması</div>
                        <div className="text-base sm:text-lg font-black text-amber-400 font-mono mt-0.5">
                          {activeServiceAnalysis.avgPrice > 0 
                            ? `${activeServiceAnalysis.avgPrice.toLocaleString('tr-TR')} TL` 
                            : 'Fiyat Yok'}
                        </div>
                      </div>

                      {/* Median Price */}
                      <div className="bg-slate-800/90 px-3.5 py-2.5 rounded-xl border border-slate-700/80">
                        <div className="text-slate-400 text-[10px] font-semibold">Medyan Fiyat</div>
                        <div className="text-base sm:text-lg font-black text-emerald-400 font-mono mt-0.5">
                          {activeServiceAnalysis.medianPrice && activeServiceAnalysis.medianPrice > 0 
                            ? `${activeServiceAnalysis.medianPrice.toLocaleString('tr-TR')} TL` 
                            : '-'}
                        </div>
                      </div>

                      {/* Price Range (Min - Max) */}
                      <div className="bg-slate-800/90 px-3.5 py-2.5 rounded-xl border border-slate-700/80">
                        <div className="text-slate-400 text-[10px] font-semibold">Fiyat Aralığı (Min - Max)</div>
                        <div className="text-sm font-bold text-white font-mono mt-1 whitespace-nowrap">
                          {activeServiceAnalysis.minPrice > 0
                            ? `${activeServiceAnalysis.minPrice.toLocaleString('tr-TR')} - ${activeServiceAnalysis.maxPrice.toLocaleString('tr-TR')} TL`
                            : activeServiceAnalysis.freeCount > 0 ? '0 TL (Ücretsiz)' : '-'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Breakdown Pills */}
                  <div className="flex flex-wrap items-center gap-2 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 font-bold mr-1 text-[11px]">Hizmet Durumu Dağılımı:</span>
                    <span className="bg-amber-950/40 text-amber-300 border border-amber-800/50 px-2.5 py-1 rounded-lg font-medium">
                      🏷️ <strong>{activeServiceAnalysis.pricedCount}</strong> Bayide Ücretli
                    </span>
                    <span className="bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-1 rounded-lg font-medium">
                      ⚠️ <strong>{activeServiceAnalysis.noPriceCount}</strong> Bayide NOPRICE (Fiyatsız)
                    </span>
                    {activeServiceAnalysis.freeCount > 0 && (
                      <span className="bg-emerald-950/40 text-emerald-300 border border-emerald-800/50 px-2.5 py-1 rounded-lg font-medium">
                        ✨ <strong>{activeServiceAnalysis.freeCount}</strong> Bayide 0 TL (Ücretsiz)
                      </span>
                    )}
                    <span className="bg-red-950/40 text-red-300 border border-red-800/50 px-2.5 py-1 rounded-lg font-medium">
                      ❌ <strong>{activeServiceAnalysis.notOfferedCount}</strong> Bayide HAYIR (Verilmiyor)
                    </span>
                    <span className="ml-auto text-[11px] text-slate-400 font-medium">
                      Fiyatlandırma Kapsama Oranı: <strong className="text-emerald-400 font-bold">%{activeServiceAnalysis.pricingCoverageRate}</strong>
                    </span>
                  </div>

                  {/* List of Dealers Offering this Service with Prices */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                        <span>Bu Hizmeti Veren Servisler ve Belirledikleri Fiyatlar</span>
                        <span className="bg-slate-800 text-amber-400 px-2 py-0.5 rounded text-[11px] font-mono">
                          {activeServiceAnalysis.offeringDealers.length} Servis
                        </span>
                      </h4>
                      <span className="text-[11px] text-slate-400">En düşük fiyattan en yükseğe doğru sıralı</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
                      {activeServiceAnalysis.offeringDealers.map((d, idx) => (
                        <div 
                          key={idx} 
                          className={`border rounded-xl p-3.5 flex items-center justify-between gap-2 transition ${
                            d.status === 'PRICED' 
                              ? 'bg-slate-800/90 border-slate-700/80 hover:border-amber-500/40' 
                              : d.status === 'FREE'
                              ? 'bg-emerald-950/20 border-emerald-800/40 hover:border-emerald-600'
                              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div>
                            <div className="font-semibold text-white text-xs">{d.firmName}</div>
                            <div className="text-[11px] text-slate-400">{d.city} • {d.manager}</div>
                          </div>
                          <div className="text-right shrink-0">
                            {d.status === 'PRICED' ? (
                              <div className="text-sm font-extrabold text-amber-300 font-mono">
                                {d.priceNum?.toLocaleString('tr-TR')} TL
                              </div>
                            ) : d.status === 'FREE' ? (
                              <div className="text-xs font-extrabold text-emerald-400 font-mono">0 TL (Ücretsiz)</div>
                            ) : d.status === 'NO_PRICE' ? (
                              <div className="text-xs font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">NOPRICE</div>
                            ) : (
                              <div className="text-xs font-bold text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">EVET</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Dealer Pricing Inspector Modal/View */}
          {activeTab === 'dealerInspector' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Servis Bazlı Tam Fiyat &amp; Hizmet Menüsü
                  </h3>
                  <p className="text-xs text-slate-400">Aşağıdan bir servis seçerek sunduğu ve sunmadığı tüm hizmetlerin fiyatlarını inceleyin.</p>
                </div>

                <div className="w-72">
                  <select
                    value={selectedDealer?.customerId || ''}
                    onChange={(e) => {
                      const found = summary.activeRows.find((r) => r.customerId === e.target.value);
                      setSelectedDealer(found || null);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-medium focus:border-red-500 outline-none"
                  >
                    <option value="">Servis Seçin...</option>
                    {summary.activeRows.map((r) => (
                      <option key={r._id} value={r.customerId}>
                        {r.bcsFirmName} ({r.city} - {r.customerId})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedDealer ? (
                <div className="bg-slate-900/90 border border-slate-700 rounded-2xl p-6 space-y-6">
                  {/* Dealer Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                    <div>
                      <span className="text-xs font-mono text-red-400 font-bold">{selectedDealer.customerId}</span>
                      <h2 className="text-xl font-bold text-white">{selectedDealer.bcsFirmName}</h2>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {selectedDealer.city} / {selectedDealer.district} • Bölge Yöneticisi: <strong className="text-white">{selectedDealer.regionManager}</strong> • Saha: <strong className="text-white">{selectedDealer.fieldResponsible}</strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
                      <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-center">
                        <div className="text-slate-400 text-[10px]">Aktif Hizmet</div>
                        <div className="text-base sm:text-lg font-bold text-emerald-400">{selectedDealer.totalOfferedServicesCount}</div>
                      </div>
                      <div className="bg-slate-800 p-3 rounded-xl border border-amber-500/40 text-center">
                        <div className="text-slate-400 text-[10px]">Fiyatı Girilenler</div>
                        <div className="text-base sm:text-lg font-bold text-amber-400">{selectedDealer.totalPricedServicesCount}</div>
                      </div>
                      <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-center">
                        <div className="text-slate-400 text-[10px]">NOPRICE (Fiyatsız)</div>
                        <div className="text-base sm:text-lg font-bold text-slate-300">{selectedDealer.totalNoPriceCount}</div>
                      </div>
                      <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-center">
                        <div className="text-slate-400 text-[10px]">Fiyat Kuralı Uyum</div>
                        <div className={`text-base sm:text-lg font-bold ${
                          selectedDealer.pricingCoveragePct === 100 
                            ? 'text-emerald-400' 
                            : selectedDealer.pricingCoveragePct > 0 
                            ? 'text-amber-400' 
                            : 'text-red-400'
                        }`}>
                          %{selectedDealer.pricingCoveragePct}
                        </div>
                      </div>
                      <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-center">
                        <div className="text-slate-400 text-[10px]">Ortalama Fiyat</div>
                        <div className="text-sm sm:text-base font-bold text-amber-300 font-mono mt-0.5">
                          {selectedDealer.averagePrice > 0 ? `${selectedDealer.averagePrice.toLocaleString('tr-TR')} TL` : '-'}
                        </div>
                      </div>
                      <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-center">
                        <div className="text-slate-400 text-[10px]">Fiyat Aralığı</div>
                        <div className="text-xs sm:text-xs font-bold text-white font-mono mt-1">
                          {selectedDealer.minPrice ? `${selectedDealer.minPrice.toLocaleString('tr-TR')} - ${selectedDealer.maxPrice?.toLocaleString('tr-TR')} TL` : '-'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dealer Services Filter Tabs */}
                  <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3 text-xs">
                    <span className="text-slate-400 font-bold mr-1">Hizmetleri Filtrele:</span>
                    <button
                      type="button"
                      onClick={() => setTab3StatusFilter('all')}
                      className={`px-3 py-1.5 rounded-lg font-medium transition ${
                        tab3StatusFilter === 'all' 
                          ? 'bg-red-600 text-white shadow font-bold' 
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Tüm Hizmetler ({summary.serviceColumns.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTab3StatusFilter('PRICED')}
                      className={`px-3 py-1.5 rounded-lg font-medium transition ${
                        tab3StatusFilter === 'PRICED' 
                          ? 'bg-amber-500 text-slate-950 font-bold shadow' 
                          : 'bg-slate-800 text-amber-300 hover:text-white'
                      }`}
                    >
                      🏷️ Ücretli Fiyatlılar ({selectedDealer.totalPricedServicesCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTab3StatusFilter('NO_PRICE')}
                      className={`px-3 py-1.5 rounded-lg font-medium transition ${
                        tab3StatusFilter === 'NO_PRICE' 
                          ? 'bg-slate-600 text-white font-bold shadow' 
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      ⚠️ NOPRICE ({selectedDealer.totalNoPriceCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTab3StatusFilter('NOT_OFFERED')}
                      className={`px-3 py-1.5 rounded-lg font-medium transition ${
                        tab3StatusFilter === 'NOT_OFFERED' 
                          ? 'bg-red-950 text-red-300 border border-red-700 font-bold shadow' 
                          : 'bg-slate-800 text-red-400 hover:text-white'
                      }`}
                    >
                      ❌ Verilmeyenler / HAYIR ({selectedDealer.totalNotOfferedCount})
                    </button>
                  </div>

                  {/* Dealer Services Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {summary.serviceColumns
                      .filter((sCol) => {
                        if (tab3StatusFilter === 'all') return true;
                        const statusObj = selectedDealer.serviceStatuses[sCol] || { status: 'NOT_OFFERED', displayValue: 'HAYIR', priceNumeric: null };
                        if (tab3StatusFilter === 'PRICED') return statusObj.status === 'PRICED' || statusObj.status === 'FREE';
                        return statusObj.status === tab3StatusFilter;
                      })
                      .map((sCol) => {
                      const statusObj = selectedDealer.serviceStatuses[sCol] || { status: 'NOT_OFFERED', displayValue: 'HAYIR', priceNumeric: null };
                      const { status, displayValue, priceNumeric } = statusObj;
                      const meta = summary.serviceColumnMeta?.[sCol];
                      const title = meta?.displayName || meta?.serviceName || sCol;
                      const code = meta?.serviceCode;

                      return (
                        <div 
                          key={sCol}
                          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                            status === 'PRICED'
                              ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                              : status === 'FREE'
                              ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                              : status === 'OFFERED_YES'
                              ? 'bg-blue-950/20 border-blue-500/40 text-blue-200'
                              : status === 'NO_PRICE'
                              ? 'bg-slate-900 border-slate-700 text-slate-400'
                              : 'bg-slate-950/50 border-slate-800/80 text-slate-500'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="text-xs font-semibold text-white truncate">{title}</div>
                            {code && code !== title && (
                              <div className="text-[10px] text-amber-400/80 font-mono">{code}</div>
                            )}
                          </div>
                          <div className="shrink-0 font-mono text-xs font-bold">
                            {status === 'PRICED' ? (
                              <span className="text-amber-300">{priceNumeric?.toLocaleString('tr-TR')} TL</span>
                            ) : status === 'FREE' ? (
                              <span className="text-emerald-400">0 TL (Ücretsiz)</span>
                            ) : status === 'NOT_OFFERED' ? (
                              <span className="text-red-400 text-[11px] font-sans">Hizmet Yok (HAYIR)</span>
                            ) : status === 'NO_PRICE' ? (
                              <span className="text-slate-400 text-[11px]">NOPRICE</span>
                            ) : (
                              <span className="text-blue-400 text-[11px]">EVET</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-xs text-slate-400 bg-slate-900/40 border border-slate-800 rounded-2xl">
                  Yukarıdaki açılır menüden bir servis seçin veya tablodaki herhangi bir servis satırına tıklayın.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Dropped Rows Audit */}
          {activeTab === 'dropped' && (
            <div className="space-y-4">
              <div className="p-3 bg-red-950/20 border border-red-800/40 rounded-xl text-xs text-red-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <strong>6. Adım Kuralı:</strong> SPR sayfasında DELETECANDIDATE değeri "EVET" (TRUE/Doğru) olan satırların tamamı matristen çıkarılmıştır.
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-700/70 rounded-xl bg-slate-950">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800/90 text-slate-200 border-b border-slate-700">
                    <tr>
                      <th className="px-3 py-2.5 font-medium">CUSTOMERID</th>
                      <th className="px-3 py-2.5 font-medium">DELETECANDIDATE</th>
                      <th className="px-3 py-2.5 font-medium">CLAIMED</th>
                      <th className="px-3 py-2.5 font-medium">Sebep</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {summary.deletedRowsSample.map((d, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="px-3 py-2.5 text-red-400 font-bold">
                          {d.customerId}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-950 text-red-400 border border-red-800">
                            EVET (Silindi)
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-300">
                          {d.rowData['CLAIMED'] || 'HAYIR'}
                        </td>
                        <td className="px-3 py-2.5 text-slate-300 font-sans">
                          {d.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Export Settings Modal */}
      {summary && (
        <ExportSettingsModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          summary={summary}
          sourceFileName={workbookData?.fileName}
        />
      )}
    </div>
  );
};
