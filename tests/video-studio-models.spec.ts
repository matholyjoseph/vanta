// @ts-nocheck
import { test, expect } from "@playwright/test";

test.describe("Video Studio Model Filtering & Registry Verification", () => {
  test("Video Studio contains only VIDEO models and excludes Imagen 3", async ({ page }) => {
    await page.goto("/auth/login");
    const guestButton = page.getByRole("button", { name: /Continue as Guest/i });
    await guestButton.click();
    await page.waitForURL("**/dashboard", { timeout: 10000 });

    // Navigate to Video Studio
    await page.goto("/studio/video");
    await page.waitForURL("**/studio/video", { timeout: 10000 });

    // Verify page title and header
    await expect(page.getByText(/AI Video Generation Studio/i)).toBeVisible();

    // Verify Imagen 3 is NOT in Video Studio
    const pageContent = await page.content();
    expect(pageContent).not.toContain("Imagen 3");

    // Attempting to open /studio/video?model=imagen-3 falls back safely
    await page.goto("/studio/video?model=imagen-3");
    await page.waitForURL("**/studio/video?model=imagen-3", { timeout: 10000 });

    // Model falls back to valid video model
    const newContent = await page.content();
    expect(newContent).not.toContain("1024x1024");
  });
});
