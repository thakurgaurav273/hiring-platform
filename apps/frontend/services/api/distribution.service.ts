import { api } from "./axios";

export type PublicationChannel = "CAREERS_PAGE" | "WEBSITE_EMBED" | "LINKEDIN" | "INDEED" | "NAUKRI";
export type PublicationStatus = "PENDING" | "PUBLISHED" | "PAUSED" | "FAILED" | "UNPUBLISHED";
export type PublicationAction = "publish" | "pause" | "unpublish";

export interface Destination {
  channel: PublicationChannel;
  label: string;
  kind: "first_party" | "external";
  /** True when Robin Talent publishes to this destination itself. */
  directPublishing: boolean;
  connected: boolean;
  manualHint: string | null;
  utmSource: string | null;
  /** null for external boards that aren't connected. */
  status: PublicationStatus | null;
  publishedAt: string | null;
  pausedAt: string | null;
  lastSyncedAt: string | null;
  lastError: string | null;
  externalUrl: string | null;
}

export interface Distribution {
  job: { id: string; title: string; status: "DRAFT" | "OPEN" | "ON_HOLD" | "CLOSED" };
  organizationSlug: string;
  destinations: Destination[];
}

export const getDistribution = async (jobId: string): Promise<Distribution> => {
  const { data } = await api.get<{ data: Distribution }>(`/distribution/jobs/${jobId}`);
  return data.data;
};

export const setPublication = async (jobId: string, channel: PublicationChannel, action: PublicationAction) => {
  const { data } = await api.put(`/distribution/jobs/${jobId}/${channel}`, { action });
  return data.data;
};
