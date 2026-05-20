import { createId, mockStore, nowIso, resolveMock } from "@/services/mockData";
import type { ActivityLogEntry } from "@/types/domain";

export type ActivityInput = Omit<ActivityLogEntry, "id" | "created_at"> & {
  created_at?: string;
};

export const activityService = {
  async listActivity(): Promise<ActivityLogEntry[]> {
    // TODO: Replace with GET /activity.
    return resolveMock([...mockStore.activityLog].sort((a, b) => b.created_at.localeCompare(a.created_at)));
  },

  async listRecent(limit = 10): Promise<ActivityLogEntry[]> {
    const activity = [...mockStore.activityLog]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit);
    return resolveMock(activity);
  },

  async createActivity(input: ActivityInput): Promise<ActivityLogEntry> {
    const entry: ActivityLogEntry = {
      id: createId("activity"),
      created_at: input.created_at ?? nowIso(),
      ...input,
    };
    mockStore.activityLog.unshift(entry);
    return resolveMock(entry);
  },
};

