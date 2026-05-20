import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { activityService } from "@/services/activityService";
import { queryKeys } from "@/constants/queryKeys";
import { usePageTitle } from "@/hooks/use-page-title";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Download, X, CalendarIcon, Smartphone, MessageSquare, Clock, Check } from "lucide-react";
import { format, formatDistanceToNow, isWithinInterval } from "date-fns";
import { cn, formatStatus } from "@/lib/utils";

const CHANNELS = ["sms", "whatsapp"];
const STATUSES = ["delivered", "failed", "pending", "opted-out"];

export default function ActivityPage() {
  usePageTitle("Activity");
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [page, setPage] = useState(0);
  const perPage = 25;

  const { data: entries, isLoading } = useQuery({ queryKey: queryKeys.activityLog, queryFn: activityService.listActivity });

  const filtered = entries?.filter((e: any) => {
    if (channelFilter.length && !channelFilter.includes(e.channel)) return false;
    if (statusFilter.length && !statusFilter.includes(e.status)) return false;
    if (search) { const s = search.toLowerCase(); if (!(e.recipient_name || "").toLowerCase().includes(s) && !e.recipient.includes(s) && !(e.body || "").toLowerCase().includes(s)) return false; }
    if (dateRange.from && dateRange.to) { if (!isWithinInterval(new Date(e.created_at), { start: dateRange.from, end: dateRange.to })) return false; }
    return true;
  });

  const paged = filtered?.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil((filtered?.length ?? 0) / perPage);
  const hasActiveFilters = channelFilter.length > 0 || statusFilter.length > 0 || dateRange.from;
  const clearAll = () => { setChannelFilter([]); setStatusFilter([]); setDateRange({}); setSearch(""); };
  const statusColor = (s: string) => { switch (s) { case "delivered": return "bg-success/10 text-success border-success/20"; case "failed": return "bg-destructive/10 text-destructive border-destructive/20"; case "pending": return "bg-warning/10 text-warning border-warning/20"; default: return ""; } };
  const channelIcon = (ch: string) => ch === "whatsapp" ? <MessageSquare className="h-3.5 w-3.5 text-success" /> : <Smartphone className="h-3.5 w-3.5" />;
  const formatTime = (d: string) => { const date = new Date(d); if (Date.now() - date.getTime() < 86400000) return formatDistanceToNow(date, { addSuffix: true }); return format(date, "MMM d, yyyy h:mm a"); };
  const toggleFilter = (arr: string[], setArr: (v: string[]) => void, val: string) => { setArr(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]); setPage(0); };

  const exportCSV = () => {
    if (!filtered) return;
    const header = "Timestamp,Recipient,Channel,Status,Message,Cost\n";
    const rows = filtered.map((e: any) => `"${e.created_at}","${e.recipient_name ?? e.recipient}","${e.channel}","${e.status}","${(e.body ?? "").replace(/"/g, '""')}","${e.cost}"`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "activity_log.csv"; a.click();
  };

  return (
    <div className="space-y-4 animate-ios-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Activity</h1>
          <p className="text-muted-foreground text-[13px]">{filtered?.length ?? 0} events</p>
        </div>
        <Button variant="outline" onClick={exportCSV} className="rounded-xl border-border/30 ios-press h-9">
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-8 h-9 text-[13px] bg-accent/30 rounded-xl border-border/30"
          />
        </div>

        <FilterGroup label="Channel" options={CHANNELS} selected={channelFilter} onToggle={(v) => toggleFilter(channelFilter, setChannelFilter, v)} />
        <FilterGroup label="Status" options={STATUSES} selected={statusFilter} onToggle={(v) => toggleFilter(statusFilter, setStatusFilter, v)} />

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 text-[12px] rounded-xl border-border/40 bg-card">
              <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
              {dateRange.from ? `${format(dateRange.from, "MMM d")} – ${dateRange.to ? format(dateRange.to, "MMM d") : "…"}` : "Date Range"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 rounded-xl" align="start">
            <Calendar mode="range" selected={dateRange as any} onSelect={(r: any) => { setDateRange(r || {}); setPage(0); }} className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 animate-ios-fade-in">
          {channelFilter.map(ch => (
            <Badge key={ch} variant="secondary" className="gap-1 text-[11px] rounded-lg pl-2 pr-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20">
              {formatStatus(ch)}
              <button onClick={() => toggleFilter(channelFilter, setChannelFilter, ch)} className="hover:bg-primary/20 rounded p-0.5"><X className="h-3 w-3" /></button>
            </Badge>
          ))}
          {statusFilter.map(st => (
            <Badge key={st} variant="secondary" className="gap-1 text-[11px] rounded-lg pl-2 pr-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20">
              {formatStatus(st)}
              <button onClick={() => toggleFilter(statusFilter, setStatusFilter, st)} className="hover:bg-primary/20 rounded p-0.5"><X className="h-3 w-3" /></button>
            </Badge>
          ))}
          <button onClick={clearAll} className="text-[11px] text-primary hover:underline ml-1 font-medium">Clear all</button>
        </div>
      )}

      <div className="glass rounded-2xl border border-border/30 overflow-hidden">
        {isLoading ? <div className="p-4 space-y-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}</div> : (
          <Table><TableHeader><TableRow className="bg-accent/30"><TableHead className="w-[200px]">Time</TableHead><TableHead>Recipient</TableHead><TableHead className="w-16">Channel</TableHead><TableHead>Message</TableHead><TableHead className="w-24">Status</TableHead><TableHead className="w-20 text-right">Cost</TableHead></TableRow></TableHeader>
          <TableBody>{paged?.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-[13px]">No activity found</TableCell></TableRow> : paged?.map((e: any) => (
            <TableRow key={e.id} className="hover:bg-accent/30 transition-all duration-300 ease-ios cursor-pointer ios-press" onClick={() => setSelectedEntry(e)}>
              <TableCell className="py-2.5">
                <div className="text-[12px] text-foreground font-medium leading-tight">{format(new Date(e.created_at), "MMM d, yyyy · h:mm a")}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}</div>
              </TableCell>
              <TableCell><div className="flex items-center gap-2"><div><p className="text-[13px] font-medium">{e.recipient_name ?? "Unknown"}</p><p className="text-[11px] text-muted-foreground font-mono">{e.recipient}</p></div></div></TableCell>
              <TableCell>{channelIcon(e.channel)}</TableCell>
              <TableCell className="max-w-[200px] truncate text-[13px] text-muted-foreground">{e.body}</TableCell>
              <TableCell><Badge variant="outline" className={cn("text-[10px] rounded-lg", statusColor(e.status))}>{formatStatus(e.status)}</Badge></TableCell>
              <TableCell className="text-right text-[13px] font-mono">${Number(e.cost).toFixed(4)}</TableCell>
            </TableRow>))}</TableBody></Table>)}
      </div>

      {totalPages > 1 && <div className="flex items-center justify-between"><p className="text-[11px] text-muted-foreground">Page {page + 1} of {totalPages}</p><div className="flex gap-1"><Button variant="outline" size="sm" className="rounded-xl ios-press" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button><Button variant="outline" size="sm" className="rounded-xl ios-press" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Next</Button></div></div>}

      <Sheet open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}><SheetContent className="w-[400px] sm:w-[480px]"><SheetHeader><SheetTitle>Event Details</SheetTitle></SheetHeader>
        {selectedEntry && <div className="space-y-5 mt-4">
          <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">{channelIcon(selectedEntry.channel)}</div><div><p className="font-semibold text-[13px]">{selectedEntry.recipient_name ?? "Unknown"}</p><p className="text-[11px] text-muted-foreground font-mono">{selectedEntry.recipient}</p></div><Badge variant="outline" className={cn("ml-auto rounded-lg", statusColor(selectedEntry.status))}>{formatStatus(selectedEntry.status)}</Badge></div>
          <div className="bg-accent/30 rounded-2xl p-4 space-y-3"><h4 className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider">Message</h4><p className="text-[13px]">{selectedEntry.body ?? "No message body"}</p></div>
          <div className="space-y-3"><h4 className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider">Delivery Timeline</h4>{[{ label: "Created", time: selectedEntry.created_at, icon: Clock }, { label: "Sent to carrier", time: selectedEntry.created_at, icon: Smartphone }, { label: selectedEntry.status === "delivered" ? "Delivered" : selectedEntry.status === "failed" ? "Failed" : "Pending", time: selectedEntry.created_at, icon: MessageSquare }].map((step, i) => <div key={i} className="flex items-center gap-3 text-[13px]"><div className="h-6 w-6 rounded-lg bg-accent/50 flex items-center justify-center"><step.icon className="h-3 w-3 text-muted-foreground" /></div><span className="flex-1">{step.label}</span><span className="text-[11px] text-muted-foreground">{format(new Date(step.time), "h:mm:ss a")}</span></div>)}</div>
          <div className="bg-accent/30 rounded-2xl p-4 space-y-2"><h4 className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider">Cost</h4><div className="flex items-center justify-between text-[13px] font-semibold"><span>Total</span><span className="font-mono">${Number(selectedEntry.cost).toFixed(4)}</span></div></div>
        </div>}
      </SheetContent></Sheet>
    </div>
  );
}

function FilterGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-1 h-9 px-2 rounded-xl bg-muted/40 border border-border/30">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1.5">{label}</span>
      <div className="flex items-center gap-1">
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              onClick={() => onToggle(opt)}
              className={cn(
                "h-7 px-2.5 inline-flex items-center gap-1 rounded-lg text-[11px] font-medium transition-all duration-200 ease-ios ios-press",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-transparent text-foreground/70 hover:bg-accent hover:text-foreground"
              )}
            >
              {active && <Check className="h-3 w-3" />}
              {opt === "sms" ? "SMS" : opt === "whatsapp" ? "WhatsApp" : opt.charAt(0).toUpperCase() + opt.slice(1)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
