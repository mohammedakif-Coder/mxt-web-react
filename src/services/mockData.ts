import type {
  ActivityLogEntry,
  Campaign,
  Contact,
  ContactList,
  ContactListMember,
  InboxMessage,
  InboxThread,
  IntegrationLog,
  Invoice,
  Message,
  Profile,
  Sender,
  Template,
} from "@/types/domain";

const DAY_MS = 86_400_000;

export function nowIso() {
  return new Date().toISOString();
}

export function daysAgo(days: number) {
  return new Date(Date.now() - days * DAY_MS).toISOString();
}

export function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export async function resolveMock<T>(value: T, latency = 120): Promise<T> {
  await new Promise((resolve) => globalThis.setTimeout(resolve, latency));
  return clone(value);
}

export const mockStore: {
  profile: Profile;
  contacts: Contact[];
  contactLists: ContactList[];
  contactListMembers: ContactListMember[];
  messages: Message[];
  activityLog: ActivityLogEntry[];
  campaigns: Campaign[];
  templates: Template[];
  senders: Sender[];
  inboxThreads: InboxThread[];
  inboxMessages: InboxMessage[];
  invoices: Invoice[];
  integrationLogs: IntegrationLog[];
} = {
  profile: {
    id: "profile_001",
    email: "operations@mxt.local",
    full_name: "MXT Operations",
    balance: 187.5,
    tier: "Growth",
    messages_used: 1284,
    messages_limit: 5000,
    created_at: daysAgo(120),
    updated_at: daysAgo(1),
  },
  contacts: [
    {
      id: "contact_001",
      full_name: "Amelia Hart",
      phone: "+61400000101",
      email: "amelia@example.com",
      tags: ["vip", "retail"],
      opt_out: false,
      created_at: daysAgo(84),
      updated_at: daysAgo(4),
    },
    {
      id: "contact_002",
      full_name: "Noah Singh",
      phone: "+61400000102",
      email: "noah@example.com",
      tags: ["trial"],
      opt_out: false,
      created_at: daysAgo(63),
      updated_at: daysAgo(7),
    },
    {
      id: "contact_003",
      full_name: "Grace Lee",
      phone: "+61400000103",
      email: "grace@example.com",
      tags: ["event"],
      opt_out: false,
      created_at: daysAgo(42),
      updated_at: daysAgo(2),
    },
    {
      id: "contact_004",
      full_name: "Lucas Brown",
      phone: "+61400000104",
      email: "lucas@example.com",
      tags: ["wholesale"],
      opt_out: true,
      created_at: daysAgo(30),
      updated_at: daysAgo(11),
    },
    {
      id: "contact_005",
      full_name: "Mia Wilson",
      phone: "+61400000105",
      email: "mia@example.com",
      tags: ["vip", "winback"],
      opt_out: false,
      created_at: daysAgo(14),
      updated_at: daysAgo(1),
    },
  ],
  contactLists: [
    {
      id: "list_001",
      name: "VIP Customers",
      email_keyword: "vip",
      default_sender: "alpha",
      is_global: false,
      description: "High value customers for priority offers.",
      created_at: daysAgo(80),
      updated_at: daysAgo(3),
    },
    {
      id: "list_002",
      name: "Trial Users",
      email_keyword: "trial",
      default_sender: "shared",
      is_global: false,
      description: "New users in trial onboarding.",
      created_at: daysAgo(50),
      updated_at: daysAgo(6),
    },
    {
      id: "list_003",
      name: "Event Attendees",
      email_keyword: "events",
      default_sender: "virtual",
      is_global: true,
      description: "Contacts collected from recent events.",
      created_at: daysAgo(25),
      updated_at: daysAgo(2),
    },
  ],
  contactListMembers: [
    { id: "member_001", list_id: "list_001", contact_id: "contact_001", created_at: daysAgo(80) },
    { id: "member_002", list_id: "list_001", contact_id: "contact_005", created_at: daysAgo(14) },
    { id: "member_003", list_id: "list_002", contact_id: "contact_002", created_at: daysAgo(50) },
    { id: "member_004", list_id: "list_003", contact_id: "contact_003", created_at: daysAgo(25) },
  ],
  messages: [
    {
      id: "msg_001",
      recipient: "+61400000101",
      body: "Your booking reminder is confirmed for tomorrow at 3 PM.",
      channel: "sms",
      sender_id: "MXT",
      status: "delivered",
      cost: 0.05,
      media_urls: null,
      created_at: daysAgo(2),
      updated_at: daysAgo(2),
    },
    {
      id: "msg_002",
      recipient: "+61400000102",
      body: "Welcome to your trial. Reply HELP if you need anything.",
      channel: "sms",
      sender_id: "MXT",
      status: "delivered",
      cost: 0.05,
      media_urls: null,
      created_at: daysAgo(5),
      updated_at: daysAgo(5),
    },
    {
      id: "msg_003",
      recipient: "+61400000103",
      body: "Thanks for attending. Here is your event follow-up.",
      channel: "whatsapp",
      sender_id: "MXT",
      status: "pending",
      cost: 0.08,
      media_urls: null,
      created_at: daysAgo(8),
      updated_at: daysAgo(8),
    },
  ],
  activityLog: [
    {
      id: "activity_001",
      event_type: "message_sent",
      recipient: "+61400000101",
      recipient_name: "Amelia Hart",
      body: "Your booking reminder is confirmed for tomorrow at 3 PM.",
      channel: "sms",
      status: "delivered",
      cost: 0.05,
      media_urls: null,
      created_at: daysAgo(2),
    },
    {
      id: "activity_002",
      event_type: "message_sent",
      recipient: "+61400000102",
      recipient_name: "Noah Singh",
      body: "Welcome to your trial. Reply HELP if you need anything.",
      channel: "sms",
      status: "delivered",
      cost: 0.05,
      media_urls: null,
      created_at: daysAgo(5),
    },
    {
      id: "activity_003",
      event_type: "campaign_created",
      recipient: "VIP Customers",
      recipient_name: "2 recipients",
      body: "VIP preview starts tonight. Use code VIP20.",
      channel: "sms",
      status: "scheduled",
      cost: 0.1,
      media_urls: null,
      created_at: daysAgo(6),
    },
  ],
  campaigns: [
    {
      id: "campaign_001",
      name: "VIP Weekend Preview",
      body: "VIP preview starts tonight. Use code VIP20.",
      channel: "sms",
      status: "scheduled",
      recipient_count: 2,
      delivered_count: 0,
      failed_count: 0,
      scheduled_at: new Date(Date.now() + 2 * DAY_MS).toISOString(),
      sent_at: null,
      created_at: daysAgo(6),
      updated_at: daysAgo(6),
    },
    {
      id: "campaign_002",
      name: "Trial Onboarding",
      body: "Welcome to MXT. Reply HELP for setup support.",
      channel: "sms",
      status: "completed",
      recipient_count: 1,
      delivered_count: 1,
      failed_count: 0,
      scheduled_at: null,
      sent_at: daysAgo(5),
      created_at: daysAgo(9),
      updated_at: daysAgo(5),
    },
  ],
  templates: [
    {
      id: "template_001",
      name: "Appointment Reminder",
      category: "Reminders",
      body: "Hi {{first_name}}, your appointment is tomorrow at {{time}}. Reply YES to confirm.",
      created_at: daysAgo(60),
      updated_at: daysAgo(8),
    },
    {
      id: "template_002",
      name: "Limited Offer",
      category: "Marketing",
      body: "Hi {{first_name}}, your exclusive offer is ready. Use {{code}} before midnight.",
      created_at: daysAgo(45),
      updated_at: daysAgo(3),
    },
    {
      id: "template_003",
      name: "Delivery Update",
      category: "Transactional",
      body: "Your order is out for delivery today. Track it here: {{tracking_link}}",
      created_at: daysAgo(32),
      updated_at: daysAgo(9),
    },
  ],
  senders: [
    {
      id: "sender_001",
      name: "MXT Brand",
      sender_id: "MXT",
      type: "alpha",
      country: "AU",
      status: "approved",
      created_at: daysAgo(75),
      updated_at: daysAgo(72),
    },
    {
      id: "sender_002",
      name: "Support Line",
      sender_id: "+61400009999",
      type: "number",
      country: "AU",
      status: "approved",
      created_at: daysAgo(65),
      updated_at: daysAgo(60),
    },
    {
      id: "sender_003",
      name: "US Campaigns",
      sender_id: "MXTUS",
      type: "alpha",
      country: "US",
      status: "pending",
      created_at: daysAgo(4),
      updated_at: daysAgo(4),
    },
  ],
  inboxThreads: [
    {
      id: "thread_001",
      contact_name: "Amelia Hart",
      contact_phone: "+61400000101",
      last_message: "Yes, see you then.",
      last_message_at: daysAgo(1),
      unread: true,
      starred: true,
      status: "open",
      created_at: daysAgo(15),
      updated_at: daysAgo(1),
    },
    {
      id: "thread_002",
      contact_name: "Noah Singh",
      contact_phone: "+61400000102",
      last_message: "Can someone help with setup?",
      last_message_at: daysAgo(3),
      unread: false,
      starred: false,
      status: "open",
      created_at: daysAgo(12),
      updated_at: daysAgo(3),
    },
  ],
  inboxMessages: [
    {
      id: "inbox_msg_001",
      thread_id: "thread_001",
      direction: "outbound",
      body: "Your appointment is tomorrow at 3 PM. Reply YES to confirm.",
      sent_at: daysAgo(2),
      created_at: daysAgo(2),
    },
    {
      id: "inbox_msg_002",
      thread_id: "thread_001",
      direction: "inbound",
      body: "Yes, see you then.",
      sent_at: daysAgo(1),
      created_at: daysAgo(1),
    },
    {
      id: "inbox_msg_003",
      thread_id: "thread_002",
      direction: "inbound",
      body: "Can someone help with setup?",
      sent_at: daysAgo(3),
      created_at: daysAgo(3),
    },
  ],
  invoices: [
    {
      id: "invoice_001",
      invoice_number: "INV-2026-001",
      description: "Messaging credits",
      amount: 100,
      status: "paid",
      issued_at: daysAgo(31),
    },
    {
      id: "invoice_002",
      invoice_number: "INV-2026-002",
      description: "Monthly platform usage",
      amount: 49,
      status: "pending",
      issued_at: daysAgo(4),
    },
  ],
  integrationLogs: [
    {
      id: "log_001",
      integration: "hubspot",
      action: "sync_two_way",
      status: "success",
      success_count: 18,
      failed_count: 0,
      created_at: daysAgo(1),
    },
    {
      id: "log_002",
      integration: "hubspot",
      action: "sync_from_hubspot",
      status: "success",
      success_count: 7,
      failed_count: 0,
      created_at: daysAgo(3),
    },
  ],
};
