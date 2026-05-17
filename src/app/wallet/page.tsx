'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

type WalletTransaction = {
  id: number;
  walletId: number;
  type: 'topup' | 'deduction';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  referenceId?: number | null;
  createdBy?: string | null;
  createdAt: string;
};

type WalletResponse = {
  wallet: {
    id: number;
    userId: string;
    balance: number;
    currency: 'LKR';
    updatedAt: string;
  };
  balance: number;
  currency: 'LKR';
  transactions: WalletTransaction[];
};

function formatAmount(amount: number, currency = 'LKR') {
  return `${currency} ${Math.abs(amount).toLocaleString('en-LK')}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleString('en-LK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function TransactionRow({ transaction, currency }: { transaction: WalletTransaction; currency: string }) {
  const isTopup = transaction.type === 'topup';
  return (
    <div className="flex flex-col gap-3 border-b px-5 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: 'var(--border-primary)' }}>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold"
            style={{
              backgroundColor: isTopup
                ? 'color-mix(in oklab, var(--status-success) 16%, var(--surface-elevated))'
                : 'color-mix(in oklab, var(--status-danger) 14%, var(--surface-elevated))',
              color: isTopup ? 'var(--status-success)' : 'var(--status-danger)',
            }}
          >
            {isTopup ? '+' : '-'}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{transaction.description}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(transaction.createdAt)}</p>
          </div>
        </div>
      </div>
      <div className="text-left sm:text-right">
        <p className="text-base font-bold" style={{ color: isTopup ? 'var(--status-success)' : 'var(--status-danger)' }}>
          {isTopup ? '+' : '-'}{formatAmount(transaction.amount, currency)}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Balance {formatAmount(transaction.balanceAfter, currency)}</p>
      </div>
    </div>
  );
}

export default function WalletPage() {
  const { token, isAuthenticated, isLoading } = useAuth();
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currency = wallet?.currency ?? 'LKR';
  const transactions = useMemo(() => wallet?.transactions ?? [], [wallet]);

  const loadWallet = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (!token) {
      setLoading(false);
      return;
    }

    if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/wallet', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load wallet');
      setWallet(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wallet');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    if (!isLoading) void loadWallet();
  }, [isLoading, loadWallet]);

  if (!isLoading && !isAuthenticated) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border p-8 text-center" style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-primary)' }}>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Login required</p>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>Sign in to view your shared ProStream wallet.</p>
          <Link href="/auth/login" className="mt-6 inline-flex rounded-full px-5 py-2 text-sm font-semibold text-white" style={{ backgroundColor: 'var(--brand-primary)' }}>
            Go to login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: 'var(--brand-secondary)' }}>Shared Wallet</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl" style={{ color: 'var(--text-primary)' }}>Wallet</h1>
          <p className="mt-3 max-w-2xl text-sm sm:text-base" style={{ color: 'var(--text-tertiary)' }}>
            One balance shared across Scoreboard, Auction, and the ProStream mobile app. Auction overlay charges are deducted here when pricing is enabled.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadWallet('refresh')}
          disabled={refreshing || loading}
          className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60"
          style={{ backgroundColor: 'var(--brand-primary)' }}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-3xl border p-6 shadow-2xl" style={{ borderColor: 'var(--border-primary)', background: 'linear-gradient(135deg, var(--brand-primary), color-mix(in oklab, var(--brand-primary) 45%, var(--brand-secondary)))' }}>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/75">Available Balance</p>
            {loading ? (
              <div className="mt-8 h-12 w-48 animate-pulse rounded-xl bg-white/20" />
            ) : (
              <p className="mt-5 text-4xl font-black text-white sm:text-5xl">{formatAmount(wallet?.balance ?? 0, currency)}</p>
            )}
            <div className="mt-8 rounded-2xl border border-white/20 bg-white/10 p-4 text-sm text-white/80 backdrop-blur">
              Wallet credits use the existing Scoreboard convention: integer LKR credits and immutable transaction history.
            </div>
          </div>

          <div className="rounded-3xl border p-6" style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-primary)' }}>
            <p className="text-sm font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>Charge point enabled</p>
            <p className="mt-3 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Auction overlay sessions</p>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Pricing key: <span className="font-mono">auction_overlay_create</span>. If this key is missing or set to 0, creation remains free.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border" style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-primary)' }}>
          <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: 'var(--border-primary)' }}>
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Recent transactions</h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Latest wallet top-ups and deductions.</p>
            </div>
            <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ backgroundColor: 'var(--surface-elevated)', color: 'var(--text-secondary)' }}>
              {transactions.length} shown
            </span>
          </div>

          {error ? (
            <div className="p-8">
              <div className="rounded-2xl border p-5" style={{ borderColor: 'color-mix(in oklab, var(--status-danger) 35%, var(--border-primary))', backgroundColor: 'color-mix(in oklab, var(--status-danger) 10%, var(--surface-card))' }}>
                <p className="font-semibold" style={{ color: 'var(--status-danger)' }}>Could not load wallet</p>
                <p className="mt-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>{error}</p>
              </div>
            </div>
          ) : loading ? (
            <div className="space-y-3 p-5">
              {[0, 1, 2].map((item) => <div key={item} className="h-16 animate-pulse rounded-2xl" style={{ backgroundColor: 'var(--surface-elevated)' }} />)}
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center p-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl" style={{ backgroundColor: 'var(--surface-elevated)' }}>🧾</div>
              <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>No transactions yet</p>
              <p className="mt-2 max-w-sm text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Top-ups from Scoreboard and Auction deductions will appear here.
              </p>
            </div>
          ) : (
            <div>{transactions.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} currency={currency} />)}</div>
          )}
        </div>
      </section>
    </main>
  );
}
