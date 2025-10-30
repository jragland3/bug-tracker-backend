import { PrismaClient } from "@prisma/client";

// Select the correct database for either production/staging or testing
const databaseUrl = 
  process.env.NODE_ENV === 'test'
    ? process.env.DATABASE_URL || 'file:./test.db'
    : process.env.DATABASE_URL;

export const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });