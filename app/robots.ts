import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hackline.hartimeerror.xyz";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/signup", "/forgot-password"],
        disallow: [
          "/dashboard/",
          "/dashboard",
          "/api/",
          "/auth/",
          "/join/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
