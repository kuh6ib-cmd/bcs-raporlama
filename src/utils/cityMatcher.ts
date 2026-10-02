// Smart Turkey Province and City Matcher
// Maps any raw city/district text (accents, typos, prefixes, suffixes) to standard 81 province plate number (1..81)

export interface ProvinceMeta {
  plate: number;
  name: string;
  displayName: string;
  aliases: string[];
}

export const TURKEY_PROVINCE_REGISTRY: ProvinceMeta[] = [
  { plate: 1, name: 'Adana', displayName: 'Adana', aliases: ['ADANA', 'SEYHAN', 'YÜREĞİR', 'ÇUKUROVA', 'CEYHAN', 'KOZAN'] },
  { plate: 2, name: 'Adıyaman', displayName: 'Adıyaman', aliases: ['ADIYAMAN', 'BESNİ', 'KAHTA'] },
  { plate: 3, name: 'Afyonkarahisar', displayName: 'Afyon', aliases: ['AFYON', 'AFYONKARAHISAR', 'AFYONKARAHİSAR', 'SANDIKLI', 'DİNAR', 'BOLVADİN'] },
  { plate: 4, name: 'Ağrı', displayName: 'Ağrı', aliases: ['AGRI', 'AĞRI', 'DOĞUBAYAZIT', 'PATNOS'] },
  { plate: 5, name: 'Amasya', displayName: 'Amasya', aliases: ['AMASYA', 'MERZİFON', 'SULUOVA'] },
  { plate: 6, name: 'Ankara', displayName: 'Ankara', aliases: ['ANKARA', 'ÇANKAYA', 'KEÇİÖREN', 'YENİMAHALLE', 'MAMAK', 'ETİMESGUT', 'SİNCAN', 'ALTINDAĞ', 'GÖLBAŞI', 'POLATLI', 'OSTİM', 'ŞAŞMAZ', 'İVEDİK'] },
  { plate: 7, name: 'Antalya', displayName: 'Antalya', aliases: ['ANTALYA', 'MURATPAŞA', 'KEPEZ', 'KONYAALTI', 'ALANYA', 'MANAVGAT', 'SERİK', 'DÖŞEMEALTI', 'KUMLUCA', 'KAŞ', 'KEMER'] },
  { plate: 8, name: 'Artvin', displayName: 'Artvin', aliases: ['ARTVIN', 'ARTVİN', 'HOPA', 'BORÇKA'] },
  { plate: 9, name: 'Aydın', displayName: 'Aydın', aliases: ['AYDIN', 'EFELER', 'KUŞADASI', 'SÖKE', 'NAZİLLİ', 'DİDİM', 'İNCİRLİOVA'] },
  { plate: 10, name: 'Balıkesir', displayName: 'Balıkesir', aliases: ['BALIKESIR', 'BALIKESİR', 'ALTIEYLÜL', 'KARESİ', 'BANDIRMA', 'EDREMİT', 'GÖNEN', 'AYVALIK', 'BURHANİYE'] },
  { plate: 11, name: 'Bilecik', displayName: 'Bilecik', aliases: ['BILECIK', 'BİLECİK', 'BOZÜYÜK'] },
  { plate: 12, name: 'Bingöl', displayName: 'Bingöl', aliases: ['BINGOL', 'BİNGÖL', 'GENÇ'] },
  { plate: 13, name: 'Bitlis', displayName: 'Bitlis', aliases: ['BITLIS', 'BİTLİS', 'TATVAN', 'AHLAT'] },
  { plate: 14, name: 'Bolu', displayName: 'Bolu', aliases: ['BOLU', 'GEREDE'] },
  { plate: 15, name: 'Burdur', displayName: 'Burdur', aliases: ['BURDUR', 'BUCAK'] },
  { plate: 16, name: 'Bursa', displayName: 'Bursa', aliases: ['BURSA', 'OSMANGAZİ', 'YILDIRIM', 'NİLÜFER', 'İNEGÖL', 'GEMLİK', 'MUDANYA', 'GÜRSU', 'MUSTAFAKEMALPAŞA'] },
  { plate: 17, name: 'Çanakkale', displayName: 'Çanakkale', aliases: ['CANAKKALE', 'ÇANAKKALE', 'BİGA', 'ÇAN', 'GELİBOLU'] },
  { plate: 18, name: 'Çankırı', displayName: 'Çankırı', aliases: ['CANKIRI', 'ÇANKIRI'] },
  { plate: 19, name: 'Çorum', displayName: 'Çorum', aliases: ['CORUM', 'ÇORUM', 'SUNGURLU', 'OSMANCIK'] },
  { plate: 20, name: 'Denizli', displayName: 'Denizli', aliases: ['DENIZLI', 'DENİZLİ', 'PAMUKKALE', 'MERKEZEFENDİ', 'ÇİVRİL', 'ACIPAYAM'] },
  { plate: 21, name: 'Diyarbakır', displayName: 'Diyarbakır', aliases: ['DIYARBAKIR', 'DİYARBAKIR', 'BAĞLAR', 'KAYAPINAR', 'YENİŞEHİR', 'SUR', 'BİSMİL', 'ERGANİ'] },
  { plate: 22, name: 'Edirne', displayName: 'Edirne', aliases: ['EDIRNE', 'EDİRNE', 'KEŞAN', 'UZUNKÖPRÜ'] },
  { plate: 23, name: 'Elazığ', displayName: 'Elazığ', aliases: ['ELAZIG', 'ELAZIĞ', 'KOVANCILAR'] },
  { plate: 24, name: 'Erzincan', displayName: 'Erzincan', aliases: ['ERZINCAN', 'ERZİNCAN'] },
  { plate: 25, name: 'Erzurum', displayName: 'Erzurum', aliases: ['ERZURUM', 'YAKUTİYE', 'PALANDÖKEN', 'AZİZİYE'] },
  { plate: 26, name: 'Eskişehir', displayName: 'Eskişehir', aliases: ['ESKISEHIR', 'ESKİŞEHİR', 'ODUNPAZARI', 'TEPEBAŞI', 'SİVRİHİSAR'] },
  { plate: 27, name: 'Gaziantep', displayName: 'Gaziantep', aliases: ['GAZIANTEP', 'GAZİANTEP', 'ANTEP', 'ŞAHİNBEY', 'ŞEHİTKAMİL', 'NİZİP'] },
  { plate: 28, name: 'Giresun', displayName: 'Giresun', aliases: ['GIRESUN', 'GİRESUN', 'BULANCAK'] },
  { plate: 29, name: 'Gümüşhane', displayName: 'Gümüşhane', aliases: ['GUMUSHANE', 'GÜMÜŞHANE', 'KELKİT'] },
  { plate: 30, name: 'Hakkari', displayName: 'Hakkari', aliases: ['HAKKARI', 'HAKKARİ', 'YÜKSEKOVA'] },
  { plate: 31, name: 'Hatay', displayName: 'Hatay', aliases: ['HATAY', 'ANTAKYA', 'İSKENDERUN', 'DEFNE', 'DÖRTYOL', 'SAMANDAĞ', 'KIRIKHAN', 'REYHANLI'] },
  { plate: 32, name: 'Isparta', displayName: 'Isparta', aliases: ['ISPARTA', 'YALVAÇ', 'EĞİRDİR'] },
  { plate: 33, name: 'Mersin', displayName: 'Mersin', aliases: ['MERSIN', 'MERSİN', 'İÇEL', 'ICEL', 'TARSUS', 'TOROSLAR', 'AKDENİZ', 'YENİŞEHİR', 'MEZİTLİ', 'ERDEMLİ', 'SİLİFKE'] },
  { plate: 34, name: 'İstanbul', displayName: 'İstanbul', aliases: ['ISTANBUL', 'İSTANBUL', 'İST', 'IST', 'KADIKÖY', 'ÜMRANİYE', 'BEŞİKTAŞ', 'ŞİŞLİ', 'BAĞCILAR', 'ESENYURT', 'KÜÇÜKÇEKMECE', 'PENDİK', 'TUZLA', 'ÜSKÜDAR', 'MALTEPE', 'KARTAL', 'BEYOĞLU', 'BAKIRKÖY', 'FATİH', 'BAŞAKŞEHİR', 'BEYLİKDÜZÜ', 'SARIYER', 'AVCILAR', 'ZEYTİNBURNU', 'SULTANGAZİ', 'GÜNGÖREN', 'ARNAVUTKÖY', 'SANCAKTEPE', 'ÇEKMEKÖY', 'EYÜPSULTAN', 'EYÜP', 'SULTANBEYLİ', 'SİLİVRİ', 'BÜYÜKÇEKMECE', 'ÇATALCA', 'ŞİLE', 'ADALAR', 'KAĞITHANE', 'KAGITHANE', 'MASLAK', 'İKİTELLİ', 'IKITELLI'] },
  { plate: 35, name: 'İzmir', displayName: 'İzmir', aliases: ['IZMIR', 'İZMİR', 'KONAK', 'BORNOVA', 'BUCA', 'KARŞIYAKA', 'ÇİĞLİ', 'TORBALI', 'MENEMEN', 'GAZİEMİR', 'BAYRAKLI', 'ALİAĞA', 'BERGAMA', 'ÖDEMİŞ', 'URLA', 'ÇEŞME', 'TİRE', 'SEFERİHİSAR', 'BALÇOVA', 'NARLIDERE'] },
  { plate: 36, name: 'Kars', displayName: 'Kars', aliases: ['KARS', 'SARIKAMIŞ'] },
  { plate: 37, name: 'Kastamonu', displayName: 'Kastamonu', aliases: ['KASTAMONU', 'TOSYA'] },
  { plate: 38, name: 'Kayseri', displayName: 'Kayseri', aliases: ['KAYSERI', 'KAYSERİ', 'MELİKGAZİ', 'KOCASİNAN', 'TALAS', 'DEVELİ'] },
  { plate: 39, name: 'Kırklareli', displayName: 'Kırklareli', aliases: ['KIRKLARELI', 'KIRKLARELİ', 'LÜLEBURGAZ', 'BABAESKİ'] },
  { plate: 40, name: 'Kırşehir', displayName: 'Kırşehir', aliases: ['KIRSEHIR', 'KIRŞEHİR', 'KAMAN'] },
  { plate: 41, name: 'Kocaeli', displayName: 'Kocaeli', aliases: ['KOCAELI', 'KOCAELİ', 'İZMİT', 'IZMIT', 'GEBZE', 'DARICA', 'KÖRFEZ', 'GÖLCÜK', 'ÇAYIROVA', 'KARTEPE', 'DERİNCE', 'BAŞİSKELE', 'KANDIRA', 'DİLOVASI'] },
  { plate: 42, name: 'Konya', displayName: 'Konya', aliases: ['KONYA', 'SELÇUKLU', 'MERAM', 'KARATAY', 'EREĞLİ', 'AKŞEHİR', 'BEYŞEHİR', 'CİHANBEYLİ', 'ÇUMRA', 'SEYDİŞEHİR'] },
  { plate: 43, name: 'Kütahya', displayName: 'Kütahya', aliases: ['KUTAHYA', 'KÜTAHYA', 'TAVŞANLI', 'SİMAV'] },
  { plate: 44, name: 'Malatya', displayName: 'Malatya', aliases: ['MALATYA', 'BATTALGAZİ', 'YEŞİLYURT', 'DOĞANŞEHİR'] },
  { plate: 45, name: 'Manisa', displayName: 'Manisa', aliases: ['MANISA', 'MANİSA', 'YUNUSEMRE', 'ŞEHZADELER', 'AKHİSAR', 'TURGUTLU', 'SALİHLİ', 'SOMA', 'ALAŞEHİR'] },
  { plate: 46, name: 'Kahramanmaraş', displayName: 'K. Maraş', aliases: ['KAHRAMANMARAS', 'KAHRAMANMARAŞ', 'K.MARAŞ', 'K.MARAS', 'KMARAS', 'MARAŞ', 'MARAS', 'ONİKİŞUBAT', 'DULKADİROĞLU', 'ELBİSTAN', 'AFŞİN', 'TÜRKOĞLU'] },
  { plate: 47, name: 'Mardin', displayName: 'Mardin', aliases: ['MARDIN', 'MARDİN', 'ARTUKLU', 'KIZILTEPE', 'MİDYAT', 'NUSAYBİN'] },
  { plate: 48, name: 'Muğla', displayName: 'Muğla', aliases: ['MUGLA', 'MUĞLA', 'BODRUM', 'FETHİYE', 'MARMARİS', 'MİLAS', 'MENTEŞE', 'ORTACA', 'YATAĞAN', 'DATÇA'] },
  { plate: 49, name: 'Muş', displayName: 'Muş', aliases: ['MUS', 'MUŞ', 'BULANIK', 'MALAZGİRT'] },
  { plate: 50, name: 'Nevşehir', displayName: 'Nevşehir', aliases: ['NEVSEHIR', 'NEVŞEHİR', 'ÜRGÜP', 'AVANOS', 'KAPADOKYA'] },
  { plate: 51, name: 'Niğde', displayName: 'Niğde', aliases: ['NIGDE', 'NİĞDE', 'BOR'] },
  { plate: 52, name: 'Ordu', displayName: 'Ordu', aliases: ['ORDU', 'ALTINORDU', 'ÜNYE', 'FATSA'] },
  { plate: 53, name: 'Rize', displayName: 'Rize', aliases: ['RIZE', 'RİZE', 'ÇAYELİ', 'ARDEŞEN'] },
  { plate: 54, name: 'Sakarya', displayName: 'Sakarya', aliases: ['SAKARYA', 'ADAPAZARI', 'SERDİVAN', 'AKYAZI', 'ERENLER', 'HENDEK', 'KARASU', 'GEYVE', 'ARİFİYE'] },
  { plate: 55, name: 'Samsun', displayName: 'Samsun', aliases: ['SAMSUN', 'İLKADIM', 'ATAKUM', 'CANİK', 'BAFRA', 'ÇARŞAMBA', 'TEKKEKÖY'] },
  { plate: 56, name: 'Siirt', displayName: 'Siirt', aliases: ['SIIRT', 'SİİRT', 'KURTALAN'] },
  { plate: 57, name: 'Sinop', displayName: 'Sinop', aliases: ['SINOP', 'SİNOP', 'BOYABAT', 'GERZE'] },
  { plate: 58, name: 'Sivas', displayName: 'Sivas', aliases: ['SIVAS', 'SİVAS', 'ŞARKIŞLA', 'YILDIZELİ'] },
  { plate: 59, name: 'Tekirdağ', displayName: 'Tekirdağ', aliases: ['TEKIRDAG', 'TEKİRDAĞ', 'SÜLEYMANPAŞA', 'ÇORLU', 'ÇERKEZKÖY', 'KAPAKLI', 'ERGENE', 'MALKARA'] },
  { plate: 60, name: 'Tokat', displayName: 'Tokat', aliases: ['TOKAT', 'ERBAA', 'TURHAL', 'NİKSAR', 'ZİLE'] },
  { plate: 61, name: 'Trabzon', displayName: 'Trabzon', aliases: ['TRABZON', 'ORTAHİSAR', 'AKÇAABAT', 'ARASİN', 'YOMRA', 'VAKFIKEBİR', 'OF'] },
  { plate: 62, name: 'Tunceli', displayName: 'Tunceli', aliases: ['TUNCELI', 'TUNCELİ'] },
  { plate: 63, name: 'Şanlıurfa', displayName: 'Şanlıurfa', aliases: ['SANLIURFA', 'ŞANLIURFA', 'URFA', 'HALİLİYE', 'EYYÜBİYE', 'KARAKÖPRÜ', 'SİVEREK', 'VİRANŞEHİR', 'BİRECİK'] },
  { plate: 64, name: 'Uşak', displayName: 'Uşak', aliases: ['USAK', 'UŞAK', 'BANAZ'] },
  { plate: 65, name: 'Van', displayName: 'Van', aliases: ['VAN', 'İPEKYOLU', 'TUŞBA', 'EDREMİT', 'ERCİŞ'] },
  { plate: 66, name: 'Yozgat', displayName: 'Yozgat', aliases: ['YOZGAT', 'SORGUN', 'BOĞAZLIYAN'] },
  { plate: 67, name: 'Zonguldak', displayName: 'Zonguldak', aliases: ['ZONGULDAK', 'EREĞLİ', 'KDZ. EREĞLİ', 'ÇAYCUMA', 'DEVREK', 'KOZLU'] },
  { plate: 68, name: 'Aksaray', displayName: 'Aksaray', aliases: ['AKSARAY'] },
  { plate: 69, name: 'Bayburt', displayName: 'Bayburt', aliases: ['BAYBURT'] },
  { plate: 70, name: 'Karaman', displayName: 'Karaman', aliases: ['KARAMAN', 'ERMENEK'] },
  { plate: 71, name: 'Kırıkkale', displayName: 'Kırıkkale', aliases: ['KIRIKKALE', 'YAHŞİHAN'] },
  { plate: 72, name: 'Batman', displayName: 'Batman', aliases: ['BATMAN'] },
  { plate: 73, name: 'Şırnak', displayName: 'Şırnak', aliases: ['SIRNAK', 'ŞIRNAK', 'CİZRE', 'SİLOPİ'] },
  { plate: 74, name: 'Bartın', displayName: 'Bartın', aliases: ['BARTIN', 'AMASRA'] },
  { plate: 75, name: 'Ardahan', displayName: 'Ardahan', aliases: ['ARDAHAN', 'GÖLE'] },
  { plate: 76, name: 'Iğdır', displayName: 'Iğdır', aliases: ['IGDIR', 'IĞDIR'] },
  { plate: 77, name: 'Yalova', displayName: 'Yalova', aliases: ['YALOVA', 'ÇİFTLİKKÖY', 'ÇINARCIK'] },
  { plate: 78, name: 'Karabük', displayName: 'Karabük', aliases: ['KARABUK', 'KARABÜK', 'SAFRANBOLU'] },
  { plate: 79, name: 'Kilis', displayName: 'Kilis', aliases: ['KILIS', 'KİLİS'] },
  { plate: 80, name: 'Osmaniye', displayName: 'Osmaniye', aliases: ['OSMANIYE', 'OSMANİYE', 'KADİRLİ', 'DÜZİÇİ'] },
  { plate: 81, name: 'Düzce', displayName: 'Düzce', aliases: ['DUZCE', 'DÜZCE', 'AKÇAKOCA'] }
];

