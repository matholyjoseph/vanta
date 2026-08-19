import {
  Layers,
  Move3D,
  ImageIcon,
  Users,
  Clapperboard,
  Sparkles,
  Zap,
  Film,
  type LucideIcon,
} from "lucide-react";

// ─── Site Config ───────────────────────────────────────────────────────────────
export const SITE_CONFIG = {
  name: "Vanta AI",
  tagline: "Professional-grade AI video, image, audio & cinema workspace.",
  description:
    "The ultimate multi-model AI video, image, audio, avatar and cinema workspace. Command industry-leading generation models with precision engineering and professional-grade controls.",
  url: "https://vanta.ai",
  version: "v2.4",
} as const;

// ─── Navigation ────────────────────────────────────────────────────────────────
export interface NavItem {
  label: string;
  href: string;
  isScroll?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "AI Director", href: "/director" },
  { label: "Developers", href: "/developers" },
  { label: "Shorts Studio", href: "/shorts" },
  { label: "Video Editor", href: "/editor" },
  { label: "Cinema Studio", href: "/cinema" },
  { label: "Video Studio", href: "/studio/video" },
  { label: "Image Studio", href: "/studio/image" },
  { label: "Audio Studio", href: "/studio/audio" },
  { label: "Avatar Studio", href: "/studio/avatar" },
  { label: "Explore", href: "#community", isScroll: true },
  { label: "Pricing", href: "/pricing" },
];

export const NAV_CTA = {
  signIn: { label: "Sign In", href: "/auth?mode=signin" },
  getStarted: { label: "Get Started", href: "/auth?mode=signup" },
} as const;

// ─── Models ────────────────────────────────────────────────────────────────────
export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  resolution: string;
  fps: string;
  duration: string;
  badge?: string;
}

export const MODELS: ModelInfo[] = [
  {
    id: "nova-video-pro",
    name: "Nova Video Pro",
    description:
      "Flagship cinematic model for photorealistic video generation with unparalleled detail and physics simulation.",
    resolution: "4K UHD",
    fps: "24-60",
    duration: "Up to 16s",
    badge: "Most Popular",
  },
  {
    id: "motion-x",
    name: "Motion X",
    description:
      "Advanced motion synthesis engine optimized for complex camera movements, fluid dynamics, and action sequences.",
    resolution: "1080p - 4K",
    fps: "24-30",
    duration: "Up to 12s",
  },
  {
    id: "curator",
    name: "Curator",
    description:
      "Artistic style transfer model that applies cinematic color grading, film grain, and visual effects to generations.",
    resolution: "1080p - 4K",
    fps: "24",
    duration: "Up to 8s",
    badge: "Creative",
  },
  {
    id: "flash-video",
    name: "Flash Video",
    description:
      "Ultra-fast generation model for rapid prototyping and previews. Lower fidelity but 10x faster generation.",
    resolution: "720p - 1080p",
    fps: "24",
    duration: "Up to 4s",
    badge: "Fast",
  },
];

// ─── Features ──────────────────────────────────────────────────────────────────
export interface FeatureCard {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  span?: "full" | "half";
}

export const FEATURES: FeatureCard[] = [
  {
    id: "multi-model",
    title: "Multi-Model Orchestration",
    description:
      "Seamlessly route prompts through specialized models. Combine Nova for render and Motion X for complex physics within the same project.",
    icon: Layers,
    span: "half",
  },
  {
    id: "motion-control",
    title: "Advanced Motion Control",
    description:
      "Direct camera paths, pan, zoom, and tilt with granular numeric inputs for precision cinematography.",
    icon: Move3D,
    span: "half",
  },
  {
    id: "image-to-video",
    title: "Image to Video",
    description:
      "Animate stills with precise depth mapping and physics simulation. Transform any image into dynamic footage.",
    icon: ImageIcon,
    span: "half",
  },
  {
    id: "character-consistency",
    title: "Character Consistency",
    description:
      "Maintain precise facial features and clothing across multiple distinct generated clips for cohesive storytelling.",
    icon: Users,
    span: "half",
  },
  {
    id: "director-mode",
    title: "AI Director Mode",
    description:
      "Describe the scene and let the AI automatically generate shot breakdowns, determine optimal camera angles, and apply cinematic color grading.",
    icon: Clapperboard,
    span: "full",
  },
];

// ─── Gallery ───────────────────────────────────────────────────────────────────
export interface GalleryItem {
  id: string;
  prompt: string;
  model: string;
  resolution: string;
  duration: string;
  fps: string;
  seed: string;
  gradient: string;
  thumbnailUrl?: string;
}

