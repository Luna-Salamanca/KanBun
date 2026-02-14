import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().default('./kanban.db'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000').transform(Number),
});

export const config = envSchema.parse(process.env);
