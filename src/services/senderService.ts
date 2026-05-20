import { createId, mockStore, nowIso, resolveMock } from "@/services/mockData";
import type { Sender } from "@/types/domain";

export type SenderRegistrationPayload = Pick<Sender, "name" | "sender_id" | "type" | "country">;

export const senderService = {
  async listSenders(): Promise<Sender[]> {
    // TODO: Replace with GET /senders.
    return resolveMock([...mockStore.senders].sort((a, b) => b.created_at.localeCompare(a.created_at)));
  },

  async listApprovedSenders(): Promise<Sender[]> {
    return resolveMock(mockStore.senders.filter((sender) => sender.status === "approved"));
  },

  async registerSender(payloads: SenderRegistrationPayload[]): Promise<Sender[]> {
    // TODO: Replace with POST /senders/register.
    const timestamp = nowIso();
    const created = payloads.map((payload) => ({
      id: createId("sender"),
      ...payload,
      status: "pending" as const,
      created_at: timestamp,
      updated_at: timestamp,
    }));
    mockStore.senders.unshift(...created);
    return resolveMock(created);
  },
};

