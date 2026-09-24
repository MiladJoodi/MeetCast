import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { getOptionalEnv } from "@/lib/env";

import * as schema from "./schema";

function createDb() {
  const databaseUrl = getOptionalEnv("DATABASE_URL");

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and set your Neon connection string.",
    );
  }

  const sql = neon(databaseUrl);
  return drizzle({ client: sql, schema });
}

type DrizzleDb = ReturnType<typeof createDb>;

const globalForDb = globalThis as unknown as {
  meetcastDb?: DrizzleDb;
};

/**
 * Server-only Drizzle client for Neon.
 * Import only from Server Components, Route Handlers, or other server modules.
 * Lazily initialized so tooling can load modules without requiring DATABASE_URL
 * until the first query.
 */
export const db: DrizzleDb = new Proxy({} as DrizzleDb, {
  get(_target, property, receiver) {
    const instance =
      globalForDb.meetcastDb ?? (globalForDb.meetcastDb = createDb());
    const value = Reflect.get(instance, property, receiver);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export type Database = DrizzleDb;
