export function generateOpenApiSpec() {
  return {
    openapi: "3.0.3",
    info: {
      title: "VANTA AI Public Platform API",
      version: "1.0.0",
      description: "Unified AI media generation API for video, image, audio, avatar, and AI Director orchestration.",
      contact: {
        name: "VANTA AI Developer Support",
        url: "https://vanta.ai/developers",
      },
    },
    servers: [
      {
        url: "/api/v1",
        description: "Production API v1 Base",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "ApiKey",
          description: "Enter your VANTA API Key (e.g. vanta_live_... or vanta_test_...)",
        },
      },
    },
    security: [{ BearerAuth: [] }],
    paths: {
      "/generations": {
        post: {
          summary: "Create AI Media Generation",
          description: "Triggers async AI generation for video, image, audio, or talking avatar.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    model: { type: "string", example: "vanta-cinema-pro" },
                    mode: { type: "string", example: "text-to-video" },
                    prompt: { type: "string", example: "A cinematic sports car driving through a futuristic city at night" },
                    duration: { type: "integer", example: 5 },
                    aspect_ratio: { type: "string", example: "16:9" },
                    resolution: { type: "string", example: "1080p" },
                  },
                  required: ["prompt"],
                },
              },
            },
          },
          responses: {
            202: { description: "Async generation queued" },
            400: { description: "Invalid request parameters" },
            401: { description: "Authentication failed" },
            402: { description: "Insufficient credit balance" },
            429: { description: "Rate limit exceeded" },
          },
        },
        get: {
          summary: "List Generations",
          responses: {
            200: { description: "List of generations" },
          },
        },
      },
      "/models": {
        get: {
          summary: "List Stable Models",
          responses: {
            200: { description: "Public VANTA model registry" },
          },
        },
      },
      "/assets": {
        get: {
          summary: "List Assets",
          responses: {
            200: { description: "User media assets" },
          },
        },
      },
      "/director/runs": {
        post: {
          summary: "Launch AI Director Agent",
          responses: {
            202: { description: "Director run initiated" },
          },
        },
      },
      "/status": {
        get: {
          summary: "API System Status",
          responses: {
            200: { description: "Operational status" },
          },
        },
      },
    },
  };
}
