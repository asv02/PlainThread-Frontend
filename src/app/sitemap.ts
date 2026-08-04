import type { MetadataRoute } from "next";
import { products } from "@/data/products";
import { getBlogSlugs } from "@/lib/blog";
import { siteConfig } from "@/data/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/shop",
    "/products",
    "/collections/oversized-tshirts",
    "/why-plain-thread",
    "/fabric",
    "/size-guide",
    "/care-guide",
    "/about",
    "/faq",
    "/contact",
    "/blog",
    "/privacy",
  ];

  const now = new Date();

  return [
    ...staticRoutes.map((path) => ({
      url: `${siteConfig.domain}${path}`,
      lastModified: now,
      changeFrequency: path === "" || path === "/shop" ? ("weekly" as const) : ("monthly" as const),
      priority: path === "" ? 1 : path.startsWith("/product") || path === "/shop" ? 0.9 : 0.7,
    })),
    ...products.map((product) => ({
      url: `${siteConfig.domain}/products/${product.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.95,
    })),
    ...getBlogSlugs().map((slug) => ({
      url: `${siteConfig.domain}/blog/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
  ];
}
