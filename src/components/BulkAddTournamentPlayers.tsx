'use client';

import React, { useState, useRef } from 'react';
import { Tournament } from '@/types';

interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  skipped: number;
  total: number;
  errors: Array<{ row: number; error: string; player?: string }>;
  duplicates: Array<{ row: number; player: string; reason: string }>;
  message: string;
}

interface BulkAddTournamentPlayersProps {
  tournament: Tournament;
  onSuccess?: () => void;
}

export default function BulkAddTournamentPlayers({
  tournament,
  onSuccess
}: BulkAddTournamentPlayersProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const playerClasses = tournament.usePlayerClasses && tournament.playerClasses
    ? tournament.playerClasses.map(c => c.name)
    : [];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
        setResult(null);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
        setResult(null);
      }
    }
  };

  const validateFile = (file: File): boolean => {
    const validExtensions = ['xlsx', 'xls', 'csv'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (!fileExtension || !validExtensions.includes(fileExtension)) {
      alert('Please upload a valid Excel file (.xlsx, .xls) or CSV file.');
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return false;
    }

    return true;
  };

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      const response = await fetch(`/api/players/tournament-bulk-template?tournamentId=${tournament._id}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to download template');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tournament_players_${tournament.name.replace(/\s+/g, '_')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      alert(`Failed to download template: ${error.message}`);
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tournamentId', tournament._id);

      const response = await fetch('/api/players/bulk-add-to-tournament', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setResult(data);

      if (data.imported > 0 && onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-white mb-2">Bulk Add Players to Tournament</h3>
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <span className="font-medium">Tournament:</span>
          <span className="text-white">{tournament.name}</span>
          {playerClasses.length > 0 && (
            <>
              <span className="text-gray-500 mx-2">•</span>
              <span className="font-medium">Player Classes:</span>
              <span className="text-white">{playerClasses.join(', ')}</span>
            </>
          )}
        </div>
      </div>

      <div className="mb-4">
        <button
          onClick={handleDownloadTemplate}
          disabled={downloadingTemplate}
          className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded font-medium flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {downloadingTemplate ? 'Downloading...' : 'Download Template with Available Players'}
        </button>
        <p className="mt-2 text-xs text-gray-400">
          Download Excel file with all available players. Select which players to add and their classes.
        </p>
      </div>

      {/* File Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center ${
          dragActive ? 'border-blue-500 bg-blue-900/20' : 'border-gray-600'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          className="hidden"
          disabled={uploading}
        />

        {!file ? (
          <div>
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-400">
              Drag and drop your filled Excel file here, or
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
            >
              Browse Files
            </button>
            <p className="mt-2 text-xs text-gray-500">
              Supports .xlsx, .xls, and .csv files (Max 10MB)
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-center gap-2 text-green-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{file.name}</span>
            </div>
            <p className="mt-1 text-sm text-gray-400">
              {(file.size / 1024).toFixed(2)} KB
            </p>
            <div className="flex gap-2 justify-center mt-4">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded font-medium"
              >
                {uploading ? 'Adding Players...' : 'Add Players to Tournament'}
              </button>
              <button
                onClick={handleReset}
                disabled={uploading}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 text-white rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="mt-4 bg-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            <span className="text-white">Processing file and adding players to tournament...</span>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="mt-4 bg-gray-700 rounded-lg p-4">
          <div className="flex items-start gap-3 mb-3">
            {result.imported > 0 ? (
              <svg className="w-6 h-6 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <div className="flex-1">
              <h4 className="text-white font-medium mb-2">Import Results</h4>
              <div className="space-y-1 text-sm">
                <p className="text-gray-300">
                  <span className="font-medium text-green-400">{result.imported}</span> players added successfully
                </p>
                <p className="text-gray-300">
                  <span className="font-medium text-red-400">{result.failed}</span> players failed
                </p>
                <p className="text-gray-300">
                  <span className="font-medium text-yellow-400">{result.skipped}</span> players skipped (Add = No)
                </p>
                <p className="text-gray-400">Total rows processed: {result.total}</p>
              </div>
            </div>
          </div>

          {/* Errors */}
          {result.errors && result.errors.length > 0 && (
            <div className="mt-4 border-t border-gray-600 pt-3">
              <h5 className="text-red-400 font-medium mb-2 text-sm">Errors:</h5>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {result.errors.map((error, index) => (
                  <p key={index} className="text-xs text-red-300">
                    Row {error.row} ({error.player || 'Unknown'}): {error.error}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Duplicates */}
          {result.duplicates && result.duplicates.length > 0 && (
            <div className="mt-4 border-t border-gray-600 pt-3">
              <h5 className="text-yellow-400 font-medium mb-2 text-sm">Already Added (Skipped):</h5>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {result.duplicates.map((dup, index) => (
                  <p key={index} className="text-xs text-yellow-300">
                    Row {dup.row}: {dup.player} - {dup.reason}
                  </p>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleReset}
            className="mt-4 w-full px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm"
          >
            Add More Players
          </button>
        </div>
      )}
    </div>
  );
}
