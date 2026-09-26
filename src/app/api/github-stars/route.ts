import { NextResponse } from "next/server";

import { getGithubStarCount } from "@/lib/site/github";

export const revalidate = 3600;

/** Lightweight JSON for the header badge — keeps stars off the HTML critical path. */
export async function GET() {
  const stars = await getGithubStarCount();
  return NextResponse.json(
    { stars },
    {
      headers: {
        "Cache-Control":
          "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
