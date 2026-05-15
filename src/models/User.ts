import type { AuctionUser } from '@/lib/pg/user-queries';

export type IUser = AuctionUser;

export const User = new Proxy(
  {},
  {
    get() {
      throw new Error('Mongo User model has been removed. Use src/lib/pg/user-queries instead.');
    },
  },
) as never;