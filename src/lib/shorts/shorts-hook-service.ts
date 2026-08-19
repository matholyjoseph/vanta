export type HookType =
  | "QUESTION"
  | "BOLD_STATEMENT"
  | "CURIOSITY"
  | "DIRECT_BENEFIT"
  | "STORY_SETUP";

export class ShortsHookService {
  public generateHookVariations(originalText: string): Record<HookType, string> {
    const clean = originalText.replace(/[^\w\s]/gi, "").trim();

    return {
      QUESTION: `Would you make the same decision when it comes to ${clean.substring(0, 30)}?`,
      BOLD_STATEMENT: "You've been doing this wrong the whole time.",
      CURIOSITY: "Nobody tells you this before you start.",
      DIRECT_BENEFIT: "Here's how to double your results in half the time.",
      STORY_SETUP: "This single moment changed everything for our team.",
    };
  }

  public rewriteHook(originalHook: string, style: HookType): string {
    const variations = this.generateHookVariations(originalHook);
    return variations[style] || originalHook;
  }
}

export const shortsHookService = new ShortsHookService();
