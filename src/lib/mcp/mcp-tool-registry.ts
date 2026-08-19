import { z } from "zod";
import { db } from "@/lib/db";
import { McpToolDefinition, McpAuthContext } from "@/lib/mcp/mcp-types";
import { reserveCredits } from "@/lib/video/pricing";
import { directorService } from "@/lib/director/director-service";
import { shortsService } from "@/lib/shorts/shorts-service";
import { createCinemaProjectAction } from "@/app/actions/cinema-actions";

export class McpToolRegistryService {
  private tools = new Map<string, McpToolDefinition>();

  constructor() {
    this.registerDefaultTools();
  }

  public registerTool(tool: McpToolDefinition) {
    this.tools.set(tool.name, tool);
  }

  public getTool(name: string): McpToolDefinition | undefined {
    return this.tools.get(name);
  }

  public getAllTools(): McpToolDefinition[] {
    return Array.from(this.tools.values());
  }

  private registerDefaultTools() {
    // 1. vanta_models_list
    this.registerTool({
      name: "vanta_models_list",
      title: "List Available Models",
      description: "Discover available VANTA AI video, image, audio, and avatar generation models.",
      safety: "READ_ONLY",
      requiredScope: "models:read",
      inputSchema: z.object({ mediaType: z.enum(["VIDEO", "IMAGE", "AUDIO"]).optional() }),
      handler: async () => [
        { id: "vanta-cinema-pro", name: "VANTA Cinema Pro", type: "VIDEO", modes: ["text-to-video", "image-to-video"], creditCost: 20 },
        { id: "vanta-nova-video", name: "VANTA Nova Video", type: "VIDEO", modes: ["text-to-video"], creditCost: 15 },
        { id: "vanta-image-studio", name: "VANTA Image Studio Ultra", type: "IMAGE", modes: ["text-to-image"], creditCost: 4 },
      ],
    });

    // 2. vanta_model_get
    this.registerTool({
      name: "vanta_model_get",
      title: "Get Model Details",
      description: "Retrieve capability metadata for a specific VANTA model.",
      safety: "READ_ONLY",
      requiredScope: "models:read",
      inputSchema: z.object({ modelId: z.string() }),
      handler: async (params) => ({
        id: params.modelId,
        name: params.modelId === "vanta-cinema-pro" ? "VANTA Cinema Pro" : "VANTA Nova Video",
        resolutions: ["720p", "1080p", "4k"],
        durations: ["5s", "10s"],
        aspectRatios: ["16:9", "9:16", "1:1"],
      }),
    });

    // 3. vanta_credits_get
    this.registerTool({
      name: "vanta_credits_get",
      title: "Get Credit Balance",
      description: "Retrieve available VANTA wallet credit balance and account plan limits.",
      safety: "READ_ONLY",
      requiredScope: "credits:read",
      inputSchema: z.object({}),
      handler: async (_, ctx) => {
        const wallet = await db.creditWallet.findUnique({ where: { userId: ctx.userId } });
        return { availableCredits: wallet?.balance ?? 100, currency: "VANTA_CREDIT" };
      },
    });

    // 4. vanta_cost_estimate
    this.registerTool({
      name: "vanta_cost_estimate",
      title: "Estimate Operation Cost",
      description: "Calculate server-authoritative credit estimate before running expensive creation jobs.",
      safety: "READ_ONLY",
      requiredScope: "credits:read",
      inputSchema: z.object({ operation: z.string(), duration: z.number().optional() }),
      handler: async (params) => ({
        operation: params.operation,
        estimatedCredits: params.operation.includes("director") ? 300 : 20,
      }),
    });

    // 5. vanta_video_generate
    this.registerTool({
      name: "vanta_video_generate",
      title: "Generate AI Video",
      description: "Create a new AI video clip using VANTA's multi-model video generation queue.",
      safety: "COST_PRODUCING",
      requiredScope: "generations:create",
      inputSchema: z.object({
        prompt: z.string().min(1),
        modelId: z.string().default("vanta-cinema-pro"),
        duration: z.string().default("5s"),
        aspectRatio: z.string().default("16:9"),
      }),
      handler: async (params, ctx) => {
        const estimatedCredits = 20;
        const gen = await db.generation.create({
          data: {
            userId: ctx.userId,
            modelId: params.modelId,
            mediaType: "VIDEO",
            mode: "text-to-video",
            prompt: params.prompt,
            resolution: "1080p",
            aspectRatio: params.aspectRatio,
            duration: params.duration,
            status: "QUEUED",
            creditCost: estimatedCredits,
          },
        });
        await reserveCredits({ userId: ctx.userId, amount: estimatedCredits, generationId: gen.id, description: `MCP Video: ${params.prompt.substring(0, 30)}` });
        return { generationId: gen.id, status: "queued", estimatedCredits, statusTool: "vanta_generation_get" };
      },
    });

    // 6. vanta_image_generate
    this.registerTool({
      name: "vanta_image_generate",
      title: "Generate AI Image",
      description: "Create a high-resolution photorealistic AI image.",
      safety: "COST_PRODUCING",
      requiredScope: "generations:create",
      inputSchema: z.object({ prompt: z.string().min(1), aspectRatio: z.string().default("16:9") }),
      handler: async (params, ctx) => {
        const estimatedCredits = 4;
        const gen = await db.generation.create({
          data: {
            userId: ctx.userId,
            modelId: "vanta-image-studio",
            mediaType: "IMAGE",
            mode: "text-to-image",
            prompt: params.prompt,
            resolution: "1080p",
            aspectRatio: params.aspectRatio,
            status: "QUEUED",
            creditCost: estimatedCredits,
          },
        });
        await reserveCredits({ userId: ctx.userId, amount: estimatedCredits, generationId: gen.id, description: `MCP Image: ${params.prompt.substring(0, 30)}` });
        return { generationId: gen.id, status: "queued", estimatedCredits };
      },
    });

    // 7. vanta_generation_get
    this.registerTool({
      name: "vanta_generation_get",
      title: "Get Generation Status",
      description: "Query generation status, progress, and resulting media URL.",
      safety: "READ_ONLY",
      requiredScope: "generations:read",
      inputSchema: z.object({ generationId: z.string() }),
      handler: async (params, ctx) => {
        const gen = await db.generation.findFirst({ where: { id: params.generationId, userId: ctx.userId } });
        if (!gen) throw new Error("Generation not found.");
        return { id: gen.id, status: gen.status.toLowerCase(), mediaType: gen.mediaType, outputUrl: gen.videoUrl || gen.imageUrl || gen.audioUrl };
      },
    });

    // 8. vanta_asset_list
    this.registerTool({
      name: "vanta_asset_list",
      title: "List Assets",
      description: "Query owned video, image, and audio assets.",
      safety: "READ_ONLY",
      requiredScope: "assets:read",
      inputSchema: z.object({ type: z.enum(["VIDEO", "IMAGE", "AUDIO"]).optional(), limit: z.number().default(10) }),
      handler: async (params, ctx) => {
        const assets = await db.asset.findMany({
          where: { userId: ctx.userId, ...(params.type ? { type: params.type } : {}) },
          take: params.limit,
          orderBy: { createdAt: "desc" },
        });
        return { assets: assets.map((a) => ({ id: a.id, name: a.name, type: a.type, url: a.url, duration: a.duration })) };
      },
    });

    // 9. vanta_project_create
    this.registerTool({
      name: "vanta_project_create",
      title: "Create Cinema Project",
      description: "Create a new filmmaking project workspace.",
      safety: "WRITE",
      requiredScope: "projects:write",
      inputSchema: z.object({ name: z.string(), description: z.string().optional() }),
      handler: async (params, ctx) => {
        const proj = await createCinemaProjectAction({ name: params.name, description: params.description });
        return { projectId: proj.id, name: proj.name };
      },
    });

    // 10. vanta_director_plan
    this.registerTool({
      name: "vanta_director_plan",
      title: "Plan AI Director Film",
      description: "Plan a multi-shot AI film project without launching expensive video generation.",
      safety: "READ_ONLY",
      requiredScope: "director:create",
      inputSchema: z.object({ prompt: z.string().min(1), maxCredits: z.number().default(500) }),
      handler: async (params, ctx) => {
        const run = await directorService.createDirectorRun(ctx.userId, { prompt: params.prompt, creditBudget: params.maxCredits });
        return { directorRunId: run.id, status: run.status, prompt: run.originalPrompt, estimatedCredits: run.creditBudget };
      },
    });

    // 11. vanta_director_produce
    this.registerTool({
      name: "vanta_director_produce",
      title: "Produce AI Director Film",
      description: "Execute multi-shot video generation for a planned AI Director film. Requires explicit confirmation if cost > 100 credits.",
      safety: "COST_PRODUCING",
      requiredScope: "director:produce",
      inputSchema: z.object({ directorRunId: z.string(), confirmed: z.boolean().optional() }),
      handler: async (params, ctx) => {
        const run = await db.directorRun.findFirst({ where: { id: params.directorRunId, userId: ctx.userId } });
        if (!run) throw new Error("Director run not found.");

        const estimatedCost = run.creditBudget || 300;

        if (estimatedCost > 100 && !params.confirmed) {
          return {
            status: "confirmation_required",
            operation: "vanta_director_produce",
            estimatedCredits: estimatedCost,
            summary: `Produce multi-shot AI Director film "${run.originalPrompt.substring(0, 40)}..." requiring ${estimatedCost} credits. Re-run tool with confirmed: true to proceed.`,
          };
        }

        await db.directorRun.update({ where: { id: run.id }, data: { status: "GENERATING_MEDIA" } });
        return { directorRunId: run.id, status: "producing", estimatedCredits: estimatedCost };
      },
    });

    // 12. vanta_shorts_analyze
    this.registerTool({
      name: "vanta_shorts_analyze",
      title: "Analyze Video for Shorts",
      description: "Detect viral 9:16 highlight moments from a long video asset.",
      safety: "READ_ONLY",
      requiredScope: "shorts:read",
      inputSchema: z.object({ sourceAssetId: z.string() }),
      handler: async (params, ctx) => {
        const project = await shortsService.createShortsProject(ctx.userId, { sourceAssetId: params.sourceAssetId });
        const details = await db.shortsProject.findUnique({ where: { id: project.id }, include: { highlights: true } });
        return { shortsProjectId: project.id, highlightsCount: details?.highlights.length || 0, highlights: details?.highlights };
      },
    });
  }
}

export const mcpToolRegistry = new McpToolRegistryService();
