import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { pgDb } from './db';
import { pricingConfig, walletTransactions, wallets } from './users-schema';

export const WALLET_CURRENCY = 'LKR';

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
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  referenceId: number | null;
  createdBy: string | null;
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

export async function getWalletWithRecentTransactions(userId: string, limit = 10) {
  const wallet = await ensureWalletForUser(userId);
  const transactions = await pgDb.query.walletTransactions.findMany({
    where: eq(walletTransactions.walletId, wallet.id),
    orderBy: [desc(walletTransactions.createdAt)],
    limit,
  });

  return { wallet, balance: wallet.balance, currency: WALLET_CURRENCY, transactions };
}

export async function getWalletTransactions(userId: string) {
  const wallet = await ensureWalletForUser(userId);
  const transactions = await pgDb.query.walletTransactions.findMany({
    where: eq(walletTransactions.walletId, wallet.id),
    orderBy: [desc(walletTransactions.createdAt)],
  });

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

export async function deductWalletBalance({
  userId,
  amount,
  description,
  referenceId,
  createdBy,
}: {
  userId: string;
  amount: number;
  description: string;
  referenceId?: number | null;
  createdBy?: string | null;
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
}: {
  userId: string;
  amount: number;
  description: string;
  referenceId?: number | null;
  createdBy?: string | null;
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
