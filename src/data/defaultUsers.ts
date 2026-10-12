import { UserAccount } from '../types';

export const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'user-admin',
    username: 'admin',
    name: 'Sistem Yöneticisi (Admin)',
    email: 'admin@bosch.com',
    password: 'abc123',
    role: 'ADMIN',
    roleName: 'Yönetici (Tam Yetkili)',
    description: 'Fiyatlar, matrisler, Excel çıktıları ve sistem tanımlarına tam erişim.',
    status: 'APPROVED',
    createdAt: '2026-01-01T00:00:00.000Z',
    permissions: {
      canViewPricing: true,
      canExportExcel: true,
      canEditServiceCatalog: true,
      canEditDealerList: true,
      canViewDroppedRows: true
    }
  },
  {
    id: 'user-saha',
    username: 'saha',
    name: 'Saha & Operasyon Sorumlusu',
    email: 'saha@bosch.com',
    password: 'saha123',
    role: 'FIELD_OPERATIONS',
    roleName: 'Saha & Operasyon (Fiyatlar Kısıtlı)',
    description: 'Servis ağ matrisi, il/ilçe, online randevu ve katılım verileri. Fiyatlar tamamen gizlidir.',
    status: 'APPROVED',
    createdAt: '2026-01-01T00:00:00.000Z',
    permissions: {
      canViewPricing: false,
      canExportExcel: true,
      canEditServiceCatalog: false,
      canEditDealerList: false,
      canViewDroppedRows: true
    }
  },
  {
    id: 'user-bolge',
    username: 'bolge',
    name: 'Bölge Yöneticisi',
    email: 'bolge@bosch.com',
    password: 'bolge123',
    role: 'REGIONAL_MANAGER',
    roleName: 'Bölge Yöneticisi',
    description: 'Bölge servis ağı takibi, hizmet çeşitliliği ve fiyat analizi erişimi.',
    status: 'APPROVED',
    createdAt: '2026-01-01T00:00:00.000Z',
    permissions: {
      canViewPricing: true,
      canExportExcel: true,
      canEditServiceCatalog: false,
      canEditDealerList: false,
      canViewDroppedRows: true
    }
  }
];
