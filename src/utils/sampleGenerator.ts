import * as XLSX from "xlsx";
import { WorkbookData, BCSServiceMasterItem, Service18xItem } from "../types";
import { DEFAULT_BCS_MASTER_SERVICES, STANDARD_BCS_SERVICES } from "../data/defaultCatalog";

export function generateSampleSPOSPRWorkbook(): { 
  workbook: XLSX.WorkBook; 
  data: WorkbookData; 
  blob: Blob;
  sample18xServices: Service18xItem[];
  sample18xWorkbookBlob: Blob;
  sampleBcsMasterList: BCSServiceMasterItem[];
  sampleBcsMasterBlob: Blob;
} {
  const sampleDataMatrix = DEFAULT_BCS_MASTER_SERVICES.map((m, idx) => {
    const services: Record<string, string | number> = {};
    STANDARD_BCS_SERVICES.forEach((svc, sIdx) => {
      const seed = (idx * 7 + sIdx * 13) % 100;
      if (sIdx === 0) {
        // Genel Randevu
        services[svc] = "EVET";
      } else if (sIdx === 13) {
        // Genel Araç Kontrolü (15 Nokta Check-up): Bazı servislerde ücretsiz check-up veya 500-800 TL
        if (seed < 40) {
          services[svc] = 0; // Ücretsiz check-up
        } else if (seed < 70) {
          services[svc] = 650 + ((idx % 3) * 50);
        } else if (seed < 85) {
          services[svc] = "NOPRICE";
        } else {
          services[svc] = "HAYIR";
        }
      } else if (seed < 60) {
        // Gerçekçi Bosch Car Service Fiyat Dağılımı (TL)
        const basePrices: Record<number, number> = {
          1: 3500, // Periyodik Bakım
          2: 1800, // Motor Yağ & Filtre Değişimi
          3: 1200, // Fren Sistemi Kontrolü
          4: 2800, // Fren Balata & Disk Değişimi
          5: 1200, // Rot Ayarı
          6: 800,  // Balans & Lastik Değişimi
          7: 2500, // Klima Kontrolü ve Bakımı
          8: 2000, // Klima Gaz Dolumu & Temizliği
          9: 600,  // Aydınlatma & Far Ayarı
          10: 450, // Akü Kontrolü & Testi
          11: 3000, // Şarj Dinamosu & Marş Motoru
          12: 1500, // Araç Muayenesi Öncesi Mevzuata Uygunluk
          13: 750,  // Genel Araç Kontrolü
          14: 4500, // Elektrikli & Hibrit Araç Kontrolü
          15: 6000, // ADAS Kalibrasyonu
          16: 2400, // Şanzıman Yağ Değişimi
          17: 5500, // Debriyaj Seti & Baskı Balata
          18: 1000, // Elektronik Arıza Tespiti
          19: 800,  // Güvenlik Sistemleri Kontrolü
          20: 4500, // Triger Kayışı Değişimi
          21: 1800, // V Kayışı & Gergi Rulmanı
          22: 3800, // Amortisör & Süspansiyon Bakımı
          23: 1600, // Ön Takım, Salıncak & Z-Rot
          24: 4000, // Egzoz & DPF Temizliği
          25: 3500, // Enjektör & Yakıt Sistemi
          26: 950,  // Buji & Ateşleme Sistemi
          27: 400   // Silecek & Cam Yıkama Sistemi
        };
        const variation = ((idx % 7) - 3) * 50; // -150 TL ile +150 TL arası doğal bayi varyasyonu
        const p = (basePrices[sIdx] || 1500) + variation;
        services[svc] = Math.max(300, p);
      } else if (seed < 80) {
        services[svc] = "NOPRICE";
      } else {
        services[svc] = "HAYIR";
      }
    });

    const isDeleteCandidate = idx === DEFAULT_BCS_MASTER_SERVICES.length - 1 ? "EVET" : "HAYIR";

    return {
      id: m.dissap,
      date: m.crmCreateDate || "15.08.2025",
      manager: m.regionManager,
      field: m.fieldResponsible,
      city: m.city,
      district: m.district,
      bcs: m.firmName,
      claimed: idx % 7 === 0 ? "HAYIR" : "EVET",
      online: idx % 6 === 0 ? "HAYIR" : "EVET",
      deleteCandidate: isDeleteCandidate,
      services
    };
  });

  // 1. Build SPO rows (Metadata & Online Booking)
  const spoRows = sampleDataMatrix.map((item) => ({
    "Col_A": "SPO-SYS",
    "Col_B": "B-VAL",
    "CUSTOMERID": item.id,
    "FİRMA (TABELA)": item.bcs,
    "crm create date": item.date,
    "İL": item.city,
    "İLÇE": item.district,
    "BÖLGE YÖNETİCİSİ": item.manager,
    "SAHA": item.field,
    "SPO_ONLINEBOOKING": item.online
  }));

  // 2. Build SPR rows:
  // Columns A-J (indices 0 to 9) contain SPR metadata (CUSTOMERID, CLAIMED, DELETECANDIDATE)
  // Columns K to AA (indices 10 to 26) contain the services and dealer pricing!
  const sprRows = sampleDataMatrix.map((item) => {
    // Select the standard services for columns K through AA (17 services)
    const kToAaServices: Record<string, any> = {};
    STANDARD_BCS_SERVICES.slice(1, 18).forEach((svcName) => {
      kToAaServices[svcName] = item.services[svcName] !== undefined ? item.services[svcName] : 'HAYIR';
    });

    return {
      "Col_A": "SPR-SEQ",
      "Col_B": "B-VAL",
      "CUSTOMERID": item.id,
      "Dissap": item.id,
      "Col_E": "E-VAL",
      "Col_F": "F-VAL",
      "Col_G": "G-VAL",
      "Col_H": "H-VAL",
      "CLAIMED": item.claimed,
      "DELETECANDIDATE": item.deleteCandidate,
      ...kToAaServices
    };
  });

  // 3. Build BCS Master List (Dissap)
  const sampleBcsMasterList = DEFAULT_BCS_MASTER_SERVICES;

  // 4. Sample 18x service list
  const sample18xServices: Service18xItem[] = STANDARD_BCS_SERVICES.map((name, idx) => ({
    serviceCode: "180" + String(idx + 1001),
    serviceName: name,
    serviceCategory: "Bosch Servis Hizmeti",
    laborHours: 1.0,
    price: 1500
  }));

  // Workbooks Generation
  const wb = XLSX.utils.book_new();
  const wsSPO = XLSX.utils.json_to_sheet(spoRows);
  const wsSPR = XLSX.utils.json_to_sheet(sprRows);
  XLSX.utils.book_append_sheet(wb, wsSPO, "SPO");
  XLSX.utils.book_append_sheet(wb, wsSPR, "SPR");
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array", compression: true });
  const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

  // 18x Blob
  const wb18x = XLSX.utils.book_new();
  const ws18x = XLSX.utils.json_to_sheet(sample18xServices.map((s) => ({
    "Hizmet Kodu (18xxxxx)": s.serviceCode,
    "Hizmet Tanımı": s.serviceName,
    "Birim Fiyat (TL)": s.price
  })));
  XLSX.utils.book_append_sheet(wb18x, ws18x, "Hizmetler_18xxxxx");
  const wb18xOut = XLSX.write(wb18x, { bookType: "xlsx", type: "array", compression: true });
  const sample18xWorkbookBlob = new Blob([wb18xOut], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

  // BCS Master Blob
  const wbBcsMaster = XLSX.utils.book_new();
  const wsBcsMaster = XLSX.utils.json_to_sheet(sampleBcsMasterList.map((m) => ({
    "Dissap": m.dissap,
    "Cari Kodu": "CAR-" + m.dissap,
    "Şube Adı": m.firmName,
    "crm create date": m.crmCreateDate || "1.08.2025",
    "FİRMA (TABELA)": m.firmName,
    "İlçe": m.district,
    "İl": m.city,
    "Bölge Yöneticisi": m.regionManager,
    "Saha Sorumlusu": m.fieldResponsible
  })));
  XLSX.utils.book_append_sheet(wbBcsMaster, wsBcsMaster, "BCS_Servis_Listesi");
  const wbBcsMasterOut = XLSX.write(wbBcsMaster, { bookType: "xlsx", type: "array", compression: true });
  const sampleBcsMasterBlob = new Blob([wbBcsMasterOut], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

  const data: WorkbookData = {
    fileName: "My_BCS_SPO_SPR_Raporu.xlsx",
    fileSize: blob.size,
    uploadDate: new Date().toISOString(),
    sheets: {
      "SPO": {
        name: "SPO",
        headers: Object.keys(spoRows[0]),
        rows: spoRows,
        totalRawRows: spoRows.length
      },
      "SPR": {
        name: "SPR",
        headers: Object.keys(sprRows[0]),
        rows: sprRows,
        totalRawRows: sprRows.length
      }
    },
    sheetNames: ["SPO", "SPR"]
  };

  return {
    workbook: wb,
    data,
    blob,
    sample18xServices,
    sample18xWorkbookBlob,
    sampleBcsMasterList,
    sampleBcsMasterBlob
  };
}
