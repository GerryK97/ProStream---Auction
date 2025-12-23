'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, Download, X, Image as ImageIcon, Loader2 } from 'lucide-react';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/bmp', 'image/webp'];
const MAX_FILE_SIZE = 16 * 1024 * 1024; // 16MB
const API_URL = '/api/remove-background'; // Use local API route to avoid CORS

export default function EditorClient() {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<Blob | null>(null);
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (originalPreview) URL.revokeObjectURL(originalPreview);
      if (processedPreview) URL.revokeObjectURL(processedPreview);
    };
  }, [originalPreview, processedPreview]);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Invalid file type. Please use PNG, JPG, GIF, BMP, or WEBP';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size exceeds 16MB limit';
    }
    return null;
  };

  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Cleanup previous URLs
    if (originalPreview) URL.revokeObjectURL(originalPreview);
    if (processedPreview) URL.revokeObjectURL(processedPreview);

    setOriginalImage(file);
    setOriginalPreview(URL.createObjectURL(file));
    setProcessedImage(null);
    setProcessedPreview(null);
    setError(null);
    setStatusMessage(null);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const removeBackgroundWithRetry = async (file: File, maxRetries = 3): Promise<Blob> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (attempt === 1) {
          setStatusMessage('Processing image... (This may take up to 60 seconds on first request)');
        } else {
          setStatusMessage(`Retry attempt ${attempt}/${maxRetries}... Please wait...`);
        }

        const formData = new FormData();
        formData.append('image', file);

        const controller = new AbortController();
        // Increase timeout to 90 seconds for cold starts
        const timeoutId = setTimeout(() => controller.abort(), 90000);

        const response = await fetch(API_URL, {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Server error: ${response.status}`);
          } else {
            throw new Error(`Server error: ${response.status}`);
          }
        }

        const blob = await response.blob();
        return blob;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          if (attempt < maxRetries) {
            setStatusMessage(`Request timed out. Retrying (${attempt + 1}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            continue;
          } else {
            throw new Error('Request timed out after multiple attempts. The service may be experiencing issues. Please try again in a moment.');
          }
        } else if (err.message === 'Failed to fetch') {
          if (attempt < maxRetries) {
            setStatusMessage(`Network error. Retrying (${attempt + 1}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            continue;
          } else {
            throw new Error('Network error. Please check your connection and try again.');
          }
        } else {
          throw err;
        }
      }
    }
    throw new Error('Failed to remove background after multiple attempts');
  };

  const handleRemoveBackground = async () => {
    if (!originalImage) return;

    setLoading(true);
    setError(null);
    setStatusMessage('Preparing to process image...');

    try {
      const blob = await removeBackgroundWithRetry(originalImage);

      if (processedPreview) URL.revokeObjectURL(processedPreview);

      setProcessedImage(blob);
      setProcessedPreview(URL.createObjectURL(blob));
      setStatusMessage('Background removed successfully!');

      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to remove background');
      setStatusMessage(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!processedPreview || !originalImage) return;

    const a = document.createElement('a');
    a.href = processedPreview;
    const originalName = originalImage.name.replace(/\.[^/.]+$/, '');
    a.download = `${originalName}_no_bg.png`;
    a.click();
  };

  const handleClear = () => {
    if (originalPreview) URL.revokeObjectURL(originalPreview);
    if (processedPreview) URL.revokeObjectURL(processedPreview);

    setOriginalImage(null);
    setOriginalPreview(null);
    setProcessedImage(null);
    setProcessedPreview(null);
    setError(null);
    setStatusMessage(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: 'var(--page-bg)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1
            className="text-4xl font-bold mb-3"
            style={{ color: 'var(--text-primary)' }}
          >
            Image Background Remover
          </h1>
          <p
            className="text-lg"
            style={{ color: 'var(--text-secondary)' }}
          >
            Upload an image and remove its background instantly
          </p>
        </div>

        {/* Upload Area or Original Image */}
        <div className="mb-6">
          {!originalPreview ? (
            <div
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative rounded-xl p-12 border-2 border-dashed cursor-pointer
                transition-all duration-300 hover:shadow-lg
                ${isDragging ? 'border-[var(--brand-primary)] shadow-lg' : 'border-[var(--border-color)]'}
              `}
              style={{ backgroundColor: 'var(--surface-elevated)' }}
            >
              <div className="flex flex-col items-center gap-4">
                <div
                  className="p-6 rounded-full"
                  style={{ backgroundColor: 'var(--surface-primary)' }}
                >
                  <Upload size={48} style={{ color: 'var(--brand-primary)' }} />
                </div>
                <div className="text-center">
                  <p
                    className="text-xl font-semibold mb-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {isDragging ? 'Drop your image here' : 'Drag & drop your image here'}
                  </p>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    or click to browse files
                  </p>
                  <p
                    className="text-sm mt-2"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Supports PNG, JPG, GIF, BMP, WEBP (max 16MB)
                  </p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_TYPES.join(',')}
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          ) : (
            <div
              className="rounded-xl p-6 shadow-lg"
              style={{ backgroundColor: 'var(--surface-elevated)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2
                  className="text-2xl font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Original Image
                </h2>
                <button
                  onClick={handleClear}
                  className="p-2 rounded-lg transition-all duration-200 hover:shadow-md"
                  style={{
                    backgroundColor: 'var(--surface-primary)',
                    color: 'var(--text-primary)'
                  }}
                  title="Clear and upload new image"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex justify-center">
                <img
                  src={originalPreview}
                  alt="Original"
                  className="max-h-96 rounded-lg shadow-md"
                  style={{ objectFit: 'contain' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {originalPreview && !processedPreview && (
          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={handleRemoveBackground}
              disabled={loading}
              className="px-8 py-3 rounded-lg font-semibold text-white transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              style={{
                backgroundColor: loading ? 'var(--surface-primary)' : 'var(--brand-primary)',
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Processing...
                </>
              ) : (
                <>
                  <ImageIcon size={20} />
                  Remove Background
                </>
              )}
            </button>
          </div>
        )}

        {/* Status Message */}
        {statusMessage && (
          <div
            className="mb-6 p-4 rounded-lg text-center"
            style={{
              backgroundColor: 'var(--surface-elevated)',
              color: 'var(--text-primary)'
            }}
          >
            {loading && <Loader2 className="inline animate-spin mr-2" size={20} />}
            {statusMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            className="mb-6 p-4 rounded-lg text-center border"
            style={{
              backgroundColor: 'color-mix(in oklab, var(--status-error) 10%, var(--surface-elevated))',
              borderColor: 'var(--status-error)',
              color: 'var(--status-error)'
            }}
          >
            {error}
          </div>
        )}

        {/* Processed Image */}
        {processedPreview && (
          <div
            className="rounded-xl p-6 shadow-lg mb-6"
            style={{ backgroundColor: 'var(--surface-elevated)' }}
          >
            <h2
              className="text-2xl font-semibold mb-4"
              style={{ color: 'var(--text-primary)' }}
            >
              Processed Image (Background Removed)
            </h2>
            <div
              className="flex justify-center p-8 rounded-lg"
              style={{
                backgroundImage: 'repeating-conic-gradient(#808080 0% 25%, #ffffff 0% 50%)',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 10px 10px'
              }}
            >
              <img
                src={processedPreview}
                alt="Processed"
                className="max-h-96 rounded-lg shadow-md"
                style={{ objectFit: 'contain' }}
              />
            </div>
          </div>
        )}

        {/* Download and New Image Buttons */}
        {processedPreview && (
          <div className="flex justify-center gap-4">
            <button
              onClick={handleDownload}
              className="px-8 py-3 rounded-lg font-semibold text-white transition-all duration-300 hover:shadow-lg flex items-center gap-2"
              style={{ backgroundColor: 'var(--brand-secondary)' }}
            >
              <Download size={20} />
              Download Image
            </button>
            <button
              onClick={handleClear}
              className="px-8 py-3 rounded-lg font-semibold transition-all duration-300 hover:shadow-lg"
              style={{
                backgroundColor: 'var(--surface-primary)',
                color: 'var(--text-primary)'
              }}
            >
              Upload New Image
            </button>
          </div>
        )}

        {/* Info Section */}
        <div
          className="mt-12 p-6 rounded-xl"
          style={{ backgroundColor: 'var(--surface-elevated)' }}
        >
          <h3
            className="text-xl font-semibold mb-3"
            style={{ color: 'var(--text-primary)' }}
          >
            How to Use
          </h3>
          <ul
            className="space-y-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            <li>1. Upload an image by dragging and dropping or clicking the upload area</li>
            <li>2. Click "Remove Background" to process your image</li>
            <li>3. Download the processed image with transparent background</li>
            <li>4. The processed image will be saved as PNG format</li>
          </ul>
          <div
            className="mt-4 p-4 rounded-lg border"
            style={{
              backgroundColor: 'color-mix(in oklab, var(--status-warning) 10%, var(--surface-elevated))',
              borderColor: 'var(--status-warning)',
              color: 'var(--text-secondary)'
            }}
          >
            <p className="font-semibold mb-2" style={{ color: 'var(--status-warning)' }}>
              ⚠️ Service Configuration Required
            </p>
            <p className="text-sm">
              The background removal service requires at least 1GB RAM to process images.
              If you encounter "Out of Memory" errors, please upgrade your Render service to a paid plan
              or configure an alternative API (remove.bg, Clipdrop, etc.).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
