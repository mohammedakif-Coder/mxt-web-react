import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { aiService } from "@/services/aiService";
import { contactService } from "@/services/contactService";
import { messagingService } from "@/services/messagingService";
import { queryKeys } from "@/constants/queryKeys";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Wand2, Lightbulb, Check } from "lucide-react";
import { toast } from "sonner";
import { applySegmentFilter, describeFilter, type SegmentFilter } from "@/lib/segment-filter";
import type { Contact, ContactList, ContactListMember, Message } from "@/types/database";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  contacts: Contact[];
  onApply: (matchedIds: string[], name: string) => void;
}

export function AISegmentDialog({ open, onOpenChange, contacts, onApply }: Props) {
  const [query, setQuery] = useState("");
  const [filterResult, setFilterResult] = useState<{ name: string; description: string; filter: SegmentFilter; confidence: string } | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{ name: string; description: string; why: string; filter: SegmentFilter }>>([]);

  const { data: lists } = useQuery<ContactList[]>({ queryKey: queryKeys.contactLists, queryFn: contactService.listContactLists });
  const { data: members } = useQuery<ContactListMember[]>({ queryKey: queryKeys.contactListMembers, queryFn: contactService.listMembers });
  const { data: messages } = useQuery<Message[]>({ queryKey: ["messages-for-segment"], queryFn: () => messagingService.listMessages() });

  const sample = {
    total_contacts: contacts.length,
    total_lists: lists?.length ?? 0,
    list_names: lists?.slice(0, 20).map((l) => l.name),
    contact_sample: contacts.slice(0, 25).map((c) => ({ full_name: c.full_name, phone: c.phone, email: c.email ?? undefined, tags: c.tags ?? [], opt_out: c.opt_out, created_days_ago: Math.round((Date.now() - new Date(c.created_at).getTime()) / 86400000) })),
  };

  const filterMutation = useMutation({
    mutationFn: async () => {
      return aiService.buildSegment(query);
    },
    onSuccess: (d) => setFilterResult(d),
    onError: (e: Error) => toast.error("Couldn't build segment", { description: e.message }),
  });

  const suggestMutation = useMutation({
    mutationFn: async () => {
      return aiService.suggestSegments();
    },
    onSuccess: (d) => setSuggestions(d.suggestions ?? []),
    onError: (e: Error) => toast.error("Couldn't get suggestions", { description: e.message }),
  });

  const previewCount = (f: SegmentFilter) => applySegmentFilter(contacts, f, { lists, members, messages }).length;

  const apply = (name: string, f: SegmentFilter) => {
    const matched = applySegmentFilter(contacts, f, { lists, members, messages });
    onApply(matched.map((c) => c.id), name);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Wand2 className="h-4 w-4 text-primary" /> AI Segment Builder</DialogTitle>
          <DialogDescription className="text-[12px]">Describe your audience in plain English, or let AI suggest segments from your data.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-[12px]">Describe your segment</Label>
            <div className="flex gap-2">
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder='e.g. "Contacts with no message in 30 days, not opted out"' className="rounded-xl border-border/30 text-[13px]" />
              <Button onClick={() => filterMutation.mutate()} disabled={!query.trim() || filterMutation.isPending} className="rounded-xl ios-press bg-primary hover:bg-primary/90 gap-1.5">
                {filterMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Build
              </Button>
            </div>
          </div>

          {filterResult && (
            <div className="bg-accent/30 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-semibold">{filterResult.name}</p>
                <Badge variant="outline" className="text-[10px] rounded-lg capitalize">{filterResult.confidence} confidence</Badge>
              </div>
              <p className="text-[12px] text-muted-foreground">{filterResult.description}</p>
              <div className="flex flex-wrap gap-1">{describeFilter(filterResult.filter).map((p, i) => <Badge key={i} variant="secondary" className="text-[10px] rounded-lg">{p}</Badge>)}</div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-muted-foreground"><strong className="text-foreground">{previewCount(filterResult.filter)}</strong> contacts match</span>
                <Button size="sm" onClick={() => apply(filterResult.name, filterResult.filter)} className="h-7 rounded-lg bg-primary hover:bg-primary/90 text-[11px] ios-press"><Check className="h-3 w-3 mr-1" /> Apply</Button>
              </div>
            </div>
          )}

          <div className="border-t border-border/30 pt-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1"><Lightbulb className="h-3 w-3" /> Suggested segments</p>
              <Button variant="ghost" size="sm" onClick={() => suggestMutation.mutate()} disabled={suggestMutation.isPending} className="h-7 rounded-lg text-[11px] gap-1">
                {suggestMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} Suggest
              </Button>
            </div>
            {suggestions.length > 0 && (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {suggestions.map((s, i) => (
                  <div key={i} className="bg-accent/30 rounded-xl p-2.5 space-y-1.5">
                    <p className="text-[12px] font-semibold">{s.name}</p>
                    <p className="text-[11px] text-muted-foreground">{s.description}</p>
                    <p className="text-[11px] italic text-primary/80">{s.why}</p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-muted-foreground">{previewCount(s.filter)} match</span>
                      <Button size="sm" onClick={() => apply(s.name, s.filter)} className="h-6 rounded-lg bg-primary hover:bg-primary/90 text-[10px] ios-press">Apply</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
