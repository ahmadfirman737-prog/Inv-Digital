import React from 'react';
import { ActiveMenu, SchoolSettings, User } from '../types';
import {
  Boxes,
  PlusCircle,
  ClipboardList,
  QrCode,
  Users,
  Settings,
  LogOut,
  GraduationCap,
  X
} from 'lucide-react';

interface SidebarProps {
  activeMenu: ActiveMenu;
  onSelectMenu: (menu: ActiveMenu) => void;
  onLogout: () => void;
  schoolSettings: SchoolSettings;
  currentUser: User | null;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeMenu,
  onSelectMenu,
  onLogout,
  schoolSettings,
  isOpenMobile,
  onCloseMobile
}) => {
  const navItems = [
    {
      id: 'input' as ActiveMenu,
      label: 'Input Barang',
      icon: PlusCircle,
      badge: null
    },
    {
      id: 'list' as ActiveMenu,
      label: 'Data Inventaris',
      icon: ClipboardList,
      badge: null
    },
    {
      id: 'scan' as ActiveMenu,
      label: 'Scan Barcode',
      icon: QrCode,
      badge: 'Kamera'
    },
    {
      id: 'users' as ActiveMenu,
      label: 'Manajemen Pengguna',
      icon: Users,
      badge: null
    },
    {
      id: 'settings' as ActiveMenu,
      label: 'Pengaturan',
      icon: Settings,
      badge: null
    }
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpenMobile && (
        <div
          id="sidebar-backdrop"
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 z-30 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      <aside
        id="app-sidebar"
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-72 bg-white border-r border-slate-200/90 shadow-xl lg:shadow-none flex flex-col flex-shrink-0 transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              id="sidebar-logo-container"
              className="flex-shrink-0 flex items-center justify-center"
            >
              {schoolSettings.logo ? (
                <img
                  id="sidebar-logo-img"
                  src={schoolSettings.logo}
                  alt="Logo"
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 object-contain drop-shadow-sm"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-[#009B4C] text-white flex items-center justify-center shadow-md shadow-[#009B4C]/20">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-extrabold text-slate-900 text-base leading-tight truncate">
                Inventaris Digital
              </h3>
              <p
                id="sidebar-school-name"
                className="text-xs font-bold text-[#009B4C] truncate mt-0.5"
                title={schoolSettings.shortName}
              >
                {schoolSettings.shortName}
              </p>
            </div>
          </div>

          <button
            id="btn-close-sidebar-mobile"
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-slate-700 lg:hidden rounded-lg hover:bg-slate-100"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 py-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            Menu Utama
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => {
                  onSelectMenu(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-150 group cursor-pointer ${
                  isActive
                    ? 'bg-[#009B4C] text-white shadow-md shadow-[#009B4C]/25 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-[#009B4C]'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-[#e6f6ee] text-[#009B4C]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer with logout */}
        <div className="p-4 border-t border-slate-100 space-y-3 bg-slate-50/50">
          <button
            id="btn-logout"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-3 text-rose-600 bg-rose-50 hover:bg-rose-100/90 rounded-xl text-sm font-semibold transition-colors duration-150 cursor-pointer border border-rose-200/60"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Aplikasi</span>
          </button>
        </div>
      </aside>
    </>
  );
};
