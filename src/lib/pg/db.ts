import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './users-schema';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const pgDb = drizzle(pool, { schema });
