import { activityService } from "@/services/activityService";
import { createId, mockStore, nowIso, resolveMock } from "@/services/mockData";
import { profileService } from "@/services/profileService";
import type { Message, MessageChannel } from "@/types/domain";

export type SendMessagePayload = {
  recipients: string[];
  body: string;
  channel: MessageChannel;
  senderId: string;
  cost: number;
  mediaUrls?: string[];
  recipientName?: string | null;
};

export const messagingService = {
  async listMessages(options: { from?: string | null } = {}): Promise<Message[]> {
    // TODO: Replace with GET /messages.
    const messages = options.from
      ? mockStore.messages.filter((message) => message.created_at >= options.from!)
      : mockStore.messages;
    return resolveMock([...messages].sort((a, b) => a.created_at.localeCompare(b.created_at)));
  },

  async sendMessage(payload: SendMessagePayload): Promise<Message> {
    // TODO: Replace with POST /messages/send. The Node backend should own delivery, persistence, and billing.
    const timestamp = nowIso();
    const primaryRecipient = payload.recipients[0] ?? "bulk";
    const status = "delivered" as const;
    const message: Message = {
      id: createId("msg"),
      recipient: primaryRecipient,
      body: payload.body,
      channel: payload.channel,
      sender_id: payload.senderId,
      status,
      cost: payload.cost,
      media_urls: payload.mediaUrls ?? null,
      created_at: timestamp,
      updated_at: timestamp,
    };
    mockStore.messages.push(message);

    await activityService.createActivity({
      event_type: "message_sent",
      recipient: primaryRecipient,
      recipient_name: payload.recipientName ?? (payload.recipients.length > 1 ? `${payload.recipients.length} recipients` : null),
      body: payload.body,
      channel: payload.channel,
      status,
      cost: payload.cost,
      media_urls: payload.mediaUrls ?? null,
    });

    await profileService.updateBalance(Math.max(0, Number(mockStore.profile.balance) - payload.cost));
    mockStore.profile.messages_used += payload.recipients.length || 1;
    return resolveMock(message);
  },

  async sendTestMessage(payload: { destination: string; body: string; origin: string }): Promise<void> {
    // TODO: Replace with POST /messages/test-send.
    if (!payload.destination) throw new Error("Enter a test number");
    return resolveMock(undefined);
  },

  async uploadMedia(files: File[]): Promise<string[]> {
    // TODO: Replace with POST /media/upload.
    const urls = files.map((file) => URL.createObjectURL(file));
    return resolveMock(urls, 60);
  },

  async shortenUrlsInText(text: string, urls: string[]): Promise<{ text: string; failed: string[] }> {
    // TODO: Replace with POST /links/shorten.
    let output = text;
    urls.forEach((url, index) => {
      output = output.split(url).join(`https://mxt.link/${(index + 1).toString().padStart(4, "0")}`);
    });
    return resolveMock({ text: output, failed: [] }, 80);
  },
};

