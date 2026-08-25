import { and, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { pgDb } from './db';
import { pricingConfig, users, walletTransactions, wallets } from './users-schema';

export const WALLET_CURRENCY = 'LKR';

export type TransactionCategory = 'paid_recharge' | 'free_credit' | 'overlay_charge';

export type WalletResponse = {
  id: number;
  userId: string;
  balance: number;
  currency: typeof WALLET_CURRENCY;
  updatedAt: Date;
};

export type WalletTransactionResponse = {
  id: number;
  walletId: number;
  type: 'topup' | 'deduction';
  category: TransactionCategory | null;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  referenceId: number | null;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: Date;
};

export class InsufficientWalletBalanceError extends Error {
  constructor(public readonly currentBalance: number, public readonly requiredAmount: number) {
    super('Insufficient wallet balance');
    this.name = 'InsufficientWalletBalanceError';
  }
}

function toWalletResponse(wallet: typeof wallets.$inferSelect): WalletResponse {
  return {
    id: wallet.id,
    userId: wallet.userId,
    balance: wallet.balance,
    currency: WALLET_CURRENCY,
    updatedAt: wallet.updatedAt,
  };
}

async function ensureWalletRow(userId: string, tx: typeof pgDb = pgDb) {
  const existing = await tx.query.wallets.findFirst({ where: eq(wallets.userId, userId) });
  if (existing) return existing;

  const [created] = await tx
    .insert(wallets)
    .values({ userId, balance: 0 })
    .onConflictDoNothing({ target: wallets.userId })
    .returning();

  if (created) return created;

  const afterConflict = await tx.query.wallets.findFirst({ where: eq(wallets.userId, userId) });
  if (!afterConflict) throw new Error('Failed to ensure wallet');
  return afterConflict;
}

export async function ensureWalletForUser(userId: string): Promise<WalletResponse> {
  const wallet = await ensureWalletRow(userId);
  return toWalletResponse(wallet);
}

// Selects transactions for a wallet, joining `users` so each row carries the
// display name of whoever performed it (`createdByName`) for full attribution.
async function selectWalletTransactions(walletId: number, limit?: number) {
  const base = pgDb
    .select({
      id: walletTransactions.id,
      walletId: walletTransactions.walletId,
      type: walletTransactions.type,
      category: walletTransactions.category,
      amount: walletTransactions.amount,
      balanceBefore: walletTransactions.balanceBefore,
      balanceAfter: walletTransactions.balanceAfter,
      description: walletTransactions.description,
      referenceId: walletTransactions.referenceId,
      createdBy: walletTransactions.createdBy,
      createdByName: users.displayName,
      createdAt: walletTransactions.createdAt,
    })
    .from(walletTransactions)
    .leftJoin(users, eq(walletTransactions.createdBy, users.id))
    .where(eq(walletTransactions.walletId, walletId))
    .orderBy(desc(walletTransactions.createdAt));

  return limit ? base.limit(limit) : base;
}

export async function getWalletWithRecentTransactions(userId: string, limit = 10) {
  const wallet = await ensureWalletForUser(userId);
  const transactions = await selectWalletTransactions(wallet.id, limit);

  return { wallet, balance: wallet.balance, currency: WALLET_CURRENCY, transactions };
}

export async function getWalletTransactions(userId: string) {
  const wallet = await ensureWalletForUser(userId);
  const transactions = await selectWalletTransactions(wallet.id);

  return { wallet, balance: wallet.balance, currency: WALLET_CURRENCY, transactions };
}

export async function getPrice(key: string, fallbackValue = 0): Promise<number> {
  const row = await pgDb.query.pricingConfig.findFirst({ where: eq(pricingConfig.key, key) });
  const value = row?.value ?? fallbackValue;
  if (!Number.isInteger(value) || value < 0) {
    console.error(`[wallet] Invalid pricing value for ${key}:`, value);
    return fallbackValue >= 0 ? fallbackValue : 0;
  }
  return value;
}

export async function getPricesWithFallbacks(defaults: Record<string, number>): Promise<Record<string, number>> {
  const keys = Object.keys(defaults);
  if (keys.length === 0) return {};

  const rows = await pgDb.query.pricingConfig.findMany({
    where: inArray(pricingConfig.key, keys),
  });
  const storedValues = new Map(rows.map(row => [row.key, row.value]));

  return Object.fromEntries(
    keys.map(key => {
      const fallbackValue = defaults[key] ?? 0;
      const value = storedValues.get(key) ?? fallbackValue;
      const safeValue = Number.isInteger(value) && value >= 0
        ? value
        : (fallbackValue >= 0 ? fallbackValue : 0);
      return [key, safeValue];
    })
  );
}

export async function upsertPrice(key: string, value: number) {
  if (!key.trim()) throw new Error('Pricing key is required');
  if (!Number.isInteger(value) || value < 0) {
    throw new Error('Pricing value must be a non-negative integer');
  }

  const [row] = await pgDb
    .insert(pricingConfig)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: pricingConfig.key,
      set: { value, updatedAt: new Date() },
    })
    .returning();

  return row;
}

