import React, { useState, useMemo, useRef } from 'react';
import { 
  MapPin, 
  RotateCcw, 
  Building2, 
  Search, 
  Sparkles, 
  UserCheck, 
  Calendar, 
  Eye, 
  CheckCircle2, 
  Filter,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import { EXACT_TURKEY_CITIES, ExactCityData } from '../data/turkeyExactMapData';
import { BCSMatrixSummary, BCSMatrixRow } from '../types';
import { resolveProvincePlate, getProvinceByPlate } from '../utils/cityMatcher';

interface TurkeyMapFilterProps {
  summary: BCSMatrixSummary;
  selectedCity: string; // 'all' or city name e.g. 'İSTANBUL'
  onSelectCity: (city: string) => void;
  onInspectDealer?: (dealer: BCSMatrixRow) => void;
}

function normalizeCity(str: string): string {
  if (!str) return '';
  return str
    .trim()
    .toLocaleUpperCase('tr-TR')
    .replace(/İ/g, 'I')
    .replace(/İ/g, 'I')
    .replace(/Ş/g, 'S')
    .replace(/Ğ/g, 'G')
    .replace(/Ü/g, 'U')
    .replace(/Ö/g, 'O')
    .replace(/Ç/g, 'C')
    .replace(/\s+/g, '');
}

// Helper for Choropleth Blue Gradient (Açıktan Koyu Maviye Servis Yoğunluğu)
function getChoroplethBlue(count: number): { fill: string; stroke: string; textColor: string; textStroke: string; isDark: boolean } {
  if (count === 0) {
    return {
      fill: '#f8fafc', // nötr açık zemin
      stroke: '#cbd5e1',
      textColor: '#64748b',
      textStroke: '#ffffff',
      isDark: false
    };
  }
  if (count <= 1) {
    return {
      fill: '#e0f2fe', // sky-100 (en açık buz mavisi)
      stroke: '#7dd3fc',
      textColor: '#0369a1',
      textStroke: '#ffffff',
      isDark: false
    };
  }
  if (count <= 2) {
    return {
      fill: '#bae6fd', // sky-200 (açık mavi)
      stroke: '#38bdf8',
      textColor: '#0369a1',
      textStroke: '#ffffff',
      isDark: false
    };
  }
  if (count <= 4) {
    return {
      fill: '#7dd3fc', // sky-300 (orta-açık mavi)
      stroke: '#0284c7',
      textColor: '#0c4a6e',
      textStroke: '#ffffff',
      isDark: false
    };
  }
  if (count <= 6) {
    return {
      fill: '#38bdf8', // sky-400 (parlak mavi)
      stroke: '#0369a1',
      textColor: '#082f49',
      textStroke: '#ffffff',
      isDark: false
    };
  }
  if (count <= 9) {
    return {
      fill: '#0284c7', // sky-600 (orta koyu mavi)
      stroke: '#075985',
      textColor: '#ffffff',
      textStroke: '#082f49',
      isDark: true
    };
  }
  if (count <= 13) {
    return {
      fill: '#1d4ed8', // blue-700 (koyu lacivert)
      stroke: '#1e3a8a',
      textColor: '#ffffff',
      textStroke: '#0f172a',
      isDark: true
    };
  }
  return {
    fill: '#172554', // blue-950 (en koyu gece mavisi / 14+ servis)
    stroke: '#020617',
    textColor: '#ffffff',
    textStroke: '#020617',
    isDark: true
  };
}

export const TurkeyMapFilter: React.FC<TurkeyMapFilterProps> = ({
  summary,
  selectedCity,
  onSelectCity,
  onInspectDealer
}) => {
  const [hoveredCityData, setHoveredCityData] = useState<ExactCityData | null>(null);
  const [dealerSearchQuery, setDealerSearchQuery] = useState('');
  const [citySearchTerm, setCitySearchTerm] = useState('');
  const tableRef = useRef<HTMLDivElement>(null);

  // 1. Group dealers by province plate number (1..81) as primary, with string fallback
  const { plateDealersMap, cityDealersMap } = useMemo(() => {
    const pMap = new Map<number, BCSMatrixRow[]>();
    const cMap = new Map<string, BCSMatrixRow[]>();
    if (!summary?.activeRows) return { plateDealersMap: pMap, cityDealersMap: cMap };

    summary.activeRows.forEach((row) => {
      // 1. Plate resolution (handles accents, aliases, prefixes, suffixes, districts)
      const plate = resolveProvincePlate(row.city, row.district);
      if (plate) {
        const existing = pMap.get(plate) || [];
        existing.push(row);
        pMap.set(plate, existing);
      }

      // 2. Normalized string mapping fallback
      if (row.city && row.city !== '#YOK') {
        const norm = normalizeCity(row.city);
        const existingStr = cMap.get(norm) || [];
        existingStr.push(row);
        cMap.set(norm, existingStr);
      }
    });

    return { plateDealersMap: pMap, cityDealersMap: cMap };
  }, [summary?.activeRows]);

  // Reliable helper to retrieve all dealers for any city on the map
  const getDealersForCity = (city: ExactCityData | null): BCSMatrixRow[] => {
    if (!city) return [];
    if (city.plateNumber && city.plateNumber > 0) {
      const byPlate = plateDealersMap.get(city.plateNumber);
      if (byPlate && byPlate.length > 0) return byPlate;
    }

    const norm1 = normalizeCity(city.name);
    const norm2 = normalizeCity(city.displayName);
    return cityDealersMap.get(norm1) || cityDealersMap.get(norm2) || [];
  };

  // 2. Identify active target city to display in the table:
  // Priority: 1) Hovered city if user is hovering over map, 2) selectedCity if filtered, 3) City with highest dealers (e.g. İstanbul with 18 dealers)
  const activeCityObject = useMemo<ExactCityData | null>(() => {
    if (hoveredCityData) {
      return hoveredCityData;
    }

    if (selectedCity && selectedCity !== 'all') {
      const selectedPlate = resolveProvincePlate(selectedCity);
      if (selectedPlate) {
        const found = EXACT_TURKEY_CITIES.find((c) => c.plateNumber === selectedPlate);
        if (found) return found;
      }

      const normSelected = normalizeCity(selectedCity);
      const found = EXACT_TURKEY_CITIES.find(
        (c) => normalizeCity(c.name) === normSelected || normalizeCity(c.displayName) === normSelected
      );
      if (found) return found;

      return {
        id: 'selected',
        plateNumber: selectedPlate || 0,
        name: selectedCity,
        displayName: selectedCity,
        color: '#dc2626',
        path: '',
        labelX: 0,
        labelY: 0
      };
    }

    // Default to city with the most dealers (e.g. İstanbul with 18 dealers)
    let topCity: ExactCityData | null = null;
    let maxCount = -1;
    EXACT_TURKEY_CITIES.forEach((c) => {
      const count = getDealersForCity(c).length;
      if (count > maxCount) {
        maxCount = count;
        topCity = c;
      }
    });

    return topCity || EXACT_TURKEY_CITIES.find((c) => c.plateNumber === 34) || null;
  }, [hoveredCityData, selectedCity, plateDealersMap, cityDealersMap]);

  // 3. Filtered dealers for the active city
  const activeCityDealers = useMemo(() => {
    if (!activeCityObject) return [];
    const list = getDealersForCity(activeCityObject);
    
    if (!dealerSearchQuery.trim()) return list;

    const q = dealerSearchQuery.toLowerCase();
    return list.filter((d) => 
      (d.bcsFirmName && d.bcsFirmName.toLowerCase().includes(q)) ||
      (d.district && d.district.toLowerCase().includes(q)) ||
      (d.customerId && d.customerId.toLowerCase().includes(q)) ||
      (d.regionManager && d.regionManager.toLowerCase().includes(q))
    );
  }, [activeCityObject, plateDealersMap, cityDealersMap, dealerSearchQuery]);

  // Total counts
  const totalWorkshops = summary?.activeRows?.length || 0;
  const activeCitiesCount = cityDealersMap.size;

  return (
    <div className="space-y-6">
      
      {/* 1. MAP SECTION (Exact replica of paintmaps.com Turkey Map with authentic province colors) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4">
        
        {/* Header & Quick Filter Status */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                <MapPin className="w-3.5 h-3.5" /> Canlı Türkiye Haritası &amp; BCS Filtresi
              </span>
              <span className="text-xs text-slate-400">
                Toplam <strong className="text-emerald-400 font-bold">{totalWorkshops}</strong> Bosch Car Service Bayisi
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2 tracking-tight">
              Türkiye İl Haritası — Üzerine Geldiğiniz Şehirdeki Bayileri Görün
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Farenizi haritadaki herhangi bir ilin üzerine getirin; o ildeki tüm servisler aşağıdaki tabloda anında listelenecektir.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {selectedCity !== 'all' ? (
              <div className="flex items-center gap-2 bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs px-3.5 py-2 rounded-xl font-bold">
                <span>Filtre: {selectedCity}</span>
                <button
                  type="button"
                  onClick={() => onSelectCity('all')}
                  className="hover:text-white p-0.5 rounded bg-amber-500/20 hover:bg-amber-500/40 ml-1"
                  title="Filtreyi kaldır"
                >
                  ✕
                </button>
              </div>
            ) : null}

            {selectedCity !== 'all' && (
              <button
                type="button"
                onClick={() => onSelectCity('all')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 shadow-lg shadow-red-950/40 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Tüm İlleri Göster</span>
              </button>
            )}
          </div>
        </div>

        {/* MAP CONTAINER (White Canvas with Blue Choropleth Density Heatmap) */}
        <div className="relative bg-white rounded-2xl p-2 sm:p-5 shadow-xl border border-slate-200 overflow-hidden space-y-3">
          
          {/* Top Bar: Live Hover Status & Blue Density Scale */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-1 border-b border-slate-100 pb-3">
            
            {/* Choropleth Blue Scale Legend */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-extrabold text-slate-800 flex items-center gap-1.5 mr-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block shadow-sm"></span>
                Servis Yoğunluğu:
              </span>
              
              <div className="flex items-center gap-1 font-semibold text-[11px] text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                <span className="inline-block w-3.5 h-3 rounded bg-[#f8fafc] border border-slate-300"></span>
                <span>0 Servis</span>
              </div>
              <div className="flex items-center gap-1 font-semibold text-[11px] text-slate-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                <span className="inline-block w-3.5 h-3 rounded bg-[#bae6fd]"></span>
                <span>1–2</span>
              </div>
              <div className="flex items-center gap-1 font-semibold text-[11px] text-slate-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                <span className="inline-block w-3.5 h-3 rounded bg-[#7dd3fc]"></span>
                <span>3–4</span>
              </div>
              <div className="flex items-center gap-1 font-semibold text-[11px] text-slate-800 bg-sky-100/60 px-2 py-0.5 rounded-md border border-sky-300">
                <span className="inline-block w-3.5 h-3 rounded bg-[#38bdf8]"></span>
                <span>5–6</span>
              </div>
              <div className="flex items-center gap-1 font-semibold text-[11px] text-white bg-sky-700 px-2 py-0.5 rounded-md shadow-sm">
                <span className="inline-block w-3.5 h-3 rounded bg-[#0284c7]"></span>
                <span>7–9</span>
              </div>
              <div className="flex items-center gap-1 font-semibold text-[11px] text-white bg-blue-700 px-2 py-0.5 rounded-md shadow-sm">
                <span className="inline-block w-3.5 h-3 rounded bg-[#1d4ed8]"></span>
                <span>10–13</span>
              </div>
              <div className="flex items-center gap-1 font-bold text-[11px] text-white bg-blue-950 px-2 py-0.5 rounded-md shadow-sm ring-1 ring-blue-900">
                <span className="inline-block w-3.5 h-3 rounded bg-[#172554]"></span>
                <span>14+ (En Yoğun)</span>
              </div>
            </div>

            {/* Live Hover Tag */}
            {hoveredCityData ? (
              <div className="px-3.5 py-1.5 rounded-xl bg-blue-950 text-white text-xs font-bold flex items-center gap-2 shadow-md animate-fade-in border border-blue-800">
                <Building2 className="w-3.5 h-3.5 text-sky-400" />
                <span>{hoveredCityData.name}</span>
                <span className="bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-md font-mono font-extrabold border border-sky-500/30">
                  {getDealersForCity(hoveredCityData).length} BCS Bayisi
                </span>
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 italic">
                Farenizi illerin üzerine getirerek o ildeki servis sayısını inceleyin
              </div>
            )}
          </div>

          {/* SVG Canvas */}
          <div className="w-full flex items-center justify-center">
            <svg
              viewBox="10 135 1030 460"
              className="w-full h-auto max-h-[520px] select-none"
              style={{ filter: 'drop-shadow(0px 6px 12px rgba(15, 23, 42, 0.12))' }}
            >
              <defs>
                <filter id="glow-gold" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#f59e0b" floodOpacity="0.8" />
                </filter>
                <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#ef4444" floodOpacity="0.9" />
                </filter>
              </defs>

              {EXACT_TURKEY_CITIES.map((city) => {
                const dealersInCity = getDealersForCity(city);
                const dealerCount = dealersInCity.length;
                const blueStyle = getChoroplethBlue(dealerCount);

                const isHovered = hoveredCityData?.plateNumber === city.plateNumber;
                const isSelected = selectedCity !== 'all' && (
                  resolveProvincePlate(selectedCity) === city.plateNumber ||
                  normalizeCity(selectedCity) === normalizeCity(city.name)
                );

                // Stroke & filter styling
                const strokeColor = isSelected ? '#ef4444' : isHovered ? '#f59e0b' : blueStyle.stroke;
                const strokeWidth = isSelected ? 3.5 : isHovered ? 2.5 : 0.85;

                return (
                  <g
                    key={city.id}
                    id={`province-${city.id}`}
                    className="cursor-pointer transition-all duration-150"
                    onMouseEnter={() => setHoveredCityData(city)}
                    onMouseLeave={() => setHoveredCityData(null)}
                    onClick={() => {
                      if (isSelected) {
                        onSelectCity('all');
                      } else {
                        onSelectCity(city.name);
                        // Smoothly scroll down to the filter table
                        tableRef.current?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                  >
                    {/* Province SVG Path with Dynamic Blue Choropleth Fill */}
                    <path
                      d={city.path}
                      fill={blueStyle.fill}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeLinejoin="round"
                      filter={isSelected ? 'url(#glow-red)' : isHovered ? 'url(#glow-gold)' : undefined}
                      className="transition-colors duration-200 hover:brightness-110"
                    >
                      <title>{city.name}: {dealerCount} BCS Bayisi</title>
                    </path>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Footer Info & Legend Description */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 px-1 text-[11px] text-slate-500 border-t border-slate-100">
            <span className="flex items-center gap-1.5">
              <span>🔵</span>
              <span><strong>Mavi Yoğunluk Haritası:</strong> Servis sayısı arttıkça il rengi açıktan koyu maviye ve gece mavisine döner.</span>
            </span>
            <span className="font-semibold text-slate-600">Toplam {activeCitiesCount} İlde BCS Ağı</span>
          </div>
        </div>

      </div>

      {/* 2. DYNAMIC FILTER TABLE (Üzerine gelinen / Seçilen ildeki BCS Bayileri Tablosu) */}
      <div 
        ref={tableRef}
        className="bg-slate-900 border-2 border-red-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4 ring-1 ring-red-500/20"
      >
        {/* Table Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-red-600/10 text-red-400 border border-red-500/20">
              <Building2 className="w-6 h-6 text-red-500 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                  Canlı Şehir Tablosu
                </span>
                {hoveredCityData ? (
                  <span className="text-[11px] font-semibold text-amber-400 animate-pulse">
                    (Haritada Üzerine Gelindi)
                  </span>
                ) : null}
              </div>
              <h3 className="text-xl font-black text-white flex items-center gap-2 mt-1">
                📍 {activeCityObject?.name || 'Seçili İl'} İlindeki Bosch Car Service Bayileri
                <span className="text-sm font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {activeCityDealers.length} Servis
                </span>
              </h3>
            </div>
          </div>

          {/* Search in City & Filter Lock Button */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-48 sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={dealerSearchQuery}
                onChange={(e) => setDealerSearchQuery(e.target.value)}
                placeholder="Bu ilde servis veya ilçe ara..."
                className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded-xl pl-8 pr-3 py-2 outline-none focus:border-red-500"
              />
            </div>

            {activeCityObject && (
              <button
                type="button"
                onClick={() => onSelectCity(activeCityObject.name)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow ${
                  selectedCity.toLocaleUpperCase('tr-TR') === activeCityObject.name.toLocaleUpperCase('tr-TR')
                    ? 'bg-amber-500 text-slate-950 shadow-amber-950/40'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
                }`}
              >
                <span>
                  {selectedCity.toLocaleUpperCase('tr-TR') === activeCityObject.name.toLocaleUpperCase('tr-TR') 
                    ? 'Bu İle Filtrelendi' 
                    : `Tüm Sayfayı ${activeCityObject.displayName} İline Filtrele`}
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Dealers Table Content */}
        {activeCityDealers.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/90 shadow-inner">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 border-b border-slate-800 text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">BCS Firma / Tabela Adı</th>
                  <th className="px-3 py-3.5">İlçe / Şehir</th>
                  <th className="px-3 py-3.5">CUSTOMERID</th>
                  <th className="px-3 py-3.5">Bölge Yöneticisi</th>
                  <th className="px-3 py-3.5">Saha Sorumlusu</th>
                  <th className="px-3 py-3.5">CRM Kayıt Tarihi</th>
                  <th className="px-3 py-3.5 text-center">Online Booking</th>
                  <th className="px-3 py-3.5 text-center">Claimed</th>
                  <th className="px-3 py-3.5 text-center">Hizmet Kapsamı</th>
                  <th className="px-4 py-3.5 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {activeCityDealers.map((dealer) => {
                  const totalOffered = dealer.totalOfferedServicesCount || 0;
                  const totalPriced = dealer.totalPricedServicesCount || 0;
                  const totalCols = summary?.serviceColumns?.length || 28;

                  return (
                    <tr 
                      key={dealer._id || dealer.customerId}
                      className="hover:bg-slate-900/80 transition-colors group"
                    >
                      {/* Firm Name */}
                      <td className="px-4 py-3.5 font-bold text-white group-hover:text-amber-300 transition">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-red-500 shrink-0" />
                          <span className="font-semibold text-sm">{dealer.bcsFirmName}</span>
                        </div>
                      </td>

                      {/* District & City */}
                      <td className="px-3 py-3.5 text-slate-300 font-medium">
                        <span className="text-white font-bold">{dealer.district || 'Merkez'}</span>
                        <span className="text-slate-500 ml-1">/ {dealer.city}</span>
                      </td>

                      {/* Customer ID */}
                      <td className="px-3 py-3.5 font-mono text-[11px] text-slate-400">
                        <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {dealer.customerId}
                        </span>
                      </td>

                      {/* Region Manager */}
                      <td className="px-3 py-3.5 text-slate-300">
                        {dealer.regionManager || '-'}
                      </td>

                      {/* Field Responsible */}
                      <td className="px-3 py-3.5 text-slate-300">
                        {dealer.fieldResponsible || '-'}
                      </td>

                      {/* CRM Date */}
                      <td className="px-3 py-3.5 text-slate-400 font-mono text-[11px]">
                        {dealer.crmCreateDate || '-'}
                      </td>

                      {/* Online Booking */}
                      <td className="px-3 py-3.5 text-center">
                        {dealer.spoOnlineBooking === 'EVET' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" /> EVET
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-slate-500 border border-slate-800">
                            HAYIR
                          </span>
                        )}
                      </td>

                      {/* Claimed */}
                      <td className="px-3 py-3.5 text-center">
                        {dealer.claimed === 'EVET' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-950 text-blue-400 border border-blue-800">
                            EVET
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-slate-500 border border-slate-800">
                            HAYIR
                          </span>
                        )}
                      </td>

                      {/* Service Coverage */}
                      <td className="px-3 py-3.5 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="font-bold text-white text-xs">
                            {totalOffered} / {totalCols} Hizmet
                          </span>
                          <span className="text-[10px] text-emerald-400 font-semibold font-mono">
                            {totalPriced} Fiyat Tanımlı
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        {onInspectDealer && (
                          <button
                            type="button"
                            onClick={() => onInspectDealer(dealer)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 transition shadow"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Fiyat Kartı</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-8 text-center space-y-3">
            <Building2 className="w-10 h-10 mx-auto text-slate-700" />
            <div>
              <p className="text-sm font-bold text-slate-300">
                {activeCityObject ? `${activeCityObject.name} ilinde kayıtlı Bosch Car Service bulunmuyor.` : 'Bir il seçin.'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Yukarıdaki haritadan bayisi olan (üzerinde kırmızı rozet bulunan) illerin üzerine gelerek servisleri listeleyebilirsiniz.
              </p>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
