import { activityService } from "@/services/activityService";
import { createId, mockStore, nowIso, resolveMock } from "@/services/mockData";
import type { Campaign, CampaignStatus, MessageChannel } from "@/types/domain";

export type CampaignPayload = {
  name: string;
  body: string;
  channel: MessageChannel;
  status: CampaignStatus;
  recipient_count: number;
  delivered_count: number;
  failed_count?: number;
  scheduled_at?: string | null;
  sent_at?: string | null;
};

export const campaignService = {
  async listCampaigns(): Promise<Campaign[]> {
    // TODO: Replace with GET /campaigns.
    return resolveMock([...mockStore.campaigns].sort((a, b) => b.created_at.localeCompare(a.created_at)));
  },

  async getNextScheduledCampaign(): Promise<Campaign | null> {
    const next = mockStore.campaigns
      .filter((campaign) => campaign.status === "scheduled")
      .sort((a, b) => (a.scheduled_at ?? "").localeCompare(b.scheduled_at ?? ""))[0] ?? null;
    return resolveMock(next);
  },

  async createCampaign(payload: CampaignPayload): Promise<Campaign> {
    // TODO: Replace with POST /campaigns.
    const timestamp = nowIso();
    const created: Campaign = {
      id: createId("campaign"),
      ...payload,
      failed_count: payload.failed_count ?? 0,
      scheduled_at: payload.scheduled_at ?? null,
      sent_at: payload.sent_at ?? null,
      created_at: timestamp,
      updated_at: timestamp,
    };
    mockStore.campaigns.unshift(created);

    await activityService.createActivity({
      event_type: "campaign_created",
      recipient: created.name,
      recipient_name: `${created.recipient_count} recipients`,
      body: created.body,
      channel: created.channel,
      status: created.status,
      cost: created.recipient_count * 0.05,
      media_urls: null,
    });

    return resolveMock(created);
  },
};