export async function upsertPrices(values: Record<string, number>) {
  const entries = Object.entries(values);
  const result = [];
  for (const [key, value] of entries) {
    result.push(await upsertPrice(key, value));
  }
  return result;
}

export async function deductWalletBalance({
  userId,
  amount,
  description,
  referenceId,
  createdBy,
  category = 'overlay_charge',
}: {
  userId: string;
  amount: number;
  description: string;
  referenceId?: number | null;
  createdBy?: string | null;
  category?: TransactionCategory;
}) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error('Wallet deduction amount must be a positive integer');
  }

  return pgDb.transaction(async (tx) => {
    await tx
      .insert(wallets)
      .values({ userId, balance: 0 })
      .onConflictDoNothing({ target: wallets.userId });

    const [updatedWallet] = await tx
      .update(wallets)
      .set({
        balance: sql`${wallets.balance} - ${amount}`,
        updatedAt: new Date(),
      })
      .where(and(eq(wallets.userId, userId), gte(wallets.balance, amount)))
      .returning();

    if (!updatedWallet) {
      const currentWallet = await tx.query.wallets.findFirst({ where: eq(wallets.userId, userId) });
      throw new InsufficientWalletBalanceError(currentWallet?.balance ?? 0, amount);
    }

    const balanceAfter = updatedWallet.balance;
    const balanceBefore = balanceAfter + amount;

    const [transaction] = await tx.insert(walletTransactions).values({
      walletId: updatedWallet.id,
      type: 'deduction',
      category,
      amount: -amount,
      balanceBefore,
      balanceAfter,
      description,
      referenceId: referenceId ?? null,
      createdBy: createdBy ?? userId,
    }).returning();

    return {
      wallet: toWalletResponse(updatedWallet),
      transaction,
    };
  });
}

