import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { campaignService } from "@/services/campaignService";
import { queryKeys } from "@/constants/queryKeys";
import { usePageTitle } from "@/hooks/use-page-title";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Search, Plus, Filter, Megaphone } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn, formatStatus } from "@/lib/utils";
import AICampaignPlannerDialog from "@/features/ai/components/AICampaignPlannerDialog";
import AIButton from "@/features/ai/components/AIButton";

const CAMPAIGN_STATUSES = ["draft", "scheduled", "completed"];

export default function CampaignsPage() {
  usePageTitle("Campaigns");
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [page, setPage] = useState(0);
  const [aiPlanOpen, setAiPlanOpen] = useState(false);
  const perPage = 20;

  const { data: campaigns, isLoading } = useQuery({ queryKey: queryKeys.campaigns, queryFn: campaignService.listCampaigns });

  const filtered = campaigns?.filter((c: any) => { if (statusFilter.length && !statusFilter.includes(c.status)) return false; if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false; return true; });
  const paged = filtered?.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil((filtered?.length ?? 0) / perPage);
  const toggleStatus = (val: string) => { setStatusFilter(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]); setPage(0); };
  const statusColor = (s: string) => { switch (s) { case "completed": return "bg-success/10 text-success border-success/20"; case "scheduled": return "bg-warning/10 text-warning border-warning/20"; case "draft": return "bg-muted text-muted-foreground"; default: return ""; } };
  const formatTime = (d: string | null) => { if (!d) return "—"; const date = new Date(d); if (Date.now() - date.getTime() < 86400000) return formatDistanceToNow(date, { addSuffix: true }); return format(date, "MMM d, yyyy"); };

  return (
    <div className="space-y-4 animate-ios-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground text-[13px]">{filtered?.length ?? 0} campaigns</p>
        </div>
        <div className="flex items-center gap-2">
          <AIButton onClick={() => setAiPlanOpen(true)}>Plan with AI</AIButton>
          <Button onClick={() => navigate("/campaigns/new")} className="bg-primary hover:bg-primary/90 rounded-xl ios-press shadow-sm">
            <Plus className="mr-2 h-4 w-4" /> New Campaign
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2"><div className="relative flex-1 max-w-xs"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search campaigns..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-8 h-9 text-[13px] bg-accent/30 rounded-xl border-border/30" /></div><div className="flex items-center gap-1"><Filter className="h-3.5 w-3.5 text-muted-foreground mr-1" />{CAMPAIGN_STATUSES.map(st => <button key={st} onClick={() => toggleStatus(st)} className={`px-2.5 py-1 text-[11px] rounded-full font-medium transition-all duration-300 ease-ios capitalize ios-press ${statusFilter.includes(st) ? "bg-primary text-primary-foreground shadow-sm" : "bg-accent/60 text-muted-foreground"}`}>{st}</button>)}</div></div>

      <div className="glass rounded-2xl border border-border/30 overflow-hidden">
        {isLoading ? <div className="p-4 space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}</div> : (
          <Table><TableHeader><TableRow className="bg-accent/30"><TableHead>Campaign</TableHead><TableHead className="w-24">Status</TableHead><TableHead className="w-28">Date</TableHead><TableHead className="w-24 text-right">Recipients</TableHead><TableHead className="w-24 text-right">Delivered</TableHead><TableHead className="w-24 text-right">Failed</TableHead></TableRow></TableHeader>
          <TableBody>{paged?.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-12"><div className="space-y-2"><Megaphone className="h-10 w-10 mx-auto text-muted-foreground/20" /><p className="text-muted-foreground text-[13px]">No campaigns found</p></div></TableCell></TableRow> : paged?.map((c: any) => {
            const deliveredPct = c.recipient_count > 0 ? Math.round((c.delivered_count / c.recipient_count) * 100) : 0;
            const failedPct = c.recipient_count > 0 ? Math.round((c.failed_count / c.recipient_count) * 100) : 0;
            return (<TableRow key={c.id} className="hover:bg-accent/30 transition-all duration-300 ease-ios cursor-pointer ios-press" onClick={() => setSelectedCampaign(c)}><TableCell><div><p className="text-[13px] font-medium">{c.name}</p><p className="text-[11px] text-muted-foreground capitalize">{c.channel}</p></div></TableCell><TableCell><Badge variant="outline" className={cn("text-[10px] rounded-lg", statusColor(c.status))}>{formatStatus(c.status)}</Badge></TableCell><TableCell className="text-[11px] text-muted-foreground">{formatTime(c.sent_at || c.scheduled_at || c.created_at)}</TableCell><TableCell className="text-right font-mono text-[13px]">{c.recipient_count.toLocaleString()}</TableCell><TableCell className="text-right text-[13px]"><span className="text-success font-mono">{deliveredPct}%</span></TableCell><TableCell className="text-right text-[13px]"><span className="text-destructive font-mono">{failedPct}%</span></TableCell></TableRow>);
          })}</TableBody></Table>)}
      </div>

      {totalPages > 1 && <div className="flex items-center justify-between"><p className="text-[11px] text-muted-foreground">Page {page + 1} of {totalPages}</p><div className="flex gap-1"><Button variant="outline" size="sm" className="rounded-xl ios-press" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button><Button variant="outline" size="sm" className="rounded-xl ios-press" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Next</Button></div></div>}

      <Sheet open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)}><SheetContent className="w-[400px] sm:w-[480px]"><SheetHeader><SheetTitle>{selectedCampaign?.name}</SheetTitle></SheetHeader>
        {selectedCampaign && <div className="space-y-5 mt-4">
          <div className="flex items-center gap-3"><Badge variant="outline" className={cn("rounded-lg", statusColor(selectedCampaign.status))}>{formatStatus(selectedCampaign.status)}</Badge><span className="text-[11px] text-muted-foreground capitalize">{selectedCampaign.channel}</span></div>
          <div className="grid grid-cols-3 gap-3">{[{ label: "Recipients", value: selectedCampaign.recipient_count.toLocaleString() }, { label: "Delivered", value: selectedCampaign.delivered_count.toLocaleString(), color: "text-success" }, { label: "Failed", value: selectedCampaign.failed_count.toLocaleString(), color: "text-destructive" }].map(s => <div key={s.label} className="bg-accent/30 rounded-2xl p-3 text-center"><p className="text-[11px] text-muted-foreground">{s.label}</p><p className={cn("text-lg font-bold", s.color)}>{s.value}</p></div>)}</div>
          {selectedCampaign.recipient_count > 0 && <div className="space-y-2"><div className="flex justify-between text-[11px] text-muted-foreground"><span>Delivery Progress</span><span>{Math.round((selectedCampaign.delivered_count / selectedCampaign.recipient_count) * 100)}%</span></div><Progress value={(selectedCampaign.delivered_count / selectedCampaign.recipient_count) * 100} className="h-2 rounded-full" /></div>}
          {selectedCampaign.body && <div className="bg-accent/30 rounded-2xl p-4 space-y-2"><h4 className="text-[11px] font-semibold uppercase text-muted-foreground">Message</h4><p className="text-[13px]">{selectedCampaign.body}</p></div>}
        </div>}
      </SheetContent></Sheet>

      <AICampaignPlannerDialog
        open={aiPlanOpen}
        onOpenChange={setAiPlanOpen}
        onApply={(plan) => navigate("/campaigns/new", { state: { aiPlan: plan } })}
      />
    </div>
  );
}
