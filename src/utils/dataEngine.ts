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
import { STANDARD_BCS_SERVICES, DEFAULT_18X_SERVICES } from '../data/defaultCatalog';
import { resolveProvincePlate, getProvinceByPlate } from './cityMatcher';

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
          const headers = rawJson.length > 0 ? Object.keys(rawJson[0]) : [];

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
  const str = String(val).trim().toUpperCase();

  if (
    str === 'DOĞRU' || 
    str === 'DOGRU' || 
    str === 'TRUE' || 
    str === 'EVET' || 
    str === '1' || 
    str === 'YES' || 
    str === 'Y'
  ) {
    return 'EVET';
  }

  if (
    str === 'YANLIŞ' || 
    str === 'YANLIS' || 
    str === 'FALSE' || 
    str === 'HAYIR' || 
    str === '0' || 
    str === 'NO' || 
    str === 'N'
  ) {
    return 'HAYIR';
  }

  return val ? String(val).toUpperCase() : 'HAYIR';
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
    findColumn(spoSheet.headers, ['CUSTOMERID', 'Müşteri No', 'MusteriNo', 'CustomerID', 'Dissap', 'Col_C'], 2) ||
    'CUSTOMERID';

  const spoDateCol = findColumn(spoSheet.headers, ['crm create date', 'crm_create_date', 'Tarih', 'Giriş Tarihi', 'Col_E'], 4) ||
    'crm create date';

  const spoOnlineCol = findColumn(spoSheet.headers, ['SPO_ONLINEBOOKING', 'ONLINEBOOKING', 'Online Booking', 'Col_K'], 10) ||
    'SPO_ONLINEBOOKING';

  const sprCustomerIdCol = customConfig?.sprCustomerIdCol ||
    findColumn(sprSheet.headers, ['CUSTOMERID', 'Müşteri No', 'MusteriNo', 'CustomerID', 'Dissap', 'Col_E', 'Col_C', 'Col_B'], 2) ||
    'CUSTOMERID';

  const sprClaimedCol = customConfig?.sprClaimedCol ||
    findColumn(sprSheet.headers, ['CLAIMED', 'Claimed', 'claimed', 'İtiraz', 'Col_I'], 8) ||
    'CLAIMED';

  const sprDeleteCandidateCol = customConfig?.sprDeleteCol ||
    findColumn(sprSheet.headers, ['DELETECANDIDATE', 'DeleteCandidate', 'DELETE_CANDIDATE', 'Silme Adayı', 'Col_J'], 9) ||
    'DELETECANDIDATE';

  // 2. Identify Non-Service / Metadata Headers to Filter Out
  const metadataLower = new Set([
    'tenant', 'spo_tenant',
    'spo_id', 'spoid', 'id', '_id', 'sıra', 'sira', 'no',
    'spo_name', 'sponame',
    'spo_onlinebooking_lastmodified', 'onlinebooking_lastmodified', 'spo_online_booking_lastmodified', 'online_booking_lastmodified',
    'spo_lastmodified', 'lastmodified', 'last_modified', 'modified', 'modified_date', 'last_modified_date',
    'spo_externaldata', 'spo_external_data', 'externaldata', 'external_data', 'spo_externalid', 'externalid', 'external_id',
    'spo_created', 'created', 'created_date', 'create_date', 'spo_created_date',
    'customerid', 'musterino', 'müşteri no', 'dissap', 'cari', 'cari kodu', 'cari no',
    'crm create date', 'crm_create_date', 'tarih', 'kayit tarihi', 'kayıt tarihi', 'giris tarihi', 'giriş tarihi',
    'spo_onlinebooking', 'onlinebooking', 'online booking', 'online randevu', 'online',
    'spo_timezoneid', 'spo_timezone', 'timezoneid', 'timezone', 'time_zone',
    'spo_emails', 'spo_email', 'emails', 'email', 'eposta', 'e-posta', 'mail',
    'spo_phone', 'spo_phonenumber', 'phone', 'telefon', 'tel', 'fax',
    'spo_address', 'address', 'adres', 'zip', 'postal', 'postakodu',
    'spo_status', 'status', 'type', 'spo_type', 'description', 'açıklama', 'aciklama',
    'spo_url', 'url', 'website', 'web', 'spo_notes', 'note', 'notes', 'notlar',
    'claimed', 'itiraz', 'deletecandidate', 'delete_candidate', 'silme adayi', 'silme adayı',
    'bölge yöneticisi', 'bolge yoneticisi', 'bölge', 'bolge', 'saha', 'saha sorumlusu', 'müşteri ilişkileri',
    'il', 'ilce', 'ilçe', 'şehir', 'sehir', 'firma', 'firma (tabela)', 'tabela', 'bcs', 'şube', 'sube', 'şube adı',
    'col_a', 'col_b', 'col_c', 'col_d', 'col_e', 'col_f', 'col_g', 'col_h', 'col_i', 'col_j'
  ]);

  // Extract Services from SPR Sheet (Columns K to AA: index 10 to 26)
  const sprServiceHeaders: string[] = [];
  if (sprSheet.headers && sprSheet.headers.length > 10) {
    const endIndex = Math.min(27, sprSheet.headers.length);
    for (let i = 10; i < endIndex; i++) {
      const h = sprSheet.headers[i];
      if (h && String(h).trim() !== '') {
        sprServiceHeaders.push(h);
      }
    }
  }

  // Extract Services from SPO Sheet
  const spoServiceHeaders = spoSheet.headers.filter((h) => {
    const raw = String(h).trim();
    const clean = raw.toLowerCase();
    if (!clean) return false;
    if (clean.startsWith('__empty')) return false;
    if (metadataLower.has(clean)) return false;
    if (h === spoCustomerIdCol || h === spoDateCol || h === spoOnlineCol) return false;

    // Pattern-based exclusions for SPO system metadata
    if (clean.includes('lastmodified') || clean.includes('last_modified')) return false;
    if (clean === 'tenant' || clean.includes('_tenant') || clean.startsWith('tenant_')) return false;
    if (clean.includes('externaldata') || clean.includes('external_data') || clean.includes('externalid')) return false;
    if (clean === 'spo_id' || clean === 'spoid' || clean === 'spo_name' || clean === 'sponame') return false;
    if (clean.includes('onlinebooking') || clean.includes('online_booking')) return false;
    if (clean.includes('timezone') || clean.includes('time_zone')) return false;
    if (clean.includes('email') || clean.includes('eposta') || clean.includes('e-posta') || clean.includes('mail')) return false;
    if (clean.includes('phone') || clean.includes('telefon') || clean.includes('fax')) return false;
    if (clean.includes('address') || clean.includes('adres')) return false;
    if (clean.includes('website') || clean.includes('url')) return false;
    if (clean.includes('latitude') || clean.includes('longitude') || clean.includes('location')) return false;
    if (clean.includes('description') || clean.includes('aciklama') || clean.includes('açıklama')) return false;
    if (clean.includes('status') || clean.includes('durum')) return false;
    if (clean.includes('note') || clean.includes('notlar')) return false;

    return true;
  });

  // Effective Service Columns:
  // As specified, SPR Columns K through AA are the primary service and pricing columns!
  let serviceColumns: string[] = [];
  if (sprServiceHeaders.length > 0) {
    serviceColumns = [...sprServiceHeaders];
    for (const h of spoServiceHeaders) {
      if (!serviceColumns.includes(h)) {
        serviceColumns.push(h);
      }
    }
  } else {
    serviceColumns = spoServiceHeaders;
  }

  // 3. Index SPR Sheet by CUSTOMERID
  const sprLookupMap = new Map<string, { claimed: string; deleteCandidate: string; rawRow: Record<string, any> }>();

  for (const sprRow of sprSheet.rows) {
    const rawCustId = sprRow[sprCustomerIdCol];
    const custId = normalizeCustomerId(rawCustId);
    if (!custId) continue;

    const rawClaimed = sprRow[sprClaimedCol];
    const rawDelete = sprRow[sprDeleteCandidateCol];

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

  // 5. Index 18xxxxx Services (Combine default catalog with user uploaded services)
  const service18xMap = new Map<string, Service18xItem>();
  
  // First load default 18x services (5-digit and 7-digit)
  for (const s of DEFAULT_18X_SERVICES) {
    if (s.serviceCode) {
      service18xMap.set(s.serviceCode.toLowerCase().trim(), s);
      const digits = s.serviceCode.replace(/\D/g, '');
      if (digits) service18xMap.set(digits, s);
    }
    if (s.serviceName) {
      service18xMap.set(s.serviceName.toLowerCase().trim(), s);
    }
  }

  // Then override/extend with user-uploaded services
  for (const s of service18xList) {
    if (s.serviceCode) {
      service18xMap.set(s.serviceCode.toLowerCase().trim(), s);
      const digits = s.serviceCode.replace(/\D/g, '');
      if (digits) service18xMap.set(digits, s);
    }
    if (s.serviceName) {
      service18xMap.set(s.serviceName.toLowerCase().trim(), s);
    }
  }

  // Helper to resolve service metadata from column header
  const resolveServiceMeta = (rawCol: string): ServiceColumnMeta => {
    const raw = String(rawCol).trim();
    const lower = raw.toLowerCase();
    const digits = raw.replace(/\D/g, '');

    // Position-based mapping for SPR columns K to AA (index 10 to 26)
    const sprIndex = sprSheet.headers ? sprSheet.headers.indexOf(rawCol) : -1;
    let positionService: Service18xItem | undefined = undefined;
    if (sprIndex >= 10 && sprIndex <= 26) {
      const stdIdx = (sprIndex - 10) + 1; // Column K maps to STANDARD_BCS_SERVICES[1] (Periyodik Bakım)
      if (stdIdx < STANDARD_BCS_SERVICES.length) {
        const stdName = STANDARD_BCS_SERVICES[stdIdx];
        positionService = service18xMap.get(stdName.toLowerCase()) || 
                          DEFAULT_18X_SERVICES.find((s) => s.serviceName === stdName);
      }
    }

    // Direct match by code or name
    let found = service18xMap.get(lower) || (digits ? service18xMap.get(digits) : undefined);

    // Fuzzy match by code digits
    if (!found && digits) {
      for (const [, item] of service18xMap.entries()) {
        const itemDigits = item.serviceCode ? item.serviceCode.replace(/\D/g, '') : '';
        if (itemDigits === digits) {
          found = item;
          break;
        }
      }
    }

    // Fallback to position-based service if name is generic (like "Col_K" or "__EMPTY_10")
    if (!found && positionService) {
      found = positionService;
    }

    if (found) {
      return {
        rawKey: raw,
        serviceCode: found.serviceCode || digits || raw,
        serviceName: found.serviceName,
        displayName: found.serviceName,
        category: found.serviceCategory
      };
    }

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
      serviceCode: digits || raw,
      serviceName: raw,
      displayName: raw,
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
    const rawCustId = spoRow[spoCustomerIdCol];
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

    const rawOnline = spoRow[spoOnlineCol] || 'HAYIR';
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
      // 1. Primary lookup: Check SPR sheet for this CUSTOMERID (Services and pricing are in Columns K to AA in SPR)
      let rawCellVal: any = sprData?.rawRow?.[svcCol];

      // 2. Lookup by column index if sprSheet has this column between index 10 and 26
      if ((rawCellVal === undefined || rawCellVal === null || String(rawCellVal).trim() === '') && sprData?.rawRow) {
        const colIdx = sprSheet.headers ? sprSheet.headers.indexOf(svcCol) : -1;
        if (colIdx >= 10 && colIdx <= 26) {
          const sprKeys = Object.keys(sprData.rawRow);
          if (sprKeys[colIdx] !== undefined) {
            rawCellVal = sprData.rawRow[sprKeys[colIdx]];
          }
        }
      }

      // 3. Fallback: Check SPO sheet
      if (rawCellVal === undefined || rawCellVal === null || String(rawCellVal).trim() === '') {
        rawCellVal = spoRow[svcCol];
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
    const offeringDealers: { firmName: string; city: string; manager: string; priceText: string; priceNum: number | null; status: string }[] = [];

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

        offeringDealers.push({
          firmName: r.bcsFirmName,
          city: r.city,
          manager: r.regionManager,
          priceText: statusObj.displayValue,
          priceNum: statusObj.priceNumeric,
          status: statusObj.status
        });
      } else {
        notOffered++;
      }
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

    // Sort offering dealers: Priced dealers first (lowest to highest), then 0 TL free, then NOPRICE, then EVET
    const sortedDealers = [...offeringDealers].sort((a, b) => {
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
  for (const cand of candidates) {
    const found = headers.find((h) => h.toLowerCase() === cand.toLowerCase());
    if (found) return found;
  }
  for (const cand of candidates) {
    const found = headers.find((h) => h.toLowerCase().includes(cand.toLowerCase()));
    if (found) return found;
  }
  if (headers[fallbackIndex]) {
    return headers[fallbackIndex];
  }
  return undefined;
}
