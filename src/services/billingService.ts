import { mockStore, resolveMock } from "@/services/mockData";
import { profileService } from "@/services/profileService";
import type { Invoice, Profile } from "@/types/domain";

export const billingService = {
  async listInvoices(): Promise<Invoice[]> {
    // TODO: Replace with GET /billing/invoices.
    return resolveMock([...mockStore.invoices].sort((a, b) => b.issued_at.localeCompare(a.issued_at)));
  },

  async topUpBalance(amount: number): Promise<Profile> {
    // TODO: Replace with POST /billing/top-ups.
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter a valid amount");
    return profileService.updateBalance(Number(mockStore.profile.balance) + amount);
  },
};

