// Client-side evaluator for the structured contact filter returned by the
// AI segment service. Keep this in sync with the backend response schema.
import type { Contact, ContactList, ContactListMember, Message } from "@/types/database";

export interface SegmentFilter {
  name_contains?: string;
  email_contains?: string;
  email_domain?: string;
  phone_country_prefix?: string;
  has_any_tag?: string[];
  not_has_tag?: string[];
  in_list_name?: string;
  opt_out?: boolean;
  created_within_days?: number;
  no_message_within_days?: number;
  last_message_status?: "delivered" | "failed" | "any";
}

interface EvalContext {
  lists?: ContactList[];
  members?: ContactListMember[];
  messages?: Message[];
}

const DAY_MS = 86_400_000;

export function applySegmentFilter(
  contacts: Contact[],
  filter: SegmentFilter,
  ctx: EvalContext = {},
): Contact[] {
  const { lists = [], members = [], messages = [] } = ctx;

  let listMemberIds: Set<string> | null = null;
  if (filter.in_list_name) {
    const target = filter.in_list_name.toLowerCase();
    const matchingList = lists.find((l) => l.name.toLowerCase() === target)
      ?? lists.find((l) => l.name.toLowerCase().includes(target));
    listMemberIds = new Set(
      matchingList ? members.filter((m) => m.list_id === matchingList.id).map((m) => m.contact_id) : [],
    );
  }

  // Build last-message-by-recipient lookup (by phone) when needed.
  let lastMsgByPhone: Map<string, Message> | null = null;
  if (filter.no_message_within_days != null || filter.last_message_status) {
    lastMsgByPhone = new Map();
    for (const m of messages) {
      const prev = lastMsgByPhone.get(m.recipient);
      if (!prev || new Date(m.created_at).getTime() > new Date(prev.created_at).getTime()) {
        lastMsgByPhone.set(m.recipient, m);
      }
    }
  }

  return contacts.filter((c) => {
    if (filter.name_contains && !c.full_name.toLowerCase().includes(filter.name_contains.toLowerCase())) return false;
    if (filter.email_contains && !(c.email ?? "").toLowerCase().includes(filter.email_contains.toLowerCase())) return false;
    if (filter.email_domain && !(c.email ?? "").toLowerCase().endsWith(`@${filter.email_domain.toLowerCase()}`)) return false;
    if (filter.phone_country_prefix && !c.phone.startsWith(filter.phone_country_prefix)) return false;
    if (filter.has_any_tag?.length) {
      const ct = (c.tags ?? []).map((t) => t.toLowerCase());
      if (!filter.has_any_tag.some((t) => ct.includes(t.toLowerCase()))) return false;
    }
    if (filter.not_has_tag?.length) {
      const ct = (c.tags ?? []).map((t) => t.toLowerCase());
      if (filter.not_has_tag.some((t) => ct.includes(t.toLowerCase()))) return false;
    }
    if (listMemberIds && !listMemberIds.has(c.id)) return false;
    if (filter.opt_out != null && !!c.opt_out !== filter.opt_out) return false;
    if (filter.created_within_days != null) {
      const ageDays = (Date.now() - new Date(c.created_at).getTime()) / DAY_MS;
      if (ageDays > filter.created_within_days) return false;
    }
    if (filter.no_message_within_days != null && lastMsgByPhone) {
      const last = lastMsgByPhone.get(c.phone);
      if (last) {
        const ageDays = (Date.now() - new Date(last.created_at).getTime()) / DAY_MS;
        if (ageDays <= filter.no_message_within_days) return false;
      }
      // No message at all → include (counts as "no message in N days")
    }
    if (filter.last_message_status && filter.last_message_status !== "any" && lastMsgByPhone) {
      const last = lastMsgByPhone.get(c.phone);
      if (!last || last.status !== filter.last_message_status) return false;
    }
    return true;
  });
}

export function describeFilter(filter: SegmentFilter): string[] {
  const parts: string[] = [];
  if (filter.name_contains) parts.push(`name contains "${filter.name_contains}"`);
  if (filter.email_contains) parts.push(`email contains "${filter.email_contains}"`);
  if (filter.email_domain) parts.push(`email @${filter.email_domain}`);
  if (filter.phone_country_prefix) parts.push(`phone starts ${filter.phone_country_prefix}`);
  if (filter.has_any_tag?.length) parts.push(`tag in [${filter.has_any_tag.join(", ")}]`);
  if (filter.not_has_tag?.length) parts.push(`tag not in [${filter.not_has_tag.join(", ")}]`);
  if (filter.in_list_name) parts.push(`in list "${filter.in_list_name}"`);
  if (filter.opt_out != null) parts.push(filter.opt_out ? "opted out" : "active");
  if (filter.created_within_days != null) parts.push(`added in last ${filter.created_within_days}d`);
  if (filter.no_message_within_days != null) parts.push(`no message in ${filter.no_message_within_days}d`);
  if (filter.last_message_status && filter.last_message_status !== "any") parts.push(`last msg ${filter.last_message_status}`);
  return parts;
}
