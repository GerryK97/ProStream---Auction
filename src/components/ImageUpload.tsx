'use client';

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder: 'players' | 'teams' | 'tournaments';
  label?: string;
  placeholder?: string;
  previewClassName?: string;
  previewShape?: 'circle' | 'square';
  id?: string;
  onUploadComplete?: (url: string) => void;
}

const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 0.85;

async function resizeImage(blob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0);
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('Conversion failed')), 'image/jpeg', JPEG_QUALITY);
        return;
      }
      if (width > height) {
        height = Math.round((height * MAX_DIMENSION) / width);
        width = MAX_DIMENSION;
      } else {
        width = Math.round((width * MAX_DIMENSION) / height);
        height = MAX_DIMENSION;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('Resize failed')), 'image/jpeg', JPEG_QUALITY);
    };
    img.onerror = reject;
    img.src = url;
  });
}

async function getCroppedBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('Crop failed')), 'image/jpeg', JPEG_QUALITY);
    };
    img.onerror = reject;
    img.src = imageSrc;
  });
}

const PLACEHOLDER_CIRCLE = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' rx='50' fill='%2397a2c6'/%3E%3Ctext x='50' y='55' text-anchor='middle' fill='%23F3F4F6' font-size='12' font-family='sans-serif'%3ENo Image%3C/text%3E%3C/svg%3E`;
const PLACEHOLDER_SQUARE = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' rx='6' fill='%2397a2c6'/%3E%3Ctext x='50' y='55' text-anchor='middle' fill='%23F3F4F6' font-size='12' font-family='sans-serif'%3ENo Logo%3C/text%3E%3C/svg%3E`;

const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  folder,
  label = 'Image',
  placeholder = 'Image URL (optional)',
  previewClassName = 'w-16 h-16',
  previewShape = 'circle',
  id = 'image-upload',
  onUploadComplete,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string>('');

  // Crop state
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  // Step 1: file selected → open crop modal
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const objectUrl = URL.createObjectURL(file);
    setCropSrc(objectUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const cancelCrop = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setFileName('');
  };

  // Step 2: user confirms crop → extract blob → resize → upload
  const handleCropConfirm = async () => {
    if (!cropSrc || !croppedAreaPixels) return;
    setIsUploading(true);
    try {
      const cropped = await getCroppedBlob(cropSrc, croppedAreaPixels);
      const resized = await resizeImage(cropped);

      const formData = new FormData();
      formData.append('file', resized, 'photo.jpg');
      formData.append('folder', `prostream-auction/${folder}`);

      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch('/api/upload', { method: 'POST', headers, body: formData });

      if (response.ok) {
        const data = await response.json();
        onChange(data.url);
        onUploadComplete?.(data.url);
      } else {
        const errorData = await response.json();
        console.error('Upload failed:', errorData);
        setFileName('');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setFileName('');
    } finally {
      URL.revokeObjectURL(cropSrc);
      setCropSrc(null);
      setIsUploading(false);
    }
  };

  const previewShapeClass = previewShape === 'circle' ? 'rounded-full' : 'rounded-md';
  const placeholderUrl = previewShape === 'circle' ? PLACEHOLDER_CIRCLE : PLACEHOLDER_SQUARE;

  return (
    <>
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</label>
        <div className="flex items-center gap-4">
          {/* Image Preview */}
          <div className="relative shrink-0">
            <img
              src={value || placeholderUrl}
              alt="Preview"
              className={`${previewClassName} ${previewShapeClass} object-cover`}
              style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)' }}
            />
            {isUploading && (
              <div className={`absolute inset-0 ${previewShapeClass} bg-black/60 flex items-center justify-center`}>
                <div className="animate-spin rounded-full h-8 w-8 border-4" style={{ borderColor: 'var(--border-primary)', borderTopColor: 'var(--brand-primary)' }}></div>
              </div>
            )}
          </div>

          {/* Upload Controls */}
          <div className="flex-grow space-y-2">
            <div className="flex items-center justify-between rounded-md p-2" style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)' }}>
              <label
                htmlFor={id}
                className={`cursor-pointer text-white font-bold py-1.5 px-3 rounded-md text-sm transition-colors hover:opacity-80 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{ backgroundColor: 'var(--brand-primary)' }}
              >
                {isUploading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </span>
                ) : 'Choose File'}
              </label>
              <input
                type="file"
                id={id}
                className="hidden"
                onChange={handleFileChange}
                accept="image/*"
                disabled={isUploading}
              />
              <span className="text-sm truncate ml-2" style={{ color: 'var(--text-secondary)' }}>
                {isUploading ? 'Uploading to cloud...' : (fileName || 'No file chosen')}
              </span>
            </div>

            {/* URL Input */}
            <div>
              <p className="text-center text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>or enter a URL below</p>
              <input
                type="text"
                value={value}
                onChange={(e) => { onChange(e.target.value); setFileName(''); }}
                placeholder={placeholder}
                className="w-full rounded-md shadow-sm p-2 text-sm"
                style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                disabled={isUploading}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Crop Modal */}
      {cropSrc && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.88)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20,
        }}>
          {/* Title */}
          <div style={{ color: '#F1F5F9', fontSize: 16, fontWeight: 600, letterSpacing: 0.5 }}>
            Drag to reposition · Scroll or use slider to zoom
          </div>

          {/* Cropper viewport */}
          <div style={{ position: 'relative', width: 360, height: 360, borderRadius: 12, overflow: 'hidden', background: '#000' }}>
            <Cropper
              image={cropSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape={previewShape === 'circle' ? 'round' : 'rect'}
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          {/* Zoom slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: 360 }}>
            <span style={{ color: '#94A3B8', fontSize: 13, minWidth: 36 }}>Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={e => setZoom(Number(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--brand-primary)' }}
            />
            <span style={{ color: '#64748B', fontSize: 12, minWidth: 32, textAlign: 'right' }}>
              {zoom.toFixed(1)}x
            </span>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={cancelCrop}
              style={{
                padding: '9px 24px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.08)', color: '#E2E8F0', fontWeight: 600, fontSize: 14, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleCropConfirm}
              style={{
                padding: '9px 24px', borderRadius: 8, border: 'none',
                background: 'var(--brand-primary)', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer',
              }}
            >
              Crop &amp; Upload
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageUpload;
