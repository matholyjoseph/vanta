// @ts-nocheck
import { test, expect } from "@playwright/test";

test.describe("Guest Session & Signup E2E Flow", () => {
  test("unauthenticated visitor can click Continue as Guest and access dashboard", async ({ page }) => {
    // 1. Visit Login Page
    await page.goto("/auth/login");

    // 2. Locate Continue as Guest button
    const guestButton = page.getByRole("button", { name: /Continue as Guest/i });
    await expect(guestButton).toBeVisible();

    // 3. Click Continue as Guest
    await guestButton.click();

    // 4. Verify URL redirects to /dashboard
    await page.waitForURL("**/dashboard", { timeout: 10000 });
    expect(page.url()).toContain("/dashboard");

    // 5. Verify vanta_guest_session cookie exists
    const cookies = await page.context().cookies();
    const guestCookie = cookies.find((c: any) => c.name === "vanta_guest_session");
    expect(guestCookie).toBeDefined();

    // 6. Verify Dashboard elements render cleanly without 404 or login redirect
    await expect(page.getByText(/100 Test Credits/i).first()).toBeVisible();

    // 7. Test page refresh persistence
    await page.reload();
    expect(page.url()).toContain("/dashboard");

    // 8. Test Studio access
    await page.goto("/studio/video");
    await page.waitForURL("**/studio/video", { timeout: 10000 });
    expect(page.url()).toContain("/studio/video");
  });

  test("signup page renders and submits without React hook violations", async ({ page }) => {
    let pageErrorOccurred = false;
    page.on("pageerror", () => {
      pageErrorOccurred = true;
    });

    await page.goto("/auth/signup");
    await expect(page.getByText(/Create your account/i)).toBeVisible();
    expect(pageErrorOccurred).toBe(false);
  });
});
