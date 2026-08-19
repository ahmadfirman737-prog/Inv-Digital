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

export const DEFAULT_INVENTORY_ITEMS: InventoryItem[] = [];

export function getStoredInventory(): InventoryItem[] {
  try {
    const raw = localStorage.getItem('kb_inventory_items');
    if (!raw) {
      localStorage.setItem('kb_inventory_items', JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    // If it contains legacy mock items (id starting with 'inv-'), purge them
    if (Array.isArray(parsed) && parsed.some((item) => String(item.id).startsWith('inv-'))) {
      localStorage.setItem('kb_inventory_items', JSON.stringify([]));
      return [];
    }
    return parsed;
  } catch {
    return [];
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
