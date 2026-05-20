export type MessageChannel = "sms" | "mms" | "whatsapp";
export type DeliveryStatus = "delivered" | "failed" | "pending" | "sent" | "scheduled";
export type CampaignStatus = "draft" | "scheduled" | "completed" | "failed";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  balance: number;
  tier: string;
  messages_used: number;
  messages_limit: number;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  tags: string[] | null;
  opt_out: boolean;
  hubspot_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactList {
  id: string;
  name: string;
  email_keyword: string | null;
  default_sender: string | null;
  is_global: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactListMember {
  id: string;
  list_id: string;
  contact_id: string;
  created_at: string;
}

export interface Message {
  id: string;
  recipient: string;
  body: string;
  channel: MessageChannel;
  sender_id: string;
  status: DeliveryStatus;
  cost: number;
  media_urls: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityLogEntry {
  id: string;
  event_type: string;
  recipient: string;
  recipient_name: string | null;
  body: string | null;
  channel: MessageChannel;
  status: DeliveryStatus | CampaignStatus;
  cost: number;
  media_urls: string[] | null;
  created_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  body: string | null;
  channel: MessageChannel;
  status: CampaignStatus;
  recipient_count: number;
  delivered_count: number;
  failed_count: number;
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  name: string;
  body: string;
  category: string | null;
  created_at: string;
  updated_at: string;
}

export interface Sender {
  id: string;
  name: string;
  sender_id: string;
  type: string;
  country: string;
  status: "approved" | "pending" | "rejected";
  created_at: string;
  updated_at: string;
}

export interface InboxThread {
  id: string;
  contact_name: string;
  contact_phone: string;
  last_message: string | null;
  last_message_at: string | null;
  unread: boolean;
  starred: boolean;
  status: "open" | "closed";
  created_at: string;
  updated_at: string;
}

export interface InboxMessage {
  id: string;
  thread_id: string;
  direction: "inbound" | "outbound";
  body: string;
  sent_at: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  description: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  issued_at: string;
}

export interface IntegrationLog {
  id: string;
  integration: string;
  action: string;
  status: "success" | "failed" | "running";
  success_count: number;
  failed_count: number;
  created_at: string;
}

