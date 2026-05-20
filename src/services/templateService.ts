import { createId, mockStore, nowIso, resolveMock } from "@/services/mockData";
import type { Template } from "@/types/domain";

export type TemplatePayload = Pick<Template, "name" | "body"> & Partial<Pick<Template, "category">>;

export const templateService = {
  async listTemplates(): Promise<Template[]> {
    // TODO: Replace with GET /templates.
    return resolveMock([...mockStore.templates].sort((a, b) => a.name.localeCompare(b.name)));
  },

  async upsertTemplate(payload: TemplatePayload, id?: string): Promise<Template> {
    const timestamp = nowIso();
    if (id) {
      const index = mockStore.templates.findIndex((template) => template.id === id);
      if (index === -1) throw new Error("Template not found");
      mockStore.templates[index] = {
        ...mockStore.templates[index],
        ...payload,
        category: payload.category ?? null,
        updated_at: timestamp,
      };
      return resolveMock(mockStore.templates[index]);
    }

    const created: Template = {
      id: createId("template"),
      name: payload.name,
      body: payload.body,
      category: payload.category ?? null,
      created_at: timestamp,
      updated_at: timestamp,
    };
    mockStore.templates.push(created);
    return resolveMock(created);
  },

  async deleteTemplate(id: string): Promise<void> {
    mockStore.templates = mockStore.templates.filter((template) => template.id !== id);
    return resolveMock(undefined);
  },

  async generateTemplates(input: {
    useCase: string;
    tone: string;
    length: string;
    includeMergeFields: boolean;
    count: number;
  }): Promise<{ templates: Array<{ name: string; category: string; body: string; char_count: number }> }> {
    // TODO: Replace with POST /ai/templates/generate.
    const merge = input.includeMergeFields ? "Hi {{first_name}}, " : "";
    const templates = Array.from({ length: input.count }).map((_, index) => {
      const body = `${merge}${input.useCase.trim()} - ${input.tone.toLowerCase()} reminder ${index + 1}. Reply STOP to opt out.`;
      return {
        name: `${input.useCase.slice(0, 28) || "Template"} ${index + 1}`,
        category: "AI Draft",
        body,
        char_count: body.length,
      };
    });
    return resolveMock({ templates });
  },

  async generateVariants(body: string): Promise<{ variants: Array<{ label: string; body: string; rationale: string }> }> {
    // TODO: Replace with POST /ai/templates/variants.
    return resolveMock({
      variants: [
        { label: "Direct", body: `${body} Act today.`, rationale: "Adds a clearer action prompt." },
        { label: "Friendly", body: `Friendly reminder: ${body}`, rationale: "Softens the opening for broad audiences." },
        { label: "Urgent", body: `${body} Ends soon.`, rationale: "Creates urgency while keeping the message short." },
      ],
    });
  },
};