export const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: "gen-werewolf-001",
    prompt:
      "A cinematic 4K video of an ancient silver werewolf howling under a glowing full moon in a foggy mystical pine forest, volumetric atmospheric fog, photorealistic fur physics and ember particle light.",
    model: "Nova Video Pro v2",
    resolution: "3840x2160",
    duration: "10s",
    fps: "60",
    seed: "99401824",
    gradient: "from-emerald-500/30 via-cyan-500/20 to-transparent",
    thumbnailUrl: "/werewolf_cinematic_preview.jpg",
  },
  {
    id: "gen-001",
    prompt:
      "A highly detailed, cinematic tracking shot through a futuristic neo-tokyo alleyway, neon lights reflecting on wet dark asphalt. Volumetric lighting.",
    model: "Nova Video Pro v2",
    resolution: "1920x1080",
    duration: "8s",
    fps: "24",
    seed: "893410928",
    gradient: "from-emerald-500/30 via-cyan-500/20 to-transparent",
  },
  {
    id: "gen-002",
    prompt:
      "A breathtaking hyper-realistic render of a dense cyberpunk city street at night, illuminated by vivid neon signs. Rain-slicked streets.",
    model: "Nova Video Pro v2",
    resolution: "1920x1080",
    duration: "4s",
    fps: "30",
    seed: "8934710923",
    gradient: "from-purple-500/30 via-pink-500/20 to-transparent",
  },
  {
    id: "gen-003",
    prompt:
      "Macro shot of complex interlocking mechanical gears made of brushed gunmetal and glowing electric lime accents. Depth of field blurring the background.",
    model: "Motion X",
    resolution: "1920x1080",
    duration: "6s",
    fps: "24",
    seed: "442891037",
    gradient: "from-lime-500/30 via-yellow-500/20 to-transparent",
  },
  {
    id: "gen-004",
    prompt:
      "Aerial drone shot sweeping over an alien planet landscape with massive crystalline formations reflecting dual suns. Epic scale, volumetric clouds.",
    model: "Nova Video Pro v2",
    resolution: "3840x2160",
    duration: "12s",
    fps: "24",
    seed: "991205744",
    gradient: "from-orange-500/30 via-red-500/20 to-transparent",
  },
  {
    id: "gen-005",
    prompt:
      "Slow-motion fluid dynamics simulation of metallic silver liquid mercury forming intricate spiral patterns against a vanta black background.",
    model: "Motion X",
    resolution: "1920x1080",
    duration: "6s",
    fps: "60",
    seed: "558203941",
    gradient: "from-slate-400/30 via-zinc-500/20 to-transparent",
  },
  {
    id: "gen-006",
    prompt:
      "An ancient temple overgrown with bioluminescent vegetation. Fireflies drift through the ruins as volumetric god-rays pierce through the canopy.",
    model: "Curator",
    resolution: "1920x1080",
    duration: "8s",
    fps: "24",
    seed: "773920156",
    gradient: "from-green-500/30 via-teal-500/20 to-transparent",
  },
];

// ─── Testimonials ──────────────────────────────────────────────────────────────
export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  avatarFallback: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "testimonial-1",
    quote:
      "Vanta AI has completely transformed our pre-visualization workflow. The multi-model orchestration lets us iterate on complex scenes in hours instead of weeks.",
    author: "Sarah Chen",
    role: "VFX Supervisor, Meridian Studios",
    avatarFallback: "SC",
  },
  {
    id: "testimonial-2",
    quote:
      "The character consistency across clips is unlike anything else on the market. We've used it to generate entire storyboard sequences for client pitches.",
    author: "Marcus Rivera",
    role: "Creative Director, Neon Collective",
    avatarFallback: "MR",
  },
  {
    id: "testimonial-3",
    quote:
      "Flash Video for rapid prototyping, then Nova Pro for final renders — the model flexibility is exactly what professional studios need.",
    author: "Yuki Tanaka",
    role: "Independent Filmmaker",
    avatarFallback: "YT",
  },
];

// ─── How It Works Steps ────────────────────────────────────────────────────────
export interface HowItWorksStep {
  id: string;
  step: number;
  title: string;
  description: string;
  icon: LucideIcon;
}

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    id: "step-1",
    step: 1,
    title: "Describe Your Vision",
    description:
      "Write a detailed prompt describing the scene, camera movement, lighting, and mood you want to achieve.",
    icon: Sparkles,
  },
  {
    id: "step-2",
    step: 2,
    title: "Choose Your Engine",
    description:
      "Select the generation model that matches your creative needs — from rapid prototyping to cinematic 4K output.",
    icon: Zap,
  },
  {
    id: "step-3",
    step: 3,
    title: "Generate & Refine",
    description:
      "Generate your video, then iterate with remix, upscale, and re-prompt tools until it matches your vision perfectly.",
    icon: Film,
  },
];

// ─── Footer ────────────────────────────────────────────────────────────────────
export interface FooterSection {
  title: string;
  links: { label: string; href: string }[];
}

export const FOOTER_SECTIONS: FooterSection[] = [
  {
    title: "Models",
    links: [
      { label: "Nova Video Pro", href: "#models" },
      { label: "Motion X", href: "#models" },
      { label: "Curator", href: "#models" },
      { label: "Flash Video", href: "#models" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "#" },
      { label: "API Reference", href: "#" },
      { label: "Pricing", href: "/pricing" },
      { label: "Community", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Cookie Policy", href: "#" },
    ],
  },
];
