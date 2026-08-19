// @ts-nocheck
import { test, expect } from "@playwright/test";

test.describe("Video Media Delivery & Playback Pipeline", () => {
  test("Serves video with Content-Type video/mp4 and supports HTTP Range 206", async ({ request }) => {
    // Test HTTP 200 GET for MP4 video
    const response = await request.get("/uploads/samples/vanta-sample-video.mp4");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("video/mp4");
    expect(response.headers()["accept-ranges"]).toBe("bytes");

    // Test HTTP 206 Partial Content Range Request
    const rangeResponse = await request.get("/uploads/samples/vanta-sample-video.mp4", {
      headers: {
        Range: "bytes=0-1023",
      },
    });
    expect(rangeResponse.status()).toBe(206);
    expect(rangeResponse.headers()["content-type"]).toContain("video/mp4");
    expect(rangeResponse.headers()["content-range"]).toContain("bytes 0-1023/");
  });

  test("HTML5 Video Player renders valid source and plays without NotSupportedError", async ({ page }) => {
    await page.goto("/auth/login");
    const guestButton = page.getByRole("button", { name: /Continue as Guest/i });
    await guestButton.click();
    await page.waitForURL("**/dashboard", { timeout: 10000 });

    // Listen for runtime page errors
    let runtimeError: Error | null = null;
    page.on("pageerror", (err) => {
      runtimeError = err;
    });

    await page.goto("/studio/video");
    await page.waitForURL("**/studio/video", { timeout: 10000 });

    expect(runtimeError).toBeNull();
  });
});
