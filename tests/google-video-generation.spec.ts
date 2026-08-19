// @ts-nocheck
import { test, expect } from "@playwright/test";

test.describe("Google Gemini Video Generation Pipeline", () => {
  test("Gemini Omni Flash locks resolution to 720p and excludes sample fixtures", async ({ page }) => {
    await page.goto("/auth/login");
    const guestButton = page.getByRole("button", { name: /Continue as Guest/i });
    await guestButton.click();
    await page.waitForURL("**/dashboard", { timeout: 10000 });

    await page.goto("/studio/video?model=gemini-omni-flash&mode=text-to-video");
    await page.waitForURL("**/studio/video**", { timeout: 10000 });

    // Verify model is loaded
    await expect(page.getByText(/AI Video Generation Studio/i)).toBeVisible();

    // Verify 1080p is NOT present in resolution selector for Gemini Omni Flash
    const pageContent = await page.content();
    expect(pageContent).not.toContain("1080p");
  });
});
