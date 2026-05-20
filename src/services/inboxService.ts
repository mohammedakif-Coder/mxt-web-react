import { createId, mockStore, nowIso, resolveMock } from "@/services/mockData";
import type { InboxMessage, InboxThread } from "@/types/domain";

export const inboxService = {
  async listThreads(): Promise<InboxThread[]> {
    // TODO: Replace with GET /inbox/threads.
    return resolveMock([...mockStore.inboxThreads].sort((a, b) => (b.last_message_at ?? "").localeCompare(a.last_message_at ?? "")));
  },

  async listMessages(threadId: string): Promise<InboxMessage[]> {
    // TODO: Replace with GET /inbox/threads/:id/messages.
    return resolveMock(
      mockStore.inboxMessages
        .filter((message) => message.thread_id === threadId)
        .sort((a, b) => a.sent_at.localeCompare(b.sent_at)),
    );
  },

  async unreadCount(): Promise<number> {
    return resolveMock(mockStore.inboxThreads.filter((thread) => thread.unread).length);
  },

  async updateThread(threadId: string, patch: Partial<Pick<InboxThread, "unread" | "starred" | "status" | "last_message" | "last_message_at">>): Promise<InboxThread> {
    const index = mockStore.inboxThreads.findIndex((thread) => thread.id === threadId);
    if (index === -1) throw new Error("Thread not found");
    mockStore.inboxThreads[index] = {
      ...mockStore.inboxThreads[index],
      ...patch,
      updated_at: nowIso(),
    };
    return resolveMock(mockStore.inboxThreads[index]);
  },

  async sendReply(threadId: string, body: string): Promise<InboxMessage> {
    // TODO: Replace with POST /inbox/threads/:id/replies.
    const timestamp = nowIso();
    const message: InboxMessage = {
      id: createId("inbox_msg"),
      thread_id: threadId,
      direction: "outbound",
      body,
      sent_at: timestamp,
      created_at: timestamp,
    };
    mockStore.inboxMessages.push(message);
    await this.updateThread(threadId, {
      last_message: body,
      last_message_at: timestamp,
      unread: false,
    });
    return resolveMock(message);
  },
};

