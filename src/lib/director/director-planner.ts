import { z } from "zod";
import {
  CreativeBrief,
  creativeBriefSchema,
  DirectorPlan,
  directorPlanSchema,
  PlannedScene,
  PlannedShot,
} from "@/lib/director/director-types";
import { resolveAllDirectorModels } from "@/lib/director/director-model-selector";
import { calculatePlanCredits } from "@/lib/director/director-budget-manager";

export interface BuildPlanInput {
  prompt: string;
  template?: string;
  destination?: string; // YOUTUBE, TIKTOK, REELS, CINEMA, ADS, GENERIC
  duration?: string;
  aspectRatio?: string;
  qualityPreference?: "ECONOMY" | "BALANCED" | "PREMIUM";
  budgetPreference?: "USE_AVAILABLE" | "MAX_CREDITS" | "ASK";
  creditBudget?: number;
  userPlan?: string;
}

export class DirectorPlannerService {
  public async planProduction(input: BuildPlanInput): Promise<DirectorPlan> {
    const quality = input.qualityPreference || "BALANCED";
    const userPlan = input.userPlan || "FREE";

    // 1. Resolve Aspect Ratio & Duration defaults based on Target Platform / Destination
    const platform = (input.destination || "GENERIC").toUpperCase();
    let defaultAspect = input.aspectRatio || "16:9";
    if (platform === "TIKTOK" || platform === "REELS") {
      defaultAspect = input.aspectRatio || "9:16";
    }

    let defaultDuration = input.duration || "30s";
    if (input.template === "luxury-car" || input.template === "automotive") {
      defaultDuration = input.duration || "45s";
    }

    // 2. Build Structured CreativeBrief
    const brief: CreativeBrief = creativeBriefSchema.parse({
      title: this.extractTitleFromPrompt(input.prompt),
      projectType: input.template || "Commercial",
      objective: `Create a professional ${input.template || "cinematic"} video based on user prompt.`,
      targetAudience: "General Audience",
      duration: defaultDuration,
      aspectRatio: defaultAspect,
      resolutionPreference: quality === "PREMIUM" ? "4K" : "1080p",
      visualStyle: "Cinematic Realism",
      tone: "Sophisticated & Dramatic",
      pacing: platform === "TIKTOK" ? "Fast & Dynamic" : "Cinematic & Measured",
      platform,
      qualityPreference: quality,
      budgetPreference: input.budgetPreference || "ASK",
      specialInstructions: input.prompt,
    });

    // 3. Resolve AI Models from Registry
    const models = await resolveAllDirectorModels(quality, userPlan);

    // 4. Generate Script & Shot List
    const { scriptText, voiceoverScript, scenes } = this.generateScriptAndScenes(input.prompt, brief, models.videoModel);

    // 5. Build Preliminary DirectorPlan
    const plan: DirectorPlan = directorPlanSchema.parse({
      title: brief.title,
      creativeBrief: brief,
      scriptText,
      scenes,
      characters: [
        {
          name: "Protagonist",
          description: "Main lead character tailored to scene aesthetic",
          prompt: "Professional character portrait with dramatic cinematic lighting",
        },
      ],
      locations: [
        {
          name: "Primary Location",
          description: "Atmospheric environment location",
          prompt: "Wide establishing architectural landscape with volumetric lighting",
        },
      ],
      products: brief.projectType.toLowerCase().includes("car") || brief.projectType.toLowerCase().includes("product")
        ? [
            {
              name: "Featured Product",
              description: "Luxury vehicle or featured item",
            },
          ]
        : [],
      voiceoverScript,
      voiceId: "voice-maya",
      musicPrompt: `Cinematic ${brief.tone.toLowerCase()} hybrid orchestral score`,
      sfxPrompts: ["Atmospheric ambient tone", "Cinematic sub drop whoosh"],
      modelAssignments: models,
      estimatedCredits: 0,
      totalDurationSeconds: parseInt(defaultDuration) || 30,
    });

    // 6. Calculate Server-Side Credit Cost
    const budget = await calculatePlanCredits(plan);
    plan.estimatedCredits = budget.estimatedCredits;

    return plan;
  }

