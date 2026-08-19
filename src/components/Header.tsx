import React from 'react';
import { ActiveMenu, User } from '../types';
import { Menu, ShieldCheck, UserCheck, RefreshCw } from 'lucide-react';

interface HeaderProps {
  activeMenu: ActiveMenu;
  currentUser: User | null;
  onOpenMobileSidebar: () => void;
  totalItemsCount: number;
  isFirebaseSyncing?: boolean;
  onSyncCloud?: () => void;
  isSyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeMenu,
  currentUser,
  onOpenMobileSidebar,
  totalItemsCount,
  isFirebaseSyncing = true,
  onSyncCloud,
  isSyncing = false
}) => {
  const getPageTitle = (menu: ActiveMenu) => {
    switch (menu) {
      case 'input':
        return {
          title: 'Input Barang Baru',
          subtitle: 'Catat aset dan barang baru ke dalam sistem inventaris sekolah'
        };
      case 'list':
        return {
          title: 'Data Inventaris & Barcode',
          subtitle: `Kelola ${totalItemsCount} item barang, cetak label, dan unduh barcode`
        };
      case 'scan':
        return {
          title: 'Scanner Barcode & QR',
          subtitle: 'Pindai barcode barang menggunakan kamera secara langsung atau cari manual'
        };
      case 'users':
        return {
          title: 'Manajemen Pengguna',
          subtitle: 'Kelola akun administrator dan staf operator sistem inventaris'
        };
      case 'settings':
        return {
          title: 'Pengaturan Profil Sekolah',
          subtitle: 'Kustomisasi identitas, nama, alamat, nomor kontak, dan logo sekolah'
        };
      default:
        return { title: 'Dashboard', subtitle: 'Sistem Inventaris Sekolah' };
    }
  };

  const pageInfo = getPageTitle(activeMenu);

  return (
    <header className="bg-white border-b border-slate-200/80 px-4 sm:px-8 py-4 sticky top-0 z-20 flex justify-between items-center shadow-xs">
      <div className="flex items-center gap-3.5">
        <button
          id="btn-open-sidebar-mobile"
          onClick={onOpenMobileSidebar}
          className="p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 lg:hidden"
          aria-label="Buka Menu Navigasi"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div>
          <h2 id="page-title" className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
            {pageInfo.title}
          </h2>
          <p className="text-xs text-slate-500 font-normal hidden sm:block mt-0.5">
            {pageInfo.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {onSyncCloud && (
          <button
            id="btn-header-sync-cloud"
            onClick={onSyncCloud}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e6f6ee] hover:bg-[#d5f0e1] text-[#009B4C] border border-[#a4e2c0] rounded-lg text-xs font-bold transition-all shadow-xs disabled:opacity-50"
            title="Klik untuk menyinkronkan data terbaru dari Cloud Firebase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isSyncing ? 'Menyinkronkan...' : 'Sinkron Cloud'}</span>
          </button>
        )}

        {isFirebaseSyncing && !onSyncCloud && (
          <div
            id="realtime-status-badge"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#e6f6ee] text-[#009B4C] border border-[#a4e2c0] rounded-full text-[11px] font-bold shadow-xs"
            title="Database Firestore terhubung realtime"
          >
            <span className="w-2 h-2 rounded-full bg-[#009B4C] animate-pulse" />
            <span>Realtime Cloud</span>
          </div>
        )}

        <div className="text-right hidden md:block">
          <p id="active-user-name" className="text-sm font-bold text-slate-800 leading-tight">
            {currentUser?.name || 'Administrator'}
          </p>
          <div className="flex items-center justify-end gap-1.5 mt-0.5">
            <span
              id="active-user-role"
              className={`text-[11px] font-bold px-2 py-0.2 rounded-full border ${
                currentUser?.role === 'Administrator'
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              {currentUser?.role || 'Admin'}
            </span>
          </div>
        </div>

        <div className="w-10 h-10 rounded-xl bg-[#e6f6ee] text-[#009B4C] flex items-center justify-center border border-[#a4e2c0] shadow-xs font-bold text-sm">
          {currentUser?.role === 'Administrator' ? (
            <ShieldCheck className="w-5 h-5 text-[#009B4C]" />
          ) : (
            <UserCheck className="w-5 h-5 text-[#009B4C]" />
          )}
        </div>
      </div>
    </header>
  );
};
