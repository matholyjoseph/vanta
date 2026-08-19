import fs from "fs";
import path from "path";

export interface StorageProvider {
  name: string;
  upload(
    buffer: Buffer,
    key: string,
    contentType?: string
  ): Promise<{ key: string; url: string }>;
  getSignedUploadUrl(
    key: string,
    contentType: string
  ): Promise<{ key: string; uploadUrl: string; publicUrl: string }>;
  getSignedDownloadUrl(key: string): Promise<string>;
  delete(key: string): Promise<void>;
}

export class LocalStorageProvider implements StorageProvider {
  public name = "local";
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(
    buffer: Buffer,
    key: string
  ): Promise<{ key: string; url: string }> {
    const sanitizedKey = key.replace(/[^a-zA-Z0-9.\-_/]/g, "_");
    const filePath = path.join(this.uploadDir, sanitizedKey);

    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, buffer);
    const url = `/uploads/${sanitizedKey}`;
    return { key: sanitizedKey, url };
  }

  async getSignedUploadUrl(
    key: string
  ): Promise<{ key: string; uploadUrl: string; publicUrl: string }> {
    const sanitizedKey = key.replace(/[^a-zA-Z0-9.\-_/]/g, "_");
    return {
      key: sanitizedKey,
      uploadUrl: `/api/uploads/local?key=${encodeURIComponent(sanitizedKey)}`,
      publicUrl: `/uploads/${sanitizedKey}`,
    };
  }

  async getSignedDownloadUrl(key: string): Promise<string> {
    if (key.startsWith("http://") || key.startsWith("https://") || key.startsWith("/")) {
      return key;
    }
    return `/uploads/${key}`;
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.uploadDir, key);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

export const localStorageProvider = new LocalStorageProvider();

export function getStorageProvider(): StorageProvider {
  return localStorageProvider;
}
