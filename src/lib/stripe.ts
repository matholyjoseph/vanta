import Stripe from "stripe";

export const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || "sk_test_placeholder_key_vanta_ai_secret",
  {
    typescript: true,
  }
);

export const STRIPE_CREDIT_PACKS = [
  {
    id: "pack-500",
    name: "500 Credits Pack",
    credits: 500,
    priceUSD: 10,
    stripePriceId: process.env.STRIPE_PRICE_PACK_500 || "price_mock_pack_500",
  },
  {
    id: "pack-2000",
    name: "2,000 Credits Pack",
    credits: 2000,
    priceUSD: 35,
    stripePriceId: process.env.STRIPE_PRICE_PACK_2000 || "price_mock_pack_2000",
  },
  {
    id: "pack-5000",
    name: "5,000 Credits Pack",
    credits: 5000,
    priceUSD: 75,
    stripePriceId: process.env.STRIPE_PRICE_PACK_5000 || "price_mock_pack_5000",
  },
];
