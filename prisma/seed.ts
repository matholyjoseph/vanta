import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding VANTA AI Database, Super Admin & Avatar Models...");

  // 1. Cleanup misconfigured legacy/erroneous rows
  await prisma.aIModel.deleteMany({
    where: {
      OR: [
        { name: { contains: "Imagen" }, type: "VIDEO" },
        { slug: "imagen-3", type: "VIDEO" },
      ],
    },
  });

  // 1. Seed Super Admin User
  const bootstrapEmail = process.env.ADMIN_BOOTSTRAP_EMAIL || "admin@vanta.ai";
  const hashedPassword = await bcrypt.hash("VantaAdmin2026!", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: bootstrapEmail },
    update: {
      role: "SUPER_ADMIN",
      name: "Platform Super Admin",
    },
    create: {
      email: bootstrapEmail,
      name: "Platform Super Admin",
      password: hashedPassword,
      role: "SUPER_ADMIN",
      emailVerified: new Date(),
    },
  });

  // Create CreditWallet for Super Admin
  await prisma.creditWallet.upsert({
    where: { userId: adminUser.id },
    update: { balance: 100000 },
    create: {
      userId: adminUser.id,
      balance: 100000,
    },
  });

  // 2. Seed Native Mock AI Provider
  const mockProvider = await prisma.aIProvider.upsert({
    where: { slug: "vanta-mock" },
    update: {
      name: "Vanta AI Native Engine",
      enabled: true,
      status: "ONLINE",
    },
    create: {
      name: "Vanta AI Native Engine",
      slug: "vanta-mock",
      enabled: true,
      status: "ONLINE",
    },
  });

  // 3. Seed Production fal.ai Provider
  const falProvider = await prisma.aIProvider.upsert({
    where: { slug: "fal" },
    update: {
      name: "fal.ai Production Engine",
      enabled: true,
      status: "ONLINE",
    },
    create: {
      name: "fal.ai Production Engine",
      slug: "fal",
      enabled: true,
      status: "ONLINE",
    },
  });

  // 3b. Seed Google Gemini Provider
  const geminiProvider = await prisma.aIProvider.upsert({
    where: { slug: "gemini" },
    update: {
      name: "Google Gemini Engine",
      enabled: true,
      status: "ONLINE",
    },
    create: {
      name: "Google Gemini Engine",
      slug: "gemini",
      enabled: true,
      status: "ONLINE",
    },
  });

  // 4. Seed AI Video, Image, Audio & Avatar Models
  const models = [
    // --- VIDEO MODELS ---
    {
      id: "vanta-motion-fast",
      slug: "vanta-motion-fast",
      providerModelId: "vanta-mock-fast",
      type: "VIDEO",
      name: "Vanta Motion Fast",
      providerId: mockProvider.id,
      description: "Ultra-fast generation engine optimized for rapid prototyping & social content.",
      creditCost: 8,
      providerEstimatedCost: 0.02,
      isDefault: true,
      enabled: true,
      isNew: false,
      isPopular: true,
      requiredPlan: "FREE",
      speedTier: "Fast",
      priority: 10,
      sortOrder: 1,
      supportedModes: JSON.stringify(["text-to-video", "image-to-video"]),
      supportedDurations: JSON.stringify(["5s", "10s"]),
      supportedResolutions: JSON.stringify(["720p", "1080p"]),
      supportedAspectRatios: JSON.stringify(["16:9", "9:16", "1:1"]),
      supportsAudio: false,
      supportsImageReference: true,
      supportsVideoReference: false,
      supportsStartEndFrame: false,
      supportsMotionControl: false,
      pricingRules: JSON.stringify({
        "5s_720p": 8,
        "5s_1080p": 12,
        "10s_720p": 15,
        "10s_1080p": 22,
      }),
    },
    {
      id: "fal-luma-dream-machine",
      slug: "fal-luma-dream-machine",
      providerModelId: "fal-ai/luma-dream-machine",
      type: "VIDEO",
      name: "fal.ai Luma Dream Machine",
      providerId: falProvider.id,
      description: "Real production AI video model powered by Luma Dream Machine on fal.ai.",
      creditCost: 12,
      providerEstimatedCost: 0.05,
      isDefault: false,
      enabled: true,
      isNew: true,
      isPopular: true,
      requiredPlan: "FREE",
      speedTier: "Balanced",
      priority: 9,
      sortOrder: 2,
      supportedModes: JSON.stringify(["text-to-video"]),
      supportedDurations: JSON.stringify(["5s"]),
      supportedResolutions: JSON.stringify(["720p", "1080p"]),
      supportedAspectRatios: JSON.stringify(["16:9", "9:16", "1:1"]),
      supportsAudio: false,
      supportsImageReference: false,
      supportsVideoReference: false,
      supportsStartEndFrame: false,
      supportsMotionControl: false,
      pricingRules: JSON.stringify({
        "5s_720p": 12,
        "5s_1080p": 18,
      }),
    },

    // --- GOOGLE GEMINI VIDEO MODELS ---
    {
      id: "gemini-omni-flash",
      slug: "gemini-omni-flash",
      providerModelId: "gemini-omni-flash-preview",
      type: "VIDEO",
      name: "Gemini Omni Flash",
      providerId: geminiProvider.id,
      description: "Fast multimodal video synthesis powered by Google Gemini AI.",
      creditCost: 6,
      providerEstimatedCost: 0.01,
      isDefault: true,
      enabled: true,
      isNew: true,
      isPopular: true,
      isFeatured: true,
      requiredPlan: "FREE",
      speedTier: "Fast",
      priority: 15,
      sortOrder: 0,
      supportedModes: JSON.stringify(["text-to-video", "image-to-video"]),
      supportedDurations: JSON.stringify(["4s", "6s", "8s"]),
      supportedResolutions: JSON.stringify(["720p"]),
      supportedAspectRatios: JSON.stringify(["16:9", "9:16"]),
      supportsAudio: false,
      supportsImageReference: true,
      supportsVideoReference: false,
      supportsStartEndFrame: false,
      supportsMotionControl: false,
      pricingRules: JSON.stringify({
        "4s_720p": 6,
        "6s_720p": 9,
        "8s_1080p": 12,
      }),
    },
    {
      id: "veo-3-1",
      slug: "veo-3-1",
      providerModelId: "veo-3.1-generate-preview",
      type: "VIDEO",
      name: "Veo 3.1",
      providerId: geminiProvider.id,
      description: "Google's flagship cinematic video model with native audio synthesis.",
      creditCost: 15,
      providerEstimatedCost: 0.05,
      isDefault: false,
      enabled: true,
      isNew: true,
      isPopular: true,
      isFeatured: true,
      requiredPlan: "PRO",
      speedTier: "Quality",
      priority: 14,
      sortOrder: 1,
      supportedModes: JSON.stringify(["text-to-video", "image-to-video", "video-to-video"]),
      supportedDurations: JSON.stringify(["4s", "6s", "8s"]),
      supportedResolutions: JSON.stringify(["720p", "1080p", "4K"]),
      supportedAspectRatios: JSON.stringify(["16:9", "9:16"]),
      supportsAudio: true,
      supportsImageReference: true,
      supportsVideoReference: true,
      supportsStartEndFrame: true,
      supportsMotionControl: true,
      pricingRules: JSON.stringify({
        "4s_720p": 15,
        "6s_1080p": 20,
        "8s_4K": 30,
      }),
    },
    {
      id: "veo-3-1-lite",
      slug: "veo-3-1-lite",
      providerModelId: "veo-3.1-lite-generate-preview",
      type: "VIDEO",
      name: "Veo 3.1 Lite",
      providerId: geminiProvider.id,
      description: "Economy Google video generation model for rapid concept testing.",
      creditCost: 8,
      providerEstimatedCost: 0.02,
      isDefault: false,
      enabled: true,
      isNew: true,
      isPopular: false,
      isFeatured: false,
      requiredPlan: "FREE",
      speedTier: "Fast",
      priority: 13,
      sortOrder: 2,
      supportedModes: JSON.stringify(["text-to-video", "image-to-video"]),
      supportedDurations: JSON.stringify(["4s", "6s"]),
      supportedResolutions: JSON.stringify(["720p", "1080p"]),
      supportedAspectRatios: JSON.stringify(["16:9", "9:16"]),
      supportsAudio: false,
      supportsImageReference: true,
      supportsVideoReference: false,
      supportsStartEndFrame: false,
      supportsMotionControl: false,
      pricingRules: JSON.stringify({
        "4s_720p": 8,
        "6s_1080p": 12,
      }),
    },

    // --- IMAGE MODELS ---
    {
      id: "fal-flux-schnell",
      slug: "fal-flux-schnell",
      providerModelId: "fal-ai/flux/schnell",
      type: "IMAGE",
      name: "FLUX.1 Schnell (fal.ai)",
      providerId: falProvider.id,
      description: "State-of-the-art real production AI image model with sub-second generation speeds.",
      creditCost: 3,
      providerEstimatedCost: 0.003,
      isDefault: true,
      enabled: true,
      isNew: true,
      isPopular: true,
      isFeatured: true,
      requiredPlan: "FREE",
      speedTier: "Fast",
      priority: 10,
      sortOrder: 1,
      supportedModes: JSON.stringify(["text-to-image", "image-to-image"]),
      supportedDurations: JSON.stringify([]),
      supportedResolutions: JSON.stringify(["1024x1024", "1280x720", "720x1280"]),
      supportedAspectRatios: JSON.stringify(["1:1", "16:9", "9:16", "4:3", "3:4"]),
      supportsAudio: false,
      supportsImageReference: true,
      supportsVideoReference: false,
      supportsStartEndFrame: false,
      supportsMotionControl: false,
      supportsInpainting: true,
      supportsOutpainting: true,
      supportsBackgroundRemoval: true,
      supportsBackgroundReplacement: true,
      supportsUpscale: true,
    },
    {
      id: "imagen-3",
      slug: "imagen-3",
      providerModelId: "imagen-3.0-generate-002",
      type: "IMAGE",
      name: "Imagen 3 (Google Gemini)",
      providerId: geminiProvider.id,
      description: "Google's free state-of-the-art photorealistic image generation model powered by Gemini API.",
      creditCost: 1,
      providerEstimatedCost: 0.0,
      isDefault: true,
      enabled: true,
      isNew: true,
      isPopular: true,
      isFeatured: true,
      requiredPlan: "FREE",
      speedTier: "Fast",
      priority: 12,
      sortOrder: 0,
      supportedModes: JSON.stringify(["text-to-image", "image-to-image"]),
      supportedDurations: JSON.stringify([]),
      supportedResolutions: JSON.stringify(["1024x1024", "1280x720", "720x1280"]),
      supportedAspectRatios: JSON.stringify(["1:1", "16:9", "9:16", "4:3", "3:4"]),
      supportsAudio: false,
      supportsImageReference: true,
      supportsVideoReference: false,
      supportsStartEndFrame: false,
      supportsMotionControl: false,
      supportsInpainting: true,
      supportsOutpainting: true,
      supportsBackgroundRemoval: true,
      supportsBackgroundReplacement: true,
      supportsUpscale: true,
    },

    // --- AUDIO MODELS ---
    {
      id: "fal-mmaudio",
      slug: "fal-mmaudio",
      providerModelId: "fal-ai/mmaudio-v2",
      type: "AUDIO",
      name: "MMAudio Sound Effects & Music (fal.ai)",
      providerId: falProvider.id,
      description: "Production sound effects & music synthesis model powered by fal.ai.",
      creditCost: 2,
      providerEstimatedCost: 0.002,
      isDefault: true,
      enabled: true,
      isNew: true,
      isPopular: true,
      isFeatured: true,
      requiredPlan: "FREE",
      speedTier: "Fast",
      priority: 10,
      sortOrder: 1,
      supportedModes: JSON.stringify(["sound-effects", "music"]),
      supportedDurations: JSON.stringify(["5s", "10s", "30s"]),
      supportedResolutions: JSON.stringify(["44.1kHz"]),
      supportedAspectRatios: JSON.stringify([]),
      supportsAudio: true,
      supportsTTS: false,
      supportsMusic: true,
      supportsSFX: true,
      supportsVoiceover: false,
      supportsAudioEnhancement: true,
    },

    // --- AVATAR & LIP SYNC MODELS (Requirement: Complete Lip Sync & Talking Avatar) ---
    {
      id: "fal-latentsync",
      slug: "fal-latentsync",
      providerModelId: "fal-ai/latentsync",
      type: "AVATAR",
      name: "LatentSync Lip Sync (fal.ai)",
      providerId: falProvider.id,
      description: "Real production AI lip sync model generating frame-accurate mouth synchronization.",
      creditCost: 5,
      providerEstimatedCost: 0.01,
      isDefault: true,
      enabled: true,
      isNew: true,
      isPopular: true,
      isFeatured: true,
      requiredPlan: "FREE",
      speedTier: "Fast",
      priority: 10,
      sortOrder: 1,
      supportedModes: JSON.stringify(["lip-sync", "talking-avatar"]),
      supportedDurations: JSON.stringify(["5s", "10s", "30s"]),
      supportedResolutions: JSON.stringify(["720p", "1080p"]),
      supportedAspectRatios: JSON.stringify(["16:9", "9:16", "1:1"]),
      supportsAudio: true,
      supportsImageReference: true,
      supportsVideoReference: true,
      supportsAvatar: true,
      supportsLipSync: true,
      supportsHeadMotion: true,
      supportsExpressionControl: true,
    },
    {
      id: "vanta-avatar-pro",
      slug: "vanta-avatar-pro",
      providerModelId: "vanta-mock-avatar",
      type: "AVATAR",
      name: "Vanta Talking Avatar Pro",
      providerId: mockProvider.id,
      description: "High-fidelity talking portrait engine with natural facial gestures and head movements.",
      creditCost: 6,
      providerEstimatedCost: 0.015,
      isDefault: false,
      enabled: true,
      isNew: false,
      isPopular: true,
      requiredPlan: "FREE",
      speedTier: "Balanced",
      priority: 9,
      sortOrder: 2,
      supportedModes: JSON.stringify(["talking-avatar", "lip-sync"]),
      supportedDurations: JSON.stringify(["5s", "10s", "30s", "60s"]),
      supportedResolutions: JSON.stringify(["1080p", "4K"]),
      supportedAspectRatios: JSON.stringify(["16:9", "9:16", "1:1"]),
      supportsAudio: true,
      supportsImageReference: true,
      supportsVideoReference: true,
      supportsAvatar: true,
      supportsLipSync: true,
      supportsHeadMotion: true,
      supportsExpressionControl: true,
    },
  ];

  for (const modelData of models) {
    await prisma.aIModel.upsert({
      where: { slug: modelData.slug },
      update: modelData,
      create: modelData,
    });
  }

  // 5. Seed Subscription Plans
  const plans = [
    {
      key: "FREE",
      name: "Free Plan",
      description: "Standard generation features for creators",
      monthlyPrice: 0,
      annualPrice: 0,
      monthlyCredits: 100,
      maxConcurrentGenerations: 1,
      maxResolution: "1080p",
      storageLimit: "10GB",
      generationPriority: "Standard",
      commercialUsage: true,
      features: JSON.stringify(["100 Monthly Credits", "720p & 1080p Resolution", "1 Concurrent Render Job"]),
    },
    {
      key: "CREATOR",
      name: "Creator Plan",
      description: "Enhanced resolution and 2 concurrent renders",
      monthlyPrice: 29,
      annualPrice: 290,
      monthlyCredits: 1200,
      maxConcurrentGenerations: 2,
      maxResolution: "1080p",
      storageLimit: "50GB",
      generationPriority: "High",
      commercialUsage: true,
      features: JSON.stringify(["1,200 Monthly Credits", "Up to 1080p HD", "2 Concurrent Renders", "Priority Queue"]),
    },
    {
      key: "PRO",
      name: "Pro Plan",
      description: "4K renders & 5 concurrent generation jobs",
      monthlyPrice: 79,
      annualPrice: 790,
      monthlyCredits: 4000,
      maxConcurrentGenerations: 5,
      maxResolution: "4K",
      storageLimit: "250GB",
      generationPriority: "Ultra High",
      commercialUsage: true,
      features: JSON.stringify(["4,000 Monthly Credits", "Full 4K Ultra HD", "5 Concurrent Renders", "Advanced Motion Control"]),
    },
    {
      key: "ULTRA",
      name: "Ultra Plan",
      description: "Unlimited potential with 10 concurrent renders",
      monthlyPrice: 199,
      annualPrice: 1990,
      monthlyCredits: 12000,
      maxConcurrentGenerations: 10,
      maxResolution: "4K",
      storageLimit: "1TB",
      generationPriority: "Maximum Dedicated",
      commercialUsage: true,
      features: JSON.stringify(["12,000 Monthly Credits", "Dedicated Render Nodes", "10 Concurrent Renders", "Custom API Access"]),
    },
  ];

  for (const planData of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { key: planData.key },
      update: planData,
      create: planData,
    });
  }

  // 6. Seed Feature Flags
  const featureFlags = [
    { key: "motion_control", name: "Motion Control", description: "Enable numeric camera panning and zoom sliders", enabled: true },
    { key: "video_to_video", name: "Video to Video", description: "Enable video stylization & transformation", enabled: true },
    { key: "cinema_studio", name: "Cinema Studio Multi-Scene", description: "Enable full scene script timeline workspace", enabled: true },
    { key: "maintenance_mode", name: "Global Maintenance Mode", description: "Temporarily pause non-admin operations", enabled: false },
    { key: "generation_maintenance", name: "Generation Maintenance", description: "Temporarily pause video rendering submissions", enabled: false },
  ];

  for (const flag of featureFlags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: flag,
      create: flag,
    });
  }

  // 7. Seed Promo Codes
  await prisma.promoCode.upsert({
    where: { code: "VANTA2026" },
    update: {},
    create: {
      code: "VANTA2026",
      creditAmount: 500,
      maxRedemptions: 1000,
      enabled: true,
    },
  });

  console.log("✅ Seed completed successfully! Super Admin login: admin@vanta.ai / VantaAdmin2026!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
