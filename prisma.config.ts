// prisma.config.ts - Konfigurasi Prisma CLI (Prisma v7+)
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * Di Prisma v7:
 * - Datasource URL dikonfigurasi di sini, bukan di schema.prisma
 * - Seed command dikonfigurasi di dalam blok migrations
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
