import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/privacy", "/terms"],
      disallow: ["/admin/", "/dashboard/", "/income/", "/invest/", "/investments/", "/login/", "/profile/", "/register/", "/team/", "/wallet/", "/watch/", "/withdraw/", "/forgot-password/"],
    },
    sitemap: "https://themusica.in/sitemap.xml",
  };
}
