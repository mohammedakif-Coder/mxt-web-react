import { createId, mockStore, nowIso, resolveMock } from "@/services/mockData";
import type { Contact, ContactList, ContactListMember } from "@/types/domain";

export type ContactPayload = Pick<Contact, "full_name" | "phone"> &
  Partial<Pick<Contact, "email" | "opt_out" | "tags">>;

export type ContactListPayload = Pick<ContactList, "name"> &
  Partial<Pick<ContactList, "email_keyword" | "default_sender" | "is_global" | "description">>;

export const contactService = {
  async listContacts(options: { includeOptedOut?: boolean } = {}): Promise<Contact[]> {
    // TODO: Replace with GET /contacts and query parameters.
    const contacts = options.includeOptedOut
      ? mockStore.contacts
      : mockStore.contacts.filter((contact) => !contact.opt_out);
    return resolveMock([...contacts].sort((a, b) => a.full_name.localeCompare(b.full_name)));
  },

  async countContacts(): Promise<number> {
    return resolveMock(mockStore.contacts.length);
  },

  async upsertContact(payload: ContactPayload, id?: string): Promise<Contact> {
    const timestamp = nowIso();
    if (id) {
      const index = mockStore.contacts.findIndex((contact) => contact.id === id);
      if (index === -1) throw new Error("Contact not found");
      mockStore.contacts[index] = {
        ...mockStore.contacts[index],
        ...payload,
        email: payload.email ?? null,
        tags: payload.tags ?? mockStore.contacts[index].tags,
        updated_at: timestamp,
      };
      return resolveMock(mockStore.contacts[index]);
    }

    const created: Contact = {
      id: createId("contact"),
      full_name: payload.full_name,
      phone: payload.phone,
      email: payload.email ?? null,
      tags: payload.tags ?? [],
      opt_out: payload.opt_out ?? false,
      created_at: timestamp,
      updated_at: timestamp,
    };
    mockStore.contacts.push(created);
    return resolveMock(created);
  },

  async deleteContact(id: string): Promise<void> {
    mockStore.contactListMembers = mockStore.contactListMembers.filter((member) => member.contact_id !== id);
    mockStore.contacts = mockStore.contacts.filter((contact) => contact.id !== id);
    return resolveMock(undefined);
  },

  async listContactLists(): Promise<ContactList[]> {
    // TODO: Replace with GET /contact-lists.
    return resolveMock([...mockStore.contactLists].sort((a, b) => a.name.localeCompare(b.name)));
  },

  async upsertContactList(payload: ContactListPayload, id?: string): Promise<ContactList> {
    const timestamp = nowIso();
    if (id) {
      const index = mockStore.contactLists.findIndex((list) => list.id === id);
      if (index === -1) throw new Error("Contact list not found");
      mockStore.contactLists[index] = {
        ...mockStore.contactLists[index],
        ...payload,
        email_keyword: payload.email_keyword ?? null,
        default_sender: payload.default_sender ?? "shared",
        is_global: payload.is_global ?? false,
        description: payload.description ?? null,
        updated_at: timestamp,
      };
      return resolveMock(mockStore.contactLists[index]);
    }

    const created: ContactList = {
      id: createId("list"),
      name: payload.name,
      email_keyword: payload.email_keyword ?? null,
      default_sender: payload.default_sender ?? "shared",
      is_global: payload.is_global ?? false,
      description: payload.description ?? null,
      created_at: timestamp,
      updated_at: timestamp,
    };
    mockStore.contactLists.push(created);
    return resolveMock(created);
  },

  async listMembers(): Promise<ContactListMember[]> {
    return resolveMock(mockStore.contactListMembers);
  },

  async countMembers(listId: string): Promise<number> {
    const count = mockStore.contactListMembers.filter((member) => member.list_id === listId).length;
    return resolveMock(count);
  },

  async addMembers(listId: string, contactIds: string[]): Promise<ContactListMember[]> {
    const existing = new Set(
      mockStore.contactListMembers
        .filter((member) => member.list_id === listId)
        .map((member) => member.contact_id),
    );

    const created = contactIds
      .filter((contactId) => !existing.has(contactId))
      .map((contactId) => ({
        id: createId("member"),
        list_id: listId,
        contact_id: contactId,
        created_at: nowIso(),
      }));

    mockStore.contactListMembers.push(...created);
    return resolveMock(created);
  },

  async removeMember(listId: string, contactId: string): Promise<void> {
    mockStore.contactListMembers = mockStore.contactListMembers.filter(
      (member) => !(member.list_id === listId && member.contact_id === contactId),
    );
    return resolveMock(undefined);
  },

  async syncContactToCrm(_contact: Contact): Promise<void> {
    // TODO: Replace with POST /integrations/hubspot/contact-sync.
    return resolveMock(undefined);
  },
};

