export const reviews = [
  {
    text: "The 220 GSM fabric feels noticeably heavier than my other tees. Worth every rupee.",
    author: "Arjun K.",
    rating: 5,
  },
  {
    text: "Ordered the black one — fit is exactly as described. Slightly oversized, sits well.",
    author: "Priya M.",
    rating: 5,
  },
  {
    text: "Finally a plain tee that doesn't feel cheap after two washes. The rose pink colour is perfect.",
    author: "Neha S.",
    rating: 5,
  },
  {
    text: "Soft from day one. No itch, no weird smell, no logo shouting at me. Exactly what I wanted.",
    author: "Rahul D.",
    rating: 5,
  },
] as const;

export const whyPoints = [
  { title: "220 GSM", detail: "Substantial fabric that keeps its structure." },
  { title: "Oversized Fit", detail: "Relaxed drape without losing shape." },
  { title: "Breathable", detail: "Combed cotton that moves with your day." },
  { title: "Skin Friendly", detail: "Chemical-safe dyes, soft hand-feel." },
  { title: "Minimal Design", detail: "No loud branding. No unnecessary graphics." },
  { title: "Unisex", detail: "One silhouette designed for everyone." },
] as const;

/** Official garment measurements from Plain Thread size guide (cm). */
export const sizeGuide = {
  note: "This is an oversized fit. Measurements below are actual garment measurements — not body measurements. Compare against a tee you already own. All values in centimetres (cm). Measure flat; double chest for full circumference.",
  headers: ["Size", "Chest", "Length", "Shoulder", "Sleeve"],
  rows: [
    ["S", "53 cm", "71 cm", "50 cm", "17 cm"],
    ["M", "55 cm", "73 cm", "52 cm", "20 cm"],
    ["L", "58 cm", "75 cm", "57 cm", "22 cm"],
    ["XL", "60 cm", "78 cm", "59 cm", "24 cm"],
    ["XXL", "62 cm", "80 cm", "61 cm", "26 cm"],
  ],
  howToMeasure: [
    {
      title: "Chest",
      body: "Measure across the widest point of the chest, one inch below the armhole.",
    },
    {
      title: "Length",
      body: "Measure from the highest point of the shoulder (at the neck seam) straight down to the bottom hem.",
    },
    {
      title: "Shoulder",
      body: "Measure from shoulder seam to shoulder seam across the back, laid flat.",
    },
    {
      title: "Sleeve",
      body: "Measure from the shoulder seam to the end of the sleeve hem. Our tee has a short drop-shoulder sleeve.",
    },
  ],
  fitAdvice: [
    {
      title: "For a relaxed oversized look",
      body: "Size down from your usual size. The tee will still be roomy but with a more controlled drape.",
    },
    {
      title: "For the intended drop-shoulder drape",
      body: "Go true to size — generous through the body with a pronounced drop shoulder.",
    },
    {
      title: "For a very oversized look",
      body: "Size up one. Works especially well for shorter heights where the extra length adds to the silhouette.",
    },
  ],
} as const;

export const careSteps = [
  "Cold wash recommended",
  "No bleach",
  "Iron inside out on low heat",
  "Dry in shade",
  "Machine wash on gentle cycle",
  "Do not tumble dry on high heat",
] as const;
