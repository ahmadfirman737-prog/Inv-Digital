export type UserRole = 'Administrator' | 'Staff';

export interface User {
  id: string | number;
  name: string;
  username: string;
  password?: string;
  role: UserRole;
  createdAt?: string;
}

export type BudgetSource = 'BOS Pusat' | 'BOS Daerah' | 'Bantuan Pemerintah Pusat' | 'Yayasan' | 'Sumbangan / Hibah' | 'DAK' | 'DAK (Dana Alokasi Khusus)' | 'Kas Sekolah' | string;
export type ItemCondition = 'Baik' | 'Rusak Ringan' | 'Rusak Berat';

export interface InventoryItem {
  id: string | number;
  name: string;
  serial: string;
  year: number | string;
  budget: BudgetSource;
  spec: string;
  photo?: string;
  category?: string;
  condition?: ItemCondition;
  location?: string;
  createdAt?: string;
}

export interface SchoolSettings {
  name: string;
  shortName: string;
  address: string;
  phone: string;
  email?: string;
  principalName?: string;
  logo: string | null;
}

export type ActiveMenu = 'input' | 'list' | 'scan' | 'users' | 'settings';

export interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}
