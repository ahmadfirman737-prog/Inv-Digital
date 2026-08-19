import { InventoryItem, SchoolSettings, User } from '../types';

export const DEFAULT_USERS: User[] = [
  {
    id: 1,
    name: 'Ahmad Firmansyah',
    username: 'Ahmadfirmansyah',
    password: 'Kusumabangsa123.',
    role: 'Administrator',
    createdAt: '2026-01-10T08:00:00.000Z'
  },
  {
    id: 2,
    name: 'Staff Inventaris',
    username: 'staff',
    password: 'staff123',
    role: 'Staff',
    createdAt: '2026-01-15T09:30:00.000Z'
  }
];

export const DEFAULT_SCHOOL_SETTINGS: SchoolSettings = {
  name: 'SMP KUSUMA BANGSA BOGOR',
  shortName: 'SMP Kusuma Bangsa',
  address: 'Jl. Raya Ciapus No 53. Rt 03 Rw 14\nDesa Kota Batu Kecamatan Ciomas\nKabupaten Bogor 16610',
  phone: '(0251) 8487725',
  email: 'smpkusumabangsa@bogor.sch.id',
  principalName: 'Drs. H. Mulyadi, M.Pd.',
  logo: 'https://lh3.googleusercontent.com/d/1tyQ3LYEHPDAtib8NHZJJkii7Os1ota6t'
};

export const DEFAULT_INVENTORY_ITEMS: InventoryItem[] = [
  {
    id: 'inv-1',
    name: 'Proyektor Epson EB-X51',
    serial: 'EPS-2023-001',
    year: 2023,
    budget: 'BOS Pusat',
    spec: 'Resolusi XGA, 3800 Lumens, HDMI, VGA, Termasuk Tas dan Remote.',
    photo: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
    category: 'Elektronik & Multimedia',
    condition: 'Baik',
    location: 'Lab Komputer 1',
    createdAt: '2026-01-05T10:00:00.000Z'
  },
  {
    id: 'inv-2',
    name: 'Laptop Lenovo ThinkPad L14',
    serial: 'LNV-2024-055',
    year: 2024,
    budget: 'BOS Daerah',
    spec: 'Intel Core i5 Gen 12, RAM 16GB, SSD 512GB, Windows 11 Pro.',
    photo: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80',
    category: 'Komputer & IT',
    condition: 'Baik',
    location: 'Ruang Guru / Kurikulum',
    createdAt: '2026-01-12T11:15:00.000Z'
  },
  {
    id: 'inv-3',
    name: 'Smart TV Samsung 55 Inch 4K',
    serial: 'SMG-2024-019',
    year: 2024,
    budget: 'Yayasan',
    spec: 'Crystal UHD 4K, HDR10+, Smart Hub, Bracket Dinding, Wi-Fi 5.',
    photo: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&auto=format&fit=crop&q=80',
    category: 'Elektronik & Multimedia',
    condition: 'Baik',
    location: 'Ruang Multimedia / Aula',
    createdAt: '2026-02-01T08:30:00.000Z'
  },
  {
    id: 'inv-4',
    name: 'Printer Epson EcoTank L3210',
    serial: 'EPS-2023-088',
    year: 2023,
    budget: 'BOS Pusat',
    spec: 'All-in-One Ink Tank (Print, Scan, Copy), Borderless 4R, USB 2.0.',
    photo: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=600&auto=format&fit=crop&q=80',
    category: 'Perangkat Kantor',
    condition: 'Baik',
    location: 'Ruang Tata Usaha (TU)',
    createdAt: '2026-02-10T14:20:00.000Z'
  },
  {
    id: 'inv-5',
    name: 'Mikroskop Binokuler Olympus CX23',
    serial: 'OLY-2022-004',
    year: 2022,
    budget: 'Sumbangan / Hibah',
    spec: 'Pembesaran 40x - 1000x, Lensa Achromat, Lampu LED Eco-friendly.',
    photo: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=600&auto=format&fit=crop&q=80',
    category: 'Alat Laboratorium IPA',
    condition: 'Baik',
    location: 'Lab IPA',
    createdAt: '2026-02-15T09:00:00.000Z'
  }
];

export function getStoredInventory(): InventoryItem[] {
  try {
    const raw = localStorage.getItem('kb_inventory_items');
    if (!raw) {
      localStorage.setItem('kb_inventory_items', JSON.stringify(DEFAULT_INVENTORY_ITEMS));
      return DEFAULT_INVENTORY_ITEMS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_INVENTORY_ITEMS;
  }
}

export function saveStoredInventory(items: InventoryItem[]): void {
  try {
    localStorage.setItem('kb_inventory_items', JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save inventory to localStorage', err);
  }
}

export function getStoredUsers(): User[] {
  try {
    const raw = localStorage.getItem('kb_inventory_users');
    if (!raw) {
      localStorage.setItem('kb_inventory_users', JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    const parsed: User[] = JSON.parse(raw);
    const hasAhmadAdmin = parsed.some(
      (u) => u.username.toLowerCase() === 'ahmadfirmansyah'
    );
    if (!hasAhmadAdmin) {
      const adminIndex = parsed.findIndex((u) => u.role === 'Administrator' || u.username === 'admin');
      if (adminIndex !== -1) {
        parsed[adminIndex] = {
          ...parsed[adminIndex],
          name: 'Ahmad Firmansyah',
          username: 'Ahmadfirmansyah',
          password: 'Kusumabangsa123.',
          role: 'Administrator'
        };
      } else {
        parsed.unshift(DEFAULT_USERS[0]);
      }
      localStorage.setItem('kb_inventory_users', JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return DEFAULT_USERS;
  }
}

export function saveStoredUsers(users: User[]): void {
  try {
    localStorage.setItem('kb_inventory_users', JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save users to localStorage', err);
  }
}

export function getStoredSchoolSettings(): SchoolSettings {
  try {
    const raw = localStorage.getItem('kb_school_settings');
    if (!raw) {
      localStorage.setItem('kb_school_settings', JSON.stringify(DEFAULT_SCHOOL_SETTINGS));
      return DEFAULT_SCHOOL_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    if (!parsed.logo) {
      parsed.logo = DEFAULT_SCHOOL_SETTINGS.logo;
      localStorage.setItem('kb_school_settings', JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return DEFAULT_SCHOOL_SETTINGS;
  }
}

export function saveStoredSchoolSettings(settings: SchoolSettings): void {
  try {
    localStorage.setItem('kb_school_settings', JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save school settings to localStorage', err);
  }
}

export function getStoredCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem('kb_current_user');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveStoredCurrentUser(user: User | null): void {
  try {
    if (!user) {
      localStorage.removeItem('kb_current_user');
    } else {
      localStorage.setItem('kb_current_user', JSON.stringify(user));
    }
  } catch (err) {
    console.error('Failed to save current user to localStorage', err);
  }
}

export function playBeepSound(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
    gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.15);
  } catch (e) {
    console.warn('Audio not supported or blocked by browser gesture policy', e);
  }
}
