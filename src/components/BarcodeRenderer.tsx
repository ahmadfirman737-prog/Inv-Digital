import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

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
  height = 42,
  width = 1.6,
  fontSize = 12,
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
          textMargin: 4,
          margin: 6,
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

export async function downloadBarcodeAsPng(value: string, fileName?: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, value, {
        format: 'CODE128',
        height: 60,
        width: 2,
        displayValue: true,
        fontSize: 14,
        font: 'monospace',
        margin: 15,
        background: '#ffffff',
        lineColor: '#000000'
      });

      const dataUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = fileName || `Barcode_${value}.png`;
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
