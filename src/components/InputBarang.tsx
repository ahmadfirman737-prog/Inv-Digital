import React, { useState } from 'react';
import { InventoryItem } from '../types';
import {
  Keyboard,
  Save,
  Camera,
  Trash2,
  Sparkles,
  Layers,
  MapPin,
  CheckCircle2,
  RotateCcw
} from 'lucide-react';

interface InputBarangProps {
  onAddItem: (item: InventoryItem) => Promise<boolean> | boolean;
  onNavigateToList: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

// Compress and resize image client-side to ensure ultra-fast realtime cloud storage
function compressImageFile(file: File, maxWidth = 800, quality = 0.75): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(event.target?.result as string);
      img.src = event.target?.result as string;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

export const InputBarang: React.FC<InputBarangProps> = ({
  onAddItem,
  onNavigateToList,
  showToast
}) => {
  const currentYear = new Date().getFullYear();
  const [name, setName] = useState('');
  const [serial, setSerial] = useState('');
  const [year, setYear] = useState<number | string>(currentYear);
  const [budget, setBudget] = useState('BOS Pusat');
  const [category, setCategory] = useState('Elektronik & Multimedia');
  const [location, setLocation] = useState('Lab Komputer 1');
  const [condition, setCondition] = useState<'Baik' | 'Rusak Ringan' | 'Rusak Berat'>('Baik');
  const [spec, setSpec] = useState('');
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate unique serial code helper
  const handleAutoGenerateSerial = () => {
    const prefix = name
      ? name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'AST')
      : 'KB';
    const rand = Math.floor(1000 + Math.random() * 9000);
    const yr = year || currentYear;
    const generated = `${prefix}-${yr}-${rand}`;
    setSerial(generated);
    showToast(`Nomor seri otomatis dibuat: ${generated}`, 'info');
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImageFile(file, 800, 0.75);
        if (compressedBase64) {
          setPhotoBase64(compressedBase64);
          showToast('Foto berhasil dimuat & dioptimasi untuk cloud', 'info');
        } else {
          showToast('Gagal memproses file foto', 'error');
        }
      } catch {
        showToast('Gagal memproses foto', 'error');
      }
    }
  };

  const handleRemovePhoto = () => {
    setPhotoBase64(null);
  };

  const handleReset = () => {
    setName('');
    setSerial('');
    setYear(currentYear);
    setBudget('BOS Pusat');
    setCategory('Elektronik & Multimedia');
    setLocation('Lab Komputer 1');
    setCondition('Baik');
    setSpec('');
    setPhotoBase64(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !serial.trim()) {
      showToast('Nama Barang dan Nomor Seri wajib diisi!', 'error');
      return;
    }

    setIsSubmitting(true);

    const newItem: InventoryItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      serial: serial.trim().toUpperCase(),
      year: Number(year) || currentYear,
      budget,
      spec: spec.trim() || 'Tidak ada spesifikasi khusus tercatat.',
      photo: photoBase64 || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80',
      category,
      location,
      condition,
      createdAt: new Date().toISOString()
    };

    try {
      const success = await onAddItem(newItem);
      if (success) {
        handleReset();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="menu-input" className="max-w-5xl mx-auto">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 p-6 sm:p-8 lg:p-10">
        
        {/* Section Title Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-[#e6f6ee] text-[#009B4C] rounded-2xl border border-[#a4e2c0] shadow-xs">
              <Keyboard className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Formulir Input Barang Baru
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Barcode akan di-generate otomatis begitu nomor seri tersimpan.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-nav-to-list"
              onClick={onNavigateToList}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Lihat Daftar Barang
            </button>
          </div>
        </div>

        <form id="form-input-barang" onSubmit={handleSubmit} className="space-y-6">
          
          {/* Main Attributes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Nama Barang */}
            <div className="space-y-1.5">
              <label htmlFor="item-name" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span>Nama Barang / Aset</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="item-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-[#009B4C] focus:border-[#009B4C] outline-none transition-all"
                placeholder="Contoh: Proyektor Epson EB-X51"
              />
            </div>

            {/* Nomor Seri / Kode */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="item-serial" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <span>Nomor Seri / Kode Inventaris</span>
                  <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  id="btn-auto-serial"
                  onClick={handleAutoGenerateSerial}
                  className="text-[11px] font-semibold text-[#009B4C] hover:text-[#007338] flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Auto-Gen SN
                </button>
              </div>
              <input
                type="text"
                id="item-serial"
                required
                value={serial}
                onChange={(e) => setSerial(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-mono focus:bg-white focus:ring-2 focus:ring-[#009B4C] focus:border-[#009B4C] outline-none transition-all uppercase"
                placeholder="Contoh: EPS-2023-001"
              />
            </div>

            {/* Tahun Pembelian */}
            <div className="space-y-1.5">
              <label htmlFor="item-year" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span>Tahun Pembelian / Pengadaan</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                id="item-year"
                required
                min={1990}
                max={2099}
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-[#009B4C] focus:border-[#009B4C] outline-none transition-all"
                placeholder="Contoh: 2024"
              />
            </div>

            {/* Sumber Anggaran */}
            <div className="space-y-1.5">
              <label htmlFor="item-budget" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span>Sumber Anggaran</span>
                <span className="text-rose-500">*</span>
              </label>
              <select
                id="item-budget"
                required
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-[#009B4C] focus:border-[#009B4C] outline-none transition-all"
              >
                <option value="BOS Pusat">BOS Pusat</option>
                <option value="BOS Daerah">BOS Daerah</option>
                <option value="Bantuan Pemerintah Pusat">Bantuan Pemerintah Pusat</option>
                <option value="Yayasan">Yayasan</option>
                <option value="Sumbangan / Hibah">Sumbangan / Hibah</option>
                <option value="DAK (Dana Alokasi Khusus)">DAK (Dana Alokasi Khusus)</option>
                <option value="Kas Sekolah">Kas Sekolah</option>
              </select>
            </div>

            {/* Kategori Barang */}
            <div className="space-y-1.5">
              <label htmlFor="item-category" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>Kategori Barang</span>
              </label>
              <select
                id="item-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-[#009B4C] focus:border-[#009B4C] outline-none transition-all"
              >
                <option value="Elektronik & Multimedia">Elektronik & Multimedia</option>
                <option value="Komputer & IT">Komputer & IT</option>
                <option value="Perangkat Kantor">Perangkat Kantor</option>
                <option value="Alat Laboratorium IPA">Alat Laboratorium IPA</option>
                <option value="Sarana Olahraga">Sarana Olahraga</option>
                <option value="Meubel & Furniture">Meubel & Furniture</option>
                <option value="Buku & Pustaka">Buku & Pustaka</option>
                <option value="Lain-lain">Lain-lain</option>
              </select>
            </div>

            {/* Lokasi Penempatan */}
            <div className="space-y-1.5">
              <label htmlFor="item-location" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Lokasi Penempatan Ruangan</span>
              </label>
              <input
                type="text"
                id="item-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-[#009B4C] focus:border-[#009B4C] outline-none transition-all"
                placeholder="Contoh: Lab Komputer 1, Ruang TU, Lab IPA"
              />
            </div>
          </div>

          {/* Kondisi Barang Pills */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Kondisi Barang Saat Ini
            </label>
            <div className="flex flex-wrap gap-3">
              {(['Baik', 'Rusak Ringan', 'Rusak Berat'] as const).map((cond) => (
                <button
                  type="button"
                  key={cond}
                  id={`condition-${cond.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => setCondition(cond)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    condition === cond
                      ? cond === 'Baik'
                        ? 'bg-[#009B4C] text-white border-[#009B4C] shadow-sm'
                        : cond === 'Rusak Ringan'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                        : 'bg-rose-600 text-white border-rose-600 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cond}
                </button>
              ))}
            </div>
          </div>

          {/* Spesifikasi Lengkap */}
          <div className="space-y-1.5">
            <label htmlFor="item-spec" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <span>Spesifikasi Lengkap & Catatan</span>
              <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="item-spec"
              required
              rows={3}
              value={spec}
              onChange={(e) => setSpec(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-[#009B4C] focus:border-[#009B4C] outline-none transition-all resize-none"
              placeholder="Masukkan detail merk, ukuran, warna, nomor model, kelengkapan aksesoris, dsb..."
            />
          </div>

          {/* Foto Barang Upload & Preview */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Foto Barang / Dokumentasi Fisik
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <label
                htmlFor="item-photo"
                className="cursor-pointer flex flex-col items-center justify-center w-36 h-36 bg-white border-2 border-dashed border-[#a4e2c0] rounded-2xl hover:bg-[#e6f6ee]/60 hover:border-[#009B4C] transition-colors relative overflow-hidden group shadow-xs flex-shrink-0"
              >
                {photoBase64 ? (
                  <img
                    id="photo-preview"
                    src={photoBase64}
                    alt="Preview Barang"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-3 text-center">
                    <Camera className="w-7 h-7 text-[#009B4C] mb-1.5 group-hover:scale-110 transition-transform" />
                    <span className="text-xs text-slate-600 font-semibold">Pilih Foto</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">JPG / PNG</span>
                  </div>
                )}
                <input
                  type="file"
                  id="item-photo"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>

              <div className="text-xs text-slate-500 space-y-1.5 flex-1">
                <p className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#009B4C]" />
                  Format didukung: JPG, PNG, WEBP (Maksimal 2MB).
                </p>
                <p>
                  Foto akan dicantumkan pada kartu inventaris dan tampil otomatis saat barcode barang di-scan.
                </p>
                {photoBase64 && (
                  <div className="pt-2">
                    <button
                      type="button"
                      id="btn-remove-photo"
                      onClick={handleRemovePhoto}
                      className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-800 font-bold px-3 py-1.5 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Hapus Foto Terpilih
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-3">
            <button
              type="button"
              id="btn-reset-form"
              onClick={handleReset}
              className="w-full sm:w-auto px-5 py-3 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Form
            </button>
            <button
              type="submit"
              id="btn-save-item"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-[#009B4C] to-[#007A3B] hover:from-[#008742] hover:to-[#006631] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#009B4C]/20 hover:shadow-[#009B4C]/35 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer transform active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Data Barang</span>
            </button>
          </div>

        </form>
      </div>
    </section>
  );
};
