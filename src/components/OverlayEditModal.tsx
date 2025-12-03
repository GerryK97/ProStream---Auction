'use client';

import React, { useState } from 'react';

interface OverlayEditModalProps {
    overlay: {
        id: string;
        name: string;
        description: string;
        category: string;
        imageURL: string;
        dimensions: { width: number; height: number };
    };
    onClose: () => void;
    onSave: (updates: {
        name: string;
        description: string;
        category: string;
        imageURL: string;
        dimensions: { width: number; height: number };
    }) => void;
}

const OverlayEditModal: React.FC<OverlayEditModalProps> = ({ overlay, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: overlay.name,
        description: overlay.description,
        category: overlay.category,
        imageURL: overlay.imageURL,
        dimensions: { ...overlay.dimensions }
    });

    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error('Failed to save overlay:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setUploadError('Please select a valid image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setUploadError('Image size must be less than 5MB');
            return;
        }

        setIsUploading(true);
        setUploadError(null);

        try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);
            formDataUpload.append('folder', 'prostream-auction/overlays'); // Specify overlay folder

            // Get auth token
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            const headers: Record<string, string> = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: headers,
                body: formDataUpload,
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Upload failed:', errorData);
                throw new Error(errorData.error || 'Upload failed');
            }

            const data = await response.json();
            setFormData({ ...formData, imageURL: data.url });
        } catch (error: any) {
            console.error('Failed to upload image:', error);
            setUploadError(error.message || 'Failed to upload image. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const categories = [
        'Player Display',
        'Team Display',
        'Ticker',
        'Auction Info',
        'Statistics',
        'Notifications',
        'Full Screen'
    ];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
            onClick={onClose}
        >
            <div
                className="rounded-lg shadow-xl max-w-2xl w-full"
                style={{
                    backgroundColor: 'var(--surface-secondary)',
                    border: `1px solid var(--border-primary)`
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="px-6 py-4 flex items-center justify-between"
                    style={{
                        borderBottom: `1px solid var(--border-primary)`,
                        backgroundColor: 'var(--surface-elevated)'
                    }}
                >
                    <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        Edit Overlay
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
                    {/* Overlay Name */}
                    <div>
                        <label
                            htmlFor="name"
                            className="block text-sm font-medium mb-1"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            Overlay Name
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 rounded-md border focus:ring-2 focus:ring-brand-primary"
                            style={{
                                backgroundColor: 'var(--surface-primary)',
                                borderColor: 'var(--border-primary)',
                                color: 'var(--text-primary)'
                            }}
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label
                            htmlFor="description"
                            className="block text-sm font-medium mb-1"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            Description
                        </label>
                        <textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 rounded-md border focus:ring-2 focus:ring-brand-primary"
                            style={{
                                backgroundColor: 'var(--surface-primary)',
                                borderColor: 'var(--border-primary)',
                                color: 'var(--text-primary)'
                            }}
                            required
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label
                            htmlFor="category"
                            className="block text-sm font-medium mb-1"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            Category
                        </label>
                        <select
                            id="category"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full px-3 py-2 rounded-md border focus:ring-2 focus:ring-brand-primary"
                            style={{
                                backgroundColor: 'var(--surface-primary)',
                                borderColor: 'var(--border-primary)',
                                color: 'var(--text-primary)'
                            }}
                            required
                        >
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Overlay Dimensions */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label
                                htmlFor="width"
                                className="block text-sm font-medium mb-1"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                Width (px)
                            </label>
                            <input
                                type="number"
                                id="width"
                                value={formData.dimensions.width}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    dimensions: { ...formData.dimensions, width: parseInt(e.target.value) || 0 }
                                })}
                                className="w-full px-3 py-2 rounded-md border focus:ring-2 focus:ring-brand-primary"
                                style={{
                                    backgroundColor: 'var(--surface-primary)',
                                    borderColor: 'var(--border-primary)',
                                    color: 'var(--text-primary)'
                                }}
                                min="1"
                                max="7680"
                                required
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="height"
                                className="block text-sm font-medium mb-1"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                Height (px)
                            </label>
                            <input
                                type="number"
                                id="height"
                                value={formData.dimensions.height}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    dimensions: { ...formData.dimensions, height: parseInt(e.target.value) || 0 }
                                })}
                                className="w-full px-3 py-2 rounded-md border focus:ring-2 focus:ring-brand-primary"
                                style={{
                                    backgroundColor: 'var(--surface-primary)',
                                    borderColor: 'var(--border-primary)',
                                    color: 'var(--text-primary)'
                                }}
                                min="1"
                                max="4320"
                                required
                            />
                        </div>
                    </div>

                    {/* Preview Image Upload */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                            Preview Image
                        </label>

                        {/* Upload Button */}
                        <div className="flex gap-2 mb-2">
                            <label
                                className="px-4 py-2 rounded-md font-medium cursor-pointer transition-colors inline-flex items-center gap-2"
                                style={{
                                    backgroundColor: 'var(--surface-elevated)',
                                    color: 'var(--text-primary)',
                                    border: `1px solid var(--border-primary)`,
                                    opacity: isUploading ? 0.5 : 1
                                }}
                            >
                                {isUploading ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        Upload Image
                                    </>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    disabled={isUploading}
                                />
                            </label>
                            <div className="flex-1">
                                <input
                                    type="url"
                                    value={formData.imageURL}
                                    onChange={(e) => setFormData({ ...formData, imageURL: e.target.value })}
                                    className="w-full px-3 py-2 rounded-md border focus:ring-2 focus:ring-brand-primary"
                                    style={{
                                        backgroundColor: 'var(--surface-primary)',
                                        borderColor: 'var(--border-primary)',
                                        color: 'var(--text-primary)'
                                    }}
                                    placeholder="Or paste image URL..."
                                    required
                                />
                            </div>
                        </div>

                        {/* Upload Error */}
                        {uploadError && (
                            <p className="text-sm mb-2" style={{ color: 'var(--error-text)' }}>
                                {uploadError}
                            </p>
                        )}

                        {/* Image Preview */}
                        {formData.imageURL && (
                            <div
                                className="rounded-md overflow-hidden"
                                style={{ border: `1px solid var(--border-primary)` }}
                            >
                                <img
                                    src={formData.imageURL}
                                    alt="Preview"
                                    className="w-full h-40 object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Info Box */}
                    <div
                        className="p-3 rounded-md text-sm"
                        style={{
                            backgroundColor: 'var(--info-bg)',
                            border: `1px solid var(--info-border)`,
                            color: 'var(--info-text)'
                        }}
                    >
                        <p className="flex items-start gap-2">
                            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <span>
                                Note: This only updates the overlay metadata displayed in the library. The actual overlay functionality and route remain unchanged.
                            </span>
                        </p>
                    </div>
                </form>

                {/* Footer */}
                <div
                    className="px-6 py-4 flex items-center justify-end gap-3"
                    style={{
                        borderTop: `1px solid var(--border-primary)`,
                        backgroundColor: 'var(--surface-elevated)'
                    }}
                >
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-md font-medium transition-colors"
                        style={{
                            backgroundColor: 'var(--surface-secondary)',
                            color: 'var(--text-primary)',
                            border: `1px solid var(--border-primary)`
                        }}
                        disabled={isSaving}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        className="px-4 py-2 rounded-md font-medium text-white transition-colors"
                        style={{
                            backgroundColor: 'var(--brand-primary)',
                            opacity: isSaving ? 0.5 : 1
                        }}
                        disabled={isSaving}
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OverlayEditModal;
