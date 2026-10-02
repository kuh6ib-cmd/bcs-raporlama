import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { BCSMatrixSummary, ExportOptions, ExportColumnOptions } from '../types';

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  columns: {
    customerId: true,
    crmCreateDate: true,
    regionManager: true,
    fieldResponsible: true,
    city: true,
    district: true,
    bcsFirmName: true,
    claimed: true,
    spoOnlineBooking: true
  },
  selectedCategories: [],
  includeMatrixSheet: true,
  includeServiceStatsSheet: true,
  includeUnpivotedSheet: true,
  includeDroppedSheet: true
};

export function exportCleanSPOResultExcel(params: {
  summary: BCSMatrixSummary;
  fileName?: string;
  sourceFileName?: string;
  options?: ExportOptions;
}): void {
  const { summary, fileName = 'My_BCS_Servis_Fiyat_Raporu.xlsx', options = DEFAULT_EXPORT_OPTIONS } = params;
  const cols = options.columns;

  const wb = XLSX.utils.book_new();

  // Filter service columns by selected categories if specified
  const serviceCols = (options.selectedCategories && options.selectedCategories.length > 0)
    ? summary.serviceColumns.filter((sCol) => {
        const cat = summary.serviceColumnMeta?.[sCol]?.category || 'Diğer Hizmetler';
        return options.selectedCategories!.includes(cat);
      })
    : summary.serviceColumns;

  // Metadata Columns Config
  const metaColsDef = [
    { id: 'customerId', label: 'CUSTOMERID', getVal: (r: any) => r.customerId, wch: 16 },
    { id: 'crmCreateDate', label: 'crm create date', getVal: (r: any) => r.crmCreateDate, wch: 16 },
    { id: 'regionManager', label: 'BÖLGE YÖNETİCİSİ', getVal: (r: any) => r.regionManager, wch: 22 },
    { id: 'fieldResponsible', label: 'SAHA', getVal: (r: any) => r.fieldResponsible, wch: 24 },
    { id: 'city', label: 'İL', getVal: (r: any) => r.city, wch: 16 },
    { id: 'district', label: 'İLÇE', getVal: (r: any) => r.district, wch: 18 },
    { id: 'bcsFirmName', label: 'BCS', getVal: (r: any) => r.bcsFirmName, wch: 34 },
    { id: 'claimed', label: 'claimed', getVal: (r: any) => r.claimed, wch: 12 },
    { id: 'spoOnlineBooking', label: 'SPO_ONLINEBOOKING', getVal: (r: any) => r.spoOnlineBooking, wch: 22 }
  ];

  const activeMetaCols = metaColsDef.filter((c) => cols[c.id as keyof ExportColumnOptions] !== false);

  // 1. Tab: Main Matrix
  if (options.includeMatrixSheet) {
    const sheetAoa: any[][] = [
      ['', '', '', 'Kayıt Olanların Oranı', summary.registeredRatio],
      ['', '', '', 'Online Olanların Oranı', summary.onlineRatio],
      ['', '', '', 'Fiyat Kuralı 100% Tam Olan Servis Oranı', summary.pricingCompleteRatio],
      ['', '', '', 'Fiyat Kuralı 100% Olmayan Servis Oranı', summary.pricingIncompleteRatio],
      ['', '', '', 'Fiyat Kuralı Hiç Girilmemiş Servis Oranı', summary.noPricingRatio],
      ['', '', '', 'Ağ Geneli Fiyatlandırma Kapsama Oranı', `%${summary.overallPricingCoveragePct}`],
      [],
      []
    ];

    const serviceHeaderLabels = serviceCols.map((col) => {
      const meta = summary.serviceColumnMeta?.[col];
      if (meta && meta.displayName) {
        return meta.serviceCode && meta.serviceCode !== meta.displayName
          ? `${meta.displayName} (${meta.serviceCode})`
          : meta.displayName;
      }
      return col;
    });

    const headerRow = [
      ...activeMetaCols.map((c) => c.label),
      ...serviceHeaderLabels
    ];
    sheetAoa.push(headerRow);

    summary.activeRows.forEach((r) => {
      const row = [
        ...activeMetaCols.map((c) => c.getVal(r)),
        ...serviceCols.map((col) => {
          const val = r.serviceValues[col];
          return val !== undefined && val !== null ? val : 'HAYIR';
        })
      ];
      sheetAoa.push(row);
    });

    const wsMain = XLSX.utils.aoa_to_sheet(sheetAoa);
    wsMain['!cols'] = [
      ...activeMetaCols.map((c) => ({ wch: c.wch })),
      ...serviceCols.map(() => ({ wch: 24 }))
    ];
    XLSX.utils.book_append_sheet(wb, wsMain, 'BCS_Matrix_Raporu');
  }

  // 2. Tab: Service-by-Service Pricing & Availability Analysis
  if (options.includeServiceStatsSheet) {
    const filteredStats = summary.serviceAnalysisList.filter((s) => 
      serviceCols.includes(s.serviceName) || serviceCols.includes(s.rawKey || '')
    );
    const statsToExport = filteredStats.length > 0 ? filteredStats : summary.serviceAnalysisList;

    const wsServiceStats = XLSX.utils.json_to_sheet(statsToExport.map((s) => ({
      'Hizmet / İşlem Adı': s.serviceName,
      'Hizmeti Veren Servis Sayısı': s.totalOfferCount,
      'Fiyatı Tanımlı Olanlar': s.pricedCount,
      'Ücretsiz Verenler (0 TL)': s.freeCount,
      'Fiyat Girilmemiş (NOPRICE)': s.noPriceCount,
      'Hizmeti Vermeyen Servisler (HAYIR)': s.notOfferedCount,
      'Min Fiyat (TL)': s.minPrice > 0 ? s.minPrice : '-',
      'Max Fiyat (TL)': s.maxPrice > 0 ? s.maxPrice : '-',
      'Ortalama Fiyat (TL)': s.avgPrice > 0 ? s.avgPrice : '-',
      'Fiyatlandırma Kapsama Oranı': `%${s.pricingCoverageRate}`
    })));
    wsServiceStats['!cols'] = [
      { wch: 45 }, { wch: 26 }, { wch: 22 }, { wch: 22 }, { wch: 26 }, { wch: 32 }, { wch: 16 }, { wch: 16 }, { wch: 20 }, { wch: 26 }
    ];
    XLSX.utils.book_append_sheet(wb, wsServiceStats, 'Hizmet_Bazli_Fiyat_Analizi');
  }

  // 3. Tab: Unpivoted Detailed Price Catalog
  if (options.includeUnpivotedSheet) {
    const unpivotedRows: any[] = [];
    summary.activeRows.forEach((r) => {
      serviceCols.forEach((sCol) => {
        const statusObj = r.serviceStatuses[sCol] || { status: 'NOT_OFFERED', displayValue: 'HAYIR', priceNumeric: null };
        const rowObj: Record<string, any> = {};
        activeMetaCols.forEach((c) => {
          rowObj[c.label] = c.getVal(r);
        });
        rowObj['Hizmet Adı'] = sCol;
        rowObj['Hizmet Durumu'] = statusObj.status === 'PRICED' ? 'Fiyatlı Hizmet' :
                                   statusObj.status === 'FREE' ? 'Ücretsiz / Dahil (0 TL)' :
                                   statusObj.status === 'NO_PRICE' ? 'Fiyat Girilmemiş (NOPRICE)' :
                                   statusObj.status === 'OFFERED_YES' ? 'Veriliyor (Paket / Randevulu)' :
                                   'Hizmet Vermiyor (HAYIR)';
        rowObj['Fiyat (TL)'] = statusObj.priceNumeric !== null ? statusObj.priceNumeric : '-';
        rowObj['Matris Değeri'] = statusObj.displayValue;
        unpivotedRows.push(rowObj);
      });
    });

    const wsUnpivoted = XLSX.utils.json_to_sheet(unpivotedRows);
    XLSX.utils.book_append_sheet(wb, wsUnpivoted, 'Servis_Hizmet_Fiyat_Detayi');
  }

  // 4. Tab: Deleted Candidate Rows
  if (options.includeDroppedSheet) {
    const droppedRows = summary.deletedRowsSample.map((d) => ({
      'CUSTOMERID': d.customerId,
      'Çıkarılma Sebebi': d.reason,
      'CLAIMED': d.rowData['CLAIMED'] || 'HAYIR',
      'DELETECANDIDATE': 'EVET'
    }));
    const wsDropped = XLSX.utils.json_to_sheet(droppedRows.length > 0 ? droppedRows : [{ 'Bilgi': 'Silme adayı olan kayıt bulunamadı.' }]);
    wsDropped['!cols'] = [{ wch: 20 }, { wch: 45 }, { wch: 16 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsDropped, 'Cikarilan_Silme_Adaylari');
  }

  // Fallback if no sheets selected
  if (wb.SheetNames.length === 0) {
    const wsEmpty = XLSX.utils.json_to_sheet([{ Bilgi: 'Seçili sekme bulunmamaktadır.' }]);
    XLSX.utils.book_append_sheet(wb, wsEmpty, 'Rapor');
  }

  // Export
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array', compression: true });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, fileName);
}
