'use client';

import React, { useState, useMemo } from 'react';
import { useAuction } from '@/hooks/useAuction';
import { OverlayTemplate } from '@/types';
import { RefreshIcon, CopyIcon, ExternalLinkIcon, BanIcon, DeleteIcon, PlusIcon } from './icons';
import Modal from './Modal';

const OverlayDashboard: React.FC = () => {
    const { overlayInstances, overlayTemplates, createOverlayInstance, deleteOverlayInstance } = useAuction();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTag, setSelectedTag] = useState('All');

    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [templateForModal, setTemplateForModal] = useState<OverlayTemplate | null>(null);
    const [newInstanceName, setNewInstanceName] = useState('');
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

    const allTags = useMemo(() => {
        const tags = new Set<string>();
        overlayTemplates.forEach(t => t.tags.forEach(tag => tags.add(tag)));
        return ['All', ...Array.from(tags).sort()];
    }, [overlayTemplates]);

    const filteredTemplates = useMemo(() => {
        return overlayTemplates.filter(template => {
            const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) || template.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTag = selectedTag === 'All' || template.tags.includes(selectedTag);
            return matchesSearch && matchesTag;
        });
    }, [overlayTemplates, searchTerm, selectedTag]);

    const handleCreateLinkClick = (template: OverlayTemplate) => {
        setTemplateForModal(template);
        setNewInstanceName(`${template.name} Overlay`);
        setCreateModalOpen(true);
    };

    const handleSaveNewInstance = () => {
        if (templateForModal && newInstanceName.trim()) {
            createOverlayInstance(templateForModal, newInstanceName.trim());
            setCreateModalOpen(false);
            setNewInstanceName('');
            setTemplateForModal(null);
        }
    };

    const handleCopy = (url: string) => {
        navigator.clipboard.writeText(url);
        setCopiedUrl(url);
        setTimeout(() => setCopiedUrl(null), 2000);
    };

    return (
        <div className="animate-fade-in space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-white">Overlay Library</h2>
                <p className="text-md text-neutral-400">Create and manage multiple overlay instances with unique shareable links</p>
            </div>

            <div className="bg-neutral-800 p-6 rounded-lg border border-neutral-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Active Overlay Links ({overlayInstances.length})</h3>
                    <button className="flex items-center gap-2 text-sm bg-neutral-700 hover:bg-neutral-600 px-3 py-1.5 rounded-md transition-colors">
                        <RefreshIcon className="h-4 w-4" />
                        Refresh
                    </button>
                </div>
                <div className="space-y-3">
                    {overlayInstances.map(instance => (
                        <div key={instance._id} className="bg-neutral-900/50 p-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-3">
                                    <h4 className="font-semibold">{instance.name}</h4>
                                    <span className="text-xs font-mono bg-neutral-700 px-2 py-0.5 rounded">{instance.templateName}</span>
                                    <span className="text-xs font-bold text-green-300 bg-green-900/50 px-2 py-0.5 rounded-full border border-green-700">ACTIVE</span>
                                </div>
                                <p className="text-sm text-neutral-400 mt-1 font-mono break-all">{instance.url}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button onClick={() => handleCopy(instance.url)} className="flex items-center gap-2 text-sm bg-neutral-600 hover:bg-neutral-500 px-3 py-2 rounded-md transition-colors">
                                    <CopyIcon className="h-4 w-4" /> {copiedUrl === instance.url ? 'Copied!' : 'Copy'}
                                </button>
                                <a href={instance.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-md transition-colors">
                                    <ExternalLinkIcon className="h-4 w-4" /> Open
                                </a>
                                <button className="p-2 bg-neutral-700 hover:bg-neutral-600 rounded-md transition-colors" aria-label="Disable">
                                    <BanIcon className="h-5 w-5"/>
                                </button>
                                <button onClick={() => deleteOverlayInstance(instance._id)} className="p-2 bg-red-800 hover:bg-red-700 rounded-md transition-colors" aria-label="Delete">
                                    <DeleteIcon className="h-5 w-5"/>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-neutral-800 p-6 rounded-lg border border-neutral-700 grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                 <div>
                    <label htmlFor="search" className="block text-sm font-medium text-neutral-300 mb-1">Search Overlays</label>
                    <input type="text" id="search" placeholder="Search by name or description..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-neutral-700 border-neutral-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary"/>
                </div>
                <div>
                    <label htmlFor="filter-tag" className="block text-sm font-medium text-neutral-300 mb-1">Filter by Tag</label>
                    <select id="filter-tag" value={selectedTag} onChange={e => setSelectedTag(e.target.value)} className="w-full bg-neutral-700 border-neutral-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary">
                        {allTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map(template => (
                    <div key={template._id} className="bg-neutral-800 rounded-lg border border-neutral-700 flex flex-col overflow-hidden group">
                        <div className="relative">
                            <img src={template.imageURL} alt={template.name} className="w-full h-40 object-cover" />
                            {template.isPremium && <span className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-md">PREMIUM</span>}
                        </div>
                        <div className="p-4 flex flex-col flex-grow">
                            <h3 className="text-lg font-bold">{template.name}</h3>
                            <p className="text-sm text-neutral-400 mt-1 flex-grow">{template.description}</p>
                            <div className="mt-4">
                                {template.tags.map(tag => (
                                    <span key={tag} className="inline-block bg-neutral-700 text-neutral-300 text-xs font-medium mr-2 mb-2 px-2.5 py-1 rounded-full">{tag}</span>
                                ))}
                            </div>
                        </div>
                        <div className="p-4 bg-neutral-800/50 border-t border-neutral-700">
                             <button onClick={() => handleCreateLinkClick(template)} className="w-full flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-primary/80 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200">
                                <PlusIcon className="h-5 w-5" />
                                Create Overlay Link
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <Modal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} title={`Create from "${templateForModal?.name}"`}>
                <div className="space-y-4">
                    <p className="text-neutral-300">Create a new shareable overlay link based on the <span className="font-semibold text-white">{templateForModal?.name}</span> template.</p>
                    <div>
                        <label htmlFor="instanceName" className="block text-sm font-medium text-neutral-300">Link Name</label>
                        <input
                            type="text"
                            id="instanceName"
                            value={newInstanceName}
                            onChange={(e) => setNewInstanceName(e.target.value)}
                            className="mt-1 block w-full bg-neutral-700 border-neutral-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary"
                        />
                    </div>
                    <div className="flex justify-end gap-4 pt-2">
                        <button onClick={() => setCreateModalOpen(false)} className="bg-neutral-600 hover:bg-neutral-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">Cancel</button>
                        <button onClick={handleSaveNewInstance} className="bg-brand-primary hover:bg-brand-primary/80 text-white font-bold py-2 px-4 rounded-lg transition-colors">Create Link</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default OverlayDashboard;
