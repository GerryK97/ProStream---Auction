import { Expo, type ExpoPushMessage } from 'expo-server-sdk';
import { eq, inArray } from 'drizzle-orm';
import { pgDb } from '@/lib/pg/db';
import { devicePushTokens, users } from '@/lib/pg/users-schema';

const expo = new Expo();

export type PushSendResult = {
  sent: number;
  failed: number;
  invalidTokens: number;
  errors?: string[];
};

/**
 * Send an Expo push message to a set of device tokens. Filters invalid tokens,
 * chunks per the Expo 100-message limit, and aggregates receipts. Never throws
 * for individual token failures — returns counts instead.
 */
export async function sendExpoPush(
  tokens: string[],
  message: Omit<ExpoPushMessage, 'to'>,
): Promise<PushSendResult> {
  const messages: ExpoPushMessage[] = [];
  let invalidTokens = 0;

  for (const to of tokens) {
    if (!Expo.isExpoPushToken(to)) {
      invalidTokens += 1;
      continue;
    }
    messages.push({ sound: 'default', ...message, to });
  }

  if (messages.length === 0) {
    return { sent: 0, failed: 0, invalidTokens };
  }

  const chunks = expo.chunkPushNotifications(messages);
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const chunk of chunks) {
    try {
      const receipts = await expo.sendPushNotificationsAsync(chunk);
      for (const receipt of receipts) {
        if (receipt.status === 'ok') sent += 1;
        else {
          failed += 1;
          if (receipt.message) errors.push(receipt.message);
        }
      }
    } catch (err: any) {
      failed += chunk.length;
      errors.push(err?.message ?? 'Chunk send failed');
    }
  }

  return { sent, failed, invalidTokens, ...(errors.length ? { errors } : {}) };
}

/** All registered device push tokens (every user, every device). */
export async function getAllPushTokens(): Promise<string[]> {
  const rows = await pgDb
    .select({ expoPushToken: devicePushTokens.expoPushToken })
    .from(devicePushTokens);
  return rows.map((r) => r.expoPushToken);
}

/** Device push tokens belonging to users with the given role (e.g. 'Admin'). */
export async function getPushTokensForRole(role: string): Promise<string[]> {
  const adminIds = await pgDb
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, role as any));
  if (adminIds.length === 0) return [];

  const rows = await pgDb
    .select({ expoPushToken: devicePushTokens.expoPushToken })
    .from(devicePushTokens)
    .where(inArray(devicePushTokens.userId, adminIds.map((u) => u.id)));
  return rows.map((r) => r.expoPushToken);
}
