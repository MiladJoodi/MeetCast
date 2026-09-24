import { sql } from "drizzle-orm";

import { db } from "@/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/health
 * Lightweight readiness probe. Does not expose secrets or infrastructure details.
 */
export async function GET() {
  const started = Date.now();

  try {
    await db.execute(sql`select 1`);

    return Response.json(
      {
        status: "ok",
        checks: {
          database: "ok",
        },
        durationMs: Date.now() - started,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    logger.error("health.check_failed", {
      error: error instanceof Error ? error.name : "unknown",
    });

    return Response.json(
      {
        status: "degraded",
        checks: {
          database: "error",
        },
        durationMs: Date.now() - started,
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
