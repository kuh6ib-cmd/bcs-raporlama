import React, { useState, useMemo } from 'react';
import { 
  X, 
  BookOpen, 
  Plus, 
  Trash2, 
  Search, 
  RotateCcw, 
  Download, 
  Copy, 
  Check, 
  FileText, 
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Service18xItem } from '../types';
import { DEFAULT_18X_SERVICES } from '../data/defaultCatalog';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

interface Service18xDictionaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  service18xList: Service18xItem[];
  onSaveList: (updatedList: Service18xItem[]) => void;
  onResetDefault: () => void;
  isCustom?: boolean;
}

export const Service18xDictionaryModal: React.FC<Service18xDictionaryModalProps> = ({
  isOpen,
  onClose,
  service18xList,
  onSaveList,
  onResetDefault,
  isCustom = false
}) => {
  const [activeTab, setActiveTab] = useState<'paste' | 'list'>('paste');
  const [pasteText, setPasteText] = useState('');
  const [pasteMode, setPasteMode] = useState<'merge' | 'replace'>('merge');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New item inputs
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Periyodik Bakım');
  const [newPrice, setNewPrice] = useState('1500');

  if (!isOpen) return null;

  // Categories extracted from current list
  const categories = useMemo(() => {
    const cats = new Set<string>();
    service18xList.forEach((s) => {
      if (s.serviceCategory) cats.add(s.serviceCategory);
    });
    return Array.from(cats).sort();
  }, [service18xList]);

  // Parse pasted text dynamically
  const parsedItems = useMemo(() => {
    if (!pasteText.trim()) return [];

    const lines = pasteText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const results: Service18xItem[] = [];

    lines.forEach((line) => {
      // Ignore comment or header lines
      if (line.startsWith('#') || line.toLowerCase().startsWith('kod') || line.toLowerCase().startsWith('service')) {
        return;
      }

      // Try TSV (tab separated)
      let parts = line.split('\t').map((p) => p.trim());
      
      // If not tab separated, try semicolon, comma, hyphen, colon
      if (parts.length < 2) {
        if (line.includes(' - ')) {
          parts = line.split(' - ').map((p) => p.trim());
        } else if (line.includes(': ')) {
          parts = line.split(': ').map((p) => p.trim());
        } else if (line.includes(';')) {
          parts = line.split(';').map((p) => p.trim());
        } else if (line.includes(',')) {
          parts = line.split(',').map((p) => p.trim());
        } else {
          // Space separated where first token is code
          const firstSpace = line.indexOf(' ');
          if (firstSpace > 0) {
            parts = [line.substring(0, firstSpace).trim(), line.substring(firstSpace + 1).trim()];
          }
        }
      }

      if (parts.length >= 1) {
        const rawCode = parts[0].trim();
        // Extract numeric digits
        const digits = rawCode.replace(/\D/g, '');
        const code = digits || rawCode;
        const name = parts[1] ? parts[1].trim() : code;
        const priceStr = parts[2] ? parts[2].replace(/[^\d.,]/g, '').replace(',', '.') : '';
        const priceNum = priceStr && !isNaN(parseFloat(priceStr)) ? parseFloat(priceStr) : 1500;
        const cat = parts[3] ? parts[3].trim() : 'Bosch Car Service';

        if (code && name) {
          results.push({
            serviceCode: code,
            serviceName: name,
            serviceCategory: cat,
            laborHours: 1.0,
            price: priceNum
          });
        }
      }
    });

    return results;
  }, [pasteText]);

  // Apply parsed items
  const handleApplyPaste = () => {
    if (parsedItems.length === 0) {
      setStatusMessage({ type: 'error', text: 'Geçerli bir hizmet satırı bulunamadı. Lütfen girdi formatını kontrol edin.' });
      return;
    }

    let newList: Service18xItem[] = [];

    if (pasteMode === 'replace') {
      newList = [...parsedItems];
    } else {
      // Merge: Update existing code matches, append new ones
      const map = new Map<string, Service18xItem>();
      service18xList.forEach((item) => {
        const key = item.serviceCode ? item.serviceCode.trim().toLowerCase() : '';
        if (key) map.set(key, item);
      });

      parsedItems.forEach((item) => {
        const key = item.serviceCode ? item.serviceCode.trim().toLowerCase() : '';
        if (key) {
          map.set(key, { ...map.get(key), ...item });
        }
      });

      newList = Array.from(map.values());
    }

    onSaveList(newList);
    setPasteText('');
    setStatusMessage({
      type: 'success',
      text: `${parsedItems.length} adet 18xxxxx hizmet kodu başarıyla ${pasteMode === 'replace' ? 'aktarıldı (tüm liste yenilendi)' : 'mevcut listeyle birleştirildi'}.`
    });
    setActiveTab('list');
  };

  // Add single code
  const handleAddSingleItem = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = newCode.trim();
    const cleanName = newName.trim();

    if (!cleanCode || !cleanName) {
      setStatusMessage({ type: 'error', text: 'Lütfen hem hizmet kodunu hem de hizmet adını doldurun.' });
      return;
    }

    const priceNum = parseFloat(newPrice) || 0;
    const existingIdx = service18xList.findIndex(
      (s) => s.serviceCode.trim().toLowerCase() === cleanCode.toLowerCase()
    );

    let updated: Service18xItem[] = [];
    if (existingIdx >= 0) {
      updated = [...service18xList];
      updated[existingIdx] = {
        ...updated[existingIdx],
        serviceCode: cleanCode,
        serviceName: cleanName,
        serviceCategory: newCategory,
        price: priceNum
      };
    } else {
      updated = [
        ...service18xList,
        {
          serviceCode: cleanCode,
          serviceName: cleanName,
          serviceCategory: newCategory,
          laborHours: 1.0,
          price: priceNum
        }
      ];
    }

    onSaveList(updated);
    setNewCode('');
    setNewName('');
    setStatusMessage({ type: 'success', text: `"${cleanCode} - ${cleanName}" başarıyla kaydedildi.` });
  };

  // Delete item
  const handleDeleteItem = (codeToDelete: string) => {
    const updated = service18xList.filter((s) => s.serviceCode !== codeToDelete);
    onSaveList(updated);
    setStatusMessage({ type: 'success', text: `${codeToDelete} kodlu hizmet listeden silindi.` });
  };

  // Copy all to clipboard TSV
  const handleCopyClipboard = () => {
    const tsv = service18xList.map((s) => `${s.serviceCode}\t${s.serviceName}\t${s.price}\t${s.serviceCategory || ''}`).join('\n');
    navigator.clipboard.writeText(tsv);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  // Download Excel
  const handleDownloadExcel = () => {
    const exportData = service18xList.map((s) => ({
      'Hizmet Kodu (18xxxxx)': s.serviceCode,
      'Hizmet Adı': s.serviceName,
      'Kategori': s.serviceCategory || 'Genel Hizmet',
      'İşçilik Saati': s.laborHours || 1.0,
      'Tavsiye Fiyat (TL)': s.price || 0
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '18x_Hizmetler');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, 'My_BCS_18xxxxx_Hizmet_Katalogu.xlsx');
  };

  // Filtered list for Tab 2
  const filteredList = useMemo(() => {
    return service18xList.filter((s) => {
      if (selectedCategory !== 'all' && (s.serviceCategory || '') !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const code = (s.serviceCode || '').toLowerCase();
        const name = (s.serviceName || '').toLowerCase();
        return code.includes(q) || name.includes(q);
      }
      return true;
    });
  }, [service18xList, selectedCategory, searchQuery]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/90 border-b border-slate-700/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20">
              <BookOpen className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="modal-title" className="text-base sm:text-lg font-bold text-white">
                  18xxxxx Hizmet Kodları &amp; İsim Sözlüğü
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                  {service18xList.length} Kod Tanımlı
                </span>
                {isCustom && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                    Özel Liste Aktif
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                SPO ve SPR analizlerinde yer alan 18xxxxx kodlu sütunların eşleştirildiği referans sözlük.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-700/50 transition"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Toast/Banner */}
        {statusMessage && (
          <div className={`px-6 py-2.5 flex items-center justify-between text-xs font-medium border-b ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60' 
              : 'bg-red-950/80 text-red-300 border-red-800/60'
          }`}>
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
              <span>{statusMessage.text}</span>
            </div>
            <button 
              onClick={() => setStatusMessage(null)}
              className="text-white/60 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-6 border-b border-slate-800 bg-slate-900/60 text-xs">
          <div className="flex gap-2 py-2">
            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition ${
                activeTab === 'paste'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Toplu Kod &amp; İsim Yapıştır (Hızlı Ekle)</span>
              {parsedItems.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-slate-950 text-amber-300 text-[10px] font-mono">
                  {parsedItems.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition ${
                activeTab === 'list'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Sözlük Listesi ({service18xList.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyClipboard}
              className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium flex items-center gap-1.5 transition"
              title="Tüm listeyi panoya kopyala"
            >
              {copiedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSuccess ? 'Kopyalandı' : 'Panoya Kopyala'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadExcel}
              className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium flex items-center gap-1.5 transition"
              title="Excel olarak indir"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Excel İndir</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (window.confirm('Hizmet listesi varsayılan Bosch 18xxxxx kataloğuna sıfırlansın mı?')) {
                  onResetDefault();
                  setStatusMessage({ type: 'success', text: 'Hizmet listesi varsayılan Bosch kataloğuna sıfırlandı.' });
                }
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-red-950/50 hover:border-red-800 text-slate-400 hover:text-red-300 text-[11px] font-medium flex items-center gap-1.5 transition"
              title="Varsayılan kataloğa sıfırla"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Varsayılana Sıfırla</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'paste' ? (
            /* TAB 1: FAST PASTE */
            <div className="space-y-4">
              <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 space-y-1">
                  <div className="font-bold text-white">Elinizdeki Hizmet Kodlarını Doğrudan Buraya Yapıştırın</div>
                  <p>
                    Excel&apos;den, mesajdan veya herhangi bir metin belgesinden kopyaladığınız listeyi aşağıdaki alana yapıştırabilirsiniz. 
                    Format farketmez (Tab, tire, iki nokta, virgül veya boşluk ile ayrılmış her satır otomatik algılanır).
                  </p>
                  <div className="text-[11px] text-slate-400 font-mono bg-slate-950/80 p-2 rounded border border-slate-800 mt-2">
                    18001 &nbsp; Periyodik Bakım<br />
                    18002 - Motor Yağ &amp; Filtre Değişimi<br />
                    18003: Fren Sistemi Kontrolü<br />
                    18025, Genel Araç Kontrolü (15 Nokta Check-up)
                  </div>
                </div>
              </div>

              {/* Textarea */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span>Hizmet Kodları ve İsimleri Metni:</span>
                  {parsedItems.length > 0 && (
                    <span className="text-emerald-400 font-mono text-[11px]">
                      ✓ {parsedItems.length} adet geçerli hizmet kodu algılandı
                    </span>
                  )}
                </label>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="Buraya yapıştırın... (Örn: 18001	Periyodik Bakım)"
                  rows={8}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500 transition resize-y placeholder:text-slate-600"
                />
              </div>

              {/* Mode and Apply Action */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-slate-400 font-medium">Uygulama Şekli:</span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-200">
                    <input
                      type="radio"
                      name="pasteMode"
                      value="merge"
                      checked={pasteMode === 'merge'}
                      onChange={() => setPasteMode('merge')}
                      className="text-amber-500 focus:ring-0"
                    />
                    <span>Mevcut Listeyle Birleştir (Tavsiye Edilen)</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-200">
                    <input
                      type="radio"
                      name="pasteMode"
                      value="replace"
                      checked={pasteMode === 'replace'}
                      onChange={() => setPasteMode('replace')}
                      className="text-amber-500 focus:ring-0"
                    />
                    <span>Tüm Listeyi Değiştir</span>
                  </label>
                </div>

                <button
                  type="button"
                  disabled={parsedItems.length === 0}
                  onClick={handleApplyPaste}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                    parsedItems.length > 0
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95'
                      : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{parsedItems.length} Hizmeti Sözlüğe Ekle &amp; Analize Uygula</span>
                </button>
              </div>

              {/* Parsed Preview Table */}
              {parsedItems.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-300">
                    Ayrıştırma Önizlemesi ({parsedItems.length} Kayıt):
                  </div>
                  <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-800/80 text-slate-200 sticky top-0">
                        <tr>
                          <th className="px-3 py-2">Kod</th>
                          <th className="px-3 py-2">Hizmet Adı</th>
                          <th className="px-3 py-2">Kategori</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                        {parsedItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-900">
                            <td className="px-3 py-1.5 text-amber-400 font-bold">{item.serviceCode}</td>
                            <td className="px-3 py-1.5 font-sans text-slate-100">{item.serviceName}</td>
                            <td className="px-3 py-1.5 font-sans text-slate-400">{item.serviceCategory}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* TAB 2: FULL LIST & SINGLE ADD */
            <div className="space-y-5">
              {/* Add Single Item Form */}
              <form onSubmit={handleAddSingleItem} className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-3">
                <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>Tek Hizmet Kodu Ekle / Düzenle:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">18xxxxx Kodu *</label>
                    <input
                      type="text"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value)}
                      placeholder="Örn: 18045"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-slate-400 mb-1">Hizmet Adı *</label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Örn: Seramik Kaplama & Boya Koruma"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition flex items-center justify-center gap-1.5 shadow"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Kaydet</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Kod veya isim ile ara..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="all">Tüm Kategoriler ({categories.length})</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>

                  <span className="text-xs text-slate-400 font-mono shrink-0">
                    {filteredList.length} / {service18xList.length} Kayıt
                  </span>
                </div>
              </div>

              {/* List Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 max-h-[45vh] overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800/90 text-slate-200 sticky top-0 font-semibold z-10">
                    <tr>
                      <th className="px-4 py-2.5">18xxxxx Kodu</th>
                      <th className="px-4 py-2.5">Hizmet Adı</th>
                      <th className="px-4 py-2.5">Kategori</th>
                      <th className="px-4 py-2.5 text-right">Referans Fiyat</th>
                      <th className="px-4 py-2.5 text-center">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {filteredList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500 font-sans">
                          Aranan kritere uygun hizmet kodu bulunamadı.
                        </td>
                      </tr>
                    ) : (
                      filteredList.map((item) => (
                        <tr key={item.serviceCode} className="hover:bg-slate-900/80 transition group">
                          <td className="px-4 py-2 text-amber-400 font-bold">
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                              {item.serviceCode}
                            </span>
                          </td>
                          <td className="px-4 py-2 font-sans font-medium text-slate-100">
                            {item.serviceName}
                          </td>
                          <td className="px-4 py-2 font-sans text-slate-400 text-[10px]">
                            {item.serviceCategory || '-'}
                          </td>
                          <td className="px-4 py-2 text-right text-slate-300">
                            {typeof item.price === 'number' && item.price > 0 ? `${item.price.toLocaleString('tr-TR')} TL` : 'Ücretsiz / Randevu'}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.serviceCode)}
                              className="text-slate-600 hover:text-red-400 p-1 rounded transition opacity-50 group-hover:opacity-100"
                              title="Bu kodu sözlükten sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-800/60 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="text-slate-400 text-[11px]">
            💾 Sözlük değişiklikleri tarayıcıda kalıcı olarak saklanır ve analiz tablosuna anında yansır.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition"
          >
            Tamamla &amp; Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
