import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  MapPin, 
  User, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  XCircle, 
  Save, 
  Sparkles, 
  ShieldCheck, 
  Wrench,
  Hash,
  AlertCircle
} from 'lucide-react';
import { BCSMatrixSummary, Service18xItem } from '../types';

interface CreateNewRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: BCSMatrixSummary | null;
  service18xList: Service18xItem[];
  onSaveRecord: (record: {
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
  }) => void;
}

export const CreateNewRecordModal: React.FC<CreateNewRecordModalProps> = ({
  isOpen,
  onClose,
  summary,
  service18xList,
  onSaveRecord
}) => {
  if (!isOpen) return null;

  // Derive unique cities, managers, and service columns
  const existingCities = Array.from(
    new Set([
      'İSTANBUL', 'ANKARA', 'İZMİR', 'BURSA', 'ANTALYA', 'ADANA', 'KONYA', 'GAZİANTEP',
      'KOCAELİ', 'MANİSA', 'SAMSUN', 'DENİZLİ', 'ESKİŞEHİR', 'KAYSERİ', 'BALIKESİR', 'TRABZON',
      ...((summary?.activeRows || []).map((r) => r.city).filter((c) => c && c !== '#YOK'))
    ])
  ).sort();

  const existingManagers = Array.from(
    new Set([
      'Ahmet Yılmaz', 'Mehmet Kaya', 'Can Koral', 'Ali Demir', 'Volkan Şahin', 'Mustafa Arslan',
      ...((summary?.activeRows || []).map((r) => r.regionManager).filter((m) => m && m !== '#YOK'))
    ])
  ).sort();

  // Service Columns list
  const serviceColumns = summary?.serviceColumns || [];

  // Form State
  const autoId = `800${Math.floor(10000000 + Math.random() * 90000000)}`;
  const [customerId, setCustomerId] = useState(autoId);
  const [bcsFirmName, setBcsFirmName] = useState('');
  const [city, setCity] = useState('İSTANBUL');
  const [customCity, setCustomCity] = useState('');
  const [district, setDistrict] = useState('Kadıköy');
  const [regionManager, setRegionManager] = useState('Ahmet Yılmaz');
  const [fieldResponsible, setFieldResponsible] = useState('Saha Yetkilisi');
  const [claimed, setClaimed] = useState<'EVET' | 'HAYIR'>('EVET');
  const [spoOnlineBooking, setSpoOnlineBooking] = useState<'EVET' | 'HAYIR'>('EVET');
  const [crmCreateDate, setCrmCreateDate] = useState(() => {
    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    return `${d}.${m}.${y}`;
  });

  // Services State: map of rawKey -> { status, price }
  const [serviceStates, setServiceStates] = useState<
    Record<string, { status: 'PRICED' | 'FREE' | 'NO_PRICE' | 'NOT_OFFERED' | 'OFFERED_YES'; priceInput: string }>
  >(() => {
    const initial: Record<string, { status: 'PRICED' | 'FREE' | 'NO_PRICE' | 'NOT_OFFERED' | 'OFFERED_YES'; priceInput: string }> = {};
    serviceColumns.forEach((col) => {
      // default: PRICED with sample or 1500
      initial[col] = {
        status: 'PRICED',
        priceInput: '1500'
      };
    });
    return initial;
  });

  const [activeFormTab, setActiveFormTab] = useState<'basic' | 'services'>('basic');
  const [errorMsg, setErrorMsg] = useState('');

  const handleServiceStatusChange = (
    col: string, 
    status: 'PRICED' | 'FREE' | 'NO_PRICE' | 'NOT_OFFERED' | 'OFFERED_YES'
  ) => {
    setServiceStates((prev) => ({
      ...prev,
      [col]: {
        ...prev[col],
        status,
        priceInput: status === 'FREE' ? '0' : prev[col]?.priceInput || '1500'
      }
    }));
  };

  const handlePriceInputChange = (col: string, val: string) => {
    setServiceStates((prev) => ({
      ...prev,
      [col]: {
        ...prev[col],
        priceInput: val,
        status: val.trim() === '0' ? 'FREE' : 'PRICED'
      }
    }));
  };

  const setAllServicesStatus = (status: 'PRICED' | 'FREE' | 'NO_PRICE' | 'NOT_OFFERED') => {
    setServiceStates((prev) => {
      const next = { ...prev };
      serviceColumns.forEach((col) => {
        next[col] = {
          status,
          priceInput: status === 'FREE' ? '0' : status === 'PRICED' ? '1800' : ''
        };
      });
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bcsFirmName.trim()) {
      setErrorMsg('Lütfen Firma / BCS Tabela Adını giriniz.');
      setActiveFormTab('basic');
      return;
    }

    const finalCity = city === 'CUSTOM' ? customCity.toUpperCase().trim() : city;
    if (!finalCity) {
      setErrorMsg('Lütfen geçerli bir Şehir (İl) seçiniz veya yazınız.');
      setActiveFormTab('basic');
      return;
    }

    const formattedServiceValues: Record<string, { status: 'PRICED' | 'FREE' | 'NO_PRICE' | 'NOT_OFFERED' | 'OFFERED_YES'; price?: number }> = {};
    
    Object.keys(serviceStates).forEach((col) => {
      const item = serviceStates[col];
      if (item.status === 'PRICED') {
        const num = parseFloat(item.priceInput.replace(/\./g, '').replace(',', '.'));
        formattedServiceValues[col] = {
          status: isNaN(num) || num <= 0 ? 'NO_PRICE' : 'PRICED',
          price: isNaN(num) ? 0 : num
        };
      } else if (item.status === 'FREE') {
        formattedServiceValues[col] = {
          status: 'FREE',
          price: 0
        };
      } else {
        formattedServiceValues[col] = {
          status: item.status
        };
      }
    });

    onSaveRecord({
      customerId: customerId.trim() || autoId,
      bcsFirmName: bcsFirmName.trim(),
      city: finalCity,
      district: district.trim() || 'Merkez',
      regionManager: regionManager.trim() || 'Genel Yönetim',
      fieldResponsible: fieldResponsible.trim() || 'Saha Sorumlusu',
      claimed,
      spoOnlineBooking,
      crmCreateDate: crmCreateDate.trim(),
      serviceValues: formattedServiceValues
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Yeni Kayıt Oluştur</span>
                <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                  SPO / SPR Kayıt Noktası
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Sisteme yeni bir Bosch Car Service ve hizmet fiyat kaydı ekleyin.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Error Banner */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl flex items-center gap-3 text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div className="flex-1">{errorMsg}</div>
            <button onClick={() => setErrorMsg('')} className="text-rose-400 hover:text-white text-xs underline">
              Kapat
            </button>
          </div>
        )}

        {/* Tab Navigation inside Modal */}
        <div className="px-6 pt-4 bg-slate-900 flex items-center gap-2 border-b border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setActiveFormTab('basic')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
              activeFormTab === 'basic'
                ? 'border-blue-500 bg-slate-800 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            1. Servis & Konum Bilgileri
          </button>
          <button
            type="button"
            onClick={() => setActiveFormTab('services')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
              activeFormTab === 'services'
                ? 'border-blue-500 bg-slate-800 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wrench className="w-4 h-4" />
            2. Hizmet Sunumu & Fiyat Tanımları ({serviceColumns.length})
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: BASIC INFO */}
          {activeFormTab === 'basic' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Müşteri ID */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-blue-400" />
                    Müşteri No (CUSTOMERID)
                  </label>
                  <input
                    type="text"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    placeholder="8000999888"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Sistem tarafından benzersiz numara üretilmiştir. İsterseniz değiştirebilirsiniz.
                  </p>
                </div>

                {/* Firma Adı */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-400" />
                    Firma / BCS Tabela Adı <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={bcsFirmName}
                    onChange={(e) => setBcsFirmName(e.target.value)}
                    placeholder="Örn: Anadolu Garaj Bosch Car Service"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  />
                </div>

                {/* Şehir / İl */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    İl (Şehir)
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {existingCities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="CUSTOM">+ Yeni Şehir Ekle...</option>
                  </select>

                  {city === 'CUSTOM' && (
                    <input
                      type="text"
                      placeholder="Şehir Adını Yazınız (Örn: BİLECİK)"
                      value={customCity}
                      onChange={(e) => setCustomCity(e.target.value)}
                      className="w-full mt-2 bg-slate-800 border border-emerald-600 rounded-xl px-3 py-2 text-white text-sm"
                    />
                  )}
                </div>

                {/* İlçe */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    İlçe
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="Örn: Kadıköy / Çankaya / Nilüfer"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Bölge Yöneticisi */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-purple-400" />
                    Bölge Yöneticisi
                  </label>
                  <input
                    type="text"
                    list="managers-list"
                    value={regionManager}
                    onChange={(e) => setRegionManager(e.target.value)}
                    placeholder="Ahmet Yılmaz"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <datalist id="managers-list">
                    {existingManagers.map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                </div>

                {/* Saha Sorumlusu */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-purple-400" />
                    Saha Sorumlusu
                  </label>
                  <input
                    type="text"
                    value={fieldResponsible}
                    onChange={(e) => setFieldResponsible(e.target.value)}
                    placeholder="Ali Demir"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Kayıt Tarihi */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    CRM Oluşturma Tarihi
                  </label>
                  <input
                    type="text"
                    value={crmCreateDate}
                    onChange={(e) => setCrmCreateDate(e.target.value)}
                    placeholder="DD.MM.YYYY"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

              </div>

              {/* Status Toggles: Claimed & Online Booking */}
              <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* SPO / Claimed Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    SPO Katılım / Kayıt Durumu (Claimed)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setClaimed('EVET')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                        claimed === 'EVET'
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                          : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      EVET (Sisteme Katıldı)
                    </button>
                    <button
                      type="button"
                      onClick={() => setClaimed('HAYIR')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                        claimed === 'HAYIR'
                          ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/30'
                          : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      <XCircle className="w-4 h-4" />
                      HAYIR (Katılmadı)
                    </button>
                  </div>
                </div>

                {/* SPO Online Booking */}
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    Online Randevu / Booking
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSpoOnlineBooking('EVET')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                        spoOnlineBooking === 'EVET'
                          ? 'bg-cyan-600 text-white border-cyan-500 shadow-md shadow-cyan-600/30'
                          : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      EVET (Aktif)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpoOnlineBooking('HAYIR')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                        spoOnlineBooking === 'HAYIR'
                          ? 'bg-slate-700 text-slate-300 border-slate-600'
                          : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      <XCircle className="w-4 h-4" />
                      HAYIR
                    </button>
                  </div>
                </div>

              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setActiveFormTab('services')}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-colors shadow-lg shadow-blue-600/20"
                >
                  Sonraki Adım: Hizmet ve Fiyat Seçimleri
                  <span>→</span>
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: SERVICES & PRICING */}
          {activeFormTab === 'services' && (
            <div className="space-y-4">
              
              {/* Quick Batch Actions */}
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-slate-300">Toplu İşlem:</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAllServicesStatus('PRICED')}
                    className="px-2.5 py-1 bg-amber-950/60 text-amber-300 border border-amber-700/60 rounded-lg hover:bg-amber-900/60 transition-colors font-semibold"
                  >
                    Tümünü Fiyatlandır (1.800 TL)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllServicesStatus('FREE')}
                    className="px-2.5 py-1 bg-emerald-950/60 text-emerald-300 border border-emerald-700/60 rounded-lg hover:bg-emerald-900/60 transition-colors font-semibold"
                  >
                    Tümünü Ücretsiz Yap (0 TL)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllServicesStatus('NO_PRICE')}
                    className="px-2.5 py-1 bg-sky-950/60 text-sky-300 border border-sky-700/60 rounded-lg hover:bg-sky-900/60 transition-colors font-semibold"
                  >
                    Tümünü Fiyat Belirtilmedi Yap
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllServicesStatus('NOT_OFFERED')}
                    className="px-2.5 py-1 bg-rose-950/60 text-rose-300 border border-rose-700/60 rounded-lg hover:bg-rose-900/60 transition-colors font-semibold"
                  >
                    Tümünü Verilmiyor Yap
                  </button>
                </div>
              </div>

              {/* Service Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {serviceColumns.map((col) => {
                  const meta = summary?.serviceColumnMeta?.[col];
                  const serviceName = meta?.displayName || col;
                  const serviceCategory = meta?.category || 'Genel Hizmet';
                  const serviceCode = meta?.serviceCode || '';

                  const currentState = serviceStates[col] || { status: 'PRICED', priceInput: '1500' };

                  return (
                    <div
                      key={col}
                      className="p-3.5 bg-slate-800/70 border border-slate-700/80 rounded-xl flex flex-col justify-between gap-2 hover:border-slate-600 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                            {serviceCode && (
                              <span className="text-[10px] font-mono bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">
                                {serviceCode}
                              </span>
                            )}
                            {serviceName}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {serviceCategory}
                          </div>
                        </div>

                        {/* Status selector badge */}
                        <select
                          value={currentState.status}
                          onChange={(e) => handleServiceStatusChange(col, e.target.value as any)}
                          className={`text-xs font-bold px-2 py-1 rounded-lg border focus:outline-none ${
                            currentState.status === 'PRICED'
                              ? 'bg-amber-950/80 text-amber-300 border-amber-700/80'
                              : currentState.status === 'FREE'
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80'
                              : currentState.status === 'NO_PRICE' || currentState.status === 'OFFERED_YES'
                              ? 'bg-sky-950/80 text-sky-300 border-sky-700/80'
                              : 'bg-rose-950/80 text-rose-300 border-rose-700/80'
                          }`}
                        >
                          <option value="PRICED">💰 Veriliyor + Ücretli</option>
                          <option value="FREE">✨ Ücretsiz / Dahil (0 TL)</option>
                          <option value="NO_PRICE">🔹 Veriliyor (Fiyat Belirtilmedi)</option>
                          <option value="NOT_OFFERED">❌ Verilmiyor (HAYIR)</option>
                        </select>
                      </div>

                      {/* Price input field if PRICED */}
                      {currentState.status === 'PRICED' && (
                        <div className="flex items-center gap-2 pt-1 border-t border-slate-700/50 mt-1">
                          <span className="text-xs text-slate-400 font-medium">Tavsiye/Hizmet Fiyatı:</span>
                          <div className="relative flex-1">
                            <input
                              type="text"
                              value={currentState.priceInput}
                              onChange={(e) => handlePriceInputChange(col, e.target.value)}
                              placeholder="1500"
                              className="w-full bg-slate-900 border border-amber-600/60 rounded-lg px-2.5 py-1 text-right text-xs font-mono font-extrabold text-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                            <span className="absolute right-2 top-1 text-[10px] text-amber-400 font-bold pointer-events-none">
                              TL
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* Bottom Actions Bar */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold transition-colors"
            >
              İptal
            </button>

            <div className="flex items-center gap-3">
              {activeFormTab === 'services' && (
                <button
                  type="button"
                  onClick={() => setActiveFormTab('basic')}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-bold transition-colors"
                >
                  ← Önceki Adım
                </button>
              )}

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all transform active:scale-95"
              >
                <Save className="w-4 h-4" />
                Kayıt Noktasını Oluştur & Kaydet
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
