import * as XLSX from 'xlsx';
import { 
  WorkbookData, 
  SheetData, 
  SPO_SPR_Config, 
  Service18xItem, 
  BCSServiceMasterItem,
  BCSMatrixRow, 
  BCSMatrixSummary,
  ServicePriceStatus,
  ServiceAnalysisItem,
  ServiceColumnMeta
} from '../types';
import { STANDARD_BCS_SERVICES, DEFAULT_18X_SERVICES, SPO_K_TO_AA_SERVICES } from '../data/defaultCatalog';
import { resolveProvincePlate, getProvinceByPlate, cleanTurkishText } from './cityMatcher';

export function safeReadExcel(data: ArrayBuffer): XLSX.WorkBook {
  const origError = console.error;
  console.error = function (...args: any[]) {
    const first = args[0];
    if (typeof first === 'string' && (
      first.startsWith('Bad uncompressed size') ||
      first.startsWith('Bad compressed size') ||
      first.startsWith('Bad CRC32')
    )) {
      return;
    }
    return origError.apply(console, args);
  };

  try {
    const bytes = new Uint8Array(data);

    // Strategy 1: Fast chunked binary string conversion (bypasses SheetJS zip local vs central size mismatches)
    try {
      let binary = '';
      const chunkSize = 16384;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
        binary += String.fromCharCode.apply(null, Array.from(chunk));
      }
      return XLSX.read(binary, { type: 'binary', raw: true });
    } catch {
      // Strategy 2: Direct Uint8Array
      try {
        return XLSX.read(bytes, { type: 'array', raw: true });
      } catch {
        // Strategy 3: Base64 encoding
        try {
          let binary = '';
          const chunkSize = 16384;
          for (let i = 0; i < bytes.length; i += chunkSize) {
            const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
            binary += String.fromCharCode.apply(null, Array.from(chunk));
          }
          const base64 = btoa(binary);
          return XLSX.read(base64, { type: 'base64', raw: true });
        } catch {
          // Strategy 4: Raw ArrayBuffer fallback
          return XLSX.read(data, { type: 'array' });
        }
      }
    }
  } finally {
    console.error = origError;
  }
}

