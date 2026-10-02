export interface FilterRule {
  id: string;
  column: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'in_list' | 'not_in_list' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value: string;
  active: boolean;
}

export interface SPO_SPR_Config {
  spoSheetName: string;
  sprSheetName: string;
  spoCustomerIdCol: string;
  sprCustomerIdCol: string;
  sprClaimedCol: string;
  sprDeleteCol: string;
  spoRequiredCols: string[];
}

export interface Service18xItem {
  customerId?: string;
  serviceCode: string;
  serviceName: string;
  serviceCategory?: string;
  laborHours?: number;
  price: number | string;
}

export interface BCSServiceMasterItem {
  dissap: string;                  // Column A: Dissap (matches CUSTOMERID)
  crmCreateDate?: string;          // Column D: crm create date
  firmName: string;                // Column E: FİRMA (TABELA) / BCS
  district: string;                // Column J: İLÇE
  city: string;                    // Column K: İL
  regionManager: string;           // Column M: BÖLGE YÖNETİCİSİ
  fieldResponsible: string;        // Column N: SAHA
  customerRelationsResp?: string;  // Column P: MÜŞTERİ İLİŞKİLERİ SORUMLUSU
  rawRow?: Record<string, any>;
}

export interface ServicePriceStatus {
  status: 'PRICED' | 'NOT_OFFERED' | 'NO_PRICE' | 'OFFERED_YES' | 'FREE';
  displayValue: string;
  priceNumeric: number | null;
}

export interface BCSMatrixRow {
  _id: string;
  customerId: string;              // CUSTOMERID
  crmCreateDate: string;           // crm create date
  regionManager: string;           // BÖLGE YÖNETİCİSİ
  fieldResponsible: string;        // SAHA
  city: string;                    // İL
  district: string;                // İLÇE
  bcsFirmName: string;             // BCS / FİRMA (TABELA)
  claimed: string;                 // claimed (EVET / HAYIR)
  spoOnlineBooking: string;        // SPO_ONLINEBOOKING (EVET / HAYIR)

  // Service Values
  serviceValues: Record<string, string | number>;
  serviceStatuses: Record<string, ServicePriceStatus>;

  // Price Aggregates for this Service
  totalOfferedServicesCount: number;
  totalPricedServicesCount: number;
  totalNotOfferedCount: number;
  totalNoPriceCount: number;
  pricingCoveragePct: number;
  pricingStatus: 'COMPLETE' | 'INCOMPLETE' | 'NO_PRICING';
  averagePrice: number;
  minPrice: number | null;
  maxPrice: number | null;

  [key: string]: any;
}

export interface SheetData {
  name: string;
  headers: string[];
  rows: Record<string, any>[];
  totalRawRows: number;
}

export interface WorkbookData {
  fileName: string;
  fileSize: number;
  uploadDate: string;
  sheets: Record<string, SheetData>;
  sheetNames: string[];
}

export interface ServiceColumnMeta {
  rawKey: string;                  // Original column header in Excel e.g. "18001"
  serviceCode: string;             // Service code e.g. "18001"
  serviceName: string;             // Service Name e.g. "Periyodik Bakım"
  displayName: string;             // Display Name e.g. "Periyodik Bakım"
  category?: string;
}

export interface ServiceAnalysisItem {
  serviceName: string;
  serviceCode?: string;
  rawKey?: string;
  catalogRefPrice?: number;        // Standart 18xxxxx Tavsiye Edilen Liste Fiyatı
  totalOfferCount: number;         // Count of dealers offering this service
  pricedCount: number;             // Count with numerical price > 0
  notOfferedCount: number;         // Count with HAYIR
  noPriceCount: number;            // Count with NOPRICE
  offeredYesCount: number;         // Count with EVET
  freeCount: number;               // Count with 0 TL
  minPrice: number;                // En düşük ücretli fiyat (> 0)
  maxPrice: number;                // En yüksek ücretli fiyat (> 0)
  avgPrice: number;                // Ücretli fiyatların aritmetik ortalaması
  medianPrice?: number;            // Medyan fiyat
  priceVariancePct?: number;       // Katalog fiyatına göre % sapma
  pricingCoverageRate: number;     // % of offerings with price
  offeringDealers: { firmName: string; city: string; manager: string; priceText: string; priceNum: number | null; status: string }[];
}

export interface ExportColumnOptions {
  customerId: boolean;
  crmCreateDate: boolean;
  regionManager: boolean;
  fieldResponsible: boolean;
  city: boolean;
  district: boolean;
  bcsFirmName: boolean;
  claimed: boolean;
  spoOnlineBooking: boolean;
}

export interface ExportOptions {
  columns: ExportColumnOptions;
  selectedCategories?: string[];
  includeMatrixSheet: boolean;
  includeServiceStatsSheet: boolean;
  includeUnpivotedSheet: boolean;
  includeDroppedSheet: boolean;
}

export interface BCSMatrixSummary {
  rawSpoCount: number;
  rawSprCount: number;
  deletedCandidateCount: number;
  finalActiveRowCount: number;
  
  // KPI percentages
  registeredRatio: string;
  onlineRatio: string;
  pricingCompleteRatio: string;
  pricingIncompleteRatio: string;
  noPricingRatio: string;

  pricingCompleteCount: number;
  pricingIncompleteCount: number;
  noPricingCount: number;
  overallPricingCoveragePct: number;

  claimedYesCount: number;
  claimedNoCount: number;
  onlineYesCount: number;
  onlineNoCount: number;

  totalServicesOfferedAcrossNetwork: number;
  totalPricedOfferingsCount: number;
  totalNotOfferedCount: number;
  totalNoPriceCount: number;

  serviceColumns: string[];
  serviceColumnMeta?: Record<string, ServiceColumnMeta>;
  activeRows: BCSMatrixRow[];
  deletedRowsSample: { customerId: string; reason: string; rowData: Record<string, any> }[];
  cityBreakdown: { city: string; count: number; avgServicesOffered: number }[];
  regionManagerBreakdown: { manager: string; count: number; pricedRate: number }[];
  serviceAnalysisList: ServiceAnalysisItem[];
}
