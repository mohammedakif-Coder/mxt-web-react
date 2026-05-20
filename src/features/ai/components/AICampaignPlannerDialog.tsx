import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { aiService } from "@/services/aiService";
import { contactService } from "@/services/contactService";
import { queryKeys } from "@/constants/queryKeys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, Loader2, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import type { ContactList } from "@/types/database";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (plan: any) => void;
};

export default function AICampaignPlannerDialog({ open, onOpenChange, onApply }: Props) {
  const [planGoal, setPlanGoal] = useState("");
  const [planAudience, setPlanAudience] = useState("");
  const [planOffer, setPlanOffer] = useState("");
  const [planResult, setPlanResult] = useState<any>(null);

  const { data: contactLists } = useQuery<ContactList[]>({
    queryKey: queryKeys.contactLists,
    queryFn: contactService.listContactLists,
  });

  const planMutation = useMutation({
    mutationFn: async () => {
      const available_lists = (contactLists ?? []).map((l) => ({ id: l.id, name: l.name }));
      return aiService.campaignPlan({
        goal: planGoal,
        audience: planAudience,
        offer: planOffer || undefined,
        available_lists,
      });
    },
    onSuccess: (d) => setPlanResult(d),
    onError: (e: Error) => toast.error("Couldn't generate plan", { description: e.message }),
  });

  const handleOpenChange = (o: boolean) => {
    onOpenChange(o);
    if (!o) {
      setPlanResult(null);
    }
  };

  const handleApply = () => {
    if (!planResult) return;
    onApply(planResult);
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-2xl max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-primary" /> AI Campaign Planner
          </DialogTitle>
          <DialogDescription className="text-[12px]">
            Describe your goal and audience — AI will draft the name, copy, recommended list, send time, and follow-ups.
          </DialogDescription>
        </DialogHeader>

        {!planResult ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[12px]">Goal</Label>
              <Input
                value={planGoal}
                onChange={(e) => setPlanGoal(e.target.value)}
                placeholder='e.g. "Drive Black Friday signups"'
                className="rounded-xl border-border/30 text-[13px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px]">Audience</Label>
              <Textarea
                value={planAudience}
                onChange={(e) => setPlanAudience(e.target.value)}
                placeholder={`e.g. "Existing customers who haven't purchased in 60 days"`}
                className="rounded-xl border-border/30 text-[13px] min-h-[70px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px]">Offer (optional)</Label>
              <Input
                value={planOffer}
                onChange={(e) => setPlanOffer(e.target.value)}
                placeholder='e.g. "20% off sitewide, code BLACK20"'
                className="rounded-xl border-border/30 text-[13px]"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <div className="bg-accent/30 rounded-xl p-3 space-y-1.5">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Campaign name</p>
              <p className="text-[14px] font-semibold">{planResult.campaign_name}</p>
            </div>
            <div className="bg-accent/30 rounded-xl p-3 space-y-1.5">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Message</p>
              <p className="text-[13px] whitespace-pre-wrap">{planResult.message_body}</p>
            </div>
            {planResult.recommended_list_id && (
              <div className="bg-accent/30 rounded-xl p-3 space-y-1">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Recommended list</p>
                <p className="text-[13px] font-medium">
                  {contactLists?.find((l) => l.id === planResult.recommended_list_id)?.name ?? "—"}
                </p>
                {planResult.recommended_list_reason && (
                  <p className="text-[11px] text-muted-foreground italic">{planResult.recommended_list_reason}</p>
                )}
              </div>
            )}
            {planResult.send_time && (
              <div className="bg-accent/30 rounded-xl p-3 space-y-1">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Send time</p>
                <p className="text-[13px] font-medium capitalize">
                  {planResult.send_time.mode}
                  {planResult.send_time.local_time_hint ? ` · ${planResult.send_time.local_time_hint}` : ""}
                </p>
                <p className="text-[11px] text-muted-foreground italic">{planResult.send_time.reason}</p>
              </div>
            )}
            {planResult.follow_up_sequence?.length > 0 && (
              <div className="bg-accent/30 rounded-xl p-3 space-y-1.5">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Follow-ups</p>
                {planResult.follow_up_sequence.map((f: any, i: number) => (
                  <div key={i} className="border-l-2 border-primary/40 pl-2 space-y-0.5">
                    <p className="text-[11px] text-muted-foreground">
                      +{f.delay_hours}h · {f.trigger.replace(/_/g, " ")}
                    </p>
                    <p className="text-[12px]">{f.body}</p>
                  </div>
                ))}
              </div>
            )}
            {planResult.predicted_response_rate && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 space-y-1">
                <p className="text-[11px] uppercase tracking-wide text-primary font-semibold">Predicted response rate</p>
                <p className="text-[14px] font-semibold">
                  {planResult.predicted_response_rate.low_pct}% – {planResult.predicted_response_rate.high_pct}%
                </p>
                <p className="text-[11px] text-muted-foreground italic">{planResult.predicted_response_rate.reasoning}</p>
              </div>
            )}
            {planResult.risks?.length > 0 && (
              <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-3 space-y-1">
                <p className="text-[11px] uppercase tracking-wide text-destructive font-semibold">Risks</p>
                <ul className="text-[12px] list-disc pl-4 space-y-0.5">
                  {planResult.risks.map((r: string, i: number) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {!planResult ? (
            <>
              <Button variant="outline" onClick={() => handleOpenChange(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button
                onClick={() => planMutation.mutate()}
                disabled={!planGoal.trim() || !planAudience.trim() || planMutation.isPending}
                className="rounded-xl bg-primary hover:bg-primary/90 ios-press gap-1.5"
              >
                {planMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}{" "}
                Generate Plan
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setPlanResult(null)} className="rounded-xl">
                Regenerate
              </Button>
              <Button onClick={handleApply} className="rounded-xl bg-primary hover:bg-primary/90 ios-press gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Apply to Campaign
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
