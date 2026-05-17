import { desc, eq } from 'drizzle-orm';
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

export async function ensureWalletForUser(userId: string): Promise<WalletResponse> {
  const existing = await pgDb.query.wallets.findFirst({ where: eq(wallets.userId, userId) });
  if (existing) return toWalletResponse(existing);

  const [created] = await pgDb.insert(wallets).values({ userId, balance: 0 }).returning();
  return toWalletResponse(created);
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
  return row?.value ?? fallbackValue;
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
    let wallet = await tx.query.wallets.findFirst({ where: eq(wallets.userId, userId) });
    if (!wallet) {
      const [created] = await tx.insert(wallets).values({ userId, balance: 0 }).returning();
      wallet = created;
    }

    if (wallet.balance < amount) {
      throw new InsufficientWalletBalanceError(wallet.balance, amount);
    }

    const balanceAfter = wallet.balance - amount;
    await tx.update(wallets).set({ balance: balanceAfter, updatedAt: new Date() }).where(eq(wallets.id, wallet.id));

    const [transaction] = await tx.insert(walletTransactions).values({
      walletId: wallet.id,
      type: 'deduction',
      amount: -amount,
      balanceBefore: wallet.balance,
      balanceAfter,
      description,
      referenceId: referenceId ?? null,
      createdBy: createdBy ?? userId,
    }).returning();

    return {
      wallet: toWalletResponse({ ...wallet, balance: balanceAfter, updatedAt: new Date() }),
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
    let wallet = await tx.query.wallets.findFirst({ where: eq(wallets.userId, userId) });
    if (!wallet) {
      const [created] = await tx.insert(wallets).values({ userId, balance: 0 }).returning();
      wallet = created;
    }

    const balanceAfter = wallet.balance + amount;
    await tx.update(wallets).set({ balance: balanceAfter, updatedAt: new Date() }).where(eq(wallets.id, wallet.id));

    const [transaction] = await tx.insert(walletTransactions).values({
      walletId: wallet.id,
      type: 'topup',
      amount,
      balanceBefore: wallet.balance,
      balanceAfter,
      description,
      referenceId: referenceId ?? null,
      createdBy: createdBy ?? userId,
    }).returning();

    return {
      wallet: toWalletResponse({ ...wallet, balance: balanceAfter, updatedAt: new Date() }),
      transaction,
    };
  });
}
