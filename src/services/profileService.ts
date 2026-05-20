import { clone, mockStore, nowIso, resolveMock } from "@/services/mockData";
import type { Profile } from "@/types/domain";

export const profileService = {
  async getProfile(): Promise<Profile> {
    // TODO: Replace with GET /profile when the Node backend is ready.
    return resolveMock(mockStore.profile);
  },

  async updateProfile(payload: Pick<Profile, "full_name" | "email">): Promise<Profile> {
    // TODO: Replace with PATCH /profile.
    mockStore.profile = {
      ...mockStore.profile,
      ...payload,
      updated_at: nowIso(),
    };
    return resolveMock(mockStore.profile);
  },

  async updateBalance(balance: number): Promise<Profile> {
    // TODO: Replace with a billing endpoint that records payments server-side.
    mockStore.profile = {
      ...mockStore.profile,
      balance,
      updated_at: nowIso(),
    };
    return resolveMock(clone(mockStore.profile));
  },
};

