import type { SegmentFilter } from "@/lib/segment-filter";
import { resolveMock } from "@/services/mockData";

export type ChatMessage = { role: "user" | "assistant"; content: string };

export const aiService = {
  async composeMessage(input: { type: string; length: string; tone: string; context: string }): Promise<string> {
    // TODO: Replace with POST /ai/compose.
    const tone = input.tone || "Friendly";
    const context = input.context.trim() || "your update";
    return resolveMock(`${tone} ${input.type || "message"}: ${context}. Reply STOP to opt out.`);
  },

  async chat(messages: ChatMessage[]): Promise<string> {
    // TODO: Replace with POST /ai/chat.
    const last = messages[messages.length - 1]?.content ?? "";
    return resolveMock(`I can help with messaging workflows, contacts, campaigns, and reporting. For now this is mock guidance based on: "${last}"`);
  },

  async buildSegment(query: string): Promise<{ name: string; description: string; filter: SegmentFilter; confidence: string }> {
    // TODO: Replace with POST /ai/segments/build.
    const normalized = query.toLowerCase();
    const filter: SegmentFilter = normalized.includes("opt")
      ? { opt_out: false }
      : normalized.includes("vip")
        ? { has_any_tag: ["vip"] }
        : { no_message_within_days: 30 };
    return resolveMock({
      name: normalized.includes("vip") ? "VIP contacts" : "Suggested segment",
      description: `Contacts matching "${query}".`,
      filter,
      confidence: "medium",
    });
  },

  async suggestSegments(): Promise<{ suggestions: Array<{ name: string; description: string; why: string; filter: SegmentFilter }> }> {
    // TODO: Replace with GET /ai/segments/suggestions.
    return resolveMock({
      suggestions: [
        {
          name: "VIP Customers",
          description: "Contacts tagged as VIP and still active.",
          why: "Useful for high-value offers.",
          filter: { has_any_tag: ["vip"], opt_out: false },
        },
        {
          name: "Winback Audience",
          description: "Contacts with no message in the last 30 days.",
          why: "A good group for re-engagement.",
          filter: { no_message_within_days: 30, opt_out: false },
        },
      ],
    });
  },

  async campaignPlan(input: {
    goal: string;
    audience: string;
    offer?: string;
    available_lists: Array<{ id: string; name: string }>;
  }) {
    // TODO: Replace with POST /ai/campaign-plan.
    const recommended = input.available_lists[0];
    return resolveMock({
      campaign_name: input.goal.slice(0, 42) || "New campaign",
      message_body: `${input.offer ? `${input.offer}: ` : ""}${input.goal}. Reply STOP to opt out.`,
      recommended_list_id: recommended?.id,
      recommended_list_reason: recommended ? `Best available fit: ${recommended.name}` : undefined,
      send_time: {
        mode: "schedule",
        local_time_hint: "10:00 AM",
        reason: "Late morning tends to perform well for business messaging.",
      },
      follow_up_sequence: [],
      predicted_response_rate: { low_pct: 8, high_pct: 14, reasoning: "Based on similar campaign patterns." },
      risks: ["Confirm consent and opt-out language before launch."],
    });
  },

  async reportSummary(stats: unknown): Promise<{ headline: string; bullets: string[]; recommendations: { action: string; expected_impact: string }[] }> {
    // TODO: Replace with POST /ai/reports/summary.
    return resolveMock({
      headline: "Delivery performance is healthy in the selected range.",
      bullets: ["Most volume is concentrated in SMS.", "Failures remain low in this mock dataset.", `Stats payload keys: ${Object.keys(stats as object).length}`],
      recommendations: [{ action: "Review failed messages weekly", expected_impact: "Keeps sender reputation and cost efficiency stable." }],
    });
  },

  async answerReportQuestion(question: string): Promise<string> {
    // TODO: Replace with POST /ai/reports/ask.
    return resolveMock(`Based on the current mock report, the answer to "${question}" is: focus on delivered rate, failed count, and channel mix.`);
  },
};

