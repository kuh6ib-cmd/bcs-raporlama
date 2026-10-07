import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { BCSMatrixSummary, ExportOptions, ExportColumnOptions } from '../types';
import { parsePriceValue } from './dataEngine';

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

// Helper to apply executive styles, borders, alignments, fills and number formats to worksheet cells
function styleWorksheet(
  ws: XLSX.WorkSheet,
  styles: {
    metaColsCount?: number;
    isMatrixSheet?: boolean;
    isServiceStatsSheet?: boolean;
    isUnpivotedSheet?: boolean;
    isDroppedSheet?: boolean;
  }
) {
  if (!ws || !ws['!ref']) return;

  // Always enable visible gridlines in Excel viewers
  ws['!sheetViews'] = [{ showGridLines: true }];

  const range = XLSX.utils.decode_range(ws['!ref']);

  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      let cell = ws[cellAddress];

      if (!cell) {
        cell = { t: 's', v: '' };
        ws[cellAddress] = cell;
      }

      if (!cell.s) cell.s = {};

      // Light slate border for executive clean look
      cell.s.border = {
        top: { style: 'thin', color: { rgb: 'E2E8F0' } },
        bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
        left: { style: 'thin', color: { rgb: 'E2E8F0' } },
        right: { style: 'thin', color: { rgb: 'E2E8F0' } }
      };

      cell.s.font = { name: 'Calibri', sz: 10, color: { rgb: '1E293B' } };

      // Matrix Sheet Specific Styling
      if (styles.isMatrixSheet) {
        // KPI Summary rows (Rows 0 to 5)
        if (R <= 5 && C >= 3 && C <= 4) {
          cell.s.font = { name: 'Calibri', sz: 10, bold: true };
          cell.s.alignment = { vertical: 'center', horizontal: C === 3 ? 'right' : 'center' };

          if (R === 0 || R === 1) {
            cell.s.fill = { fgColor: { rgb: 'F1F5F9' } }; // Light Slate
            cell.s.font.color = { rgb: '1E293B' };
          } else if (R === 2) {
            cell.s.fill = { fgColor: { rgb: 'DCFCE7' } }; // Soft Emerald Green
            cell.s.font.color = { rgb: '14532D' };
          } else if (R === 3) {
            cell.s.fill = { fgColor: { rgb: 'FEF3C7' } }; // Soft Amber Yellow
            cell.s.font.color = { rgb: '78350F' };
          } else if (R === 4) {
            cell.s.fill = { fgColor: { rgb: 'FFE4E6' } }; // Soft Rose Red
            cell.s.font.color = { rgb: '9F1239' };
          } else if (R === 5) {
            cell.s.fill = { fgColor: { rgb: 'DBEAFE' } }; // Soft Royal Blue
            cell.s.font.color = { rgb: '1E40AF' };
          }
          continue;
        }

        // Table Header Row (Row 8, 0-indexed)
        if (R === 8) {
          const isMeta = C < (styles.metaColsCount || 9);
          cell.s.fill = { fgColor: { rgb: isMeta ? '0F172A' : '1E293B' } }; // Dark Navy / Bosch Slate
          cell.s.font = { name: 'Calibri', sz: 11, bold: true, color: { rgb: isMeta ? 'FFFFFF' : 'FDE047' } }; // White / Gold
          cell.s.alignment = { vertical: 'center', horizontal: 'center', wrapText: true };
          continue;
        }

        // Data Rows (Row >= 9)
        if (R >= 9) {
          const isMeta = C < (styles.metaColsCount || 9);
          const isEvenRow = R % 2 === 0;

          if (isMeta) {
            cell.s.alignment = { vertical: 'center', horizontal: 'center' };
            const strVal = String(cell.v || '').trim().toUpperCase();

            if (strVal === 'EVET') {
              cell.s.fill = { fgColor: { rgb: 'DCFCE7' } }; // Soft Green tag
              cell.s.font = { name: 'Calibri', sz: 10, bold: true, color: { rgb: '15803D' } };
            } else if (strVal === 'HAYIR') {
              cell.s.fill = { fgColor: { rgb: 'F3F4F6' } }; // Soft Gray
              cell.s.font = { name: 'Calibri', sz: 10, color: { rgb: '6B7280' } };
            } else {
              cell.s.fill = { fgColor: { rgb: isEvenRow ? 'F8FAFC' : 'FFFFFF' } };
            }
          } else {
            // Service Price Cells Color Coding
            const parsed = parsePriceValue(cell.v);
            cell.s.alignment = { vertical: 'center', horizontal: 'center' };

            if (parsed.status === 'PRICED') {
              cell.s.fill = { fgColor: { rgb: 'FEF3C7' } }; // Soft Gold/Amber fill
              cell.s.font = { name: 'Calibri', sz: 10, bold: true, color: { rgb: '78350F' } };
              if (parsed.priceNumeric !== null) {
                cell.t = 'n';
                cell.v = parsed.priceNumeric;
                cell.z = '#,##0 "TL"';
              }
            } else if (parsed.status === 'FREE') {
              cell.s.fill = { fgColor: { rgb: 'DCFCE7' } }; // Soft Emerald Green fill
              cell.s.font = { name: 'Calibri', sz: 10, bold: true, color: { rgb: '14532D' } };
              cell.t = 'n';
              cell.v = 0;
              cell.z = '0 "TL (Ücretsiz)"';
            } else if (parsed.status === 'NO_PRICE') {
              cell.s.fill = { fgColor: { rgb: 'F1F5F9' } }; // Light Slate Gray fill
              cell.s.font = { name: 'Calibri', sz: 10, color: { rgb: '475569' } };
            } else if (parsed.status === 'OFFERED_YES') {
              cell.s.fill = { fgColor: { rgb: 'DBEAFE' } }; // Soft Blue fill
              cell.s.font = { name: 'Calibri', sz: 10, bold: true, color: { rgb: '1E40AF' } };
            } else {
              // NOT_OFFERED (HAYIR)
              cell.s.fill = { fgColor: { rgb: 'FFE4E6' } }; // Soft Rose/Red fill
              cell.s.font = { name: 'Calibri', sz: 10, color: { rgb: '9F1239' } };
            }
          }
        }
      }

      // Service Stats Sheet Styling (Tab 2)
      if (styles.isServiceStatsSheet) {
        if (R === 0) {
          cell.s.fill = { fgColor: { rgb: '881337' } }; // Dark Rose Navy
          cell.s.font = { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } };
          cell.s.alignment = { vertical: 'center', horizontal: 'center', wrapText: true };
        } else {
          const isEven = R % 2 === 0;
          cell.s.fill = { fgColor: { rgb: isEven ? 'F8FAFC' : 'FFFFFF' } };

          if (C === 0) {
            cell.s.font = { name: 'Calibri', sz: 10, bold: true, color: { rgb: '0F172A' } };
            cell.s.alignment = { vertical: 'center', horizontal: 'left' };
          } else if (C >= 1 && C <= 5) {
            cell.s.alignment = { vertical: 'center', horizontal: 'center' };
            if (C === 1) cell.s.fill = { fgColor: { rgb: 'F0F9FF' } }; // Offer count
            if (C === 2) cell.s.fill = { fgColor: { rgb: 'FEF3C7' } }; // Priced count
            if (C === 3) cell.s.fill = { fgColor: { rgb: 'DCFCE7' } }; // Free count
            if (C === 4) cell.s.fill = { fgColor: { rgb: 'F1F5F9' } }; // No price count
            if (C === 5) cell.s.fill = { fgColor: { rgb: 'FFE4E6' } }; // Not offered count
          } else if (C >= 6 && C <= 8) {
            // Price columns
            cell.s.alignment = { vertical: 'center', horizontal: 'right' };
            if (typeof cell.v === 'number') {
              cell.t = 'n';
              cell.z = '#,##0 "TL"';
            }
          } else if (C === 9) {
            // Coverage rate percentage
            cell.s.alignment = { vertical: 'center', horizontal: 'center' };
            cell.s.font = { name: 'Calibri', sz: 10, bold: true };
            const numVal = parseFloat(String(cell.v).replace('%', ''));
            if (!isNaN(numVal)) {
              if (numVal >= 80) {
                cell.s.fill = { fgColor: { rgb: 'DCFCE7' } };
                cell.s.font.color = { rgb: '14532D' };
              } else if (numVal >= 40) {
                cell.s.fill = { fgColor: { rgb: 'FEF3C7' } };
                cell.s.font.color = { rgb: '78350F' };
              } else {
                cell.s.fill = { fgColor: { rgb: 'FFE4E6' } };
                cell.s.font.color = { rgb: '9F1239' };
              }
            }
          }
        }
      }

      // Unpivoted Sheet Styling (Tab 3)
      if (styles.isUnpivotedSheet) {
        if (R === 0) {
          cell.s.fill = { fgColor: { rgb: '0F172A' } };
          cell.s.font = { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } };
          cell.s.alignment = { vertical: 'center', horizontal: 'center' };
        } else {
          cell.s.alignment = { vertical: 'center', horizontal: 'left' };
          if (typeof cell.v === 'number') {
            cell.t = 'n';
            cell.z = '#,##0 "TL"';
            cell.s.alignment = { vertical: 'center', horizontal: 'right' };
          }
        }
      }

      // Dropped Sheet Styling (Tab 4)
      if (styles.isDroppedSheet) {
        if (R === 0) {
          cell.s.fill = { fgColor: { rgb: '991B1B' } };
          cell.s.font = { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } };
          cell.s.alignment = { vertical: 'center', horizontal: 'center' };
        } else {
          cell.s.fill = { fgColor: { rgb: R % 2 === 0 ? 'FFE4E6' : 'FFFFFF' } };
          cell.s.alignment = { vertical: 'center', horizontal: 'left' };
        }
      }
    }
  }

  // Row heights
  ws['!rows'] = ws['!rows'] || [];
  for (let R = range.s.r; R <= range.e.r; ++R) {
    if (R === 8 && styles.isMatrixSheet) {
      ws['!rows'][R] = { hpt: 30 }; // Tall header row
    } else if (R === 0 && !styles.isMatrixSheet) {
      ws['!rows'][R] = { hpt: 28 };
    } else {
      ws['!rows'][R] = { hpt: 20 };
    }
  }
}

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
    styleWorksheet(wsMain, { isMatrixSheet: true, metaColsCount: activeMetaCols.length });
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
    styleWorksheet(wsServiceStats, { isServiceStatsSheet: true });
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
    styleWorksheet(wsUnpivoted, { isUnpivotedSheet: true });
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
    styleWorksheet(wsDropped, { isDroppedSheet: true });
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