  private extractTitleFromPrompt(prompt: string): string {
    if (!prompt) return "New Cinema Production";
    const words = prompt.trim().split(" ");
    if (words.length <= 4) return prompt;
    return `${words.slice(0, 4).join(" ")}...`;
  }

  private generateScriptAndScenes(
    prompt: string,
    brief: CreativeBrief,
    videoModelSlug: string
  ): { scriptText: string; voiceoverScript: string; scenes: PlannedScene[] } {
    const isCommercial = brief.projectType.toLowerCase().includes("commercial") || prompt.toLowerCase().includes("commercial") || prompt.toLowerCase().includes("ad");
    const isCar = prompt.toLowerCase().includes("car") || prompt.toLowerCase().includes("automotive");

    let scriptText = "";
    let voiceoverScript = "";

    if (isCommercial) {
      voiceoverScript = "Elegance isn't spoken. It's commanded. Experience the pinnacle of performance and craftsmanship.";
      scriptText = `[EXT. MONACO - NIGHT]\nOpening establishing shot of wet neon street reflections.\n\nVOICEOVER: "${voiceoverScript}"\n\nCLOSING: Logo reveal and tagline.`;
    } else {
      voiceoverScript = "In a world defined by shadows, light carves the path forward.";
      scriptText = `[EXT. CINEMATIC LOCATION - DUSK]\nHigh contrast dramatic wide shot.\n\nNARRATION: "${voiceoverScript}"`;
    }

    const durationNum = parseInt(brief.duration) || 30;
    const shotCount = durationNum >= 45 ? 6 : durationNum >= 30 ? 4 : 3;

    const shots: PlannedShot[] = [];
    for (let i = 1; i <= shotCount; i++) {
      let promptText = `Cinematic shot ${i} of ${prompt}, hyper-realistic 8k lighting, depth of field.`;
      if (isCar) {
        if (i === 1) promptText = "Wide cinematic establishing shot of a sleek black futuristic sports car parked along Monaco coastal road at night, neon lights reflecting on wet asphalt.";
        else if (i === 2) promptText = "Extreme close-up shot of car headlight ignition, LED matrix light activation in slow motion.";
        else if (i === 3) promptText = "Tracking low-angle shot of black sports car accelerating through neon-lit street tunnel.";
        else if (i === 4) promptText = "Interior cockpit shot of driver hands gripping leather steering wheel, glowing dashboard gauges.";
        else if (i === 5) promptText = "Dynamic side tracking shot of sports car gliding past luxury harbor yachts at night.";
        else promptText = "Cinematic static shot of car stopped at overlook overlooking illuminated city bay, subtle smoke exhaust.";
      }

      shots.push({
        shotNumber: `1.${i}`,
        sceneIndex: 1,
        purpose: i === 1 ? "Opening Hook" : i === shotCount ? "Climax & CTA" : "Narrative Development",
        prompt: promptText,
        storyboardPrompt: `Storyboard illustration sketch: ${promptText}`,
        shotSize: i === 1 || i === shotCount ? "Wide" : i === 2 ? "Extreme Close-Up" : "Medium Shot",
        cameraAngle: "Eye Level",
        cameraMovement: i % 2 === 0 ? "Tracking" : "Pan Left",
        lens: "35mm",
        duration: "5s",
        generationMode: "text-to-video",
        recommendedModelId: videoModelSlug,
        dialogueLine: i === 2 ? voiceoverScript : undefined,
      });
    }

    const scene: PlannedScene = {
      sceneIndex: 1,
      title: "Scene 1: Main Production Sequence",
      description: `Primary sequence for ${brief.title}`,
      location: brief.locationPreferences[0] || "Monaco at Night",
      timeOfDay: prompt.toLowerCase().includes("night") ? "Night" : "Dusk",
      shots,
    };

    return {
      scriptText,
      voiceoverScript,
      scenes: [scene],
    };
  }
}

export const directorPlanner = new DirectorPlannerService();