export async function creditWalletBalance({
  userId,
  amount,
  description,
  referenceId,
  createdBy,
  category = 'paid_recharge',
}: {
  userId: string;
  amount: number;
  description: string;
  referenceId?: number | null;
  createdBy?: string | null;
  category?: TransactionCategory;
}) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error('Wallet credit amount must be a positive integer');
  }

  return pgDb.transaction(async (tx) => {
    await tx
      .insert(wallets)
      .values({ userId, balance: 0 })
      .onConflictDoNothing({ target: wallets.userId });

    const [updatedWallet] = await tx
      .update(wallets)
      .set({
        balance: sql`${wallets.balance} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(wallets.userId, userId))
      .returning();

    if (!updatedWallet) throw new Error('Failed to credit wallet');

    const balanceAfter = updatedWallet.balance;
    const balanceBefore = balanceAfter - amount;

    const [transaction] = await tx.insert(walletTransactions).values({
      walletId: updatedWallet.id,
      type: 'topup',
      category,
      amount,
      balanceBefore,
      balanceAfter,
      description,
      referenceId: referenceId ?? null,
      createdBy: createdBy ?? userId,
    }).returning();

    return {
      wallet: toWalletResponse(updatedWallet),
      transaction,
    };
  });
}

/* ── Accounts ledger ──────────────────────────────────────────────────────
 * Read-only aggregation over the immutable wallet_transactions log. This is
 * the "Accounts" view for Admins and users granted canRechargeWallet. It
 * returns the WHOLE ledger (every recharge by everyone) with attribution.
 * Filters (recharger + date range) are convenience, not access restrictions.
 */

export type AccountsLedgerRow = {
  id: number;
  createdAt: Date;
  type: 'topup' | 'deduction';
  category: TransactionCategory | null;
  amount: number;
  balanceAfter: number;
  description: string;
  // Who performed the transaction (the recharger / admin).
  createdBy: string | null;
  createdByName: string | null;
  // The wallet owner the money moved for (the target user).
  targetUserId: string;
  targetUserName: string | null;
};

export type AccountsRechargerTotal = {
  createdBy: string | null;
  createdByName: string | null;
  paidRecharge: number;
  count: number;
};

export type AccountsLedger = {
  rows: AccountsLedgerRow[];
  totals: {
    // Cash collected = sum of paid_recharge amounts.
    moneyReceived: number;
    paidRechargeCount: number;
    // Free/promo credit, shown separately and NOT counted as cash.
    freeCredit: number;
    freeCreditCount: number;
    overlayCharges: number;
    overlayChargeCount: number;
  };
  perRecharger: AccountsRechargerTotal[];
};

export async function getAccountsLedger({
  createdBy,
  from,
  to,
  limit = 500,
}: {
  createdBy?: string | null;
  from?: Date | null;
  to?: Date | null;
  limit?: number;
} = {}): Promise<AccountsLedger> {
  const conditions = [];
  if (createdBy) conditions.push(eq(walletTransactions.createdBy, createdBy));
  if (from) conditions.push(gte(walletTransactions.createdAt, from));
  if (to) conditions.push(lte(walletTransactions.createdAt, to));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const targetUser = alias(users, 'target_user');
  const recharger = alias(users, 'recharger');

  const rowsRaw = await pgDb
    .select({
      id: walletTransactions.id,
      createdAt: walletTransactions.createdAt,
      type: walletTransactions.type,
      category: walletTransactions.category,
      amount: walletTransactions.amount,
      balanceAfter: walletTransactions.balanceAfter,
      description: walletTransactions.description,
      createdBy: walletTransactions.createdBy,
      createdByName: recharger.displayName,
      targetUserId: wallets.userId,
      targetUserName: targetUser.displayName,
    })
    .from(walletTransactions)
    .innerJoin(wallets, eq(walletTransactions.walletId, wallets.id))
    .leftJoin(targetUser, eq(targetUser.id, wallets.userId))
    .leftJoin(recharger, eq(recharger.id, walletTransactions.createdBy))
    .where(where)
    .orderBy(desc(walletTransactions.createdAt))
    .limit(limit);

  const rows = rowsRaw as unknown as AccountsLedgerRow[];

  // Totals (unbounded by the row limit) computed via aggregate query.
  const totalsRows = await pgDb
    .select({
      category: walletTransactions.category,
      total: sql<number>`COALESCE(SUM(ABS(${walletTransactions.amount})), 0)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(walletTransactions)
    .where(where)
    .groupBy(walletTransactions.category);

  const byCategory = new Map(totalsRows.map((r) => [r.category, r]));
  const paid = byCategory.get('paid_recharge');
  const free = byCategory.get('free_credit');
  const overlay = byCategory.get('overlay_charge');

  const perRechargerRows = await pgDb
    .select({
      createdBy: walletTransactions.createdBy,
      createdByName: sql<string | null>`MAX(${users.displayName})`,
      paidRecharge: sql<number>`COALESCE(SUM(${walletTransactions.amount}), 0)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(walletTransactions)
    .leftJoin(users, eq(walletTransactions.createdBy, users.id))
    .where(
      and(eq(walletTransactions.category, 'paid_recharge'), ...(where ? [where] : [])),
    )
    .groupBy(walletTransactions.createdBy)
    .orderBy(sql`COALESCE(SUM(${walletTransactions.amount}), 0) DESC`);

  return {
    rows,
    totals: {
      moneyReceived: Number(paid?.total ?? 0),
      paidRechargeCount: Number(paid?.count ?? 0),
      freeCredit: Number(free?.total ?? 0),
      freeCreditCount: Number(free?.count ?? 0),
      overlayCharges: Number(overlay?.total ?? 0),
      overlayChargeCount: Number(overlay?.count ?? 0),
    },
    perRecharger: perRechargerRows.map((r) => ({
      createdBy: r.createdBy,
      createdByName: r.createdByName,
      paidRecharge: Number(r.paidRecharge ?? 0),
      count: Number(r.count ?? 0),
    })),
  };
}
