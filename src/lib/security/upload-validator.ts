export class UploadValidatorService {
  private allowedMimeTypes = [
    "image/jpeg", "image/png", "image/webp", "image/gif",
    "video/mp4", "video/webm", "video/quicktime",
    "audio/mpeg", "audio/wav", "audio/mp3", "audio/ogg",
  ];

  private maxSizeBytes = 250 * 1024 * 1024; // 250MB limit

  public validateFileUpload(file: { name: string; size: number; type: string }): { valid: boolean; error?: string } {
    if (file.size > this.maxSizeBytes) {
      return { valid: false, error: `File size exceeds max limit of 250MB.` };
    }

    if (!this.allowedMimeTypes.includes(file.type.toLowerCase())) {
      return { valid: false, error: `Unsupported file type '${file.type}'.` };
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (["zip", "tar", "gz", "exe", "sh", "bat", "php", "js"].includes(ext || "")) {
      return { valid: false, error: "Archive and executable uploads are rejected." };
    }

    return { valid: true };
  }
}

export const uploadValidator = new UploadValidatorService();
