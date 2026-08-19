import { db } from "@/lib/db";

export interface PlanConfig {
  key: "FREE" | "CREATOR" | "PRO" | "ULTRA";
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  monthlyCredits: number;
  maxConcurrentGenerations: number;
  maxResolution: string;
  storageLimit: string;
  generationPriority: string;
  commercialUsage: boolean;
  isPopular?: boolean;
  stripePriceIdMonthly?: string;
  stripePriceIdAnnual?: string;
  features: string[];
}

export const DEFAULT_PLANS: PlanConfig[] = [
  {
    key: "FREE",
    name: "Free Explorer",
    description: "Ideal for testing models and quick personal experiments.",
    monthlyPrice: 0,
    annualPrice: 0,
    monthlyCredits: 100,
    maxConcurrentGenerations: 1,
    maxResolution: "1080p",
    storageLimit: "5 GB",
    generationPriority: "Standard Queue",
    commercialUsage: false,
    features: [
      "100 Monthly Generation Credits",
      "Access to Flash Video & Nova models",
      "1 Concurrent Generation",
      "1080p Video Resolution",
      "5 GB Storage Space",
      "Personal Non-Commercial License",
    ],
  },
  {
    key: "CREATOR",
    name: "Creator Studio",
    description: "For independent filmmakers, YouTubers, and digital content creators.",
    monthlyPrice: 29,
    annualPrice: 24,
    monthlyCredits: 1000,
    maxConcurrentGenerations: 2,
    maxResolution: "1080p",
    storageLimit: "50 GB",
    generationPriority: "Fast Queue",
    commercialUsage: true,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_CREATOR_MONTHLY || "price_creator_monthly",
    stripePriceIdAnnual: process.env.STRIPE_PRICE_CREATOR_ANNUAL || "price_creator_annual",
    features: [
      "1,000 Monthly Generation Credits",
      "Access to All 5 AI Video Engines",
      "2 Concurrent Generations",
      "Full Camera & Motion Controls",
      "50 GB Storage Space",
      "Full Commercial License",
      "Script-to-Scenes AI Parser",
    ],
  },
  {
    key: "PRO",
    name: "Pro Director",
    description: "For professional studios, visual artists, and commercial production teams.",
    monthlyPrice: 79,
    annualPrice: 64,
    monthlyCredits: 3500,
    maxConcurrentGenerations: 4,
    maxResolution: "4K UHD",
    storageLimit: "250 GB",
    generationPriority: "Turbo Priority",
    commercialUsage: true,
    isPopular: true,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY || "price_pro_monthly",
    stripePriceIdAnnual: process.env.STRIPE_PRICE_PRO_ANNUAL || "price_pro_annual",
    features: [
      "3,500 Monthly Generation Credits",
      "4K UHD Resolution Export",
      "4 Concurrent Generations",
      "Turbo Rendering Priority",
      "250 GB Storage Space",
      "Character & Location Reference Tags",
      "Full Commercial Rights & License",
      "Master Timeline Film Export",
    ],
  },
  {
    key: "ULTRA",
    name: "Ultra Enterprise",
    description: "Maximum power and unlimited scalability for high-volume production agencies.",
    monthlyPrice: 199,
    annualPrice: 159,
    monthlyCredits: 10000,
    maxConcurrentGenerations: 8,
    maxResolution: "4K UHD",
    storageLimit: "1 TB",
    generationPriority: "Ultra Dedicated Priority",
    commercialUsage: true,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_ULTRA_MONTHLY || "price_ultra_monthly",
    stripePriceIdAnnual: process.env.STRIPE_PRICE_ULTRA_ANNUAL || "price_ultra_annual",
    features: [
      "10,000 Monthly Generation Credits",
      "8 Concurrent Generations",
      "Ultra Dedicated Cluster Priority",
      "1 TB Storage Space",
      "Dedicated API & Custom Fine-Tuning",
      "24/7 Priority Support & SLAs",
    ],
  },
];

export async function ensureSubscriptionPlansSeeded() {
  for (const plan of DEFAULT_PLANS) {
    await db.subscriptionPlan.upsert({
      where: { key: plan.key },
      update: {
        name: plan.name,
        description: plan.description,
        monthlyPrice: plan.monthlyPrice,
        annualPrice: plan.annualPrice,
        monthlyCredits: plan.monthlyCredits,
        maxConcurrentGenerations: plan.maxConcurrentGenerations,
        maxResolution: plan.maxResolution,
        storageLimit: plan.storageLimit,
        generationPriority: plan.generationPriority,
        commercialUsage: plan.commercialUsage,
        features: JSON.stringify(plan.features),
      },
      create: {
        key: plan.key,
        name: plan.name,
        description: plan.description,
        monthlyPrice: plan.monthlyPrice,
        annualPrice: plan.annualPrice,
        monthlyCredits: plan.monthlyCredits,
        maxConcurrentGenerations: plan.maxConcurrentGenerations,
        maxResolution: plan.maxResolution,
        storageLimit: plan.storageLimit,
        generationPriority: plan.generationPriority,
        commercialUsage: plan.commercialUsage,
        stripePriceIdMonthly: plan.stripePriceIdMonthly,
        stripePriceIdAnnual: plan.stripePriceIdAnnual,
        features: JSON.stringify(plan.features),
      },
    });
  }
}