function cleanTurkishText(str: string): string {
  if (!str) return '';
  return str
    .toLocaleUpperCase('tr-TR')
    .replace(/İ/g, 'I')
    .replace(/İ/g, 'I')
    .replace(/Ş/g, 'S')
    .replace(/Ğ/g, 'G')
    .replace(/Ü/g, 'U')
    .replace(/Ö/g, 'O')
    .replace(/Ç/g, 'C')
    .replace(/[^A-Z0-9]/g, ' ')
    .trim();
}

/**
 * Resolves any city, district or free-form text to a standard Turkey Province plate number (1..81).
 */
export function resolveProvincePlate(cityInput?: string, districtInput?: string): number | null {
  const cityClean = cleanTurkishText(cityInput || '');
  const districtClean = cleanTurkishText(districtInput || '');
  const combined = `${cityClean} ${districtClean}`.trim();

  if (!combined) return null;

  // 1. Direct check: exact alias match on city
  for (const prov of TURKEY_PROVINCE_REGISTRY) {
    const pNameClean = cleanTurkishText(prov.name);
    if (cityClean === pNameClean) return prov.plate;
    for (const alias of prov.aliases) {
      if (cityClean === cleanTurkishText(alias)) return prov.plate;
    }
  }

  // 2. Substring/Word match: Does cityClean contain the province alias or name?
  const cityWords = cityClean.split(/\s+/).filter(Boolean);
  for (const word of cityWords) {
    for (const prov of TURKEY_PROVINCE_REGISTRY) {
      if (word === cleanTurkishText(prov.name)) return prov.plate;
      if (word === cleanTurkishText(prov.displayName)) return prov.plate;
      for (const alias of prov.aliases) {
        if (word === cleanTurkishText(alias)) return prov.plate;
      }
    }
  }

  // 3. Check combined words (e.g. city + district)
  for (const prov of TURKEY_PROVINCE_REGISTRY) {
    for (const alias of prov.aliases) {
      const aClean = cleanTurkishText(alias);
      if (aClean.length >= 4 && (cityClean.includes(aClean) || combined.includes(aClean))) {
        return prov.plate;
      }
    }
  }

  // 4. Check district alone
  if (districtClean) {
    for (const prov of TURKEY_PROVINCE_REGISTRY) {
      for (const alias of prov.aliases) {
        if (districtClean === cleanTurkishText(alias)) return prov.plate;
      }
    }
  }

  // 5. Check numeric plate in string e.g. "34 - ISTANBUL" or "34"
  for (const word of cityWords) {
    const num = parseInt(word, 10);
    if (!isNaN(num) && num >= 1 && num <= 81) {
      return num;
    }
  }

  return null;
}

export function getProvinceByPlate(plate: number): ProvinceMeta | undefined {
  return TURKEY_PROVINCE_REGISTRY.find((p) => p.plate === plate);
}
