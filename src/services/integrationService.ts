import { createId, mockStore, nowIso, resolveMock } from "@/services/mockData";
import type { IntegrationLog } from "@/types/domain";

export type SyncAction =
  | "sync_to_hubspot"
  | "sync_from_hubspot"
  | "sync_two_way"
  | "sync_companies"
  | "push_sms_activity"
  | "push_campaign_activity";

export const integrationService = {
  async getHubspotStatus() {
    // TODO: Replace with GET /integrations/hubspot/status.
    return resolveMock({
      connected: true,
      account: { uiDomain: "acme.hubspot.com", portalId: "123456", accountType: "Demo" },
      lastSync: mockStore.integrationLogs[0]?.created_at,
      lastSyncStats: {
        success: mockStore.integrationLogs[0]?.success_count ?? 0,
        failed: mockStore.integrationLogs[0]?.failed_count ?? 0,
      },
      contactCount: mockStore.contacts.length,
      syncedCount: mockStore.contacts.filter((contact) => contact.hubspot_id).length + 18,
    });
  },

  async listHubspotLogs(): Promise<IntegrationLog[]> {
    // TODO: Replace with GET /integrations/hubspot/logs.
    return resolveMock([...mockStore.integrationLogs].sort((a, b) => b.created_at.localeCompare(a.created_at)));
  },

  async runHubspotSync(action: SyncAction): Promise<{ success: number; failed: number }> {
    // TODO: Replace with POST /integrations/hubspot/sync.
    const success = action === "sync_companies" ? 4 : mockStore.contacts.length;
    const failed = 0;
    mockStore.integrationLogs.unshift({
      id: createId("log"),
      integration: "hubspot",
      action,
      status: "success",
      success_count: success,
      failed_count: failed,
      created_at: nowIso(),
    });
    return resolveMock({ success, failed });
  },

  async backgroundSyncFromHubspot(): Promise<{ success: number; failed: number }> {
    return this.runHubspotSync("sync_from_hubspot");
  },
};

