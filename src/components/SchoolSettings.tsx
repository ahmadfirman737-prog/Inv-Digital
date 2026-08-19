import React, { useState } from 'react';
import { InventoryItem, SchoolSettings as SchoolSettingsType, User } from '../types';
import {
  School,
  Save,
  Upload,
  Phone,
  MapPin,
  Image as ImageIcon,
  CheckCircle2,
  Trash2,
  Database,
  Download,
  UploadCloud,
  FileCode,
  GraduationCap
} from 'lucide-react';

interface SchoolSettingsProps {
  settings: SchoolSettingsType;
  onSaveSettings: (newSettings: SchoolSettingsType) => void;
  inventoryItems: InventoryItem[];
  users: User[];
  onImportBackup: (items: InventoryItem[], settings: SchoolSettingsType, users: User[]) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const SchoolSettings: React.FC<SchoolSettingsProps> = ({
  settings,
  onSaveSettings,
  inventoryItems,
  users,
  onImportBackup,
  showToast
}) => {
  const [name, setName] = useState(settings.name);
  const [shortName, setShortName] = useState(settings.shortName);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [email, setEmail] = useState(settings.email || '');
  const [principalName, setPrincipalName] = useState(settings.principalName || '');
  const [logo, setLogo] = useState<string | null>(settings.logo);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Ukuran logo terlalu besar! Maksimal 2MB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const res = event.target?.result as string;
        setLogo(res);
        showToast('Logo sekolah berhasil dipilih.', 'info');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogo(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !shortName.trim() || !address.trim()) {
      showToast('Nama dan Alamat Sekolah wajib diisi!', 'error');
      return;
    }

    const updated: SchoolSettingsType = {
      name: name.trim(),
      shortName: shortName.trim(),
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim(),
      principalName: principalName.trim(),
      logo
    };

    onSaveSettings(updated);
    showToast('Profil & Identitas Sekolah berhasil diperbarui!', 'success');
  };

