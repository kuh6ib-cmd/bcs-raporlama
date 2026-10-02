import { BCSServiceMasterItem, Service18xItem } from '../types';

export const STANDARD_BCS_SERVICES = [
  'Genel Randevu',
  'Periyodik Bakım',
  'Motor Yağ & Filtre Değişimi',
  'Fren Sistemi Kontrolü',
  'Fren Balata & Disk Değişimi',
  'Rot Ayarı',
  'Balans & Lastik Değişimi',
  'Klima Kontrolü ve Bakımı',
  'Klima Gaz Dolumu & Temizliği',
  'Aydınlatma & Far Ayarı',
  'Akü Kontrolü & Testi',
  'Şarj Dinamosu & Marş Motoru',
  'Araç Muayenesi Öncesi Mevzuata Uygunluk Kontrolü',
  'Genel Araç Kontrolü (15 Nokta Check-up)',
  'Elektrikli & Hibrit Araç Kontrolü',
  'ADAS Kalibrasyonu (Gelişmiş Sürücü Destek Sistemleri)',
  'Şanzıman Yağ Değişimi',
  'Debriyaj Seti & Baskı Balata',
  'Elektronik Arıza Tespiti',
  'Güvenlik Sistemleri Kontrolü',
  'Triger Kayışı Değişimi',
  'V Kayışı & Gergi Rulmanı',
  'Amortisör & Süspansiyon Bakımı',
  'Ön Takım, Salıncak & Z-Rot',
  'Egzoz & DPF Temizliği',
  'Enjektör & Yakıt Sistemi',
  'Buji & Ateşleme Sistemi',
  'Silecek & Cam Yıkama Sistemi'
];

