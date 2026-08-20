import React, { useState, useEffect, useRef } from 'react';
import { InventoryItem } from '../types';
import { playBeepSound } from '../utils/storage';
import { fetchInventoryFromFirestore } from '../firebase';
import { BarcodeRenderer, downloadBarcodeAsPng, downloadLabel12x8AsPng } from './BarcodeRenderer';
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType, VideoInputDevice } from '@zxing/library';
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
  Upload,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Barcode as BarcodeIcon,
  RefreshCw,
  Zap,
  ZapOff,
  FlipHorizontal,
  Info,
  Maximize2,
  Printer
} from 'lucide-react';

interface ScanBarcodeProps {
  items: InventoryItem[];
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  onNavigateToInventory?: (searchSerial?: string) => void;
}

export const ScanBarcode: React.FC<ScanBarcodeProps> = ({
  items,
  showToast,
  onNavigateToInventory
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [videoDevices, setVideoDevices] = useState<VideoInputDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [manualInput, setManualInput] = useState('');
  const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
  const [isSearchingCloud, setIsSearchingCloud] = useState(false);
  const [scannedHistory, setScannedHistory] = useState<{ item: InventoryItem; time: string }[]>([]);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [scanSuccessFlash, setScanSuccessFlash] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const nativeDetectorRef = useRef<any>(null);
  const nativeAnimFrameRef = useRef<number | null>(null);
  const lastScannedTimeRef = useRef<number>(0);
  const lastScannedTextRef = useRef<string>('');

  // Initialize ZXing MultiFormat Reader
  const getCodeReader = (): BrowserMultiFormatReader => {
    if (!codeReaderRef.current) {
      const hints = new Map<DecodeHintType, any>();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.CODE_93,
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.QR_CODE,
        BarcodeFormat.DATA_MATRIX,
        BarcodeFormat.ITF,
        BarcodeFormat.CODABAR
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);
      codeReaderRef.current = new BrowserMultiFormatReader(hints, 250);
    }
    return codeReaderRef.current;
  };

  // Enumerate video devices on mount
  useEffect(() => {
    const reader = getCodeReader();
    reader
      .getVideoInputDevices()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setVideoDevices(devices);
          // Prefer environment / back camera
          const backCam = devices.find(
            (d) =>
              d.label.toLowerCase().includes('back') ||
              d.label.toLowerCase().includes('rear') ||
              d.label.toLowerCase().includes('environment')
          );
          setSelectedDeviceId(backCam ? backCam.deviceId : devices[0].deviceId);
        }
      })
      .catch((err) => {
        console.warn('Could not list video devices:', err);
      });

    // Check if browser has native BarcodeDetector
    if ('BarcodeDetector' in window) {
      try {
        nativeDetectorRef.current = new (window as any).BarcodeDetector({
          formats: [
            'code_128',
            'code_39',
            'code_93',
            'ean_13',
            'ean_8',
            'upc_a',
            'upc_e',
            'qr_code',
            'data_matrix',
            'itf',
            'codabar'
          ]
        });
      } catch (e) {
        console.warn('Native BarcodeDetector not available:', e);
      }
    }

    return () => {
      stopCamera();
    };
  }, []);

  // Match serial or barcode string against inventory
  const findMatchingItem = (rawText: string, currentItems: InventoryItem[]): InventoryItem | null => {
    const clean = rawText.trim();
    if (!clean) return null;

    const cleanUpper = clean.toUpperCase();

    // 1. Direct exact match on serial
    let found = currentItems.find((it) => it.serial.trim().toUpperCase() === cleanUpper);
    if (found) return found;

    // 2. Direct match on ID
    found = currentItems.find((it) => String(it.id).trim() === clean);
    if (found) return found;

    // 3. Serial contained in raw text (e.g. from QR / URL)
    found = currentItems.find((it) => cleanUpper.includes(it.serial.trim().toUpperCase()));
    if (found) return found;

    // 4. Case-insensitive name match
    found = currentItems.find((it) => it.name.trim().toUpperCase() === cleanUpper);
    if (found) return found;

    // 5. Try parsing as JSON
    try {
      const parsed = JSON.parse(clean);
      const possibleSerial = parsed.serial || parsed.sn || parsed.code || parsed.id;
      if (possibleSerial) {
        found = currentItems.find(
          (it) =>
            it.serial.toUpperCase() === String(possibleSerial).toUpperCase() ||
            String(it.id) === String(possibleSerial)
        );
        if (found) return found;
      }
    } catch {
      // not JSON
    }

    return null;
  };

  // Process decoded serial number
  const handleProcessSerial = async (rawSerial: string) => {
    const cleanSerial = rawSerial.trim();
    if (!cleanSerial) {
      showToast('Masukkan atau scan nomor seri terlebih dahulu!', 'warning');
      return;
    }

    // Debounce duplicate scans within 1.5 seconds
    const now = Date.now();
    if (cleanSerial === lastScannedTextRef.current && now - lastScannedTimeRef.current < 1500) {
      return;
    }
    lastScannedTimeRef.current = now;
    lastScannedTextRef.current = cleanSerial;

    // Trigger visual green flash
    setScanSuccessFlash(true);
    setTimeout(() => setScanSuccessFlash(false), 700);

    // 1. Search local inventory
    let matched = findMatchingItem(cleanSerial, items);

    // 2. Fallback to Firestore Realtime Cloud
    if (!matched) {
      setIsSearchingCloud(true);
      try {
        const cloudItems = await fetchInventoryFromFirestore();
        if (cloudItems && cloudItems.length > 0) {
          matched = findMatchingItem(cleanSerial, cloudItems);
        }
      } catch (err) {
        console.warn('Cloud search error:', err);
      } finally {
        setIsSearchingCloud(false);
      }
    }

    if (matched) {
      playBeepSound();
      if (navigator.vibrate) {
        try {
          navigator.vibrate([80, 40, 80]);
        } catch {}
      }

      setScannedItem(matched);
      setScannedHistory((prev) => [
        {
          item: matched!,
          time: new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        },
        ...prev.filter((p) => String(p.item.id) !== String(matched!.id)).slice(0, 9)
      ]);
      showToast(`Barang Ditemukan: "${matched.name}" (${matched.serial})`, 'success');
    } else {
      setScannedItem(null);
      showToast(`Barang dengan nomor seri "${cleanSerial}" tidak ditemukan di sistem!`, 'error');
    }
  };

  // Hardware-accelerated native detector loop alongside ZXing
  const startNativeDetectorLoop = () => {
    if (!nativeDetectorRef.current) return;

    const detectFrame = async () => {
      if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
        try {
          const barcodes = await nativeDetectorRef.current.detect(videoRef.current);
          if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
            handleProcessSerial(barcodes[0].rawValue);
          }
        } catch (e) {}
      }
      nativeAnimFrameRef.current = requestAnimationFrame(detectFrame);
    };

    nativeAnimFrameRef.current = requestAnimationFrame(detectFrame);
  };

  // Start Camera Scanning
  const startCamera = async (targetDeviceId?: string) => {
    setCameraError(null);
    stopCamera();

    const deviceId = targetDeviceId || selectedDeviceId || null;
    const reader = getCodeReader();

    try {
      setIsScanning(true);

      if (videoRef.current) {
        await reader.decodeFromVideoDevice(
          deviceId,
          videoRef.current,
          (result, error) => {
            if (result) {
              const text = result.getText();
              if (text) {
                handleProcessSerial(text);
              }
            }
          }
        );

        // Check torch capabilities on active video stream
        try {
          const stream = videoRef.current.srcObject as MediaStream;
          if (stream) {
            const track = stream.getVideoTracks()[0];
            if (track) {
              const caps = (track.getCapabilities?.() || {}) as any;
              setHasTorch(Boolean(caps.torch));
            }
          }
        } catch (e) {}

        // Start parallel native detector
        startNativeDetectorLoop();
      }
    } catch (err: any) {
      console.error('Camera start error:', err);
      setIsScanning(false);
      const errMsg =
        err?.message ||
        'Tidak dapat mengakses kamera. Pastikan izin kamera aktif dan browser tidak memblokir akses.';
      setCameraError(errMsg);
      showToast('Gagal mengakses kamera. Anda bisa menggunakan opsi upload foto atau ketik nomor seri.', 'error');
    }
  };

  // Stop Camera Scanning
  const stopCamera = () => {
    if (nativeAnimFrameRef.current) {
      cancelAnimationFrame(nativeAnimFrameRef.current);
      nativeAnimFrameRef.current = null;
    }

    if (codeReaderRef.current) {
      try {
        codeReaderRef.current.reset();
      } catch (err) {
        console.warn('Reader reset note:', err);
      }
    }

    if (videoRef.current && videoRef.current.srcObject) {
      try {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      } catch (err) {}
    }

    setIsScanning(false);
    setIsTorchOn(false);
  };

  const toggleCamera = () => {
    if (isScanning) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedDeviceId(newId);
    if (isScanning) {
      startCamera(newId);
    }
  };

  // Toggle Torch / Flashlight
  const toggleTorch = async () => {
    if (!videoRef.current || !videoRef.current.srcObject) return;
    try {
      const stream = videoRef.current.srcObject as MediaStream;
      const track = stream.getVideoTracks()[0];
      if (track) {
        const newState = !isTorchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: newState }]
        });
        setIsTorchOn(newState);
      }
    } catch (err) {
      console.warn('Torch toggle error:', err);
    }
  };

  // Scan from Uploaded Barcode Image File
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const imageUrl = URL.createObjectURL(file);
      const img = new Image();
      img.src = imageUrl;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // 1. Native detector on image
      if (nativeDetectorRef.current) {
        try {
          const barcodes = await nativeDetectorRef.current.detect(img);
          if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
            handleProcessSerial(barcodes[0].rawValue);
            setIsUploadingImage(false);
            return;
          }
        } catch (e) {}
      }

      // 2. ZXing Reader on image
      const reader = getCodeReader();
      try {
        const result = await reader.decodeFromImageElement(img);
        if (result && result.getText()) {
          handleProcessSerial(result.getText());
          setIsUploadingImage(false);
          return;
        }
      } catch (e) {}

      // 3. Fallback: Contrast Adjusted Canvas
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          const avg = (d[i] + d[i + 1] + d[i + 2]) / 3;
          const v = avg > 125 ? 255 : 0;
          d[i] = v;
          d[i + 1] = v;
          d[i + 2] = v;
        }
        ctx.putImageData(imgData, 0, 0);

        const enhancedImg = new Image();
        enhancedImg.src = canvas.toDataURL();
        await new Promise((res) => {
          enhancedImg.onload = res;
        });

        try {
          const res = await reader.decodeFromImageElement(enhancedImg);
          if (res && res.getText()) {
            handleProcessSerial(res.getText());
            setIsUploadingImage(false);
            return;
          }
        } catch (e) {}
      }

      showToast('Barcode tidak terdeteksi pada gambar. Pastikan gambar jelas dan tidak buram.', 'warning');
    } catch (err) {
      console.error('File scan error:', err);
      showToast('Gagal memproses gambar barcode.', 'error');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    handleProcessSerial(manualInput);
  };

  return (
    <section id="menu-scan" className="max-w-6xl mx-auto space-y-6">
      
      {/* Main Scanner Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 overflow-hidden">
        
        {/* Header Banner */}
        <div className="p-6 sm:p-7 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#009B4C] via-[#008742] to-[#006631] text-white">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
                Scanner Barcode & Identifikasi Aset
                <span className="text-[11px] bg-white/20 text-white font-mono px-2 py-0.5 rounded-full font-bold">
                  Code 128 / QR
                </span>
              </h3>
              <p className="text-xs text-emerald-100 font-light mt-0.5">
                Pindai barcode fisik barang, unggah foto barcode, atau cari nomor seri secara instan
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            <button
              type="button"
              id="btn-upload-barcode"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingImage}
              className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white border border-white/30 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              title="Pindai barcode dari file foto / gambar"
            >
              <Upload className={`w-4 h-4 ${isUploadingImage ? 'animate-bounce' : ''}`} />
              <span className="hidden sm:inline">
                {isUploadingImage ? 'Memindai Foto...' : 'Upload Foto Barcode'}
              </span>
            </button>

            <button
              type="button"
              id="btn-toggle-cam"
              onClick={toggleCamera}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                isScanning
                  ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse'
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
        </div>

        {/* Scanner Viewport & Results Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
          
          {/* Left Column: Camera Viewport & Manual Serial Search */}
          <div className="lg:col-span-5 p-6 sm:p-7 bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-200/90 flex flex-col justify-between">
            
            <div>
              {/* Camera Selection Controls if multiple cameras exist */}
              {videoDevices.length > 1 && (
                <div className="mb-3">
                  <label htmlFor="select-camera" className="block text-[11px] font-bold uppercase text-slate-500 mb-1 flex items-center gap-1">
                    <FlipHorizontal className="w-3.5 h-3.5 text-[#009B4C]" />
                    Pilih Sumber Kamera / Webcam:
                  </label>
                  <select
                    id="select-camera"
                    value={selectedDeviceId}
                    onChange={handleDeviceChange}
                    className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-700 font-medium focus:ring-2 focus:ring-[#009B4C] outline-none"
                  >
                    {videoDevices.map((dev, idx) => (
                      <option key={dev.deviceId || idx} value={dev.deviceId}>
                        {dev.label || `Kamera ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Viewfinder Target Video Container */}
              <div className={`relative w-full rounded-2xl overflow-hidden bg-slate-950 border-4 transition-all duration-300 shadow-inner aspect-[4/3] flex items-center justify-center ${
                scanSuccessFlash ? 'border-emerald-500 ring-4 ring-emerald-300 shadow-emerald-500/30' : 'border-slate-200'
              }`}>
                {/* Live Video Element */}
                <video
                  ref={videoRef}
                  className={`w-full h-full object-cover ${isScanning ? 'block' : 'hidden'}`}
                  autoPlay
                  playsInline
                  muted
                />

                {/* Laser animation indicator & aiming reticle when scanning */}
                {isScanning && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                    {/* Reticle bounding box */}
                    <div className="w-[85%] h-[55%] border-2 border-dashed border-white/70 rounded-2xl relative shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center justify-center overflow-hidden">
                      <div className="w-full h-1 bg-emerald-400 shadow-[0_0_15px_#34d399] animate-bounce opacity-90 rounded-full" />
                    </div>

                    <div className="absolute bottom-3 bg-black/65 backdrop-blur-md px-3 py-1 rounded-full text-[11px] text-white font-medium flex items-center gap-1.5 border border-white/20">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      Arahkan barcode ke dalam bingkai
                    </div>

                    {/* Torch / Flashlight Button if supported */}
                    {hasTorch && (
                      <button
                        type="button"
                        onClick={toggleTorch}
                        className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 cursor-pointer pointer-events-auto transition-colors"
                        title="Nyalakan Lampu Kilat / Senter"
                      >
                        {isTorchOn ? <Zap className="w-4 h-4 text-amber-300 fill-amber-300" /> : <ZapOff className="w-4 h-4 text-white" />}
                      </button>
                    )}
                  </div>
                )}

                {/* Placeholder when camera is inactive */}
                {!isScanning && (
                  <div
                    id="reader-placeholder"
                    className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-slate-300 p-6 text-center z-10"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-3 text-emerald-400">
                      <BarcodeIcon className="w-7 h-7" />
                    </div>
                    <p className="font-bold text-sm text-white">Kamera Scanner Siap</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                      Klik <strong>"Aktifkan Kamera"</strong> untuk memindai otomatis, atau cari nomor seri secara manual di bawah.
                    </p>
                    <button
                      type="button"
                      onClick={() => startCamera()}
                      className="mt-4 px-4 py-2.5 bg-[#009B4C] hover:bg-[#008742] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Mulai Pindai Kamera
                    </button>
                  </div>
                )}
              </div>

              {cameraError && (
                <div className="mt-3 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
                  <div className="leading-relaxed">
                    <p className="font-bold">Kendala Akses Kamera</p>
                    <p className="text-[11px] text-rose-600 mt-0.5">{cameraError}</p>
                    <p className="text-[10px] text-slate-500 mt-1.5">
                      Tip: Anda tetap dapat menggunakan fitur <strong>Upload Foto Barcode</strong> atau <strong>Pencarian Nomor Seri</strong> di bawah ini.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Manual Serial Search Bar & Barcode Gun Input */}
            <div className="mt-6 pt-5 border-t border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="manual-serial"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-600"
                >
                  Pencarian Nomor Seri / Barcode Gun
                </label>
                {isSearchingCloud && (
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Mencari di Cloud...
                  </span>
                )}
              </div>

              <form onSubmit={handleManualSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    id="manual-serial"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Contoh: EPS-2023-001..."
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-mono text-slate-900 focus:ring-2 focus:ring-[#009B4C] outline-none uppercase font-bold"
                  />
                </div>
                <button
                  type="submit"
                  id="btn-manual-search"
                  disabled={isSearchingCloud}
                  className="px-5 py-2.5 bg-[#009B4C] hover:bg-[#008742] text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSearchingCloud ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Cari'}
                </button>
              </form>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Tip: Anda dapat menempelkan <em>USB Barcode Scanner Gun</em> langsung pada kolom ini lalu tekan scan.
              </p>
            </div>

          </div>

          {/* Right Column: Scanned Result Card */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between bg-white">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  Hasil Identifikasi Barang
                </h4>
                {scannedItem && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-[#009B4C] bg-[#e6f6ee] px-3 py-1 rounded-full border border-[#a4e2c0] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Terdaftar di Sistem
                    </span>
                    <button
                      type="button"
                      onClick={() => setScannedItem(null)}
                      className="text-xs text-slate-400 hover:text-slate-600 p-1"
                      title="Reset tampilan scan"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* If no item is scanned yet */}
              {!scannedItem && (
                <div
                  id="scan-result-empty"
                  className="py-12 flex flex-col items-center justify-center text-slate-400 text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3 text-emerald-600 border border-emerald-100">
                    <BarcodeIcon className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">Menunggu Hasil Scan Barcode</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
                    Arahkan kamera ke barcode aset, unggah foto barcode, atau klik salah satu sampel barang di bawah untuk menguji hasil scan.
                  </p>

                  {/* Interactive Quick-Test Chips from registered items */}
                  {items.length > 0 && (
                    <div className="mt-6 w-full pt-5 border-t border-slate-100">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2.5 text-left">
                        Uji Coba Cepat Scan dari Data Terdaftar:
                      </p>
                      <div className="flex flex-wrap gap-2 justify-start max-h-40 overflow-y-auto p-1">
                        {items.slice(0, 10).map((it) => (
                          <button
                            key={it.id}
                            type="button"
                            onClick={() => handleProcessSerial(it.serial)}
                            className="px-3 py-1.5 bg-slate-50 hover:bg-[#e6f6ee] hover:text-[#009B4C] hover:border-[#a4e2c0] border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <BarcodeIcon className="w-3.5 h-3.5 text-[#009B4C]" />
                            <span>{it.name}</span>
                            <span className="font-mono text-[10px] text-slate-400 font-bold">({it.serial})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Scanned item detail presentation */}
              {scannedItem && (
                <div id="scan-result-data" className="space-y-4 animate-fade-in">
                  
                  {/* Photo & Item Name Header */}
                  <div className="flex gap-4 items-start bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-white border border-slate-200 flex-shrink-0 shadow-xs flex items-center justify-center">
                      {scannedItem.photo ? (
                        <img
                          id="res-photo"
                          src={scannedItem.photo}
                          alt={scannedItem.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-100">
                          <Layers className="w-8 h-8" />
                          <span className="text-[10px] text-slate-400 mt-1">Tanpa Foto</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-1.5">
                        <span className="text-xs font-mono font-extrabold text-[#009B4C] bg-[#e6f6ee] px-2.5 py-0.5 rounded-md border border-[#a4e2c0]">
                          SN: <strong id="res-serial">{scannedItem.serial}</strong>
                        </span>
                        <span className="text-[11px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                          {scannedItem.category || 'Umum'}
                        </span>
                      </div>

                      <h2 id="res-name" className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
                        {scannedItem.name}
                      </h2>

                      {scannedItem.location && (
                        <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-1.5 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-[#009B4C] flex-shrink-0" />
                          <span>Lokasi: <strong>{scannedItem.location}</strong></span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Attributes Badges Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                        Tahun Pengadaan
                      </p>
                      <p id="res-year" className="text-sm font-bold text-slate-800 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#009B4C]" />
                        {scannedItem.year}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                        Sumber Dana
                      </p>
                      <p id="res-budget" className="text-sm font-bold text-[#009B4C] truncate">
                        {scannedItem.budget}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 col-span-2 sm:col-span-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                        Kondisi Aset
                      </p>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            scannedItem.condition === 'Rusak Berat'
                              ? 'bg-rose-500'
                              : scannedItem.condition === 'Rusak Ringan'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                        <p className="text-sm font-bold text-slate-800">
                          {scannedItem.condition || 'Baik'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Full Specification Description */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-slate-400" />
                      Spesifikasi Teknis / Keterangan
                    </p>
                    <p id="res-spec" className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      {scannedItem.spec || 'Tidak ada catatan spesifikasi tambahan.'}
                    </p>
                  </div>

                  {/* Barcode representation 12x8 cm */}
                  <div className="p-3.5 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                    <div className="overflow-hidden py-1">
                      <BarcodeRenderer value={scannedItem.serial} height={36} width={1.3} fontSize={11} />
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        id="btn-download-12x8"
                        onClick={async () => {
                          const success = await downloadBarcodeAsPng(
                            scannedItem.serial,
                            `Barcode_12x8cm_${scannedItem.serial}_${scannedItem.name.replace(/\s+/g, '_')}.png`
                          );
                          if (success) {
                            showToast(`Barcode 12x8 cm (${scannedItem.serial}) berhasil diunduh!`, 'success');
                          }
                        }}
                        className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#009B4C] border border-[#a4e2c0] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Unduh barcode resolusi tinggi ukuran 12x8 cm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Unduh 12x8</span>
                      </button>

                      {onNavigateToInventory && (
                        <button
                          type="button"
                          id="btn-view-in-inventory"
                          onClick={() => onNavigateToInventory(scannedItem.serial)}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Buka detail dan riwayat barang ini di tabel inventaris"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Buka di Tabel</span>
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Session Scan History */}
            {scannedHistory.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <History className="w-3 h-3 text-slate-400" />
                    Riwayat Scan Sesi Ini ({scannedHistory.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setScannedHistory([])}
                    className="text-[10px] text-slate-400 hover:text-rose-500 font-bold"
                  >
                    Bersihkan
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {scannedHistory.map((hist, idx) => (
                    <button
                      key={idx}
                      onClick={() => setScannedItem(hist.item)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                        scannedItem?.id === hist.item.id
                          ? 'bg-[#009B4C] text-white border-[#009B4C] font-bold'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span>{hist.item.name}</span>
                      <span className="opacity-75 font-mono text-[10px]">({hist.item.serial})</span>
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
