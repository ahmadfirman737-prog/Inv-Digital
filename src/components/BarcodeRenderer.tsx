import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { InventoryItem, SchoolSettings } from '../types';

interface BarcodeRendererProps {
  value: string;
  height?: number;
  width?: number;
  fontSize?: number;
  displayValue?: boolean;
  className?: string;
  id?: string;
}

export const BarcodeRenderer: React.FC<BarcodeRendererProps> = ({
  value,
  height = 50,
  width = 2,
  fontSize = 13,
  displayValue = true,
  className = '',
  id
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: 'CODE128',
          height,
          width,
          displayValue,
          fontSize,
          font: 'monospace',
          textMargin: 6,
          margin: 8,
          background: '#ffffff',
          lineColor: '#000000',
        });
      } catch (err) {
        console.error('Failed to render barcode:', err);
      }
    }
  }, [value, height, width, fontSize, displayValue]);

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg
        id={id || `barcode-svg-${value.replace(/[^a-zA-Z0-9]/g, '_')}`}
        ref={svgRef}
        className="max-w-full h-auto rounded bg-white"
      />
    </div>
  );
};

/**
 * Downloads a standalone high-resolution barcode formatted for 12x8 cm ratio (1417 x 945 px @ 300 DPI)
 */
export async function downloadBarcodeAsPng(value: string, fileName?: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      // 12cm x 8cm at 300 DPI is approximately 1417 x 945 pixels
      const canvas = document.createElement('canvas');
      canvas.width = 1417;
      canvas.height = 945;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(false);
        return;
      }

      // Background white
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Outer border 12x8 cm
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 6;
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

      // Inner dashed border for cutting guide
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.strokeRect(32, 32, canvas.width - 64, canvas.height - 64);
      ctx.setLineDash([]);

      // Top title
      ctx.fillStyle = '#009B4C';
      ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('KODE BARCODE ASET INVENTARIS (12 x 8 CM)', canvas.width / 2, 90);

      // Temporary canvas for JsBarcode
      const barcodeCanvas = document.createElement('canvas');
      JsBarcode(barcodeCanvas, value, {
        format: 'CODE128',
        height: 280,
        width: 4.2,
        displayValue: true,
        fontSize: 38,
        font: 'monospace',
        margin: 20,
        background: '#ffffff',
        lineColor: '#000000'
      });

      // Draw barcode in center
      const bcX = (canvas.width - barcodeCanvas.width) / 2;
      const bcY = 160;
      ctx.drawImage(barcodeCanvas, bcX, bcY);

      // Size badge at bottom
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 26px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Ukuran Standar Label Cetak: 12.0 cm × 8.0 cm (300 DPI)', canvas.width / 2, canvas.height - 70);

      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = fileName || `Barcode_12x8cm_${value}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      resolve(true);
    } catch (err) {
      console.error('Error generating barcode download', err);
      resolve(false);
    }
  });
}

/**
 * Downloads a complete full-featured sticker label formatted strictly at 12 x 8 cm (1417 x 945 px @ 300 DPI)
 */
export async function downloadLabel12x8AsPng(
  item: InventoryItem,
  schoolSettings: SchoolSettings,
  fileName?: string
): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      // 12 cm x 8 cm at 300 DPI = 1417 x 945 px
      const canvas = document.createElement('canvas');
      canvas.width = 1417;
      canvas.height = 945;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(false);
        return;
      }

      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Outer solid border
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 8;
      ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);

      // Header Banner Background
      ctx.fillStyle = '#009B4C';
      ctx.fillRect(20, 20, canvas.width - 40, 150);

      // Header Text (School Name)
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 46px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(schoolSettings.name.toUpperCase(), canvas.width / 2, 85);

      // Header Subtitle
      ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#d1fae5';
      ctx.fillText('SISTEM INVENTARIS & ASET RESMI SEKOLAH', canvas.width / 2, 130);

      // Item Name Box
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 44px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      
      // Truncate name if too long
      let displayName = item.name;
      if (displayName.length > 42) {
        displayName = displayName.substring(0, 40) + '...';
      }
      ctx.fillText(displayName, canvas.width / 2, 235);

      // Generate barcode image with JsBarcode
      const barcodeCanvas = document.createElement('canvas');
      JsBarcode(barcodeCanvas, item.serial, {
        format: 'CODE128',
        height: 240,
        width: 4.2,
        displayValue: true,
        fontSize: 36,
        font: 'monospace',
        margin: 15,
        background: '#ffffff',
        lineColor: '#000000'
      });

      // Draw barcode centered
      const bcX = (canvas.width - barcodeCanvas.width) / 2;
      const bcY = 270;
      ctx.drawImage(barcodeCanvas, bcX, bcY);

      // Divider line
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(40, 690);
      ctx.lineTo(canvas.width - 40, 690);
      ctx.stroke();

      // Information Table Grid
      const col1X = 60;
      const col2X = 540;
      const col3X = 1000;
      const rowY1 = 745;
      const rowY2 = 825;

      ctx.textAlign = 'left';

      // Field 1: Sumber Anggaran
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('SUMBER ANGGARAN:', col1X, rowY1);
      ctx.fillStyle = '#000000';
      ctx.font = '900 26px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(item.budget || '-', col1X, rowY1 + 35);

      // Field 2: Tahun Pengadaan
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('TAHUN PENGADAAN:', col2X, rowY1);
      ctx.fillStyle = '#000000';
      ctx.font = '900 26px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(String(item.year) || '-', col2X, rowY1 + 35);

      // Field 3: Kondisi Barang
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('KONDISI:', col3X, rowY1);
      ctx.fillStyle = '#000000';
      ctx.font = '900 26px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(item.condition || 'Baik', col3X, rowY1 + 35);

      // Field 4: Lokasi
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('LOKASI PENEMPATAN:', col1X, rowY2);
      ctx.fillStyle = '#000000';
      ctx.font = '900 26px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(item.location || 'Semua Ruang', col1X, rowY2 + 35);

      // Field 5: Kategori
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('KATEGORI ASET:', col2X, rowY2);
      ctx.fillStyle = '#000000';
      ctx.font = '900 26px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(item.category || 'Umum', col2X, rowY2 + 35);

      // Field 6: Dimensi Label
      ctx.fillStyle = '#009B4C';
      ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('UKURAN: 12 × 8 CM', canvas.width - 60, rowY2 + 35);

      // Output PNG
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = fileName || `Label_Stiker_12x8cm_${item.serial}_${item.name.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      resolve(true);
    } catch (err) {
      console.error('Error generating 12x8 cm label download', err);
      resolve(false);
    }
  });
}

