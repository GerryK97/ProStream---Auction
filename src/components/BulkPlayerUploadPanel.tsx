'use client';

import React, { useState, useRef } from 'react';
import { downloadPlayerTemplate } from '@/lib/excel-template';
import { DocumentTextIcon, UploadIcon, LoadingSpinner, CheckCircleIcon, XCircleIcon } from './icons';

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface BulkImportResult {
  success: boolean;
  totalRows: number;
  imported: number;
  failed: number;
  errors: ValidationError[];
  duplicates?: string[];
}

interface BulkPlayerUploadPanelProps {
  onImportComplete?: () => void;
  onClose?: () => void;
}

const BulkPlayerUploadPanel: React.FC<BulkPlayerUploadPanelProps> = ({ onImportComplete, onClose }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<BulkImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    downloadPlayerTemplate();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/master-players/bulk-import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok || response.status === 207) {
        // Success or partial success
        setUploadResult(result);
        if (result.success && onImportComplete) {
          onImportComplete();
        }
      } else {
        // Error response
        if (result.errors) {
          setUploadResult(result);
        } else {
          setError(result.error || result.details || 'Upload failed');
        }
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Bulk Player Upload</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">How to bulk upload players:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
          <li>Download the Excel template below</li>
          <li>Fill in the player details (delete the sample data)</li>
          <li>Upload the completed file</li>
          <li>Review the results and fix any errors if needed</li>
        </ol>
      </div>

      {/* Download Template Button */}
      <div className="mb-6">
        <button
          onClick={handleDownloadTemplate}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <DocumentTextIcon className="w-5 h-5" />
          Download Excel Template
        </button>
      </div>

      {/* File Upload Section */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-6 text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileSelect}
          className="hidden"
          id="bulk-upload-file"
        />
        <label htmlFor="bulk-upload-file" className="cursor-pointer">
          <UploadIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            {selectedFile ? selectedFile.name : 'Choose a file or drag it here'}
          </p>
          <p className="text-sm text-gray-500">Excel (.xlsx, .xls) or CSV (.csv) files only</p>
        </label>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <XCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900">Error</h4>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Result Summary */}
      {uploadResult && (
        <div className={`border rounded-lg p-4 mb-6 ${uploadResult.success ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="flex items-start gap-2 mb-4">
            {uploadResult.success ? (
              <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0" />
            ) : (
              <XCircleIcon className="w-6 h-6 text-yellow-600 flex-shrink-0" />
            )}
            <div className="flex-1">
              <h4 className={`font-semibold ${uploadResult.success ? 'text-green-900' : 'text-yellow-900'}`}>
                {uploadResult.success ? 'Import Successful!' : 'Import Completed with Errors'}
              </h4>
              <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                <div>
                  <span className="text-gray-600">Total Rows:</span>
                  <span className="ml-2 font-semibold">{uploadResult.totalRows}</span>
                </div>
                <div>
                  <span className="text-green-600">Imported:</span>
                  <span className="ml-2 font-semibold text-green-700">{uploadResult.imported}</span>
                </div>
                <div>
                  <span className="text-red-600">Failed:</span>
                  <span className="ml-2 font-semibold text-red-700">{uploadResult.failed}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Error Details */}
          {uploadResult.errors && uploadResult.errors.length > 0 && (
            <div className="mt-4 max-h-60 overflow-y-auto">
              <h5 className="font-semibold text-sm text-gray-900 mb-2">Error Details:</h5>
              <div className="space-y-1">
                {uploadResult.errors.map((err, index) => (
                  <div key={index} className="text-sm bg-white border border-gray-200 rounded px-3 py-2">
                    <span className="font-medium text-gray-700">Row {err.row}:</span>
                    <span className="text-gray-600 ml-2">{err.field}</span>
                    <span className="text-red-600 ml-2">- {err.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Duplicate Names */}
          {uploadResult.duplicates && uploadResult.duplicates.length > 0 && (
            <div className="mt-4">
              <h5 className="font-semibold text-sm text-gray-900 mb-2">Duplicate Players Found:</h5>
              <div className="text-sm bg-white border border-gray-200 rounded px-3 py-2">
                {uploadResult.duplicates.join(', ')}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end">
        {uploadResult ? (
          <>
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Upload Another File
            </button>
            {uploadResult.success && onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            )}
          </>
        ) : (
          <>
            <button
              onClick={handleReset}
              disabled={!selectedFile || isUploading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear
            </button>
            <button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <LoadingSpinner className="w-5 h-5" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadIcon className="w-5 h-5" />
                  Upload & Import
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default BulkPlayerUploadPanel;
