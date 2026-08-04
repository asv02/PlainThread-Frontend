export const siteConfig = {
  name: "Plain Thread",
  legalName: "Plain Thread",
  domain: "https://plainthread.in",
  tagline: "Premium Oversized Essentials",
  description:
    "Plain Thread creates premium oversized t-shirts crafted with 220 GSM combed cotton. Minimal design, breathable comfort, and timeless essentials. Shop our collection on Amazon and Flipkart.",
  email: "hello@plainthread.in",
  instagram: "https://www.instagram.com/plainthread.in/",
  locale: "en_IN",
  currency: "INR",
  foundingYear: 2024,
} as const;

export const navLinks = [
  { href: "/shop", label: "Shop" },
  { href: "/collections/oversized-tshirts", label: "Collection" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
] as const;

export const footerLinks = {
  products: [
    { href: "/products/black-oversized-tshirt", label: "Black Oversized Tee" },
    { href: "/products/white-oversized-tshirt", label: "White Oversized Tee" },
    { href: "/products/pink-oversized-tshirt", label: "Pink Oversized Tee" },
    { href: "/shop", label: "Shop All" },
  ],
  explore: [
    { href: "/collections/oversized-tshirts", label: "Collections" },
    { href: "/why-plain-thread", label: "Why Plain Thread" },
    { href: "/fabric", label: "Fabric" },
    { href: "/size-guide", label: "Size Guide" },
    { href: "/care-guide", label: "Care Guide" },
  ],
  company: [
    { href: "/about", label: "About" },
    { href: "/faq", label: "FAQ" },
    { href: "/blog", label: "Blog" },
    { href: "/contact", label: "Contact" },
    { href: "/privacy", label: "Privacy" },
  ],
} as const;
