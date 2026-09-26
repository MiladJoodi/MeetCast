import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site/url";

export default function robots(): MetadataRoute.Robots {
  const origin = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/dashboard/",
          "/settings",
          "/settings/",
          "/billing",
          "/billing/",
          "/checkout",
          "/checkout/",
          "/admin",
          "/admin/",
          "/api/",
          "/invite/",
          "/room/",
        ],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
