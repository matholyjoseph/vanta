import {
  LocalStorageProvider,
  localStorageProvider,
  getStorageProvider,
  StorageProvider,
} from "./storage/index";

export * from "./storage/index";

export interface UploadResult {
  url: string;
  sizeBytes: number;
}

export interface StorageAdapter {
  uploadFile(
    fileBuffer: Buffer,
    filename: string,
    mimeType: string,
    folder?: string
  ): Promise<UploadResult>;
}

export class LocalStorageAdapter implements StorageAdapter {
  async uploadFile(
    fileBuffer: Buffer,
    filename: string,
    mimeType: string,
    folder: string = "uploads"
  ): Promise<UploadResult> {
    const result = await localStorageProvider.upload(fileBuffer, `${folder}/${filename}`);
    return {
      url: result.url,
      sizeBytes: fileBuffer.length,
    };
  }
}

export function getStorageAdapter(): StorageAdapter {
  return new LocalStorageAdapter();
}

export const storage = getStorageAdapter();
export { localStorageProvider, getStorageProvider, LocalStorageProvider };
export type { StorageProvider };
