import React, { useState } from 'react';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder: 'players' | 'teams' | 'tournaments';
  label?: string;
  placeholder?: string;
  previewClassName?: string;
  previewShape?: 'circle' | 'square';
  id?: string;
}

const MAX_DIMENSION = 1024; // px — resize before upload
const JPEG_QUALITY = 0.85;

async function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
        // No resize needed — still convert to JPEG for compression
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

// Inline SVG placeholders — no external network call
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
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string>('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    setFileName(file.name);
    setIsUploading(true);

    try {
      // Resize/compress client-side before uploading
      const resized = await resizeImage(file);

      const formData = new FormData();
      formData.append('file', resized, file.name.replace(/\.[^.]+$/, '.jpg'));
      formData.append('folder', `prostream-auction/${folder}`);

      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch('/api/upload', { method: 'POST', headers, body: formData });

      if (response.ok) {
        const data = await response.json();
        onChange(data.url);
      } else {
        const errorData = await response.json();
        console.error('Upload failed:', errorData);
        setFileName('');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setFileName('');
    } finally {
      setIsUploading(false);
    }
  };

  const previewShapeClass = previewShape === 'circle' ? 'rounded-full' : 'rounded-md';
  const placeholderUrl = previewShape === 'circle' ? PLACEHOLDER_CIRCLE : PLACEHOLDER_SQUARE;

  return (
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
  );
};

export default ImageUpload;
