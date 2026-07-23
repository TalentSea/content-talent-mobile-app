/**
 * Status helpers aligned with the Bunny Stream webhook state machine.
 * Codes 6 (PresignedUploadStarted) and 9/10 (metadata events) are
 * audit-only — the video status itself doesn't change for those.
 */

/** Statuses where the video has at least one streamable resolution. */
const STREAMABLE_STATUSES = ['READY', 'PLAYABLE'] as const;

/** Returns true if the video can be played in ExoPlayer. */
export function isStreamable(status: string): boolean {
  return STREAMABLE_STATUSES.includes(
    status.trim().toUpperCase() as (typeof STREAMABLE_STATUSES)[number],
  );
}

export type StatusDisplay = {
  label: string;
  color: string;
};

export const STATUS_DISPLAY: Record<string, StatusDisplay> = {
  PENDING:          { label: 'Queued',         color: '#6B7280' },
  PROCESSING:       { label: 'Processing',     color: '#F59E0B' },
  ENCODING:         { label: 'Encoding',       color: '#3B82F6' },
  READY:            { label: 'Ready',          color: '#10B981' },
  PLAYABLE:         { label: 'Playable',       color: '#34D399' },
  FAILED:           { label: 'Failed',         color: '#EF4444' },
  UPLOAD_FINISHED:  { label: 'Uploaded',       color: '#8B5CF6' },
  UPLOAD_FAILED:    { label: 'Upload Failed',  color: '#EF4444' },
};

/** Safe lookup — returns a neutral grey for unknown statuses. */
export function getStatusDisplay(status: string): StatusDisplay {
  const key = status.trim().toUpperCase();
  return STATUS_DISPLAY[key] ?? { label: status, color: '#6B7280' };
}
