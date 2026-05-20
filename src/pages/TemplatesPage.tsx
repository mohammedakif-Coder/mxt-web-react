import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { templateService } from "@/services/templateService";
import { usePageTitle } from "@/hooks/use-page-title";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Copy, Edit, Trash2, FileText, Hash, Search, Sparkles, Wand2, FlaskConical, Loader2, Check } from "lucide-react";
import AIButton from "@/features/ai/components/AIButton";
import { toast } from "sonner";
import { format } from "date-fns";

export default function TemplatesPage() {
  usePageTitle("Templates");
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<any>(null);
  const [form, setForm] = useState({ name: "", category: "", body: "" });

  // AI: generate-from-use-case dialog state
  const [aiGenOpen, setAiGenOpen] = useState(false);
  const [aiGenForm, setAiGenForm] = useState({ useCase: "", tone: "Friendly", length: "short", includeMergeFields: true, count: 3 });
  const [aiGenResults, setAiGenResults] = useState<Array<{ name: string; category: string; body: string; char_count: number }>>([]);
  const [aiGenSavingIdx, setAiGenSavingIdx] = useState<number | null>(null);

  // AI: A/B variants dialog state
  const [aiVarOpen, setAiVarOpen] = useState(false);
  const [aiVarSourceTemplate, setAiVarSourceTemplate] = useState<any>(null);
  const [aiVarResults, setAiVarResults] = useState<Array<{ label: string; body: string; rationale: string }>>([]);
  const [aiVarSavingIdx, setAiVarSavingIdx] = useState<number | null>(null);

  const { data: templates, isLoading } = useQuery({ queryKey: queryKeys.templates, queryFn: templateService.listTemplates });

  const upsertMutation = useMutation({ mutationFn: async () => { const payload = { name: form.name, body: form.body, category: form.category || null }; await templateService.upsertTemplate(payload, editTemplate?.id); }, onSuccess: () => { toast.success(editTemplate ? "Template updated" : "Template created"); queryClient.invalidateQueries({ queryKey: queryKeys.templates }); setDrawerOpen(false); resetForm(); }, onError: (err: any) => toast.error(err.message) });
  const deleteMutation = useMutation({ mutationFn: templateService.deleteTemplate, onSuccess: () => { toast.success("Template deleted"); queryClient.invalidateQueries({ queryKey: queryKeys.templates }); } });

  // AI: generate templates from a use case
  const aiGenerateMutation = useMutation({
    mutationFn: async () => {
      return templateService.generateTemplates(aiGenForm);
    },
    onSuccess: (data) => {
      setAiGenResults(data.templates ?? []);
      if (!data.templates?.length) toast.info("AI returned no templates — try rephrasing your use case.");
    },
    onError: (err: any) => toast.error("Couldn't generate templates", { description: err.message }),
  });

  const aiVariantsMutation = useMutation({
    mutationFn: async (sourceBody: string) => {
      return templateService.generateVariants(sourceBody);
    },
    onSuccess: (data) => {
      setAiVarResults(data.variants ?? []);
      if (!data.variants?.length) toast.info("AI returned no variants — try a longer source body.");
    },
    onError: (err: any) => toast.error("Couldn't create variants", { description: err.message }),
  });

  const saveGeneratedTemplate = async (idx: number) => {
    const t = aiGenResults[idx];
    if (!t) return;
    setAiGenSavingIdx(idx);
    try {
      await templateService.upsertTemplate({ name: t.name, body: t.body, category: t.category || null });
      toast.success("Template saved");
      queryClient.invalidateQueries({ queryKey: queryKeys.templates });
      setAiGenResults((prev) => prev.filter((_, i) => i !== idx));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save template");
    } finally {
      setAiGenSavingIdx(null);
    }
  };

  const saveVariantTemplate = async (idx: number) => {
    const v = aiVarResults[idx];
    if (!v || !aiVarSourceTemplate) return;
    setAiVarSavingIdx(idx);
    const error: Error | null = null;
    await templateService.upsertTemplate({
      name: `${aiVarSourceTemplate.name} — ${v.label}`,
      body: v.body,
      category: aiVarSourceTemplate.category || null,
    });
    setAiVarSavingIdx(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Variant saved as new template");
    queryClient.invalidateQueries({ queryKey: queryKeys.templates });
    setAiVarResults((prev) => prev.filter((_, i) => i !== idx));
  };

  const openVariants = (t: any) => {
    setAiVarSourceTemplate(t);
    setAiVarResults([]);
    setAiVarOpen(true);
    aiVariantsMutation.mutate(t.body);
  };

  const resetForm = () => { setForm({ name: "", category: "", body: "" }); setEditTemplate(null); };
  const openEdit = (t: any) => { setEditTemplate(t); setForm({ name: t.name, category: t.category ?? "", body: t.body }); setDrawerOpen(true); };
  const duplicate = (t: any) => { setEditTemplate(null); setForm({ name: `${t.name} (Copy)`, category: t.category ?? "", body: t.body }); setDrawerOpen(true); };
  const charCount = form.body.length;
  const segments = Math.max(1, Math.ceil(charCount / 160));
  const filtered = templates?.filter((t: any) => t.name.toLowerCase().includes(search.toLowerCase()) || (t.body || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4 animate-ios-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Templates</h1><p className="text-muted-foreground text-[13px]">{templates?.length ?? 0} templates</p></div>
        <div className="flex items-center gap-2">
          <AIButton onClick={() => { setAiGenResults([]); setAiGenOpen(true); }}>
            Generate with AI
          </AIButton>
          <Button onClick={() => { resetForm(); setDrawerOpen(true); }} className="bg-primary hover:bg-primary/90 rounded-xl ios-press shadow-sm"><Plus className="mr-2 h-4 w-4" /> New Template</Button>
        </div>
      </div>
      <div className="relative max-w-xs"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search templates..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9 text-[13px] bg-accent/30 rounded-xl border-border/30" /></div>

      {isLoading ? <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}</div> : filtered?.length === 0 ? <div className="text-center py-16 space-y-2"><FileText className="h-12 w-12 mx-auto text-muted-foreground/20" /><p className="text-muted-foreground text-[13px] font-medium">No templates yet</p></div> : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{filtered?.map((t: any) => {
          const fields = t.body.match(/\{\{(\w+)\}\}/g) || [];
          return (
            <Card key={t.id} className="glass rounded-2xl border-border/30 hover:shadow-md transition-all duration-300 ease-ios group ios-press">
              <CardHeader className="pb-2"><div className="flex items-start justify-between"><CardTitle className="text-[13px]">{t.name}</CardTitle>{t.category && <Badge variant="secondary" className="text-[10px] rounded-lg">{t.category}</Badge>}</div></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-[11px] text-muted-foreground line-clamp-3">{t.body}</p>
                <div className="flex items-center gap-2 flex-wrap">{fields.map((f: string, i: number) => <Badge key={i} variant="outline" className="text-[10px] gap-1 rounded-lg border-border/30"><Hash className="h-2.5 w-2.5" />{f.replace(/\{\{|\}\}/g, "")}</Badge>)}</div>
                <div className="flex items-center justify-between pt-1">
                  <p className="text-[10px] text-muted-foreground">Modified {format(new Date(t.updated_at), "MMM d")}</p>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg ios-press text-primary" title="Create A/B variants" onClick={e => { e.stopPropagation(); openVariants(t); }}><FlaskConical className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg ios-press" onClick={e => { e.stopPropagation(); openEdit(t); }}><Edit className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg ios-press" onClick={e => { e.stopPropagation(); duplicate(t); }}><Copy className="h-3.5 w-3.5" /></Button>
                    <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-destructive ios-press" onClick={e => e.stopPropagation()}><Trash2 className="h-3.5 w-3.5" /></Button></AlertDialogTrigger><AlertDialogContent className="rounded-2xl"><AlertDialogHeader><AlertDialogTitle>Delete "{t.name}"?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteMutation.mutate(t.id)} className="rounded-xl">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}</div>)}

      <Sheet open={drawerOpen} onOpenChange={open => { setDrawerOpen(open); if (!open) resetForm(); }}><SheetContent className="w-[440px]"><SheetHeader><SheetTitle>{editTemplate ? "Edit Template" : "New Template"}</SheetTitle></SheetHeader><div className="space-y-4 mt-4"><div className="space-y-2"><Label className="text-[13px]">Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="rounded-xl border-border/30" /></div><div className="space-y-2"><Label className="text-[13px]">Category</Label><Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. Marketing, Alerts" className="rounded-xl border-border/30" /></div><div className="space-y-2"><div className="flex items-center justify-between"><Label className="text-[13px]">Message Body *</Label><div className="flex gap-2 text-[10px] text-muted-foreground"><span>{charCount} chars</span><span>{segments} segment{segments > 1 ? "s" : ""}</span></div></div><Textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} placeholder="Type your message... Use {{field_name}} for merge fields" className="min-h-[120px] text-[13px] rounded-xl border-border/30" /><div className="flex gap-1">{["first_name", "last_name", "company"].map(field => <Button key={field} variant="outline" size="sm" className="text-[10px] h-6 px-2 rounded-lg border-border/30 ios-press" onClick={() => setForm({ ...form, body: form.body + `{{${field}}}` })}><Hash className="h-2.5 w-2.5 mr-0.5" />{field}</Button>)}</div></div></div><SheetFooter className="mt-6"><Button variant="outline" onClick={() => { setDrawerOpen(false); resetForm(); }} className="rounded-xl">Cancel</Button><Button onClick={() => upsertMutation.mutate()} disabled={!form.name || !form.body} className="bg-primary hover:bg-primary/90 rounded-xl ios-press">{editTemplate ? "Save" : "Create"}</Button></SheetFooter></SheetContent></Sheet>

      {/* AI: Generate templates dialog */}
      <Dialog open={aiGenOpen} onOpenChange={(o) => { setAiGenOpen(o); if (!o) setAiGenResults([]); }}>
        <DialogContent className="rounded-2xl max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Wand2 className="h-4 w-4 text-primary" /> Generate templates with AI</DialogTitle>
            <DialogDescription className="text-[12px]">Describe your use case in plain English. AI will draft ready-to-save templates with merge fields.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[12px]">Use case <span className="text-destructive">*</span></Label>
              <Textarea
                value={aiGenForm.useCase}
                onChange={(e) => setAiGenForm({ ...aiGenForm, useCase: e.target.value })}
                placeholder="e.g. Appointment reminders for a dental clinic 24h before the booking"
                className="min-h-[80px] rounded-xl border-border/30 text-[13px]"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[12px]">Tone</Label>
                <Select value={aiGenForm.tone} onValueChange={(v) => setAiGenForm({ ...aiGenForm, tone: v })}>
                  <SelectTrigger className="h-9 rounded-xl border-border/30 text-[12px]"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">{["Friendly", "Professional", "Casual", "Urgent"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px]">Length</Label>
                <Select value={aiGenForm.length} onValueChange={(v) => setAiGenForm({ ...aiGenForm, length: v })}>
                  <SelectTrigger className="h-9 rounded-xl border-border/30 text-[12px]"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="short">Short (1 SMS)</SelectItem>
                    <SelectItem value="medium">Medium (1-2)</SelectItem>
                    <SelectItem value="long">Long (up to 3)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px]">How many?</Label>
                <Select value={String(aiGenForm.count)} onValueChange={(v) => setAiGenForm({ ...aiGenForm, count: Number(v) })}>
                  <SelectTrigger className="h-9 rounded-xl border-border/30 text-[12px]"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">{[2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n} templates</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input id="ai-merge" type="checkbox" checked={aiGenForm.includeMergeFields} onChange={(e) => setAiGenForm({ ...aiGenForm, includeMergeFields: e.target.checked })} className="rounded" />
              <Label htmlFor="ai-merge" className="text-[12px] cursor-pointer">Use {`{{merge_fields}}`} where natural</Label>
            </div>

            {aiGenResults.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border/30">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Suggestions ({aiGenResults.length})</p>
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {aiGenResults.map((t, i) => (
                    <div key={i} className="bg-accent/30 rounded-xl p-3 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[13px] font-semibold">{t.name}</p>
                        {t.category && <Badge variant="secondary" className="text-[10px] rounded-lg">{t.category}</Badge>}
                      </div>
                      <p className="text-[12px] whitespace-pre-wrap">{t.body}</p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-muted-foreground">{t.body.length} chars · {Math.max(1, Math.ceil(t.body.length / 160))} segment{Math.ceil(t.body.length / 160) > 1 ? "s" : ""}</span>
                        <Button size="sm" onClick={() => saveGeneratedTemplate(i)} disabled={aiGenSavingIdx === i} className="h-7 rounded-lg bg-primary hover:bg-primary/90 text-[11px] ios-press">
                          {aiGenSavingIdx === i ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Check className="h-3 w-3 mr-1" /> Save</>}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAiGenOpen(false)} className="rounded-xl">Close</Button>
            <Button
              onClick={() => aiGenerateMutation.mutate()}
              disabled={!aiGenForm.useCase.trim() || aiGenerateMutation.isPending}
              className="bg-primary hover:bg-primary/90 rounded-xl ios-press gap-1.5"
            >
              {aiGenerateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {aiGenResults.length ? "Regenerate" : "Generate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI: A/B variants dialog */}
      <Dialog open={aiVarOpen} onOpenChange={(o) => { setAiVarOpen(o); if (!o) { setAiVarResults([]); setAiVarSourceTemplate(null); } }}>
        <DialogContent className="rounded-2xl max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FlaskConical className="h-4 w-4 text-primary" /> A/B Variants</DialogTitle>
            <DialogDescription className="text-[12px]">
              Variants of <span className="font-medium text-foreground">"{aiVarSourceTemplate?.name}"</span> exploring different angles.
            </DialogDescription>
          </DialogHeader>
          {aiVarSourceTemplate && (
            <div className="bg-muted/40 rounded-xl p-2.5 mb-1">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">Original</p>
              <p className="text-[12px] whitespace-pre-wrap">{aiVarSourceTemplate.body}</p>
            </div>
          )}
          {aiVariantsMutation.isPending ? (
            <div className="py-6 flex flex-col items-center gap-2"><Loader2 className="h-5 w-5 animate-spin text-primary" /><p className="text-[12px] text-muted-foreground">Drafting variants…</p></div>
          ) : aiVarResults.length === 0 ? (
            <p className="text-[12px] text-muted-foreground py-4 text-center">No variants yet.</p>
          ) : (
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {aiVarResults.map((v, i) => (
                <div key={i} className="bg-accent/30 rounded-xl p-3 space-y-1.5">
                  <p className="text-[12px] font-semibold text-primary">{v.label}</p>
                  <p className="text-[12px] whitespace-pre-wrap">{v.body}</p>
                  <p className="text-[11px] text-muted-foreground italic">Why: {v.rationale}</p>
                  <div className="flex justify-end pt-1">
                    <Button size="sm" onClick={() => saveVariantTemplate(i)} disabled={aiVarSavingIdx === i} className="h-7 rounded-lg bg-primary hover:bg-primary/90 text-[11px] ios-press">
                      {aiVarSavingIdx === i ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Check className="h-3 w-3 mr-1" /> Save as new template</>}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAiVarOpen(false)} className="rounded-xl">Close</Button>
            <Button
              onClick={() => aiVarSourceTemplate && aiVariantsMutation.mutate(aiVarSourceTemplate.body)}
              disabled={aiVariantsMutation.isPending || !aiVarSourceTemplate}
              className="bg-primary hover:bg-primary/90 rounded-xl ios-press gap-1.5"
            >
              {aiVariantsMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Regenerate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
