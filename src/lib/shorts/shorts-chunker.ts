import { TranscriptSegment, ShortsChunk } from "@/lib/shorts/shorts-types";

export class ShortsChunkerService {
  /**
   * Splits long transcripts (10-90 mins) into overlapping 3-minute chunks with context padding.
   */
  public chunkTranscript(segments: TranscriptSegment[], chunkDurationSeconds = 180, overlapSeconds = 30): ShortsChunk[] {
    if (!segments || segments.length === 0) return [];

    const totalDuration = segments[segments.length - 1].endTime;
    const chunks: ShortsChunk[] = [];

    let currentStart = 0;
    let chunkIndex = 1;

    while (currentStart < totalDuration) {
      const currentEnd = currentStart + chunkDurationSeconds;

      const chunkSegments = segments.filter(
        (s) => s.startTime >= currentStart && s.startTime < currentEnd
      );

      if (chunkSegments.length > 0) {
        const text = chunkSegments.map((s) => s.text).join(" ");
        chunks.push({
          chunkIndex,
          startTime: currentStart,
          endTime: Math.min(currentEnd, totalDuration),
          text,
          segments: chunkSegments,
        });
        chunkIndex++;
      }

      currentStart += chunkDurationSeconds - overlapSeconds;
    }

    return chunks;
  }
}

export const shortsChunker = new ShortsChunkerService();
