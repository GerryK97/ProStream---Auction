'use client';

/**
 * QuickBidEditorModal
 *
 * A modal for editing the quick-bid increment buttons shown on the Auction
 * Control Panel.  Operators can add, remove and reorder amounts (1–8 entries,
 * all > 0) and save them back to the tournament record.
 *
 * The parent is responsible for passing the current amounts and a callback
 * that fires once the save request has completed successfully.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';

const DEFAULT_QUICK_BIDS = [1000, 5000, 10000, 20000, 25000, 50000];
const MAX_ENTRIES = 8;
const MIN_ENTRIES = 1;

interface Props {
    tournamentId: string;
    currentAmounts: number[];
    onSave: (amounts: number[]) => void;
    onClose: () => void;
}

type Row = { id: number; value: string };

let _nextId = 1;
const uid = () => _nextId++;

export default function QuickBidEditorModal({
    tournamentId,
    currentAmounts,
    onSave,
    onClose,
}: Props) {
    const [rows, setRows] = useState<Row[]>(() =>
        (currentAmounts.length > 0 ? currentAmounts : DEFAULT_QUICK_BIDS).map(a => ({
            id: uid(),
            value: String(a),
        })),
    );
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    const updateRow = useCallback((id: number, value: string) => {
        setRows(prev => prev.map(r => (r.id === id ? { ...r, value } : r)));
        setError(null);
    }, []);

    const removeRow = useCallback((id: number) => {
        setRows(prev => {
            if (prev.length <= MIN_ENTRIES) return prev;
            return prev.filter(r => r.id !== id);
        });
    }, []);

    const addRow = useCallback(() => {
        setRows(prev => {
            if (prev.length >= MAX_ENTRIES) return prev;
            return [...prev, { id: uid(), value: '' }];
        });
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }, []);

    const resetDefaults = useCallback(() => {
        setRows(DEFAULT_QUICK_BIDS.map(a => ({ id: uid(), value: String(a) })));
        setError(null);
    }, []);

    const handleSave = useCallback(async () => {
        const amounts: number[] = [];
        for (const row of rows) {
            const n = Number(row.value.replace(/,/g, '').trim());
            if (!Number.isFinite(n) || n <= 0) {
                setError('All amounts must be positive numbers.');
                return;
            }
            amounts.push(n);
        }
        if (amounts.length < MIN_ENTRIES) {
            setError(`You need at least ${MIN_ENTRIES} amount.`);
            return;
        }
        if (amounts.length > MAX_ENTRIES) {
            setError(`Maximum ${MAX_ENTRIES} quick-bid amounts allowed.`);
            return;
        }

        setSaving(true);
        setError(null);
        try {
            const { getAuthHeaders } = await import('@/lib/api-client');
            const res = await fetch(`/api/tournaments/${tournamentId}`, {
                method: 'PUT',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    directQuickBidsEnabled: true,
                    directQuickBids: amounts.map(a => ({ amount: a })),
                }),
            });
            if (!res.ok) {
                const json = await res.json().catch(() => ({}));
                throw new Error(json?.error ?? `Server error ${res.status}`);
            }
            onSave(amounts);
            onClose();
        } catch (err: any) {
            setError(err?.message ?? 'Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    }, [rows, tournamentId, onSave, onClose]);

    const canAdd = rows.length < MAX_ENTRIES;
    const canRemove = rows.length > MIN_ENTRIES;

    return (
        /* Backdrop */
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            {/* Panel */}
            <div
                className="w-full max-w-sm rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                style={{ backgroundColor: 'var(--surface-primary)', border: '1px solid var(--border-primary)' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                    <div>
                        <p className="font-bold text-[var(--text-primary)]">Quick Bid Amounts</p>
                        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Edit the increment buttons shown during bidding</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 flex items-center justify-center rounded-full text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                        style={{ backgroundColor: 'var(--surface-secondary)' }}
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                {/* Rows */}
                <div className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-2" style={{ maxHeight: '340px' }}>
                    {rows.map((row, idx) => (
                        <div key={row.id} className="flex items-center gap-2">
                            <span className="text-xs w-4 text-right shrink-0" style={{ color: 'var(--text-muted)' }}>
                                {idx + 1}
                            </span>
                            <div className="flex items-center flex-1 rounded-lg overflow-hidden" style={{ border: '1.5px solid var(--border-primary)', backgroundColor: 'var(--surface-secondary)' }}>
                                <input
                                    type="number"
                                    min={1}
                                    value={row.value}
                                    onChange={e => updateRow(row.id, e.target.value)}
                                    placeholder="e.g. 10000"
                                    className="flex-1 bg-transparent px-2.5 py-2 text-sm text-[var(--text-primary)] outline-none"
                                    style={{ minWidth: 0 }}
                                />
                                {row.value && Number(row.value) >= 1000 && (
                                    <span className="px-2.5 text-xs shrink-0" style={{ color: 'var(--text-tertiary)' }}>
                                        {Number(row.value) >= 100000
                                            ? `${(Number(row.value) / 100000).toFixed(Number(row.value) % 100000 === 0 ? 0 : 1)}L`
                                            : `${(Number(row.value) / 1000).toFixed(Number(row.value) % 1000 === 0 ? 0 : 1)}K`}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => removeRow(row.id)}
                                disabled={!canRemove}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-sm transition-colors disabled:opacity-25"
                                style={{ backgroundColor: 'rgba(220,38,38,0.1)', color: '#f87171' }}
                                aria-label="Remove"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                    <div ref={bottomRef} />
                </div>

                {/* Add row + reset */}
                <div className="px-5 pb-2 flex items-center gap-2">
                    <button
                        onClick={addRow}
                        disabled={!canAdd}
                        className="flex-1 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-30"
                        style={{ backgroundColor: 'var(--surface-elevated)', color: 'var(--text-secondary)', border: '1.5px dashed var(--border-primary)' }}
                    >
                        + Add Amount {canAdd ? `(${rows.length}/${MAX_ENTRIES})` : '(max)'}
                    </button>
                    <button
                        onClick={resetDefaults}
                        className="px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
                        style={{ backgroundColor: 'var(--surface-elevated)', color: 'var(--text-tertiary)', border: '1px solid var(--border-primary)' }}
                        title="Reset to defaults"
                    >
                        Reset
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="mx-5 mb-2 px-3 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: 'rgba(220,38,38,0.08)', color: '#f87171', border: '1px solid rgba(220,38,38,0.2)' }}>
                        {error}
                    </div>
                )}

                {/* Footer */}
                <div className="px-5 py-4 flex gap-2" style={{ borderTop: '1px solid var(--border-primary)' }}>
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                        style={{ backgroundColor: 'var(--surface-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-primary)' }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                        style={{ backgroundColor: 'var(--brand-primary)', color: '#fff', border: 'none' }}
                    >
                        {saving ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}
