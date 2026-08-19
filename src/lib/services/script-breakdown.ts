export interface ProposedShot {
  shotNumber: string;
  prompt: string;
  duration: string;
}

export interface ProposedScene {
  title: string;
  description: string;
  shots: ProposedShot[];
}

export interface ScriptBreakdownService {
  breakdownScript(scriptText: string): Promise<ProposedScene[]>;
}

export class MockScriptBreakdownService implements ScriptBreakdownService {
  async breakdownScript(scriptText: string): Promise<ProposedScene[]> {
    if (!scriptText || scriptText.trim().length === 0) {
      return [
        {
          title: "INT. CYBERPUNK LAB - NIGHT",
          description: "Neon-lit research laboratory with glowing holograms.",
          shots: [
            {
              shotNumber: "Shot 1.1",
              prompt: "Wide establishing shot of @Lab interior, glowing green matrix screens.",
              duration: "00:04",
            },
            {
              shotNumber: "Shot 1.2",
              prompt: "Close-up of @Kael adjusting holographic lens overlay.",
              duration: "00:04",
            },
          ],
        },
      ];
    }

    // Deterministic parsing algorithm for development
    const lines = scriptText.split("\n").map((l) => l.trim()).filter(Boolean);
    const scenes: ProposedScene[] = [];
    let currentScene: ProposedScene | null = null;
    const sceneIndex = 1;
    let shotIndex = 1;

    for (const line of lines) {
      if (
        line.toUpperCase().startsWith("INT.") ||
        line.toUpperCase().startsWith("EXT.") ||
        line.toUpperCase().startsWith("SCENE")
      ) {
        if (currentScene) {
          scenes.push(currentScene);
        }
        currentScene = {
          title: line.toUpperCase(),
          description: "Parsed scene sequence",
          shots: [],
        };
        shotIndex = 1;
      } else if (currentScene) {
        currentScene.shots.push({
          shotNumber: `Shot ${sceneIndex}.${shotIndex}`,
          prompt: line,
          duration: "00:04",
        });
        shotIndex++;
      }
    }

    if (currentScene && currentScene.shots.length > 0) {
      scenes.push(currentScene);
    }

    if (scenes.length === 0) {
      scenes.push({
        title: "INT. MAIN SCENE - DAY",
        description: scriptText.slice(0, 80),
        shots: [
          {
            shotNumber: "Shot 1.1",
            prompt: scriptText,
            duration: "00:04",
          },
        ],
      });
    }

    return scenes;
  }
}

export const scriptBreakdownService = new MockScriptBreakdownService();