  const handleExportBackupJson = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      schoolSettings: {
        name,
        shortName,
        address,
        phone,
        email,
        principalName,
        logo
      },
      inventoryItems,
      users
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `Backup_Inventaris_${shortName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    showToast('File backup database (JSON) berhasil diunduh!', 'success');
  };

  const handleImportBackupJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.inventoryItems && parsed.schoolSettings) {
            onImportBackup(parsed.inventoryItems, parsed.schoolSettings, parsed.users || users);
            setName(parsed.schoolSettings.name);
            setShortName(parsed.schoolSettings.shortName);
            setAddress(parsed.schoolSettings.address);
            setPhone(parsed.schoolSettings.phone);
            setLogo(parsed.schoolSettings.logo || null);
            showToast('Data inventaris & profil sekolah berhasil dipulihkan!', 'success');
          } else {
            showToast('Format file backup tidak valid!', 'error');
          }
        } catch {
          showToast('Gagal membaca file JSON!', 'error');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <section id="menu-settings" className="space-y-6 max-w-5xl mx-auto">
      
      {/* School Profile Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 p-6 sm:p-8 lg:p-10">
        
        {/* Header */}
        <div className="mb-8 flex items-center gap-3.5 border-b border-slate-100 pb-6">
          <div className="p-3 bg-[#e6f6ee] text-[#009B4C] rounded-2xl border border-[#a4e2c0] shadow-xs">
            <School className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Profil & Identitas Sekolah
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Sesuaikan nama, alamat, nomor telepon, dan logo instansi yang tampil pada login, label stiker, dan header aplikasi.
            </p>
          </div>
        </div>

        <form id="form-settings" onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Nama Sekolah Lengkap */}
            <div className="space-y-1.5">
              <label htmlFor="setting-school-name" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                <span>Nama Sekolah (Lengkap / Formal)</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="setting-school-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-bold focus:bg-white focus:ring-2 focus:ring-[#009B4C] outline-none transition-all"
                placeholder="Contoh: SMP KUSUMA BANGSA BOGOR"
              />
            </div>

            {/* Nama Singkat (Sidebar) */}
            <div className="space-y-1.5">
              <label htmlFor="setting-school-short" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                <span>Nama Singkat (Untuk Sidebar & Label)</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="setting-school-short"
                required
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-bold focus:bg-white focus:ring-2 focus:ring-[#009B4C] outline-none transition-all"
                placeholder="Contoh: SMP Kusuma Bangsa"
              />
            </div>

            {/* Alamat Lengkap */}
            <div className="space-y-1.5 md:col-span-2">
              <label htmlFor="setting-school-address" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Alamat Lengkap (Gunakan Enter untuk Baris Baru)</span>
                <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="setting-school-address"
                required
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#009B4C] outline-none transition-all resize-none"
                placeholder="Masukkan alamat lengkap sekolah..."
              />
            </div>

            {/* Telepon */}
            <div className="space-y-1.5">
              <label htmlFor="setting-school-phone" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Nomor Telepon Sekolah</span>
              </label>
              <input
                type="text"
                id="setting-school-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#009B4C] outline-none transition-all"
                placeholder="Contoh: (0251) 8487725"
              />
            </div>

            {/* Kepala Sekolah */}
            <div className="space-y-1.5">
              <label htmlFor="setting-principal" className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Nama Kepala Sekolah / Penanggung Jawab
              </label>
              <input
                type="text"
                id="setting-principal"
                value={principalName}
                onChange={(e) => setPrincipalName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#009B4C] outline-none transition-all"
                placeholder="Contoh: Drs. H. Mulyadi, M.Pd."
              />
            </div>

            {/* Logo Sekolah */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Logo Instansi / Sekolah
              </label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <label
                  htmlFor="setting-logo-input"
                  className="cursor-pointer flex flex-col items-center justify-center w-32 h-32 bg-transparent hover:opacity-80 transition-opacity relative overflow-hidden group flex-shrink-0"
                >
                  {logo ? (
                    <img
                      id="setting-logo-preview"
                      src={logo}
                      alt="Logo Preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain drop-shadow-sm"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-3 text-center border-2 border-dashed border-[#a4e2c0] rounded-2xl bg-white w-full h-full">
                      <GraduationCap className="w-8 h-8 text-[#009B4C] mb-1" />
                      <span className="text-xs text-slate-600 font-semibold">Upload Logo</span>
                      <span className="text-[10px] text-slate-400">PNG Transparan</span>
                    </div>
                  )}
                  <input
                    type="file"
                    id="setting-logo-input"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>

                <div className="text-xs text-slate-500 space-y-1.5 flex-1">
                  <p className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#009B4C]" />
                    Format didukung: PNG transparan, JPG, WEBP.
                  </p>
                  <p>
                    Logo akan otomatis diperbarui pada halaman login, kartu barcode, dan sidebar aplikasi tanpa bingkai kotak.
                  </p>
                  {logo && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-800 font-bold px-3 py-1 bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Reset ke Logo Default
                    </button>
                  )}
                </div>
              </div>
            </div>

          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              id="btn-save-settings"
              className="px-8 py-3 bg-gradient-to-r from-[#009B4C] to-[#007A3B] hover:from-[#008742] hover:to-[#006631] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#009B4C]/20 hover:shadow-[#009B4C]/35 transition-all flex items-center gap-2 cursor-pointer transform active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan Profil</span>
            </button>
          </div>

        </form>
      </div>

      {/* Database Backup & Restore Utility */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 p-6 sm:p-8">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-5">
          <div className="p-2.5 bg-[#e6f6ee] text-[#009B4C] rounded-xl border border-[#a4e2c0]">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900">Cadangan & Pemulihan Data (Backup & Restore)</h4>
            <p className="text-xs text-slate-500">Amankan seluruh data inventaris dan pengaturan sekolah dalam format JSON</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Download className="w-4 h-4 text-[#009B4C]" />
                Unduh Cadangan Lengkap
              </p>
              <p className="text-xs text-slate-500">
                Ekspor {inventoryItems.length} item inventaris, {users.length} akun pengguna, dan data profil sekolah.
              </p>
            </div>
            <button
              type="button"
              id="btn-download-backup-json"
              onClick={handleExportBackupJson}
              className="mt-4 w-full py-2.5 px-4 bg-white hover:bg-[#e6f6ee] text-[#009B4C] border border-slate-300 hover:border-[#a4e2c0] rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <FileCode className="w-4 h-4" />
              <span>Download Backup JSON</span>
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-[#009B4C]" />
                Pulihkan Data Dari JSON
              </p>
              <p className="text-xs text-slate-500">
                Unggah file backup JSON sebelumnya untuk mengembalikan seluruh catatan aset.
              </p>
            </div>
            <label
              htmlFor="import-backup-file"
              className="mt-4 w-full py-2.5 px-4 bg-[#009B4C] hover:bg-[#008742] text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Upload className="w-4 h-4" />
              <span>Pilih File Backup JSON</span>
              <input
                type="file"
                id="import-backup-file"
                accept=".json"
                onChange={handleImportBackupJson}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

    </section>
  );
};