export const DEFAULT_18X_SERVICES: Service18xItem[] = [
  // 5-digit Standard Codes (as used in SPO sheets)
  { serviceCode: '18000', serviceName: 'Genel Randevu', serviceCategory: 'Genel Randevu & Ön Kabul', laborHours: 0.5, price: 0 },
  { serviceCode: '18001', serviceName: 'Periyodik Bakım', serviceCategory: 'Periyodik Bakım', laborHours: 2.0, price: 3500 },
  { serviceCode: '18002', serviceName: 'Motor Yağ & Filtre Değişimi', serviceCategory: 'Periyodik Bakım', laborHours: 1.0, price: 1800 },
  { serviceCode: '18003', serviceName: 'Fren Sistemi Kontrolü', serviceCategory: 'Fren Sistemleri', laborHours: 1.0, price: 1200 },
  { serviceCode: '18004', serviceName: 'Fren Sistemi', serviceCategory: 'Fren Sistemleri', laborHours: 1.0, price: 1200 },
  { serviceCode: '18005', serviceName: 'Fren Balata & Disk Değişimi', serviceCategory: 'Fren Sistemleri', laborHours: 1.5, price: 2800 },
  { serviceCode: '18006', serviceName: 'Rot Ayarı', serviceCategory: 'Yürüyen Aksam & Lastik', laborHours: 1.0, price: 1200 },
  { serviceCode: '18007', serviceName: 'Balans & Lastik Değişimi', serviceCategory: 'Yürüyen Aksam & Lastik', laborHours: 1.0, price: 800 },
  { serviceCode: '18008', serviceName: 'Klima Kontrolü ve Bakımı', serviceCategory: 'Klima & Isıtma', laborHours: 1.5, price: 2500 },
  { serviceCode: '18009', serviceName: 'Klima Gaz Dolumu & Temizliği', serviceCategory: 'Klima & Isıtma', laborHours: 1.0, price: 2000 },
  { serviceCode: '18010', serviceName: 'Aydınlatma Kontrolü', serviceCategory: 'Elektrik & Aydınlatma', laborHours: 0.5, price: 500 },
  { serviceCode: '18011', serviceName: 'Akü Kontrolü', serviceCategory: 'Akü & Elektrik', laborHours: 0.5, price: 0 },
  { serviceCode: '18021', serviceName: 'Aydınlatma & Far Ayarı', serviceCategory: 'Elektrik & Aydınlatma', laborHours: 0.5, price: 600 },
  { serviceCode: '18022', serviceName: 'Akü Kontrolü & Testi', serviceCategory: 'Akü & Elektrik', laborHours: 0.5, price: 0 },
  { serviceCode: '18023', serviceName: 'Şarj Dinamosu & Marş Motoru', serviceCategory: 'Akü & Elektrik', laborHours: 2.0, price: 3000 },
  { serviceCode: '18024', serviceName: 'Araç Muayenesi Öncesi Mevzuata Uygunluk Kontrolü', serviceCategory: 'Muayene & Kontrol', laborHours: 1.5, price: 1500 },
  { serviceCode: '18025', serviceName: 'Genel Araç Kontrolü (15 Nokta Check-up)', serviceCategory: 'Check-Up & Güvenlik', laborHours: 1.0, price: 0 },
  { serviceCode: '18026', serviceName: 'Elektrikli & Hibrit Araç Kontrolü', serviceCategory: 'E-Mobilite & Hibrit', laborHours: 2.0, price: 4500 },
  { serviceCode: '18027', serviceName: 'ADAS Kalibrasyonu (Gelişmiş Sürücü Destek)', serviceCategory: 'ADAS & Sürüş Destek', laborHours: 2.5, price: 6000 },
  { serviceCode: '18028', serviceName: 'Şanzıman Yağ Değişimi', serviceCategory: 'Şanzıman & Aktarma', laborHours: 1.5, price: 2400 },
  { serviceCode: '18029', serviceName: 'Debriyaj Seti & Baskı Balata', serviceCategory: 'Şanzıman & Aktarma', laborHours: 4.0, price: 5500 },
  { serviceCode: '18030', serviceName: 'Elektronik Arıza Tespiti', serviceCategory: 'Diyagnostik & Test', laborHours: 1.0, price: 1000 },
  { serviceCode: '18031', serviceName: 'Güvenlik Sistemleri Kontrolü', serviceCategory: 'Diyagnostik & Test', laborHours: 1.0, price: 0 },
  { serviceCode: '18032', serviceName: 'Triger Kayışı Değişimi', serviceCategory: 'Motor & Mekanik', laborHours: 3.5, price: 4500 },
  { serviceCode: '18033', serviceName: 'V Kayışı & Gergi Rulmanı', serviceCategory: 'Motor & Mekanik', laborHours: 1.5, price: 1800 },
  { serviceCode: '18034', serviceName: 'Amortisör & Süspansiyon Bakımı', serviceCategory: 'Süspansiyon & Şasi', laborHours: 2.0, price: 3800 },
  { serviceCode: '18035', serviceName: 'Ön Takım, Salıncak & Z-Rot', serviceCategory: 'Süspansiyon & Şasi', laborHours: 1.5, price: 1600 },
  { serviceCode: '18036', serviceName: 'Egzoz & DPF Temizliği', serviceCategory: 'Egzoz & Emisyon', laborHours: 2.0, price: 4000 },
  { serviceCode: '18037', serviceName: 'Enjektör & Yakıt Sistemi', serviceCategory: 'Yakıt & Enjeksiyon', laborHours: 2.0, price: 3500 },
  { serviceCode: '18038', serviceName: 'Buji & Ateşleme Sistemi', serviceCategory: 'Ateşleme & Motor', laborHours: 1.0, price: 950 },
  { serviceCode: '18039', serviceName: 'Silecek & Cam Yıkama Sistemi', serviceCategory: 'Aksesuar & Görüş', laborHours: 0.5, price: 400 },

  // 7-digit Extended Codes
  { serviceCode: '1801001', serviceName: 'Genel Randevu', serviceCategory: 'Genel Randevu & Ön Kabul', laborHours: 0.5, price: 0 },
  { serviceCode: '1802001', serviceName: 'Periyodik Bakım', serviceCategory: 'Periyodik Bakım', laborHours: 2.0, price: 3500 },
  { serviceCode: '1802002', serviceName: 'Motor Yağ & Filtre Değişimi', serviceCategory: 'Periyodik Bakım', laborHours: 1.0, price: 1800 },
  { serviceCode: '1803001', serviceName: 'Fren Sistemi Kontrolü', serviceCategory: 'Fren Sistemleri', laborHours: 1.0, price: 1200 },
  { serviceCode: '1803002', serviceName: 'Fren Balata & Disk Değişimi', serviceCategory: 'Fren Sistemleri', laborHours: 1.5, price: 2800 },
  { serviceCode: '1804001', serviceName: 'Rot Ayarı', serviceCategory: 'Yürüyen Aksam & Lastik', laborHours: 1.0, price: 1200 },
  { serviceCode: '1804002', serviceName: 'Balans & Lastik Değişimi', serviceCategory: 'Yürüyen Aksam & Lastik', laborHours: 1.0, price: 800 },
  { serviceCode: '1805001', serviceName: 'Klima Kontrolü ve Bakımı', serviceCategory: 'Klima & Isıtma', laborHours: 1.5, price: 2500 },
  { serviceCode: '1805002', serviceName: 'Klima Gaz Dolumu & Temizliği', serviceCategory: 'Klima & Isıtma', laborHours: 1.0, price: 2000 },
  { serviceCode: '1806001', serviceName: 'Aydınlatma & Far Ayarı', serviceCategory: 'Elektrik & Aydınlatma', laborHours: 0.5, price: 600 },
  { serviceCode: '1807001', serviceName: 'Akü Kontrolü & Testi', serviceCategory: 'Akü & Elektrik', laborHours: 0.5, price: 0 },
  { serviceCode: '1807002', serviceName: 'Şarj Dinamosu & Marş Motoru', serviceCategory: 'Akü & Elektrik', laborHours: 2.0, price: 3000 },
  { serviceCode: '1808001', serviceName: 'Araç Muayenesi Öncesi Mevzuata Uygunluk Kontrolü', serviceCategory: 'Muayene & Kontrol', laborHours: 1.5, price: 1500 },
  { serviceCode: '1809001', serviceName: 'Genel Araç Kontrolü (15 Nokta Check-up)', serviceCategory: 'Check-Up & Güvenlik', laborHours: 1.0, price: 0 },
  { serviceCode: '1810001', serviceName: 'Elektrikli & Hibrit Araç Kontrolü', serviceCategory: 'E-Mobilite & Hibrit', laborHours: 2.0, price: 4500 },
  { serviceCode: '1811001', serviceName: 'ADAS Kalibrasyonu (Gelişmiş Sürücü Destek Sistemleri)', serviceCategory: 'ADAS & Sürüş Destek', laborHours: 2.5, price: 6000 },
  { serviceCode: '1812001', serviceName: 'Şanzıman Yağ Değişimi', serviceCategory: 'Şanzıman & Aktarma', laborHours: 1.5, price: 2400 },
  { serviceCode: '1812002', serviceName: 'Debriyaj Seti & Baskı Balata', serviceCategory: 'Şanzıman & Aktarma', laborHours: 4.0, price: 5500 },
  { serviceCode: '1813001', serviceName: 'Elektronik Arıza Tespiti', serviceCategory: 'Diyagnostik & Test', laborHours: 1.0, price: 1000 },
  { serviceCode: '1813002', serviceName: 'Güvenlik Sistemleri Kontrolü', serviceCategory: 'Diyagnostik & Test', laborHours: 1.0, price: 0 },
  { serviceCode: '1814001', serviceName: 'Triger Kayışı Değişimi', serviceCategory: 'Motor & Mekanik', laborHours: 3.5, price: 4500 },
  { serviceCode: '1814002', serviceName: 'V Kayışı & Gergi Rulmanı', serviceCategory: 'Motor & Mekanik', laborHours: 1.5, price: 1800 },
  { serviceCode: '1815001', serviceName: 'Amortisör & Süspansiyon Bakımı', serviceCategory: 'Süspansiyon & Şasi', laborHours: 2.0, price: 3800 },
  { serviceCode: '1815002', serviceName: 'Ön Takım, Salıncak & Z-Rot', serviceCategory: 'Süspansiyon & Şasi', laborHours: 1.5, price: 1600 },
  { serviceCode: '1816001', serviceName: 'Egzoz & DPF Temizliği', serviceCategory: 'Egzoz & Emisyon', laborHours: 2.0, price: 4000 },
  { serviceCode: '1817001', serviceName: 'Enjektör & Yakıt Sistemi', serviceCategory: 'Yakıt & Enjeksiyon', laborHours: 2.0, price: 3500 },
  { serviceCode: '1818001', serviceName: 'Buji & Ateşleme Sistemi', serviceCategory: 'Ateşleme & Motor', laborHours: 1.0, price: 950 },
  { serviceCode: '1819001', serviceName: 'Silecek & Cam Yıkama Sistemi', serviceCategory: 'Aksesuar & Görüş', laborHours: 0.5, price: 400 }
];

