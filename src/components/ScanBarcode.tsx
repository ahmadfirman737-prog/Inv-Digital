import React, { useState, useEffect, useRef } from 'react';
import { InventoryItem } from '../types';
import { playBeepSound } from '../utils/storage';
import { BarcodeRenderer, downloadBarcodeAsPng } from './BarcodeRenderer';
import { Html5Qrcode } from 'html5-qrcode';
import {
  QrCode,
  Camera,
  CameraOff,
  Search,
  CheckCircle2,
  AlertTriangle,
  History,
  Calendar,
  Layers,
  MapPin,
  Download,
  RotateCw
} from 'lucide-react';

interface ScanBarcodeProps {
  items: InventoryItem[];
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const ScanBarcode: React.FC<ScanBarcodeProps> = ({ items, showToast }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
  const [scannedHistory, setScannedHistory] = useState<{ item: InventoryItem; time: string }[]>([]);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'html5-barcode-reader';

  // Process search result
  const handleProcessSerial = (rawSerial: string) => {
    const cleanSerial = rawSerial.trim().toUpperCase();
    if (!cleanSerial) {
      showToast('Masukkan nomor seri terlebih dahulu!', 'warning');
      return;
    }

    const found = items.find(
      (item) => item.serial.toUpperCase() === cleanSerial || item.serial.toUpperCase().includes(cleanSerial)
    );

    if (found) {
      playBeepSound();
      setScannedItem(found);
      setScannedHistory((prev) => [
        { item: found, time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) },
        ...prev.filter(p => p.item.id !== found.id).slice(0, 9)
      ]);
      showToast(`Barang ditemukan: ${found.name}`, 'success');
    } else {
      setScannedItem(null);
      showToast(`Barang dengan nomor seri "${cleanSerial}" tidak ditemukan di database!`, 'error');
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(readerElementId);
      }

      setIsScanning(true);

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 260, height: 160 },
          aspectRatio: 1.333
        },
        (decodedText) => {
          // Success callback
          handleProcessSerial(decodedText);
          // Optional: pause or stop to prevent rapid duplicate beeps
        },
        () => {
          // Failure callback during continuous scanning frame (silent)
        }
      );
    } catch (err: any) {
      console.error('Camera start error:', err);
      setIsScanning(false);
      const errMsg = err?.message || 'Tidak dapat mengakses kamera. Pastikan izin kamera aktif.';
      setCameraError(errMsg);
      showToast('Izin kamera ditolak atau tidak ditemukan perangkat kamera.', 'error');
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.warn('Camera stop error:', err);
      } finally {
        setIsScanning(false);
      }
    }
  };

  const toggleCamera = () => {
    if (isScanning) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  // Clean up scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    handleProcessSerial(manualInput);
  };

  return (
    <section id="menu-scan" className="max-w-5xl mx-auto space-y-6">
      
      {/* Scanner Card Container */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 overflow-hidden">
        
        {/* Header Bar */}
        <div className="p-6 sm:p-7 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#009B4C] via-[#008742] to-[#006631] text-white">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold tracking-tight">
                Scanner Barcode & QR Code
              </h3>
              <p className="text-xs text-emerald-100 font-light mt-0.5">
                Arahkan kamera ke barcode fisik barang inventaris sekolah
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-toggle-cam"
            onClick={toggleCamera}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md ${
              isScanning
                ? 'bg-rose-500 hover:bg-rose-600 text-white'
                : 'bg-white text-[#009B4C] hover:bg-emerald-50'
            }`}
          >
            {isScanning ? (
              <>
                <CameraOff className="w-4 h-4" />
                <span id="cam-status-text">Matikan Kamera</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                <span id="cam-status-text">Aktifkan Kamera</span>
              </>
            )}
          </button>
        </div>

        {/* Scanner Body: Left is Camera/Input, Right is Result */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[480px]">
          
          {/* Left Column: Camera Viewport & Manual Form */}
          <div className="lg:col-span-6 p-6 sm:p-8 bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-200/90 flex flex-col justify-between">
            
            <div>
              <div className="relative w-full rounded-2xl overflow-hidden bg-slate-900 border-4 border-slate-200 shadow-inner aspect-[4/3] flex items-center justify-center">
                {/* HTML5 QR reader target */}
                <div id={readerElementId} className="w-full h-full" />

                {/* Placeholder when camera is off */}
                {!isScanning && (
                  <div
                    id="reader-placeholder"
                    className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-slate-300 p-6 text-center z-10"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-3 text-emerald-400">
                      <Camera className="w-8 h-8" />
                    </div>
                    <p className="font-bold text-sm text-white">Kamera Scanner Nonaktif</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                      Klik tombol <strong>"Aktifkan Kamera"</strong> di atas atau gunakan pencarian nomor seri di bawah ini.
                    </p>
                  </div>
                )}
              </div>

              {cameraError && (
                <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{cameraError}</span>
                </div>
              )}
            </div>

            {/* Manual Serial Search Bar */}
            <div className="mt-6 pt-5 border-t border-slate-200">
              <label htmlFor="manual-serial" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Pencarian Cepat Nomor Seri Manual
              </label>
              <form onSubmit={handleManualSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    id="manual-serial"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Ketik No Seri: EPS-2023-001..."
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-mono text-slate-900 focus:ring-2 focus:ring-[#009B4C] outline-none uppercase"
                  />
                </div>
                <button
                  type="submit"
                  id="btn-manual-search"
                  className="px-5 py-2.5 bg-[#009B4C] hover:bg-[#008742] text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  Cari
                </button>
              </form>
            </div>

          </div>

          {/* Right Column: Scanned Result Card */}
          <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between bg-white">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Hasil Identifikasi Barang
                </h4>
                {scannedItem && (
                  <span className="text-[11px] font-bold text-[#009B4C] bg-[#e6f6ee] px-2.5 py-0.5 rounded-full border border-[#a4e2c0] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Terverifikasi
                  </span>
                )}
              </div>

              {/* If no item is scanned yet */}
              {!scannedItem && (
                <div
                  id="scan-result-empty"
                  className="py-16 flex flex-col items-center justify-center text-slate-400 text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-3 text-slate-300 border border-slate-100">
                    <Search className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-bold text-slate-600">Menunggu Hasil Scan...</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Dekatkan barcode ke kamera atau masukkan nomor seri untuk memuat detail aset secara instan.
                  </p>
                </div>
              )}

              {/* Scanned item detail presentation */}
              {scannedItem && (
                <div id="scan-result-data" className="space-y-4 animate-fade-in">
                  
                  {/* Photo & Item Name */}
                  <div className="flex gap-4 items-start">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 shadow-xs">
                      <img
                        id="res-photo"
                        src={scannedItem.photo || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80'}
                        alt={scannedItem.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="inline-block text-[11px] font-mono font-bold text-[#009B4C] bg-[#e6f6ee] px-2.5 py-0.5 rounded-md border border-[#a4e2c0] mb-1">
                        SN: <span id="res-serial">{scannedItem.serial}</span>
                      </div>
                      <h2 id="res-name" className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
                        {scannedItem.name}
                      </h2>
                      {scannedItem.category && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <Layers className="w-3 h-3 text-slate-400" />
                          {scannedItem.category}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Attributes Badges Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                        Tahun Beli
                      </p>
                      <p id="res-year" className="text-sm font-bold text-slate-800 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#009B4C]" />
                        {scannedItem.year}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                        Anggaran
                      </p>
                      <p id="res-budget" className="text-sm font-bold text-[#009B4C] truncate">
                        {scannedItem.budget}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 col-span-2 sm:col-span-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                        Kondisi
                      </p>
                      <p className="text-sm font-bold text-slate-800">
                        {scannedItem.condition || 'Baik'}
                      </p>
                    </div>
                  </div>

                  {/* Location Info */}
                  {scannedItem.location && (
                    <div className="p-3 bg-[#e6f6ee]/80 rounded-xl border border-[#a4e2c0] flex items-center gap-2 text-xs text-slate-800">
                      <MapPin className="w-4 h-4 text-[#009B4C] flex-shrink-0" />
                      <span>Lokasi Penempatan: <strong>{scannedItem.location}</strong></span>
                    </div>
                  )}

                  {/* Full Specification Description */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Spesifikasi Lengkap
                    </p>
                    <p id="res-spec" className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      {scannedItem.spec}
                    </p>
                  </div>

                  {/* Barcode representation */}
                  <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
                    <div className="overflow-hidden">
                      <BarcodeRenderer value={scannedItem.serial} height={32} width={1.2} fontSize={10} />
                    </div>
                    <button
                      type="button"
                      onClick={() => downloadBarcodeAsPng(scannedItem.serial)}
                      className="px-3 py-2 bg-slate-100 hover:bg-[#e6f6ee] hover:text-[#009B4C] text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer flex-shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh</span>
                    </button>
                  </div>

                </div>
              )}
            </div>

            {/* Session Scan History */}
            {scannedHistory.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <History className="w-3 h-3" />
                    Riwayat Scan Sesi Ini
                  </span>
                  <span className="text-[10px] text-slate-400">{scannedHistory.length} item</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {scannedHistory.map((hist, idx) => (
                    <button
                      key={idx}
                      onClick={() => setScannedItem(hist.item)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        scannedItem?.id === hist.item.id
                          ? 'bg-[#009B4C] text-white border-[#009B4C] font-bold'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {hist.item.name} ({hist.item.serial})
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

    </section>
  );
};
