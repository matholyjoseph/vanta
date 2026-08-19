import { URL } from "url";

export class SsrfProtectionService {
  private blockedHostnames = ["localhost", "127.0.0.1", "0.0.0.0", "169.254.169.254", "metadata.google.internal"];

  /**
   * Validates if a user-supplied URL is safe to fetch server-side.
   */
  public isUrlSafe(inputUrl: string): { safe: boolean; reason?: string } {
    try {
      const parsed = new URL(inputUrl);

      if (!["http:", "https:"].includes(parsed.protocol)) {
        return { safe: false, reason: "Forbidden protocol scheme." };
      }

      const hostname = parsed.hostname.toLowerCase();

      if (this.blockedHostnames.includes(hostname)) {
        return { safe: false, reason: "Blocked internal or metadata hostname." };
      }

      // Check private IPv4 ranges
      if (
        hostname.startsWith("10.") ||
        hostname.startsWith("192.168.") ||
        hostname.startsWith("127.") ||
        hostname.startsWith("169.254.") ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
      ) {
        return { safe: false, reason: "Blocked private network IP destination." };
      }

      return { safe: true };
    } catch {
      return { safe: false, reason: "Invalid URL string." };
    }
  }
}

export const ssrfProtection = new SsrfProtectionService();