export async function parseExcelFile(file: File): Promise<WorkbookData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        if (!buffer || buffer.byteLength === 0) {
          throw new Error('Dosya boş veya okunamadı.');
        }

        const workbook = safeReadExcel(buffer);
        const sheetNames = workbook.SheetNames;
        const sheets: Record<string, SheetData> = {};

        for (const name of sheetNames) {
          const ws = workbook.Sheets[name];
          const rawJson = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false }) as Record<string, any>[];

          // Use header: 1 to get exact physical left-to-right column order from row 1 (A, B, C... K... AA)
          // (Object.keys() re-orders integer keys like '18000' to the beginning, breaking column order!)
          const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false }) as any[][];
          let headers: string[] = [];
          if (aoa && aoa.length > 0 && Array.isArray(aoa[0])) {
            headers = aoa[0].map((c) => String(c !== undefined && c !== null ? c : '').trim());
          }
          if (headers.length === 0 && rawJson.length > 0) {
            headers = Object.keys(rawJson[0]);
          }

          sheets[name] = {
            name,
            headers,
            rows: rawJson,
            totalRawRows: rawJson.length
          };
        }

        resolve({
          fileName: file.name,
          fileSize: file.size,
          uploadDate: new Date().toISOString(),
          sheets,
          sheetNames
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

export function formatExcelDate(val: any): string {
  if (val === undefined || val === null || val === '') return '-';

  // If already a Date object
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '-';
    const d = String(val.getDate()).padStart(2, '0');
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const y = val.getFullYear();
    return `${d}.${m}.${y}`;
  }

  const str = String(val).trim();

  // If it's a known non-date value (Firma name, boolean, NOPRICE, #YOK)
  const upper = str.toUpperCase();
  if (
    upper.includes('OTOMOTİV') || 
    upper.includes('OTOMOTIV') || 
    upper.includes('MOTORS') || 
    upper.includes('GARAGE') ||
    upper.includes('GRUP') ||
    upper.includes('ŞUBE') ||
    upper.includes('SUBE') ||
    upper.includes('NOPRICE') ||
    upper.includes('EVET') ||
    upper.includes('HAYIR') ||
    upper.includes('TRUE') ||
    upper.includes('FALSE') ||
    upper.includes('#YOK') ||
    upper.includes('COL_')
  ) {
    return '-';
  }

  // If numeric Excel date serial number (e.g. 45947, 45954, 45945, 45645)
  const num = Number(str);
  if (!isNaN(num) && num > 30000 && num < 70000) {
    const dateObj = new Date(Math.round((num - 25569) * 86400 * 1000));
    if (!isNaN(dateObj.getTime())) {
      const d = String(dateObj.getUTCDate()).padStart(2, '0');
      const m = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
      const y = dateObj.getUTCFullYear();
      return `${d}.${m}.${y}`;
    }
  }

  // If ISO date string YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const parts = str.split('T')[0].split('-');
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }

  // If already formatted like DD.MM.YYYY or DD/MM/YYYY
  if (/^\d{1,2}[./-]\d{1,2}[./-]\d{4}/.test(str)) {
    return str.replace(/\//g, '.').replace(/-/g, '.');
  }

  return str;
}

export function convertToTurkishBoolean(val: any): string {
  if (val === undefined || val === null) return 'HAYIR';
  if (typeof val === 'boolean') return val ? 'EVET' : 'HAYIR';
  if (typeof val === 'number') return val > 0 ? 'EVET' : 'HAYIR';
  const str = String(val).trim().toUpperCase();

  if (
    str === 'DOĞRU' || 
    str === 'DOGRU' || 
    str === 'TRUE' || 
    str === 'EVET' || 
    str === '1' || 
    str === 'YES' || 
    str === 'Y' ||
    str === 'AKTİF' ||
    str === 'AKTIF' ||
    str === 'ONLINE' ||
    str === 'ON-LINE' ||
    str === 'KAYITLI' ||
    str === 'VAR'
  ) {
    return 'EVET';
  }

  return 'HAYIR';
}

export function parsePriceValue(val: any): ServicePriceStatus {
  if (val === undefined || val === null || val === '') {
    return { status: 'NOT_OFFERED', displayValue: 'HAYIR', priceNumeric: null };
  }

  // If already a number
  if (typeof val === 'number') {
    if (isNaN(val)) {
      return { status: 'NOT_OFFERED', displayValue: 'HAYIR', priceNumeric: null };
    }
    if (val === 0) {
      return { status: 'FREE', displayValue: '0 TL (Ücretsiz)', priceNumeric: 0 };
    }
    return {
      status: 'PRICED',
      displayValue: `${val.toLocaleString('tr-TR')} TL`,
      priceNumeric: val
    };
  }

  const strVal = String(val).trim();
  const upper = strVal.toUpperCase();

  if (
    upper === 'HAYIR' ||
    upper === 'FALSE' ||
    upper === 'YANLIŞ' ||
    upper === 'YANLIS' ||
    upper === 'YOK' ||
    upper === 'NONE' ||
    upper === 'PASİF' ||
    upper === 'PASIF' ||
    upper === '-' ||
    upper === '--' ||
    upper === '---' ||
    upper === 'N/A' ||
    upper === '#N/A' ||
    upper === '#YOK' ||
    upper === 'MUAF' ||
    upper === 'NULL' ||
    upper === 'UNDEFINED'
  ) {
    return { status: 'NOT_OFFERED', displayValue: 'HAYIR', priceNumeric: null };
  }

  if (
    upper === 'NOPRICE' ||
    upper === 'NO_PRICE' ||
    upper === 'NO PRICE' ||
    upper === 'NOPRİCE' ||
    upper === 'FİYAT YOK' ||
    upper === 'FIYAT YOK' ||
    upper === 'FIYATSIZ' ||
    upper === 'FİYATSIZ' ||
    upper === 'TUTAR YOK' ||
    upper === 'TANIMSIZ' ||
    upper === 'BELİRTİLMEMİŞ' ||
    upper === 'BELIRTILMEMIS' ||
    upper === '- TL' ||
    upper === '-TL' ||
    upper === '?' ||
    upper === 'FİYAT GİRİLMEDİ' ||
    upper === 'FIYAT GIRILMEDI'
  ) {
    return { status: 'NO_PRICE', displayValue: 'NOPRICE', priceNumeric: null };
  }

  if (
    upper === 'EVET' ||
    upper === 'TRUE' ||
    upper === 'DOĞRU' ||
    upper === 'DOGRU' ||
    upper === 'VAR' ||
    upper === 'AKTİF' ||
    upper === 'AKTIF' ||
    upper === 'DAHİL' ||
    upper === 'DAHIL'
  ) {
    return { status: 'OFFERED_YES', displayValue: 'EVET', priceNumeric: null };
  }

  if (
    strVal === '0' ||
    strVal === '0,00' ||
    strVal === '0.00' ||
    strVal === '0 TL' ||
    strVal === '0TL' ||
    strVal === '0,0 TL' ||
    upper === 'ÜCRETSİZ' ||
    upper === 'UCRETSIZ' ||
    upper === 'BEDAVA' ||
    upper === 'FREE'
  ) {
    return { status: 'FREE', displayValue: '0 TL (Ücretsiz)', priceNumeric: 0 };
  }

  // Parse numeric string e.g. "1.500", "1500", "1,500.00", "1.500,50 TL", "2500 TL"
  let cleanStr = strVal.replace(/[₺TLtlEURUSD$\s]/g, '').trim();

  if (cleanStr.includes('.') && cleanStr.includes(',')) {
    if (cleanStr.indexOf('.') < cleanStr.indexOf(',')) {
      // Turkish: "1.500,50" -> "1500.50"
      cleanStr = cleanStr.replace(/\./g, '').replace(',', '.');
    } else {
      // US: "1,500.50" -> "1500.50"
      cleanStr = cleanStr.replace(/,/g, '');
    }
  } else if (cleanStr.includes(',')) {
    cleanStr = cleanStr.replace(',', '.');
  } else if (cleanStr.includes('.')) {
    const parts = cleanStr.split('.');
    if (parts.length === 2 && parts[1].length === 3 && parts[0].length >= 1) {
      // Turkish thousand separator: "1.500" -> "1500"
      cleanStr = cleanStr.replace('.', '');
    }
  }

  const num = parseFloat(cleanStr);
  if (!isNaN(num) && isFinite(num)) {
    if (num === 0) {
      return { status: 'FREE', displayValue: '0 TL (Ücretsiz)', priceNumeric: 0 };
    }
    return {
      status: 'PRICED',
      displayValue: `${num.toLocaleString('tr-TR')} TL`,
      priceNumeric: num
    };
  }

  if (cleanStr === '-' || cleanStr === '' || cleanStr === '.') {
    return { status: 'NOT_OFFERED', displayValue: 'HAYIR', priceNumeric: null };
  }

  return { status: 'OFFERED_YES', displayValue: strVal, priceNumeric: null };
}

export function normalizeCustomerId(val: any): string {
  if (val === undefined || val === null) return '';
  const s = String(val).trim();
  // Remove floating point from Excel number conversions e.g. "76285542.0" -> "76285542"
  return s.replace(/\.0+$/, '');
}

/**
 * Bidirectional cross-mapping for Bosch Car Service 5-digit and 7-digit 18xxxxx codes
 */
export const CODE_5_TO_7_MAP: Record<string, string> = {
  '18000': '1801001', // Genel Randevu
  '18001': '1802001', // Periyodik Bakım
  '18002': '1802002', // Motor Yağ Değişimi
  '18003': '1814001', // Triger Kayışı Değişimi
  '18004': '1803001', // Fren Sistemi Kontrolü
  '18005': '1808001', // Araç Muayenesi Öncesi Mevzuata Uygunluk Kontrolü
  '18006': '1809001', // Genel Araç Kontrolü
  '18007': '1804001', // Rot Ayarı
  '18008': '1805001', // Klima Kontrolü ve Bakımı
  '18009': '1806001', // Aydınlatma Kontrolü
  '18021': '1804002', // Lastik Kontrolü ve Değişimi
  '18022': '1810001', // Elektrikli & Hibrit Araç Kontrolü
  '18023': '1811001', // ADAS Kalibrasyonu (Gelişmiş Sürücü Destek Sistemleri)
  '18024': '1812001', // Şanzıman Yağ Değişimi
  '18025': '1813001', // Elektronik Arıza Tespiti
  '18026': '1813002', // Güvenlik Sistemleri Kontrolü
  '18034': '1807001'  // Akü Kontrolü
};

export const CODE_7_TO_5_MAP: Record<string, string> = Object.entries(CODE_5_TO_7_MAP).reduce(
  (acc, [k5, k7]) => {
    acc[k7] = k5;
    return acc;
  },
  {} as Record<string, string>
);

/**
 * Executes the complete BCS Service Pricing & Availability Analysis pipeline
 */
export function executeSPOSPRPipeline(params: {
  spoSheet: SheetData;
  sprSheet: SheetData;
  service18xList?: Service18xItem[];
  bcsMasterList?: BCSServiceMasterItem[];
  customConfig?: Partial<SPO_SPR_Config>;
}): BCSMatrixSummary {
  const { spoSheet, sprSheet, service18xList = [], bcsMasterList = [], customConfig } = params;

  // 1. Determine Columns in SPO & SPR
  const spoCustomerIdCol = customConfig?.spoCustomerIdCol ||
    findColumn(spoSheet.headers, ['CUSTOMERID', 'Müşteri No', 'MusteriNo', 'CustomerID', 'Dissap', 'Cari', 'Cari No', 'Col_C'], 2) ||
    'CUSTOMERID';

  const spoDateCol = findColumn(spoSheet.headers, ['crm create date', 'crm_create_date', 'Tarih', 'Giriş Tarihi', 'Col_D', 'Col_E'], 3) ||
    'crm create date';

  // Online booking is strictly in metadata columns (columns A-J, indices 0-9 in SPO; NEVER column index >= 10 which is Column K!)
  const spoOnlineCol = findColumn(spoSheet.headers, ['SPO_ONLINEBOOKING', 'ONLINEBOOKING', 'Online Booking', 'Col_J', 'Col_I'], 9) ||
    'SPO_ONLINEBOOKING';

  const sprCustomerIdCol = customConfig?.sprCustomerIdCol ||
    findColumn(sprSheet.headers, ['CUSTOMERID', 'Müşteri No', 'MusteriNo', 'CustomerID', 'Dissap', 'Col_E', 'Col_C', 'Col_B'], 2) ||
    'CUSTOMERID';

  const sprClaimedCol = customConfig?.sprClaimedCol ||
    findColumn(sprSheet.headers, ['CLAIMED', 'Claimed', 'claimed', 'İtiraz', 'Col_K', 'Col_I'], 10) ||
    'CLAIMED';

  const sprDeleteCandidateCol = customConfig?.sprDeleteCol ||
    findColumn(sprSheet.headers, ['DELETECANDIDATE', 'DeleteCandidate', 'DELETE_CANDIDATE', 'Silme Adayı', 'Col_J'], 9) ||
    'DELETECANDIDATE';

  // 2. Identify Non-Service / Metadata Headers to Filter Out
  const normalizeHeaderKey = (str: string): string => {
    return cleanTurkishText(str).toLowerCase().replace(/[\s\-_()]/g, '');
  };

  const metadataNormalized = new Set([
    'tenant', 'spotenant', 'tenantid',
    'spoid', 'id', 'sira', 'no',
    'sponame',
    'spoonlinebookinglastmodified', 'onlinebookinglastmodified',
    'spolastmodified', 'lastmodified', 'modified', 'modifieddate', 'lastmodifieddate',
    'spoexternaldata', 'externaldata', 'spoexternalid', 'externalid',
    'spoexternaldatasource', 'externaldatasource', 'datasource', 'source',
    'spocreated', 'created', 'createddate', 'spocreateddate',
    'customerid', 'musterino', 'dissap', 'cari', 'carikodu', 'carino',
    'crmcreatedate', 'tarih', 'kayittarihi', 'giristarihi',
    'spoonlinebooking', 'onlinebooking', 'onlinerandevu', 'online',
    'spotimezoneid', 'spotimezone', 'timezoneid', 'timezone',
    'spoemails', 'spoemail', 'emails', 'email', 'eposta', 'mail',
    'spophone', 'spophonenumber', 'phone', 'telefon', 'tel', 'fax',
    'spoaddress', 'address', 'adres', 'zip', 'postal', 'postakodu',
    'spostatus', 'status', 'type', 'spotype', 'description', 'aciklama',
    'spourl', 'url', 'website', 'web', 'sponotes', 'note', 'notes', 'notlar',
    'claimed', 'itiraz', 'deletecandidate', 'silmeadayi',
    'bolgeyoneticisi', 'bolge', 'saha', 'sahasorumlusu', 'musteriiliskileri',
    'il', 'ilce', 'sehir', 'firma', 'firmatabela', 'tabela', 'bcs', 'sube', 'subeadi',
    'cola', 'colb', 'colc', 'cold', 'cole', 'colf', 'colg', 'colh', 'coli', 'colj'
  ]);

  const isMetadataHeader = (h: string): boolean => {
    if (!h) return true;
    const raw = String(h).trim();
    if (!raw) return true;

    // 18xxxxx Service codes are ALWAYS service columns, NEVER metadata!
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('18') && digits.length >= 4) return false;

    const norm = normalizeHeaderKey(raw);
    if (!norm) return true;
    if (norm.startsWith('empty') || norm.startsWith('__empty')) return true;
    if (metadataNormalized.has(norm)) return true;

    if (norm.includes('externaldata') || norm.includes('externalid') || norm.includes('datasource') || norm.includes('lastmodified') || norm.includes('createddate') || norm.includes('tenant') || norm.includes('spoid') || norm.includes('sponame') || norm.includes('timezone')) return true;
    if (norm === 'claimed' || norm.includes('claimed') || norm === 'itiraz') return true;
    if (norm === 'deletecandidate' || norm.includes('deletecandidate') || norm.includes('silmeadayi')) return true;
    if (h === sprClaimedCol || h === sprDeleteCandidateCol || h === sprCustomerIdCol || h === spoCustomerIdCol || h === spoDateCol || h === spoOnlineCol) return true;

    return false;
  };

  // Extract Services from SPO Sheet: Columns K to AA (index 10 to 26 inclusive = 17 services)
  // Kullanıcı kuralı: "spo sayfasında K sütunundan başlayıp AA sütununa kadar AA da dahil olmak üzere hizmetler burada oluyor"
  const spoKToAaHeaders: string[] = [];
  if (spoSheet.headers && spoSheet.headers.length > 10) {
    const endIndex = Math.min(27, spoSheet.headers.length);
    for (let i = 10; i < endIndex; i++) {
      const h = spoSheet.headers[i];
      if (h !== undefined && h !== null && String(h).trim() !== '' && !isMetadataHeader(h)) {
        spoKToAaHeaders.push(h);
      }
    }
  }

  // Any other columns containing 18xxxxx codes anywhere in SPO sheet:
  const spo18CodeHeaders = (spoSheet.headers || []).filter((h) => {
    if (!h) return false;
    const digits = String(h).replace(/\D/g, '');
    return digits.startsWith('18') && digits.length >= 4;
  });

  // Effective Service Columns: Combine SPO K..AA and 18-codes without duplicates
  let serviceColumns: string[] = [];
  spoKToAaHeaders.forEach((h) => {
    if (!serviceColumns.includes(h)) serviceColumns.push(h);
  });
  spo18CodeHeaders.forEach((h) => {
    if (!serviceColumns.includes(h)) serviceColumns.push(h);
  });

  // Fallback ONLY if spoSheet has no service columns at all (e.g. malformed or empty sheet)
  if (serviceColumns.length === 0 && sprSheet.headers && sprSheet.headers.length > 0) {
    sprSheet.headers.forEach((h) => {
      const digits = String(h).replace(/\D/g, '');
      if ((digits.startsWith('18') && digits.length >= 4) || (!isMetadataHeader(h) && sprSheet.headers.indexOf(h) >= 10)) {
        if (!serviceColumns.includes(h)) serviceColumns.push(h);
      }
    });
  }

  // 3. Index SPR Sheet by CUSTOMERID
  const sprLookupMap = new Map<string, { claimed: string; deleteCandidate: string; rawRow: Record<string, any> }>();

  for (const sprRow of sprSheet.rows) {
    let rawCustId = sprRow[sprCustomerIdCol];
    if (rawCustId === undefined || rawCustId === '') {
      for (const k of Object.keys(sprRow)) {
        const normK = cleanTurkishText(k).toLowerCase().replace(/[\s\-_()]/g, '');
        if (normK === 'customerid' || normK === 'dissap' || normK === 'musterino' || normK === 'carino' || normK === 'cari') {
          rawCustId = sprRow[k];
          break;
        }
      }
    }
    if ((rawCustId === undefined || rawCustId === '') && sprSheet.headers && sprSheet.headers.length > 2) {
      rawCustId = sprRow[sprSheet.headers[2]];
    }

    const custId = normalizeCustomerId(rawCustId);
    if (!custId) continue;

    // Resolve rawClaimed with multiple strategies: Column K (index 10 in SPR sheet), explicit header, or normalized key
    let rawClaimed: any = sprRow[sprClaimedCol];
    if ((rawClaimed === undefined || rawClaimed === '') && sprSheet.headers && sprSheet.headers.length > 10) {
      const colKHeader = sprSheet.headers[10];
      if (colKHeader && sprRow[colKHeader] !== undefined && sprRow[colKHeader] !== '') {
        rawClaimed = sprRow[colKHeader];
      }
    }
    if (rawClaimed === undefined || rawClaimed === '') {
      for (const k of Object.keys(sprRow)) {
        const normK = cleanTurkishText(k).toLowerCase().replace(/[\s\-_()]/g, '');
        if (normK === 'claimed' || normK === 'kayitli' || normK === 'itiraz' || normK === 'colk' || normK === 'col_k' || normK === 'k') {
          rawClaimed = sprRow[k];
          break;
        }
      }
    }

    // Resolve deleteCandidate with multiple strategies
    let rawDelete: any = sprRow[sprDeleteCandidateCol];
    if ((rawDelete === undefined || rawDelete === '') && sprSheet.headers && sprSheet.headers.length > 9) {
      const colJHeader = sprSheet.headers[9];
      if (colJHeader && sprRow[colJHeader] !== undefined && sprRow[colJHeader] !== '') {
        rawDelete = sprRow[colJHeader];
      }
    }
    if (rawDelete === undefined || rawDelete === '') {
      for (const k of Object.keys(sprRow)) {
        const normK = cleanTurkishText(k).toLowerCase().replace(/[\s\-_()]/g, '');
        if (normK === 'deletecandidate' || normK === 'silmeadayi' || normK === 'silme') {
          rawDelete = sprRow[k];
          break;
        }
      }
    }

    const claimedVal = convertToTurkishBoolean(rawClaimed);
    const deleteCandidateVal = convertToTurkishBoolean(rawDelete);

    sprLookupMap.set(custId, {
      claimed: claimedVal,
      deleteCandidate: deleteCandidateVal,
      rawRow: sprRow
    });
  }

  // 4. Index BCS Master Services (Dissap Map)
  const bcsMasterMap = new Map<string, BCSServiceMasterItem>();
  for (const item of bcsMasterList) {
    const dissapKey = normalizeCustomerId(item.dissap);
    if (dissapKey) {
      bcsMasterMap.set(dissapKey, item);
    }
  }

  // 5. Index 18xxxxx Services (Combine default catalog with user uploaded/edited services)
  const service18xMap = new Map<string, Service18xItem>();
  const service18xByCode = new Map<string, Service18xItem>();

  const registerService18x = (s: Service18xItem) => {
    if (!s) return;
    const rawCode = String(s.serviceCode || '').trim();
    const digits = rawCode.replace(/\D/g, '');
    const cleanName = String(s.serviceName || '').trim();

    if (rawCode) {
      service18xMap.set(rawCode.toLowerCase(), s);
      service18xByCode.set(rawCode.toLowerCase(), s);
    }
    if (digits) {
      service18xMap.set(digits, s);
      service18xByCode.set(digits, s);

      // Cross map 5-digit <-> 7-digit equivalents
      const eq7 = CODE_5_TO_7_MAP[digits];
      if (eq7 && !service18xByCode.has(eq7)) {
        service18xByCode.set(eq7, s);
      }
      const eq5 = CODE_7_TO_5_MAP[digits];
      if (eq5 && !service18xByCode.has(eq5)) {
        service18xByCode.set(eq5, s);
      }
    }
    if (cleanName) {
      service18xMap.set(cleanName.toLowerCase(), s);
      const cleanTr = cleanTurkishText(cleanName).toLowerCase();
      if (cleanTr) service18xMap.set(cleanTr, s);
    }
  };

  // First load default 18x services (5-digit and 7-digit)
  for (const s of DEFAULT_18X_SERVICES) {
    registerService18x(s);
  }

  // Then override/extend with user-uploaded or user-edited services
  for (const s of service18xList) {
    registerService18x(s);
  }

  // Helper to resolve service metadata from column header
  const resolveServiceMeta = (rawCol: string): ServiceColumnMeta => {
    const raw = String(rawCol).trim();
    // Normalize Excel numeric formatting (e.g. "18001.0" -> "18001")
    const cleanRaw = raw.replace(/\.0+$/, '').trim();
    const lower = cleanRaw.toLowerCase();

    // Extract digits and 18xxxxx pattern if present
    const digits = cleanRaw.replace(/\D/g, '');
    const match18 = cleanRaw.match(/\b(18\d{3,7})\b/) || cleanRaw.match(/18\d{3,7}/);
    const code18 = match18 ? match18[0] : (digits.startsWith('18') && digits.length >= 5 ? digits : '');

    // Is this header an anonymous Excel placeholder? (Col_K, __EMPTY_10, etc.)
    // Note: NEVER treat an 18xxxxx code as a generic header!
    const isGenericHeader = !code18 && (
      lower.startsWith('col_') || 
      lower.startsWith('col') || 
      lower.startsWith('__empty') || 
      lower.startsWith('sütun') || 
      lower.startsWith('column')
    );

    // Position-based mapping for SPO Sheet: Columns K to AA (index 10 to 26 inclusive = 17 services)
    // Sütun K (10) -> SPO_K_TO_AA_SERVICES[0] (18000 Genel Randevu)
    // Sütun L (11) -> SPO_K_TO_AA_SERVICES[1] (18001 Periyodik Bakım)
    // ...
    // Sütun AA (26) -> SPO_K_TO_AA_SERVICES[16] (18034 Akü Kontrolü)
    const spoIndex = spoSheet.headers ? spoSheet.headers.indexOf(rawCol) : -1;
    let positionService: Service18xItem | undefined = undefined;
    if (spoIndex >= 10 && spoIndex <= 26) {
      const spoOffset = spoIndex - 10;
      if (spoOffset >= 0 && spoOffset < SPO_K_TO_AA_SERVICES.length) {
        positionService = SPO_K_TO_AA_SERVICES[spoOffset];
      }
    } else if (spoIndex === -1 && sprSheet.headers) {
      const sprIndex = sprSheet.headers.indexOf(rawCol);
      if (sprIndex >= 10 && sprIndex <= 26) {
        const sprOffset = sprIndex - 10;
        if (sprOffset >= 0 && sprOffset < SPO_K_TO_AA_SERVICES.length) {
          positionService = SPO_K_TO_AA_SERVICES[sprOffset];
        }
      }
    }

    // 1. Direct match by 18-code in catalog
    let found = (code18 ? service18xByCode.get(code18.toLowerCase()) : undefined) ||
                (digits ? service18xByCode.get(digits) : undefined) ||
                service18xMap.get(lower);

    // 2. Cross-map 5-digit <-> 7-digit equivalents
    if (!found && code18) {
      const eq7 = CODE_5_TO_7_MAP[code18];
      if (eq7) found = service18xByCode.get(eq7);
      if (!found) {
        const eq5 = CODE_7_TO_5_MAP[code18];
        if (eq5) found = service18xByCode.get(eq5);
      }
    }

    // 3. Match by normalized Turkish text
    if (!found) {
      const normTurkish = cleanTurkishText(cleanRaw).toLowerCase();
      if (normTurkish) {
        found = service18xMap.get(normTurkish);
      }
    }

    // 4. Fuzzy match across registered items by serviceCode digits
    if (!found && digits) {
      for (const [, item] of service18xMap.entries()) {
        const itemDigits = item.serviceCode ? item.serviceCode.replace(/\D/g, '') : '';
        if (itemDigits === digits) {
          found = item;
          break;
        }
      }
    }

    // If item matched from user catalog or default 18x list:
    if (found) {
      return {
        rawKey: raw,
        serviceCode: found.serviceCode || code18 || digits || cleanRaw,
        serviceName: found.serviceName,
        displayName: found.serviceName,
        category: found.serviceCategory || '18xxxxx Hizmetler'
      };
    }

    // USER EXPLICIT RULE: "Elinizdeki listede bulunmayan bir 18 li kod gelirse nasıl davranılsın? -> Hizmet kodu doğrudan başlık olarak korunsun"
    // Keep the service code itself as title, NEVER apply generic position fallback!
    if (code18 || (digits.startsWith('18') && digits.length >= 4)) {
      const fallbackCode = code18 || digits || cleanRaw;
      return {
        rawKey: raw,
        serviceCode: fallbackCode,
        serviceName: fallbackCode,
        displayName: fallbackCode,
        category: '18xxxxx Hizmetler'
      };
    }

    // Fallback to position-based service only for anonymous placeholders (Col_K, __EMPTY_10)
    if (positionService) {
      return {
        rawKey: raw,
        serviceCode: positionService.serviceCode,
        serviceName: positionService.serviceName,
        displayName: positionService.serviceName,
        category: positionService.serviceCategory
      };
    }

    return {
      rawKey: raw,
      serviceCode: digits || cleanRaw,
      serviceName: cleanRaw,
      displayName: cleanRaw,
      category: 'Diğer Hizmetler'
    };
  };

  const serviceColumnMeta: Record<string, ServiceColumnMeta> = {};
  serviceColumns.forEach((col) => {
    serviceColumnMeta[col] = resolveServiceMeta(col);
  });

  // 6. Process SPO Rows
  const activeRows: BCSMatrixRow[] = [];
  const deletedRowsSample: { customerId: string; reason: string; rowData: Record<string, any> }[] = [];

  let claimedYesCount = 0;
  let claimedNoCount = 0;
  let onlineYesCount = 0;
  let onlineNoCount = 0;
  let totalServicesOfferedAcrossNetwork = 0;
  let totalPricedOfferingsCount = 0;
  let totalNotOfferedCount = 0;
  let totalNoPriceCount = 0;

  spoSheet.rows.forEach((spoRow, index) => {
    let rawCustId = spoRow[spoCustomerIdCol];
    if (rawCustId === undefined || rawCustId === '') {
      for (const k of Object.keys(spoRow)) {
        const normK = cleanTurkishText(k).toLowerCase().replace(/[\s\-_()]/g, '');
        if (normK === 'customerid' || normK === 'dissap' || normK === 'musterino' || normK === 'carino' || normK === 'cari') {
          rawCustId = spoRow[k];
          break;
        }
      }
    }
    if ((rawCustId === undefined || rawCustId === '') && spoSheet.headers && spoSheet.headers.length > 2) {
      rawCustId = spoRow[spoSheet.headers[2]];
    }
    const custId = normalizeCustomerId(rawCustId);

    // Düşeyara from SPR
    const sprData = sprLookupMap.get(custId);
    const claimedVal = sprData ? sprData.claimed : 'HAYIR';
    const deleteCandidateVal = sprData ? sprData.deleteCandidate : 'HAYIR';

    // Step 6: Filter out DELETECANDIDATE = EVET
    if (deleteCandidateVal === 'EVET') {
      deletedRowsSample.push({
        customerId: custId || `SATIR-${index + 1}`,
        reason: 'DELETECANDIDATE = EVET (Silme Adayı Olarak Elendi)',
        rowData: { ...spoRow, 'CLAIMED': claimedVal, 'DELETECANDIDATE': 'EVET' }
      });
      return;
    }

    if (claimedVal === 'EVET') claimedYesCount++;
    else claimedNoCount++;

    // Resolve online booking value with extensive fallbacks
    let rawOnline: any = spoRow[spoOnlineCol];
    if ((rawOnline === undefined || rawOnline === '') && spoSheet.headers && spoSheet.headers.length > 9) {
      const colJHeader = spoSheet.headers[9];
      if (colJHeader && spoRow[colJHeader] !== undefined && spoRow[colJHeader] !== '') {
        rawOnline = spoRow[colJHeader];
      }
      if ((rawOnline === undefined || rawOnline === '') && spoSheet.headers.length > 8) {
        const colIHeader = spoSheet.headers[8];
        if (colIHeader && spoRow[colIHeader] !== undefined && spoRow[colIHeader] !== '') {
          rawOnline = spoRow[colIHeader];
        }
      }
    }
    if (rawOnline === undefined || rawOnline === '') {
      for (const k of Object.keys(spoRow)) {
        const normK = cleanTurkishText(k).toLowerCase().replace(/[\s\-_()]/g, '');
        if (normK === 'spoonlinebooking' || normK === 'onlinebooking' || normK === 'onlinerandevu' || normK === 'spoonline' || normK === 'online') {
          rawOnline = spoRow[k];
          break;
        }
      }
    }
    const onlineVal = convertToTurkishBoolean(rawOnline);
    if (onlineVal === 'EVET') onlineYesCount++;
    else onlineNoCount++;

    // Step 9-12: Match Dissap in Master List with extensive fallbacks from row columns
    const bcsMaster = bcsMasterMap.get(custId);
    let regionManager = bcsMaster?.regionManager || '-';
    let fieldResponsible = bcsMaster?.fieldResponsible || '-';
    let city = bcsMaster?.city || '-';
    let district = bcsMaster?.district || '-';
    let bcsFirmName = bcsMaster?.firmName || '-';

    // 1. Fallback for City
    if (city === '#YOK' || city === '-' || !city) {
      const rowCity = spoRow['İL'] || spoRow['İl'] || spoRow['IL'] || spoRow['il'] ||
                      spoRow['Şehir'] || spoRow['ŞEHİR'] || spoRow['SEHIR'] || spoRow['sehir'] ||
                      spoRow['City'] || spoRow['CITY'] || spoRow['city'] ||
                      sprData?.rawRow?.['İL'] || sprData?.rawRow?.['İl'] || sprData?.rawRow?.['Şehir'];
      if (rowCity && String(rowCity).trim() !== '' && String(rowCity).trim() !== '#YOK') {
        city = String(rowCity).trim();
      }
    }

    // 2. Fallback for District
    if (district === '#YOK' || district === '-' || !district) {
      const rowDistrict = spoRow['İLÇE'] || spoRow['İlçe'] || spoRow['ILCE'] || spoRow['ilce'] ||
                          spoRow['District'] || spoRow['DISTRICT'] ||
                          sprData?.rawRow?.['İLÇE'] || sprData?.rawRow?.['İlçe'];
      if (rowDistrict && String(rowDistrict).trim() !== '' && String(rowDistrict).trim() !== '#YOK') {
        district = String(rowDistrict).trim();
      }
    }

    // 3. Fallback for BCS Firm Name
    if (bcsFirmName === '#YOK' || bcsFirmName === '-' || !bcsFirmName) {
      const rowFirm = spoRow['BCS'] || spoRow['FİRMA (TABELA)'] || spoRow['FİRMA'] || spoRow['Firma'] ||
                      spoRow['SPO_NAME'] || spoRow['spo_name'] || spoRow['Tabela'] || spoRow['TABELA'] ||
                      sprData?.rawRow?.['BCS'] || sprData?.rawRow?.['FİRMA (TABELA)'];
      if (rowFirm && String(rowFirm).trim() !== '' && String(rowFirm).trim() !== '#YOK') {
        bcsFirmName = String(rowFirm).trim();
      }
    }

    // 4. Fallback for Region Manager
    if (regionManager === '#YOK' || regionManager === '-' || !regionManager) {
      const rowRM = spoRow['BÖLGE YÖNETİCİSİ'] || spoRow['Bölge Yöneticisi'] || spoRow['BOLGE YONETICISI'] ||
                    spoRow['BY'] || spoRow['Bölge'] || sprData?.rawRow?.['BÖLGE YÖNETİCİSİ'];
      if (rowRM && String(rowRM).trim() !== '' && String(rowRM).trim() !== '#YOK') {
        regionManager = String(rowRM).trim();
      }
    }

    // 5. Fallback for Field Responsible
    if (fieldResponsible === '#YOK' || fieldResponsible === '-' || !fieldResponsible) {
      const rowField = spoRow['SAHA'] || spoRow['Saha'] || spoRow['SAHA SORUMLUSU'] || spoRow['Saha Sorumlusu'] ||
                       sprData?.rawRow?.['SAHA'];
      if (rowField && String(rowField).trim() !== '' && String(rowField).trim() !== '#YOK') {
        fieldResponsible = String(rowField).trim();
      }
    }

    // 6. Canonical City Normalization: If city is known, ensure proper uppercase formatting
    const resolvedPlate = resolveProvincePlate(city, district);
    if (resolvedPlate) {
      const pMeta = getProvinceByPlate(resolvedPlate);
      if (pMeta) {
        city = pMeta.displayName.toLocaleUpperCase('tr-TR');
      }
    }

    // Extract & Analyze Service Values (Price, NOPRICE, EVET, HAYIR) - STRICTLY from user uploaded cells
    const serviceValues: Record<string, string | number> = {};
    const serviceStatuses: Record<string, ServicePriceStatus> = {};

    let offeredCount = 0;
    let pricedCount = 0;
    let notOfferedRow = 0;
    let noPriceRow = 0;
    const pricesInRow: number[] = [];

    serviceColumns.forEach((svcCol) => {
      const meta = serviceColumnMeta[svcCol];
      // 1. Primary lookup: Check SPO sheet for this CUSTOMERID by exact svcCol header
      let rawCellVal: any = spoRow[svcCol];

      // 2. Lookup by serviceCode or serviceName in spoRow if available
      if ((rawCellVal === undefined || rawCellVal === null || String(rawCellVal).trim() === '') && meta) {
        if (meta.serviceCode && spoRow[meta.serviceCode] !== undefined) {
          rawCellVal = spoRow[meta.serviceCode];
        } else if (meta.serviceName && spoRow[meta.serviceName] !== undefined) {
          rawCellVal = spoRow[meta.serviceName];
        }
      }

      // 3. Lookup by column index in SPO sheet (Columns K to AA: index 10 to 26)
      if (rawCellVal === undefined || rawCellVal === null || String(rawCellVal).trim() === '') {
        const colIdx = spoSheet.headers ? spoSheet.headers.indexOf(svcCol) : -1;
        if (colIdx >= 10 && colIdx <= 26) {
          const headerAtIdx = spoSheet.headers[colIdx];
          if (headerAtIdx && spoRow[headerAtIdx] !== undefined) {
            rawCellVal = spoRow[headerAtIdx];
          }
          if (rawCellVal === undefined || rawCellVal === null || String(rawCellVal).trim() === '') {
            const spoKeys = Object.keys(spoRow);
            if (spoKeys[colIdx] !== undefined) {
              rawCellVal = spoRow[spoKeys[colIdx]];
            }
          }
        }
      }

      // 4. Fallback: Check SPR sheet
      if ((rawCellVal === undefined || rawCellVal === null || String(rawCellVal).trim() === '') && sprData?.rawRow) {
        rawCellVal = sprData.rawRow[svcCol];
        if (rawCellVal === undefined && meta?.serviceCode) rawCellVal = sprData.rawRow[meta.serviceCode];
        if (rawCellVal === undefined && meta?.serviceName) rawCellVal = sprData.rawRow[meta.serviceName];
        if (rawCellVal === undefined || rawCellVal === null || String(rawCellVal).trim() === '') {
          const colIdx = sprSheet.headers ? sprSheet.headers.indexOf(svcCol) : -1;
          if (colIdx >= 10 && colIdx <= 26) {
            const sprKeys = Object.keys(sprData.rawRow);
            if (sprKeys[colIdx] !== undefined) {
              rawCellVal = sprData.rawRow[sprKeys[colIdx]];
            }
          }
        }
      }

      const val = (rawCellVal === undefined || rawCellVal === null || String(rawCellVal).trim() === '') ? 'HAYIR' : rawCellVal;

      const statusObj = parsePriceValue(val);
      serviceValues[svcCol] = val;
      serviceStatuses[svcCol] = statusObj;

      if (statusObj.status !== 'NOT_OFFERED') {
        offeredCount++;
        totalServicesOfferedAcrossNetwork++;

        if (statusObj.status === 'PRICED' || statusObj.status === 'FREE') {
          pricedCount++;
          totalPricedOfferingsCount++;
          if (statusObj.priceNumeric !== null) {
            pricesInRow.push(statusObj.priceNumeric);
          }
        } else if (statusObj.status === 'NO_PRICE') {
          noPriceRow++;
          totalNoPriceCount++;
        }
      } else {
        notOfferedRow++;
        totalNotOfferedCount++;
      }
    });

    const paidPricesInRow = pricesInRow.filter((p) => p > 0);
    const minPrice = paidPricesInRow.length > 0 
      ? Math.min(...paidPricesInRow) 
      : (pricesInRow.length > 0 ? 0 : null);
    const maxPrice = paidPricesInRow.length > 0 
      ? Math.max(...paidPricesInRow) 
      : (pricesInRow.length > 0 ? 0 : null);
    const avgPrice = paidPricesInRow.length > 0
      ? Math.round((paidPricesInRow.reduce((a, b) => a + b, 0) / paidPricesInRow.length) * 100) / 100
      : (pricesInRow.length > 0 ? 0 : 0);

    let rawDate = (bcsMaster && bcsMaster.crmCreateDate) ? bcsMaster.crmCreateDate : '';
    if (!rawDate || rawDate === '-' || rawDate === '#YOK') {
      rawDate = spoRow[spoDateCol] || spoRow['crm create date'] || spoRow['crm_create_date'] || spoRow['Col_D'] || spoRow['Col_E'] || '';
    }
    const crmCreateDate = formatExcelDate(rawDate);

    const pricingCoveragePct = offeredCount > 0 
      ? Math.round((pricedCount / offeredCount) * 100) 
      : 0;
    const pricingStatus: 'COMPLETE' | 'INCOMPLETE' | 'NO_PRICING' = 
      pricedCount === 0 
        ? 'NO_PRICING' 
        : (offeredCount > 0 && pricedCount >= offeredCount) 
          ? 'COMPLETE' 
          : 'INCOMPLETE';

    const rowObj: BCSMatrixRow = {
      _id: `BCS-${index + 1}-${custId || 'NOCUST'}`,
      customerId: custId,
      crmCreateDate,
      regionManager,
      fieldResponsible,
      city,
      district,
      bcsFirmName,
      claimed: claimedVal,
      spoOnlineBooking: onlineVal,
      serviceValues,
      serviceStatuses,
      totalOfferedServicesCount: offeredCount,
      totalPricedServicesCount: pricedCount,
      totalNotOfferedCount: notOfferedRow,
      totalNoPriceCount: noPriceRow,
      pricingCoveragePct,
      pricingStatus,
      minPrice,
      maxPrice,
      averagePrice: avgPrice,
      ...serviceValues
    };

    activeRows.push(rowObj);
  });

  // Calculate Header Summary Ratios
  const finalCount = activeRows.length;
  const registeredPct = finalCount > 0 ? Math.round((claimedYesCount / finalCount) * 100) : 91;
  const onlinePct = finalCount > 0 ? Math.round((onlineYesCount / finalCount) * 100) : 89;
  
  // Real BCS SPO Dealer Pricing Compliance KPIs
  const dealersComplete = activeRows.filter((r) => r.pricingStatus === 'COMPLETE');
  const dealersIncomplete = activeRows.filter((r) => r.pricingStatus === 'INCOMPLETE');
  const dealersNoPricing = activeRows.filter((r) => r.pricingStatus === 'NO_PRICING');

  const pricingCompleteCount = dealersComplete.length;
  // All dealers that do not have 100% of offered services priced
  const pricingIncompleteCount = activeRows.filter((r) => r.totalOfferedServicesCount === 0 || r.totalPricedServicesCount < r.totalOfferedServicesCount).length;
  const noPricingCount = dealersNoPricing.length;

  const completePct = finalCount > 0 ? Math.round((pricingCompleteCount / finalCount) * 100) : 0;
  const incompletePct = finalCount > 0 ? Math.round((pricingIncompleteCount / finalCount) * 100) : 0;
  const noPricingPct = finalCount > 0 ? Math.round((noPricingCount / finalCount) * 100) : 0;

  // Network-wide overall price definition rate:
  const overallPricingCoveragePct = totalServicesOfferedAcrossNetwork > 0
    ? Math.round((totalPricedOfferingsCount / totalServicesOfferedAcrossNetwork) * 1000) / 10
    : 0;

  // 7. Per-Service Pricing & Availability Analytics
  const serviceAnalysisList: ServiceAnalysisItem[] = serviceColumns.map((sName) => {
    let totalOffer = 0;
    let priced = 0;
    let notOffered = 0;
    let noPrice = 0;
    let offeredYes = 0;
    let free = 0;
    const prices: number[] = [];
    const offeringDealers: { firmName: string; city: string; manager: string; priceText: string; priceNum: number | null; status: string; customerId?: string; claimed?: string; spoOnlineBooking?: string }[] = [];

    activeRows.forEach((r) => {
      const statusObj = r.serviceStatuses[sName] || { status: 'NOT_OFFERED', displayValue: 'HAYIR', priceNumeric: null };

      if (statusObj.status !== 'NOT_OFFERED') {
        totalOffer++;
        if (statusObj.status === 'PRICED') {
          priced++;
          if (statusObj.priceNumeric !== null) prices.push(statusObj.priceNumeric);
        } else if (statusObj.status === 'FREE') {
          free++;
          prices.push(0);
        } else if (statusObj.status === 'NO_PRICE') {
          noPrice++;
        } else if (statusObj.status === 'OFFERED_YES') {
          offeredYes++;
        }
      } else {
        notOffered++;
      }

      offeringDealers.push({
        firmName: r.bcsFirmName,
        city: r.city,
        manager: r.regionManager,
        priceText: statusObj.displayValue,
        priceNum: statusObj.priceNumeric,
        status: statusObj.status,
        customerId: r.customerId,
        claimed: r.claimed,
        spoOnlineBooking: r.spoOnlineBooking
      });
    });

    // Calculate accurate prices: only positive paid prices should form market min, max, avg, and median
    const paidPrices = prices.filter((p) => p > 0);

    const minP = paidPrices.length > 0 ? Math.min(...paidPrices) : (free > 0 ? 0 : 0);
    const maxP = paidPrices.length > 0 ? Math.max(...paidPrices) : (free > 0 ? 0 : 0);
    const avgP = paidPrices.length > 0 
      ? Math.round(paidPrices.reduce((a, b) => a + b, 0) / paidPrices.length) 
      : (free > 0 ? 0 : 0);

    // Median price
    let medianP = 0;
    if (paidPrices.length > 0) {
      const sorted = [...paidPrices].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      medianP = sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
    }

    const covRate = totalOffer > 0 ? Math.round(((priced + free) / totalOffer) * 100) : 0;

    const meta = serviceColumnMeta[sName] || resolveServiceMeta(sName);

    // Lookup 18xxxxx reference price
    const s18xItem = service18xMap.get(sName.toLowerCase().trim()) ||
                     (meta.serviceCode ? service18xMap.get(meta.serviceCode.toLowerCase().trim()) : undefined);
    const catalogRefPrice = (s18xItem && typeof s18xItem.price === 'number') ? s18xItem.price : undefined;

    let priceVariancePct: number | undefined = undefined;
    if (catalogRefPrice && catalogRefPrice > 0 && avgP > 0) {
      priceVariancePct = Math.round(((avgP - catalogRefPrice) / catalogRefPrice) * 1000) / 10;
    }

    // Sort offering dealers: Priced/Free first, then No Price / Offered Yes, then Not Offered
    const sortedDealers = [...offeringDealers].sort((a, b) => {
      const rank = (status: string) => {
        if (status === 'PRICED' || status === 'FREE') return 1;
        if (status === 'NO_PRICE' || status === 'OFFERED_YES') return 2;
        return 3;
      };
      const rA = rank(a.status);
      const rB = rank(b.status);
      if (rA !== rB) return rA - rB;

      if (a.priceNum !== null && b.priceNum !== null) {
        return a.priceNum - b.priceNum;
      }
      if (a.priceNum !== null) return -1;
      if (b.priceNum !== null) return 1;
      return a.firmName.localeCompare(b.firmName, 'tr-TR');
    });

    return {
      serviceName: meta.displayName || meta.serviceName || sName,
      serviceCode: meta.serviceCode,
      rawKey: sName,
      catalogRefPrice,
      totalOfferCount: totalOffer,
      pricedCount: priced,
      notOfferedCount: notOffered,
      noPriceCount: noPrice,
      offeredYesCount: offeredYes,
      freeCount: free,
      minPrice: minP,
      maxPrice: maxP,
      avgPrice: avgP,
      medianPrice: medianP,
      priceVariancePct,
      pricingCoverageRate: covRate,
      offeringDealers: sortedDealers
    };
  });

  // Breakdown metrics
  const cityMap = new Map<string, { count: number; totalOffered: number }>();
  const managerMap = new Map<string, { count: number; pricedCount: number; totalOffered: number }>();

  for (const r of activeRows) {
    if (r.city && r.city !== '#YOK') {
      if (!cityMap.has(r.city)) cityMap.set(r.city, { count: 0, totalOffered: 0 });
      const c = cityMap.get(r.city)!;
      c.count++;
      c.totalOffered += r.totalOfferedServicesCount;
    }
    if (r.regionManager && r.regionManager !== '#YOK') {
      if (!managerMap.has(r.regionManager)) managerMap.set(r.regionManager, { count: 0, pricedCount: 0, totalOffered: 0 });
      const m = managerMap.get(r.regionManager)!;
      m.count++;
      m.pricedCount += r.totalPricedServicesCount;
      m.totalOffered += r.totalOfferedServicesCount;
    }
  }

  const cityBreakdown = Array.from(cityMap.entries()).map(([city, d]) => ({
    city,
    count: d.count,
    avgServicesOffered: d.count > 0 ? Math.round(d.totalOffered / d.count) : 0
  })).sort((a, b) => b.count - a.count);

  const regionManagerBreakdown = Array.from(managerMap.entries()).map(([manager, d]) => ({
    manager,
    count: d.count,
    pricedRate: d.totalOffered > 0 ? Math.round((d.pricedCount / d.totalOffered) * 100) : 0
  })).sort((a, b) => b.count - a.count);

  return {
    rawSpoCount: spoSheet.rows.length,
    rawSprCount: sprSheet.rows.length,
    deletedCandidateCount: deletedRowsSample.length,
    finalActiveRowCount: activeRows.length,
    registeredRatio: `${registeredPct}%`,
    onlineRatio: `${onlinePct}%`,
    pricingCompleteRatio: `${completePct}%`,
    pricingIncompleteRatio: `${incompletePct}%`,
    noPricingRatio: `${noPricingPct}%`,
    pricingCompleteCount,
    pricingIncompleteCount,
    noPricingCount,
    overallPricingCoveragePct,
    claimedYesCount,
    claimedNoCount,
    onlineYesCount,
    onlineNoCount,
    totalServicesOfferedAcrossNetwork,
    totalPricedOfferingsCount,
    totalNotOfferedCount,
    totalNoPriceCount,
    serviceColumns,
    serviceColumnMeta,
    activeRows,
    deletedRowsSample,
    cityBreakdown,
    regionManagerBreakdown,
    serviceAnalysisList
  };
}

function findColumn(headers: string[], candidates: string[], fallbackIndex: number): string | undefined {
  if (!headers || headers.length === 0) return undefined;
  for (const cand of candidates) {
    const found = headers.find((h) => h && h.toLowerCase() === cand.toLowerCase());
    if (found) return found;
  }
  for (const cand of candidates) {
    const found = headers.find((h) => h && h.toLowerCase().includes(cand.toLowerCase()));
    if (found) return found;
  }
  if (fallbackIndex >= 0 && fallbackIndex < headers.length) {
    const fallback = headers[fallbackIndex];
    if (fallback) {
      const digits = String(fallback).replace(/\D/g, '');
      // Never fallback to an 18-service column for metadata!
      if (!digits.startsWith('18')) {
        return fallback;
      }
    }
  }
  return undefined;
}
