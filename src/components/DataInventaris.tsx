import React, { useState } from 'react';
import { InventoryItem, SchoolSettings } from '../types';
import { BarcodeRenderer, downloadBarcodeAsPng } from './BarcodeRenderer';
import {
  Search,
  Download,
  Printer,
  Trash2,
  Edit,
  Plus,
  Filter,
  Grid,
  List as TableIcon,
  Tag,
  MapPin,
  Calendar,
  X,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';

interface DataInventarisProps {
  items: InventoryItem[];
  schoolSettings: SchoolSettings;
  onDeleteItem: (id: string | number) => void;
  onUpdateItem: (item: InventoryItem) => void;
  onNavigateToInput: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const DataInventaris: React.FC<DataInventarisProps> = ({
  items,
  schoolSettings,
  onDeleteItem,
  onUpdateItem,
  onNavigateToInput,
  showToast
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBudget, setSelectedBudget] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // Modal states
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [printingItem, setPrintingItem] = useState<InventoryItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  // Filter items
  const filteredItems = items.filter((item) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      item.name.toLowerCase().includes(query) ||
      item.serial.toLowerCase().includes(query) ||
      (item.spec && item.spec.toLowerCase().includes(query)) ||
      (item.location && item.location.toLowerCase().includes(query)) ||
      (item.category && item.category.toLowerCase().includes(query));

    const matchesBudget =
      selectedBudget === 'All' || item.budget === selectedBudget;

    return matchesSearch && matchesBudget;
  });

  const handleDownloadBarcode = async (item: InventoryItem) => {
    const success = await downloadBarcodeAsPng(item.serial, `Barcode_${item.serial}_${item.name.replace(/\s+/g, '_')}.png`);
    if (success) {
      showToast(`Barcode ${item.serial} berhasil diunduh!`, 'success');
    } else {
      showToast('Gagal mengunduh barcode', 'error');
    }
  };

  const handleConfirmDelete = () => {
    if (deletingId) {
      onDeleteItem(deletingId);
      setDeletingId(null);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      onUpdateItem(editingItem);
      setEditingItem(null);
      showToast('Data barang berhasil diperbarui!', 'success');
    }
  };

  const handlePrintSticker = (item: InventoryItem) => {
    setPrintingItem(item);
  };

  const handleExecutePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    if (items.length === 0) {
      showToast('Tidak ada data inventaris untuk diekspor', 'warning');
      return;
    }

    const headers = ['ID', 'Nama Barang', 'Nomor Seri', 'Tahun', 'Sumber Anggaran', 'Kategori', 'Lokasi', 'Kondisi', 'Spesifikasi'];
    const rows = items.map((i) => [
      `"${i.id}"`,
      `"${i.name.replace(/"/g, '""')}"`,
      `"${i.serial}"`,
      `"${i.year}"`,
      `"${i.budget}"`,
      `"${i.category || '-'}"`,
      `"${i.location || '-'}"`,
      `"${i.condition || 'Baik'}"`,
      `"${(i.spec || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Inventaris_${schoolSettings.shortName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Data inventaris berhasil diekspor ke CSV!', 'success');
  };

  return (
    <section id="menu-list" className="space-y-6">
      
      {/* Top Header & Stat Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Daftar Barang Inventaris
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola dan lihat data lengkap aset sekolah beserta barcode siap cetak.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-[#e6f6ee] text-[#009B4C] px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm border border-[#a4e2c0] flex items-center gap-2">
            <span>Total:</span>
            <span id="total-items" className="text-base font-black">{items.length}</span>
            <span>Barang</span>
          </div>

          <button
            type="button"
            id="btn-export-csv"
            onClick={handleExportCsv}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#009B4C]" />
            <span className="hidden sm:inline">Ekspor CSV</span>
          </button>

          <button
            type="button"
            id="btn-add-item-top"
            onClick={onNavigateToInput}
            className="px-4 py-2.5 bg-[#009B4C] hover:bg-[#008742] text-white rounded-xl text-xs font-bold shadow-md shadow-[#009B4C]/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Barang</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative w-full lg:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="search-inventory"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan nama, No Seri, lokasi, spek..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#009B4C] focus:border-[#009B4C] outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter by Budget & View Mode Toggle */}
        <div className="flex items-center gap-2.5 w-full lg:w-auto justify-between lg:justify-end">
          <div className="flex items-center gap-2 flex-1 lg:flex-initial">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              id="filter-budget"
              value={selectedBudget}
              onChange={(e) => setSelectedBudget(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-[#009B4C]"
            >
              <option value="All">Semua Sumber Anggaran</option>
              <option value="BOS Pusat">BOS Pusat</option>
              <option value="BOS Daerah">BOS Daerah</option>
              <option value="Yayasan">Yayasan</option>
              <option value="Sumbangan / Hibah">Sumbangan / Hibah</option>
              <option value="DAK">DAK</option>
              <option value="Kas Sekolah">Kas Sekolah</option>
            </select>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              id="btn-view-grid"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-[#009B4C] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Grid Kartu"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              type="button"
              id="btn-view-table"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-[#009B4C] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Tabel"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div id="empty-state" className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-center">
          <div className="w-20 h-20 bg-[#e6f6ee] text-[#009B4C] rounded-3xl flex items-center justify-center mb-4 shadow-inner">
            <Tag className="w-10 h-10" />
          </div>
          <h4 className="text-lg font-bold text-slate-800">
            {items.length === 0 ? 'Belum Ada Barang Inventaris' : 'Tidak Ada Barang Yang Cocok'}
          </h4>
          <p className="text-slate-500 text-sm mt-1 mb-5 max-w-md">
            {items.length === 0
              ? 'Mulai catat aset dan barang sekolah Anda agar barcode dapat langsung di-generate secara digital.'
              : `Pencarian "${searchQuery}" tidak menemukan hasil pada filter yang dipilih.`}
          </p>
          {items.length === 0 ? (
            <button
              type="button"
              onClick={onNavigateToInput}
              className="px-6 py-2.5 bg-[#009B4C] hover:bg-[#008742] text-white rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              + Input Barang Sekarang
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedBudget('All');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition-colors"
            >
              Reset Filter Pencarian
            </button>
          )}
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && filteredItems.length > 0 && (
        <div id="inventory-grid" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              id={`item-card-${item.id}`}
              className="bg-white rounded-3xl shadow-sm border border-slate-200/90 overflow-hidden flex flex-col hover:shadow-md hover:border-[#a4e2c0] transition-all duration-200 group"
            >
              {/* Photo & Badge */}
              <div className="h-48 relative bg-slate-100 overflow-hidden">
                <img
                  src={item.photo || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80'}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                  <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-emerald-300" />
                    {item.year}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-sm ${
                      item.condition === 'Rusak Ringan'
                        ? 'bg-amber-500 text-white'
                        : item.condition === 'Rusak Berat'
                        ? 'bg-rose-600 text-white'
                        : 'bg-[#009B4C] text-white'
                    }`}
                  >
                    {item.condition || 'Baik'}
                  </span>
                </div>

                <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-xs rounded-xl p-1 shadow-sm opacity-90 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => setEditingItem(item)}
                    className="p-1.5 text-slate-600 hover:text-[#009B4C] hover:bg-[#e6f6ee] rounded-lg transition-colors cursor-pointer"
                    title="Edit Data Barang"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingId(item.id)}
                    className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Hapus Barang"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h4 className="text-base font-bold text-slate-900 leading-snug line-clamp-1" title={item.name}>
                    {item.name}
                  </h4>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-[11px] font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                    SN: {item.serial}
                  </span>
                  <span className="text-[11px] font-semibold text-[#009B4C] bg-[#e6f6ee] px-2.5 py-0.5 rounded-lg border border-[#a4e2c0]">
                    {item.budget}
                  </span>
                </div>

                {item.location && (
                  <p className="text-xs text-slate-500 mb-2 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{item.location}</span>
                  </p>
                )}

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mb-4 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                  {item.spec}
                </p>

                {/* Live Barcode Renderer Box */}
                <div className="mt-auto pt-3 border-t border-slate-100 flex flex-col items-center bg-slate-50 rounded-2xl p-3 gap-2.5">
                  <div className="bg-white p-2 rounded-xl border border-slate-200/80 shadow-xs w-full flex justify-center overflow-hidden">
                    <BarcodeRenderer value={item.serial} height={38} width={1.4} fontSize={11} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 w-full">
                    <button
                      type="button"
                      id={`btn-download-barcode-${item.id}`}
                      onClick={() => handleDownloadBarcode(item)}
                      className="py-2 px-3 text-xs bg-white border border-slate-200 hover:border-[#a4e2c0] hover:bg-[#e6f6ee] text-slate-700 hover:text-[#009B4C] rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 font-semibold cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh PNG</span>
                    </button>
                    <button
                      type="button"
                      id={`btn-print-sticker-${item.id}`}
                      onClick={() => handlePrintSticker(item)}
                      className="py-2 px-3 text-xs bg-white border border-slate-200 hover:border-[#a4e2c0] hover:bg-[#e6f6ee] text-slate-700 hover:text-[#009B4C] rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 font-semibold cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Label Stiker</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && filteredItems.length > 0 && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
                  <th className="py-4 px-5">Foto</th>
                  <th className="py-4 px-5">Nama Barang & Seri</th>
                  <th className="py-4 px-5">Anggaran & Tahun</th>
                  <th className="py-4 px-5">Lokasi / Kondisi</th>
                  <th className="py-4 px-5 text-center">Barcode</th>
                  <th className="py-4 px-5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="py-3 px-5">
                      <img
                        src={item.photo || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80'}
                        alt={item.name}
                        className="w-14 h-14 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                      />
                    </td>
                    <td className="py-3 px-5">
                      <p className="font-bold text-slate-900">{item.name}</p>
                      <p className="font-mono text-xs text-[#009B4C] font-bold mt-0.5">SN: {item.serial}</p>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{item.spec}</p>
                    </td>
                    <td className="py-3 px-5">
                      <span className="font-semibold text-slate-800">{item.budget}</span>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Tahun {item.year}</p>
                    </td>
                    <td className="py-3 px-5">
                      <p className="font-medium text-slate-700">{item.location || '-'}</p>
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                          item.condition === 'Rusak Ringan'
                            ? 'bg-amber-100 text-amber-800'
                            : item.condition === 'Rusak Berat'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-[#009B4C]/15 text-[#009B4C]'
                        }`}
                      >
                        {item.condition || 'Baik'}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <BarcodeRenderer value={item.serial} height={28} width={1.2} fontSize={9} />
                        <button
                          type="button"
                          onClick={() => handleDownloadBarcode(item)}
                          className="text-[11px] text-[#009B4C] hover:text-[#007A3B] font-bold hover:underline"
                        >
                          Unduh
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handlePrintSticker(item)}
                          className="p-2 text-slate-600 hover:text-[#009B4C] bg-slate-100 hover:bg-[#e6f6ee] rounded-lg transition-colors cursor-pointer"
                          title="Cetak Label"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingItem(item)}
                          className="p-2 text-slate-600 hover:text-[#009B4C] bg-slate-100 hover:bg-[#e6f6ee] rounded-lg transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(item.id)}
                          className="p-2 text-slate-600 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h3 className="text-lg font-bold text-slate-900">Edit Data Barang Inventaris</h3>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">Nama Barang</label>
                <input
                  type="text"
                  required
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#009B4C] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Nomor Seri / SN</label>
                  <input
                    type="text"
                    required
                    value={editingItem.serial}
                    onChange={(e) => setEditingItem({ ...editingItem, serial: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#009B4C] outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Tahun</label>
                  <input
                    type="number"
                    required
                    value={editingItem.year}
                    onChange={(e) => setEditingItem({ ...editingItem, year: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#009B4C] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Sumber Anggaran</label>
                  <select
                    value={editingItem.budget}
                    onChange={(e) => setEditingItem({ ...editingItem, budget: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#009B4C] outline-none"
                  >
                    <option value="BOS Pusat">BOS Pusat</option>
                    <option value="BOS Daerah">BOS Daerah</option>
                    <option value="Yayasan">Yayasan</option>
                    <option value="Sumbangan / Hibah">Sumbangan / Hibah</option>
                    <option value="DAK">DAK</option>
                    <option value="Kas Sekolah">Kas Sekolah</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Kondisi</label>
                  <select
                    value={editingItem.condition || 'Baik'}
                    onChange={(e) => setEditingItem({ ...editingItem, condition: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#009B4C] outline-none"
                  >
                    <option value="Baik">Baik</option>
                    <option value="Rusak Ringan">Rusak Ringan</option>
                    <option value="Rusak Berat">Rusak Berat</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">Lokasi Penempatan</label>
                <input
                  type="text"
                  value={editingItem.location || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, location: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#009B4C] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">Spesifikasi Lengkap</label>
                <textarea
                  rows={3}
                  value={editingItem.spec}
                  onChange={(e) => setEditingItem({ ...editingItem, spec: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#009B4C] outline-none resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#009B4C] hover:bg-[#008742] text-white rounded-xl text-xs font-bold shadow-md shadow-[#009B4C]/25 transition-all"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 text-center">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <Trash2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Hapus Barang Inventaris?</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 mb-6">
              Data barang dan barcode ini akan dihapus dari sistem. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/25 transition-all"
              >
                Ya, Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Sticker Label Modal */}
      {printingItem && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <Printer className="w-5 h-5 text-blue-600" />
                <span>Pratinjau Label Stiker Inventaris</span>
              </div>
              <button
                onClick={() => setPrintingItem(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Label preview box (printable format) */}
            <div id="printable-sticker" className="border-2 border-slate-800 p-4 rounded-2xl bg-white text-slate-900 flex flex-col items-center text-center shadow-xs">
              <div className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1.5 w-full">
                {schoolSettings.name}
              </div>
              <p className="text-[10px] text-slate-500 mt-1 uppercase font-semibold">
                PROPERTI INVENTARIS RESMI
              </p>
              <h4 className="font-extrabold text-sm text-slate-900 mt-1 mb-2">
                {printingItem.name}
              </h4>
              
              <div className="bg-white py-1 px-3 border border-slate-200 rounded-lg my-1">
                <BarcodeRenderer value={printingItem.serial} height={45} width={1.8} fontSize={12} />
              </div>

              <div className="flex justify-between w-full text-[10px] font-semibold text-slate-600 mt-2 border-t border-slate-200 pt-1.5">
                <span>Sumber: {printingItem.budget}</span>
                <span>Tahun: {printingItem.year}</span>
                <span>Lokasi: {printingItem.location || 'Sekolah'}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPrintingItem(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleExecutePrint}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Cetak Label Stiker
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
};