export const DEFAULT_BCS_MASTER_SERVICES: BCSServiceMasterItem[] = [
  {
    "dissap": "76280012",
    "crmCreateDate": "15.01.2025",
    "firmName": "Bostancı BCS Otomotiv",
    "district": "Kadıköy",
    "city": "İSTANBUL",
    "regionManager": "Ünal Özyavaş",
    "fieldResponsible": "Muhammed Ali ÖZER"
  },
  {
    "dissap": "76280149",
    "crmCreateDate": "15.02.2025",
    "firmName": "Servist Otomotiv",
    "district": "Kağıthane",
    "city": "İSTANBUL",
    "regionManager": "Ünal Özyavaş",
    "fieldResponsible": "Muhammed Ali ÖZER"
  },
  {
    "dissap": "76280286",
    "crmCreateDate": "15.03.2025",
    "firmName": "ABC Motorlu Araçlar",
    "district": "Kağıthane",
    "city": "İSTANBUL",
    "regionManager": "Ünal Özyavaş",
    "fieldResponsible": "Muhammed Ali ÖZER"
  },
  {
    "dissap": "76280423",
    "crmCreateDate": "15.04.2025",
    "firmName": "Unitgarage",
    "district": "Küçükçekmece",
    "city": "İSTANBUL",
    "regionManager": "Özgür KASAP",
    "fieldResponsible": "Uğur TASLAK"
  },
  {
    "dissap": "76280560",
    "crmCreateDate": "15.05.2025",
    "firmName": "Nato Otomotiv - Şube",
    "district": "Beyoğlu",
    "city": "İSTANBUL",
    "regionManager": "Ünal Özyavaş",
    "fieldResponsible": "Muhammed Ali ÖZER"
  },
  {
    "dissap": "76280697",
    "crmCreateDate": "15.06.2025",
    "firmName": "Mirsan Otomotiv",
    "district": "Kartal",
    "city": "İSTANBUL",
    "regionManager": "Metin ARAS",
    "fieldResponsible": "Halil Onat ÖZKAN"
  },
  {
    "dissap": "76280834",
    "crmCreateDate": "15.07.2025",
    "firmName": "Sky Otomotiv",
    "district": "Bağcılar",
    "city": "İSTANBUL",
    "regionManager": "Ünal Özyavaş",
    "fieldResponsible": "Uğur TASLAK"
  },
  {
    "dissap": "76280971",
    "crmCreateDate": "15.08.2025",
    "firmName": "Özdem Otomotiv",
    "district": "Arnavutköy",
    "city": "İSTANBUL",
    "regionManager": "Ünal Özyavaş",
    "fieldResponsible": "Halil Onat ÖZKAN"
  },
  {
    "dissap": "76281108",
    "crmCreateDate": "15.01.2025",
    "firmName": "Tam Garanti Servis",
    "district": "Esenyurt",
    "city": "İSTANBUL",
    "regionManager": "Ünal Özyavaş",
    "fieldResponsible": "Uğur TASLAK"
  },
  {
    "dissap": "76281245",
    "crmCreateDate": "15.02.2025",
    "firmName": "Hedef Oto Servis",
    "district": "Ümraniye",
    "city": "İSTANBUL",
    "regionManager": "Metin ARAS",
    "fieldResponsible": "Muhammed Ali ÖZER"
  },
  {
    "dissap": "76281382",
    "crmCreateDate": "15.03.2025",
    "firmName": "Boğaziçi BCS Servis",
    "district": "Beşiktaş",
    "city": "İSTANBUL",
    "regionManager": "Ünal Özyavaş",
    "fieldResponsible": "Muhammed Ali ÖZER"
  },
  {
    "dissap": "76281519",
    "crmCreateDate": "15.04.2025",
    "firmName": "Anadolu BCS Motor",
    "district": "Maltepe",
    "city": "İSTANBUL",
    "regionManager": "Metin ARAS",
    "fieldResponsible": "Halil Onat ÖZKAN"
  },
  {
    "dissap": "76281656",
    "crmCreateDate": "15.05.2025",
    "firmName": "Pendik BCS Teknik",
    "district": "Pendik",
    "city": "İSTANBUL",
    "regionManager": "Metin ARAS",
    "fieldResponsible": "Uğur TASLAK"
  },
  {
    "dissap": "76281793",
    "crmCreateDate": "15.06.2025",
    "firmName": "Mecidiyeköy Oto Tamir",
    "district": "Şişli",
    "city": "İSTANBUL",
    "regionManager": "Ünal Özyavaş",
    "fieldResponsible": "Muhammed Ali ÖZER"
  },
  {
    "dissap": "76281930",
    "crmCreateDate": "15.07.2025",
    "firmName": "İkitelli BCS Uzman",
    "district": "Başakşehir",
    "city": "İSTANBUL",
    "regionManager": "Özgür KASAP",
    "fieldResponsible": "Uğur TASLAK"
  },
  {
    "dissap": "76282067",
    "crmCreateDate": "15.08.2025",
    "firmName": "Tuzla Sanayi BCS",
    "district": "Tuzla",
    "city": "İSTANBUL",
    "regionManager": "Metin ARAS",
    "fieldResponsible": "Halil Onat ÖZKAN"
  },
  {
    "dissap": "76282204",
    "crmCreateDate": "15.01.2025",
    "firmName": "Sahil BCS Bakırköy",
    "district": "Bakırköy",
    "city": "İSTANBUL",
    "regionManager": "Ünal Özyavaş",
    "fieldResponsible": "Uğur TASLAK"
  },
  {
    "dissap": "76282341",
    "crmCreateDate": "15.02.2025",
    "firmName": "Batı Ataşehir BCS",
    "district": "Ataşehir",
    "city": "İSTANBUL",
    "regionManager": "Metin ARAS",
    "fieldResponsible": "Muhammed Ali ÖZER"
  },
  {
    "dissap": "76282478",
    "crmCreateDate": "15.03.2025",
    "firmName": "Eterna Otomotiv",
    "district": "Yenimahalle",
    "city": "ANKARA",
    "regionManager": "Cem ÇAP",
    "fieldResponsible": "Muhammed Ali ÖZER"
  },
  {
    "dissap": "76282615",
    "crmCreateDate": "15.04.2025",
    "firmName": "Fix Grup Bir",
    "district": "Yenimahalle",
    "city": "ANKARA",
    "regionManager": "Cem ÇAP",
    "fieldResponsible": "Muhammed Ali ÖZER"
  },
  {
    "dissap": "76282752",
    "crmCreateDate": "15.05.2025",
    "firmName": "Ostim BCS Teknik",
    "district": "Yenimahalle",
    "city": "ANKARA",
    "regionManager": "Cem ÇAP",
    "fieldResponsible": "Muhammed Ali ÖZER"
  },
  {
    "dissap": "76282889",
    "crmCreateDate": "15.06.2025",
    "firmName": "Şaşmaz Motorlu Araçlar",
    "district": "Etimesgut",
    "city": "ANKARA",
    "regionManager": "Cem ÇAP",
    "fieldResponsible": "Halil Onat ÖZKAN"
  },
  {
    "dissap": "76283026",
    "crmCreateDate": "15.07.2025",
    "firmName": "Çankaya BCS Premium",
    "district": "Çankaya",
    "city": "ANKARA",
    "regionManager": "Cem ÇAP",
    "fieldResponsible": "Muhammed Ali ÖZER"
  },
  {
    "dissap": "76283163",
    "crmCreateDate": "15.08.2025",
    "firmName": "İvedik BCS Servis",
    "district": "Yenimahalle",
    "city": "ANKARA",
    "regionManager": "Cem ÇAP",
    "fieldResponsible": "Uğur TASLAK"
  },
  {
    "dissap": "76283300",
    "crmCreateDate": "15.01.2025",
    "firmName": "Kuzey BCS Otomotiv",
    "district": "Keçiören",
    "city": "ANKARA",
    "regionManager": "Cem ÇAP",
    "fieldResponsible": "Halil Onat ÖZKAN"
  },
  {
    "dissap": "76283437",
    "crmCreateDate": "15.02.2025",
    "firmName": "Sincan Organize BCS",
    "district": "Sincan",
    "city": "ANKARA",
    "regionManager": "Cem ÇAP",
    "fieldResponsible": "Uğur TASLAK"
  },
  {
    "dissap": "76283574",
    "crmCreateDate": "15.03.2025",
    "firmName": "İskitler BCS Motor",
    "district": "Altındağ",
    "city": "ANKARA",
    "regionManager": "Cem ÇAP",
    "fieldResponsible": "Muhammed Ali ÖZER"
  },
  {
    "dissap": "76283711",
    "crmCreateDate": "15.04.2025",
    "firmName": "Gölbaşı BCS Servis",
    "district": "Gölbaşı",
    "city": "ANKARA",
    "regionManager": "Cem ÇAP",
    "fieldResponsible": "Halil Onat ÖZKAN"
  },
  {
    "dissap": "76283848",
    "crmCreateDate": "15.05.2025",
    "firmName": "Ege BCS Otomotiv",
    "district": "Bornova",
    "city": "İZMİR",
    "regionManager": "Uğur KESKİN",
    "fieldResponsible": "Fatih ÖNER"
  },
  {
    "dissap": "76283985",
    "crmCreateDate": "15.06.2025",
    "firmName": "Çiğli Ata Sanayi BCS",
    "district": "Çiğli",
    "city": "İZMİR",
    "regionManager": "Uğur KESKİN",
    "fieldResponsible": "Fatih ÖNER"
  },
  {
    "dissap": "76284122",
    "crmCreateDate": "15.07.2025",
    "firmName": "Alsancak BCS Teknik",
    "district": "Konak",
    "city": "İZMİR",
    "regionManager": "Uğur KESKİN",
    "fieldResponsible": "Fatih ÖNER"
  },
  {
    "dissap": "76284259",
    "crmCreateDate": "15.08.2025",
    "firmName": "Gaziemir BCS Motor",
    "district": "Gaziemir",
    "city": "İZMİR",
    "regionManager": "Uğur KESKİN",
    "fieldResponsible": "Uğur TASLAK"
  },
  {
    "dissap": "76284396",
    "crmCreateDate": "15.01.2025",
    "firmName": "Mavişehir BCS Servis",
    "district": "Karşıyaka",
    "city": "İZMİR",
    "regionManager": "Uğur KESKİN",
    "fieldResponsible": "Fatih ÖNER"
  },
  {
    "dissap": "76284533",
    "crmCreateDate": "15.02.2025",
    "firmName": "Torbalı BCS Otomotiv",
    "district": "Torbalı",
    "city": "İZMİR",
    "regionManager": "Uğur KESKİN",
    "fieldResponsible": "Uğur TASLAK"
  },
  {
    "dissap": "76284670",
    "crmCreateDate": "15.03.2025",
    "firmName": "Buca 6. Sanayi BCS",
    "district": "Buca",
    "city": "İZMİR",
    "regionManager": "Uğur KESKİN",
    "fieldResponsible": "Fatih ÖNER"
  },
  {
    "dissap": "76284807",
    "crmCreateDate": "15.04.2025",
    "firmName": "Kuzey Ege BCS",
    "district": "Menemen",
    "city": "İZMİR",
    "regionManager": "Uğur KESKİN",
    "fieldResponsible": "Uğur TASLAK"
  },
  {
    "dissap": "76284944",
    "crmCreateDate": "15.05.2025",
    "firmName": "Kaptan Oto - Şube",
    "district": "İnegöl",
    "city": "BURSA",
    "regionManager": "Ünal Özyavaş",
    "fieldResponsible": "Halil Onat ÖZKAN"
  },
  {
    "dissap": "76285081",
    "crmCreateDate": "15.06.2025",
    "firmName": "ZEYN Otomotiv",
    "district": "Nilüfer",
    "city": "BURSA",
    "regionManager": "Ünal Özyavaş",
    "fieldResponsible": "Halil Onat ÖZKAN"
  },
  {
    "dissap": "76285218",
    "crmCreateDate": "15.07.2025",
    "firmName": "Küçük Sanayi BCS",
    "district": "Nilüfer",
    "city": "BURSA",
    "regionManager": "Ünal Özyavaş",
    "fieldResponsible": "Halil Onat ÖZKAN"
  },
  {
    "dissap": "76285355",
    "crmCreateDate": "15.08.2025",
    "firmName": "Bursa Merkez BCS",
    "district": "Osmangazi",
    "city": "BURSA",
    "regionManager": "Ünal Özyavaş",
    "fieldResponsible": "Halil Onat ÖZKAN"
  },
  {
    "dissap": "76285492",
    "crmCreateDate": "15.01.2025",
    "firmName": "Otosansit BCS Teknik",
    "district": "Yıldırım",
    "city": "BURSA",
    "regionManager": "Ünal Özyavaş",
    "fieldResponsible": "Halil Onat ÖZKAN"
  },
  {
    "dissap": "76285629",
    "crmCreateDate": "15.02.2025",
    "firmName": "Körfez BCS Gemlik",
    "district": "Gemlik",
    "city": "BURSA",
    "regionManager": "Ünal Özyavaş",
    "fieldResponsible": "Halil Onat ÖZKAN"
  },
  {
    "dissap": "76285766",
    "crmCreateDate": "15.03.2025",
    "firmName": "Döşemealtı BCS",
    "district": "Döşemealtı",
    "city": "ANTALYA",
    "regionManager": "Şafak Dommasch",
    "fieldResponsible": "Uğur TASLAK"
  },
  {
    "dissap": "76285903",
    "crmCreateDate": "15.04.2025",
    "firmName": "Akdeniz BCS Servis",
    "district": "Muratpaşa",
    "city": "ANTALYA",
    "regionManager": "Şafak Dommasch",
    "fieldResponsible": "Uğur TASLAK"
  },
  {
    "dissap": "76286040",
    "crmCreateDate": "15.05.2025",
    "firmName": "Kepez Sanayi BCS",
    "district": "Kepez",
    "city": "ANTALYA",
    "regionManager": "Şafak Dommasch",
    "fieldResponsible": "Uğur TASLAK"
  },
  {
    "dissap": "76286177",
    "crmCreateDate": "15.06.2025",
    "firmName": "Alanya BCS Otomotiv",
    "district": "Alanya",
    "city": "ANTALYA",
    "regionManager": "Şafak Dommasch",
    "fieldResponsible": "Uğur TASLAK"
  },
  {
    "dissap": "76286314",
    "crmCreateDate": "15.07.2025",
    "firmName": "Manavgat BCS Teknik",
    "district": "Manavgat",
    "city": "ANTALYA",
    "regionManager": "Şafak Dommasch",
    "fieldResponsible": "Uğur TASLAK"
  },
  {
    "dissap": "76286451",
    "crmCreateDate": "15.08.2025",
    "firmName": "Yavuzoğlu Otomotiv",
    "district": "Seyhan",
    "city": "ADANA",
    "regionManager": "Özgür KASAP",
    "fieldResponsible": "Halil Onat ÖZKAN"
  },
  {
    "dissap": "76286588",
    "crmCreateDate": "15.01.2025",
    "firmName": "Çukurova BCS Servis",
    "district": "Çukurova",
    "city": "ADANA",
    "regionManager": "Özgür KASAP",
    "fieldResponsible": "Halil Onat ÖZKAN"
  },
  {
    "dissap": "76286725",
    "crmCreateDate": "15.02.2025",
    "firmName": "Güney BCS Adana",
    "district": "Seyhan",
    "city": "ADANA",
    "regionManager": "Özgür KASAP",
    "fieldResponsible": "Halil Onat ÖZKAN"
  },
  {
    "dissap": "76286862",
    "crmCreateDate": "15.03.2025",
    "firmName": "Ceyhan BCS Teknik",
    "district": "Ceyhan",
    "city": "ADANA",
    "regionManager": "Özgür KASAP",
    "fieldResponsible": "Halil Onat ÖZKAN"
  },
  {
    "dissap": "76286999",
    "crmCreateDate": "15.04.2025",
    "firmName": "Sersa Otomotiv",
    "district": "Şahinbey",
    "city": "GAZİANTEP",
    "regionManager": "Metin ARAS",
    "fieldResponsible": "Fatih ÖNER"
  },
  {
    "dissap": "76287136",
    "crmCreateDate": "15.05.2025",
    "firmName": "TP Motors",
    "district": "Şehitkamil",
    "city": "GAZİANTEP",
    "regionManager": "Metin ARAS",
    "fieldResponsible": "Fatih ÖNER"
  },
  {
    "dissap": "76287273",
    "crmCreateDate": "15.06.2025",
    "firmName": "Küsget Sanayi BCS",
    "district": "Şehitkamil",
    "city": "GAZİANTEP",
    "regionManager": "Metin ARAS",
    "fieldResponsible": "Fatih ÖNER"
  },
  {
    "dissap": "76287410",
    "crmCreateDate": "15.07.2025",
    "firmName": "Gaziantep BCS Otomotiv",
    "district": "Şahinbey",
    "city": "GAZİANTEP",
    "regionManager": "Metin ARAS",
    "fieldResponsible": "Fatih ÖNER"
  },
  {
    "dissap": "76287547",
    "crmCreateDate": "15.08.2025",
    "firmName": "Mevlana BCS Motor",
    "district": "Selçuklu",
    "city": "KONYA",
    "regionManager": "Cem ÇAP",
    "fieldResponsible": "Halil Onat ÖZKAN"
  },
  {
    "dissap": "76287684",
    "crmCreateDate": "15.01.2025",
    "firmName": "Mar-San Sanayi BCS",
    "district": "Karatay",
    "city": "KONYA",
    "regionManager": "Cem ÇAP",
    "fieldResponsible": "Halil Onat ÖZKAN"
  },
  {
    "dissap": "76287821",
    "crmCreateDate": "15.02.2025",
    "firmName": "Meram BCS Servis",
    "district": "Meram",
    "city": "KONYA",
    "regionManager": "Cem ÇAP",
    "fieldResponsible": "Halil Onat ÖZKAN"
  },
  {
    "dissap": "76287958",
    "crmCreateDate": "15.03.2025",
    "firmName": "Kocaeli BCS Teknik",
    "district": "İzmit",
    "city": "KOCAELİ",
    "regionManager": "Ünal Özyavaş",
    "fieldResponsible": "Muhammed Ali ÖZER"
  },
  {
    "dissap": "76288095",
    "crmCreateDate": "15.04.2025",
    "firmName": "Gebze Organize BCS",
    "district": "Gebze",
    "city": "KOCAELİ",
    "regionManager": "Ünal Özyavaş",
    "fieldResponsible": "Muhammed Ali ÖZER"
  },
  {
    "dissap": "76288232",
    "crmCreateDate": "15.05.2025",
    "firmName": "Körfez BCS Otomotiv",
    "district": "Körfez",
    "city": "KOCAELİ",
    "regionManager": "Ünal Özyavaş",
    "fieldResponsible": "Muhammed Ali ÖZER"
  },
  {
    "dissap": "76288369",
    "crmCreateDate": "15.06.2025",
    "firmName": "Dicle BCS Otomotiv",
    "district": "Kayapınar",
    "city": "DİYARBAKIR",
    "regionManager": "Metin ARAS",
    "fieldResponsible": "Fatih ÖNER"
  },
  {
    "dissap": "76288506",
    "crmCreateDate": "15.07.2025",
    "firmName": "Bağlar Sanayi BCS",
    "district": "Bağlar",
    "city": "DİYARBAKIR",
    "regionManager": "Metin ARAS",
    "fieldResponsible": "Fatih ÖNER"
  },
  {
    "dissap": "76288643",
    "crmCreateDate": "15.08.2025",
    "firmName": "Yenişehir BCS Servis",
    "district": "Yenişehir",
    "city": "DİYARBAKIR",
    "regionManager": "Metin ARAS",
    "fieldResponsible": "Fatih ÖNER"
  },
  {
    "dissap": "76288780",
    "crmCreateDate": "15.01.2025",
    "firmName": "İhya Otomotiv",
    "district": "Melikgazi",
    "city": "KAYSERİ",
    "regionManager": "Cem ÇAP",
    "fieldResponsible": "Uğur TASLAK"
  },
  {
    "dissap": "76288917",
    "crmCreateDate": "15.02.2025",
    "firmName": "Kocasinan BCS Teknik",
    "district": "Kocasinan",
    "city": "KAYSERİ",
    "regionManager": "Cem ÇAP",
    "fieldResponsible": "Uğur TASLAK"
  },
  {
    "dissap": "76289054",
    "crmCreateDate": "15.03.2025",
    "firmName": "Karadeniz BCS Samsun",
    "district": "İlkadım",
    "city": "SAMSUN",
    "regionManager": "Ünal Özyavaş",
    "fieldResponsible": "Uğur TASLAK"
  },
  {
    "dissap": "76289191",
    "crmCreateDate": "15.04.2025",
    "firmName": "Atakum BCS Servis",
    "district": "Atakum",
    "city": "SAMSUN",
    "regionManager": "Ünal Özyavaş",
    "fieldResponsible": "Uğur TASLAK"
  },
  {
    "dissap": "76289328",
    "crmCreateDate": "15.05.2025",
    "firmName": "Trabzon Değirmendere BCS",
    "district": "Ortahisar",
    "city": "TRABZON",
    "regionManager": "Ünal Özyavaş",
    "fieldResponsible": "Uğur TASLAK"
  },
  {
    "dissap": "76289465",
    "crmCreateDate": "15.06.2025",
    "firmName": "Akçaabat BCS Teknik",
    "district": "Akçaabat",
    "city": "TRABZON",
    "regionManager": "Ünal Özyavaş",
    "fieldResponsible": "Uğur TASLAK"
  },
  {
    "dissap": "76289602",
    "crmCreateDate": "15.07.2025",
    "firmName": "Mersin Liman BCS",
    "district": "Akdeniz",
    "city": "MERSİN",
    "regionManager": "Özgür KASAP",
    "fieldResponsible": "Halil Onat ÖZKAN"
  },
  {
    "dissap": "76289739",
    "crmCreateDate": "15.08.2025",
    "firmName": "Toroslar BCS Otomotiv",
    "district": "Toroslar",
    "city": "MERSİN",
    "regionManager": "Özgür KASAP",
    "fieldResponsible": "Halil Onat ÖZKAN"
  },
  {
    "dissap": "76289876",
    "crmCreateDate": "15.01.2025",
    "firmName": "Eskişehir BCS Motor",
    "district": "Tepebaşı",
    "city": "ESKİŞEHİR",
    "regionManager": "Cem ÇAP",
    "fieldResponsible": "Muhammed Ali ÖZER"
  },
  {
    "dissap": "76290013",
    "crmCreateDate": "15.02.2025",
    "firmName": "Odunpazarı BCS Servis",
    "district": "Odunpazarı",
    "city": "ESKİŞEHİR",
    "regionManager": "Cem ÇAP",
    "fieldResponsible": "Muhammed Ali ÖZER"
  },
  {
    "dissap": "76290150",
    "crmCreateDate": "15.03.2025",
    "firmName": "Pamukkale BCS Denizli",
    "district": "Merkezefendi",
    "city": "DENİZLİ",
    "regionManager": "Uğur KESKİN",
    "fieldResponsible": "Fatih ÖNER"
  },
  {
    "dissap": "76290287",
    "crmCreateDate": "15.04.2025",
    "firmName": "Denizli 3. Sanayi BCS",
    "district": "Sümer",
    "city": "DENİZLİ",
    "regionManager": "Uğur KESKİN",
    "fieldResponsible": "Fatih ÖNER"
  },
  {
    "dissap": "76290424",
    "crmCreateDate": "15.05.2025",
    "firmName": "Balıkesir BCS Servis",
    "district": "Karesi",
    "city": "BALIKESİR",
    "regionManager": "Ünal Özyavaş",
    "fieldResponsible": "Halil Onat ÖZKAN"
  },
  {
    "dissap": "76290561",
    "crmCreateDate": "15.06.2025",
    "firmName": "Bandırma Liman BCS",
    "district": "Bandırma",
    "city": "BALIKESİR",
    "regionManager": "Ünal Özyavaş",
    "fieldResponsible": "Halil Onat ÖZKAN"
  },
  {
    "dissap": "76290698",
    "crmCreateDate": "15.07.2025",
    "firmName": "Trakya Çorlu BCS",
    "district": "Çorlu",
    "city": "TEKİRDAĞ",
    "regionManager": "Ünal Özyavaş",
    "fieldResponsible": "Muhammed Ali ÖZER"
  },
  {
    "dissap": "76290835",
    "crmCreateDate": "15.08.2025",
    "firmName": "Tekirdağ BCS Servis",
    "district": "Süleymanpaşa",
    "city": "TEKİRDAĞ",
    "regionManager": "Ünal Özyavaş",
    "fieldResponsible": "Muhammed Ali ÖZER"
  },
  {
    "dissap": "76290972",
    "crmCreateDate": "15.01.2025",
    "firmName": "Sakarya BCS Otomotiv",
    "district": "Adapazarı",
    "city": "SAKARYA",
    "regionManager": "Ünal Özyavaş",
    "fieldResponsible": "Muhammed Ali ÖZER"
  },
  {
    "dissap": "76291109",
    "crmCreateDate": "15.02.2025",
    "firmName": "Serdivan BCS Teknik",
    "district": "Serdivan",
    "city": "SAKARYA",
    "regionManager": "Ünal Özyavaş",
    "fieldResponsible": "Muhammed Ali ÖZER"
  },
  {
    "dissap": "76291246",
    "crmCreateDate": "15.03.2025",
    "firmName": "Dıramalı Otomotiv",
    "district": "Menteşe",
    "city": "MUĞLA",
    "regionManager": "Uğur KESKİN",
    "fieldResponsible": "Fatih ÖNER"
  },
  {
    "dissap": "76291383",
    "crmCreateDate": "15.04.2025",
    "firmName": "Bodrum Yarımada BCS",
    "district": "Bodrum",
    "city": "MUĞLA",
    "regionManager": "Uğur KESKİN",
    "fieldResponsible": "Fatih ÖNER"
  },
  {
    "dissap": "76291520",
    "crmCreateDate": "15.05.2025",
    "firmName": "Aydın Efeler BCS",
    "district": "Efeler",
    "city": "AYDIN",
    "regionManager": "Uğur KESKİN",
    "fieldResponsible": "Fatih ÖNER"
  },
  {
    "dissap": "76291657",
    "crmCreateDate": "15.06.2025",
    "firmName": "Kuşadası Sahil BCS",
    "district": "Kuşadası",
    "city": "AYDIN",
    "regionManager": "Uğur KESKİN",
    "fieldResponsible": "Fatih ÖNER"
  },
  {
    "dissap": "76291794",
    "crmCreateDate": "15.07.2025",
    "firmName": "Manisa Organize BCS",
    "district": "Yunusemre",
    "city": "MANİSA",
    "regionManager": "Uğur KESKİN",
    "fieldResponsible": "Fatih ÖNER"
  },
  {
    "dissap": "76291931",
    "crmCreateDate": "15.08.2025",
    "firmName": "Akhisar BCS Teknik",
    "district": "Akhisar",
    "city": "MANİSA",
    "regionManager": "Uğur KESKİN",
    "fieldResponsible": "Fatih ÖNER"
  },
  {
    "dissap": "76292068",
    "crmCreateDate": "15.01.2025",
    "firmName": "Şanlıurfa BCS Otomotiv",
    "district": "Haliliye",
    "city": "ŞANLIURFA",
    "regionManager": "Metin ARAS",
    "fieldResponsible": "Fatih ÖNER"
  },
  {
    "dissap": "76292205",
    "crmCreateDate": "15.02.2025",
    "firmName": "Karaköprü BCS Teknik",
    "district": "Karaköprü",
    "city": "ŞANLIURFA",
    "regionManager": "Metin ARAS",
    "fieldResponsible": "Fatih ÖNER"
  },
  {
    "dissap": "76292342",
    "crmCreateDate": "15.03.2025",
    "firmName": "Malatya BCS Servis",
    "district": "Battalgazi",
    "city": "MALATYA",
    "regionManager": "Metin ARAS",
    "fieldResponsible": "Fatih ÖNER"
  },
  {
    "dissap": "76292479",
    "crmCreateDate": "15.04.2025",
    "firmName": "Yeşilyurt Sanayi BCS",
    "district": "Yeşilyurt",
    "city": "MALATYA",
    "regionManager": "Metin ARAS",
    "fieldResponsible": "Fatih ÖNER"
  },
  {
    "dissap": "76292616",
    "crmCreateDate": "15.05.2025",
    "firmName": "İskenderun BCS Körfez",
    "district": "İskenderun",
    "city": "HATAY",
    "regionManager": "Özgür KASAP",
    "fieldResponsible": "Halil Onat ÖZKAN"
  },
  {
    "dissap": "76292753",
    "crmCreateDate": "15.06.2025",
    "firmName": "Antakya BCS Teknik",
    "district": "Antakya",
    "city": "HATAY",
    "regionManager": "Özgür KASAP",
    "fieldResponsible": "Halil Onat ÖZKAN"
  },
  {
    "dissap": "76292890",
    "crmCreateDate": "15.07.2025",
    "firmName": "Beyazlar Otomotiv",
    "district": "Merkez",
    "city": "SİNOP",
    "regionManager": "Ünal Özyavaş",
    "fieldResponsible": "Uğur TASLAK"
  },
  {
    "dissap": "76293027",
    "crmCreateDate": "15.08.2025",
    "firmName": "Kiraz Otomotiv",
    "district": "Merkez",
    "city": "KARABÜK",
    "regionManager": "Ünal Özyavaş",
    "fieldResponsible": "Muhammed Ali ÖZER"
  },
  {
    "dissap": "76293164",
    "crmCreateDate": "15.01.2025",
    "firmName": "Sivas BCS Otomotiv",
    "district": "Merkez",
    "city": "SİVAS",
    "regionManager": "Cem ÇAP",
    "fieldResponsible": "Uğur TASLAK"
  },
  {
    "dissap": "76293301",
    "crmCreateDate": "15.02.2025",
    "firmName": "Troya BCS Çanakkale",
    "district": "Merkez",
    "city": "ÇANAKKALE",
    "regionManager": "Ünal Özyavaş",
    "fieldResponsible": "Halil Onat ÖZKAN"
  },
  {
    "dissap": "76293438",
    "crmCreateDate": "15.03.2025",
    "firmName": "Erzurum Palandöken BCS",
    "district": "Yakutiye",
    "city": "ERZURUM",
    "regionManager": "Metin ARAS",
    "fieldResponsible": "Fatih ÖNER"
  },
  {
    "dissap": "76293575",
    "crmCreateDate": "15.04.2025",
    "firmName": "Van Gölü BCS Servis",
    "district": "İpekyolu",
    "city": "VAN",
    "regionManager": "Metin ARAS",
    "fieldResponsible": "Fatih ÖNER"
  },
  {
    "dissap": "76293712",
    "crmCreateDate": "15.05.2025",
    "firmName": "Maraş BCS Teknik",
    "district": "Onikişubat",
    "city": "KAHRAMANMARAŞ",
    "regionManager": "Özgür KASAP",
    "fieldResponsible": "Halil Onat ÖZKAN"
  },
  {
    "dissap": "76293849",
    "crmCreateDate": "15.06.2025",
    "firmName": "Batman Petrol BCS",
    "district": "Merkez",
    "city": "BATMAN",
    "regionManager": "Metin ARAS",
    "fieldResponsible": "Fatih ÖNER"
  },
  {
    "dissap": "76293986",
    "crmCreateDate": "15.07.2025",
    "firmName": "Elazığ BCS Servis",
    "district": "Merkez",
    "city": "ELAZIĞ",
    "regionManager": "Metin ARAS",
    "fieldResponsible": "Fatih ÖNER"
  },
  {
    "dissap": "76294123",
    "crmCreateDate": "15.08.2025",
    "firmName": "Afyon Termal BCS",
    "district": "Merkez",
    "city": "AFYONKARAHİSAR",
    "regionManager": "Cem ÇAP",
    "fieldResponsible": "Halil Onat ÖZKAN"
  },
  {
    "dissap": "76294260",
    "crmCreateDate": "15.01.2025",
    "firmName": "Kütahya Çini BCS",
    "district": "Merkez",
    "city": "KÜTAHYA",
    "regionManager": "Cem ÇAP",
    "fieldResponsible": "Halil Onat ÖZKAN"
  },
  {
    "dissap": "76294397",
    "crmCreateDate": "15.02.2025",
    "firmName": "Kdz. Ereğli BCS",
    "district": "Ereğli",
    "city": "ZONGULDAK",
    "regionManager": "Ünal Özyavaş",
    "fieldResponsible": "Muhammed Ali ÖZER"
  },
  {
    "dissap": "76294534",
    "crmCreateDate": "15.03.2025",
    "firmName": "Düzce BCS Servis",
    "district": "Merkez",
    "city": "DÜZCE",
    "regionManager": "Ünal Özyavaş",
    "fieldResponsible": "Muhammed Ali ÖZER"
  },
  {
    "dissap": "76294671",
    "crmCreateDate": "15.04.2025",
    "firmName": "Yalova Sahil BCS",
    "district": "Merkez",
    "city": "YALOVA",
    "regionManager": "Ünal Özyavaş",
    "fieldResponsible": "Halil Onat ÖZKAN"
  },
  {
    "dissap": "76294808",
    "crmCreateDate": "15.05.2025",
    "firmName": "Osmaniye BCS Otomotiv",
    "district": "Merkez",
    "city": "OSMANİYE",
    "regionManager": "Özgür KASAP",
    "fieldResponsible": "Halil Onat ÖZKAN"
  },
  {
    "dissap": "76294945",
    "crmCreateDate": "15.06.2025",
    "firmName": "Lüleburgaz BCS",
    "district": "Lüleburgaz",
    "city": "KIRKLARELİ",
    "regionManager": "Ünal Özyavaş",
    "fieldResponsible": "Muhammed Ali ÖZER"
  },
  {
    "dissap": "76295082",
    "crmCreateDate": "15.07.2025",
    "firmName": "Edirne Serhat BCS",
    "district": "Merkez",
    "city": "EDİRNE",
    "regionManager": "Ünal Özyavaş",
    "fieldResponsible": "Muhammed Ali ÖZER"
  },
  {
    "dissap": "76295219",
    "crmCreateDate": "15.08.2025",
    "firmName": "Ordu Sahil BCS",
    "district": "Altınordu",
    "city": "ORDU",
    "regionManager": "Ünal Özyavaş",
    "fieldResponsible": "Uğur TASLAK"
  },
  {
    "dissap": "76295356",
    "crmCreateDate": "15.01.2025",
    "firmName": "Giresun BCS Servis",
    "district": "Merkez",
    "city": "GİRESUN",
    "regionManager": "Ünal Özyavaş",
    "fieldResponsible": "Uğur TASLAK"
  },
  {
    "dissap": "76295493",
    "crmCreateDate": "15.02.2025",
    "firmName": "Rize Çay BCS Servis",
    "district": "Merkez",
    "city": "RİZE",
    "regionManager": "Ünal Özyavaş",
    "fieldResponsible": "Uğur TASLAK"
  },
  {
    "dissap": "76295630",
    "crmCreateDate": "15.03.2025",
    "firmName": "Kapadokya BCS",
    "district": "Merkez",
    "city": "NEVŞEHİR",
    "regionManager": "Cem ÇAP",
    "fieldResponsible": "Uğur TASLAK"
  },
  {
    "dissap": "76295767",
    "crmCreateDate": "15.04.2025",
    "firmName": "Aksaray BCS Otomotiv",
    "district": "Merkez",
    "city": "AKSARAY",
    "regionManager": "Cem ÇAP",
    "fieldResponsible": "Uğur TASLAK"
  },
  {
    "dissap": "76295904",
    "crmCreateDate": "15.05.2025",
    "firmName": "Isparta Gül BCS",
    "district": "Merkez",
    "city": "ISPARTA",
    "regionManager": "Şafak Dommasch",
    "fieldResponsible": "Uğur TASLAK"
  },
  {
    "dissap": "76296041",
    "crmCreateDate": "15.06.2025",
    "firmName": "Burdur BCS Teknik",
    "district": "Merkez",
    "city": "BURDUR",
    "regionManager": "Şafak Dommasch",
    "fieldResponsible": "Uğur TASLAK"
  },
  {
    "dissap": "76296178",
    "crmCreateDate": "15.07.2025",
    "firmName": "Kars Serhat BCS",
    "district": "Merkez",
    "city": "KARS",
    "regionManager": "Metin ARAS",
    "fieldResponsible": "Fatih ÖNER"
  },
  {
    "dissap": "76296315",
    "crmCreateDate": "15.08.2025",
    "firmName": "Ağrı Dağı BCS",
    "district": "Doğubayazıt",
    "city": "AĞRI",
    "regionManager": "Metin ARAS",
    "fieldResponsible": "Fatih ÖNER"
  },
  {
    "dissap": "76296452",
    "crmCreateDate": "15.01.2025",
    "firmName": "Tokat BCS Servis",
    "district": "Merkez",
    "city": "TOKAT",
    "regionManager": "Cem ÇAP",
    "fieldResponsible": "Uğur TASLAK"
  },
  {
    "dissap": "76296589",
    "crmCreateDate": "15.02.2025",
    "firmName": "Merzifon BCS Teknik",
    "district": "Merzifon",
    "city": "AMASYA",
    "regionManager": "Ünal Özyavaş",
    "fieldResponsible": "Uğur TASLAK"
  },
  {
    "dissap": "76296726",
    "crmCreateDate": "15.03.2025",
    "firmName": "Kastamonu BCS Motor",
    "district": "Merkez",
    "city": "KASTAMONU",
    "regionManager": "Ünal Özyavaş",
    "fieldResponsible": "Muhammed Ali ÖZER"
  },
  {
    "dissap": "76296863",
    "crmCreateDate": "15.04.2025",
    "firmName": "Bolu Dağı BCS",
    "district": "Merkez",
    "city": "BOLU",
    "regionManager": "Ünal Özyavaş",
    "fieldResponsible": "Muhammed Ali ÖZER"
  },
  {
    "dissap": "76297000",
    "crmCreateDate": "15.05.2025",
    "firmName": "Bozüyük BCS Teknik",
    "district": "Bozüyük",
    "city": "BİLECİK",
    "regionManager": "Ünal Özyavaş",
    "fieldResponsible": "Halil Onat ÖZKAN"
  },
  {
    "dissap": "76297137",
    "crmCreateDate": "15.06.2025",
    "firmName": "Uşak Ege BCS",
    "district": "Merkez",
    "city": "UŞAK",
    "regionManager": "Uğur KESKİN",
    "fieldResponsible": "Fatih ÖNER"
  },
  {
    "dissap": "76297274",
    "crmCreateDate": "15.07.2025",
    "firmName": "Mardin Mezopotamya BCS",
    "district": "Kızıltepe",
    "city": "MARDİN",
    "regionManager": "Metin ARAS",
    "fieldResponsible": "Fatih ÖNER"
  },
  {
    "dissap": "76297411",
    "crmCreateDate": "15.08.2025",
    "firmName": "Nemrut BCS Adıyaman",
    "district": "Merkez",
    "city": "ADIYAMAN",
    "regionManager": "Metin ARAS",
    "fieldResponsible": "Fatih ÖNER"
  },
  {
    "dissap": "76297548",
    "crmCreateDate": "15.01.2025",
    "firmName": "Çorum Hitit BCS",
    "district": "Merkez",
    "city": "ÇORUM",
    "regionManager": "Cem ÇAP",
    "fieldResponsible": "Uğur TASLAK"
  }
];
