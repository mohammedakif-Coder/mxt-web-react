import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { senderService } from "@/services/senderService";
import { usePageTitle } from "@/hooks/use-page-title";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Plus, Radio, ChevronRight, ChevronLeft, Check, Search } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn, formatStatus } from "@/lib/utils";

const COUNTRIES = [{ code: "AU", name: "Australia", flag: "🇦🇺" }, { code: "US", name: "United States", flag: "🇺🇸" }, { code: "GB", name: "United Kingdom", flag: "🇬🇧" }, { code: "NZ", name: "New Zealand", flag: "🇳🇿" }, { code: "SG", name: "Singapore", flag: "🇸🇬" }];

export default function SendersPage() {
  usePageTitle("Senders");
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [detailSender, setDetailSender] = useState<any>(null);
  const [form, setForm] = useState({ name: "", sender_id: "", type: "alpha", countries: [] as string[] });

  const { data: senders, isLoading } = useQuery({ queryKey: queryKeys.sendersAll, queryFn: senderService.listSenders });
  const createMutation = useMutation({ mutationFn: async () => { const countries = form.countries.length ? form.countries : ["AU"]; await senderService.registerSender(countries.map((country) => ({ name: form.name, sender_id: form.sender_id, type: form.type, country }))); }, onSuccess: () => { toast.success("Sender ID registration submitted"); queryClient.invalidateQueries({ queryKey: queryKeys.sendersAll }); queryClient.invalidateQueries({ queryKey: queryKeys.sendersApproved }); setDrawerOpen(false); resetForm(); }, onError: (err: any) => toast.error(err.message) });

  const resetForm = () => { setForm({ name: "", sender_id: "", type: "alpha", countries: [] }); setStep(0); };
  const toggleCountry = (code: string) => setForm(prev => ({ ...prev, countries: prev.countries.includes(code) ? prev.countries.filter(c => c !== code) : [...prev.countries, code] }));
  const statusColor = (s: string) => { switch (s) { case "approved": return "bg-success/10 text-success border-success/20"; case "pending": return "bg-warning/10 text-warning border-warning/20"; case "rejected": return "bg-destructive/10 text-destructive border-destructive/20"; default: return ""; } };
  const countryFlag = (code: string) => COUNTRIES.find(c => c.code === code)?.flag || "🌐";
  const filtered = senders?.filter((s: any) => s.name.toLowerCase().includes(search.toLowerCase()) || s.sender_id.toLowerCase().includes(search.toLowerCase()));
  const steps = ["Enter Details", "Select Countries", "Review & Submit"];

  return (
    <div className="space-y-4 animate-ios-fade-in">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold">Senders</h1><p className="text-muted-foreground text-[13px]">{senders?.length ?? 0} sender IDs</p></div><Button onClick={() => { resetForm(); setDrawerOpen(true); }} className="bg-primary hover:bg-primary/90 rounded-xl ios-press shadow-sm"><Plus className="mr-2 h-4 w-4" /> Register Sender ID</Button></div>
      <div className="relative max-w-xs"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search senders..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9 text-[13px] bg-accent/30 rounded-xl border-border/30" /></div>

      <div className="glass rounded-2xl border border-border/30 overflow-hidden">
        {isLoading ? <div className="p-4 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}</div> : (
          <Table><TableHeader><TableRow className="bg-accent/30"><TableHead>Name</TableHead><TableHead>Sender ID</TableHead><TableHead>Type</TableHead><TableHead>Country</TableHead><TableHead>Status</TableHead><TableHead className="w-28">Created</TableHead></TableRow></TableHeader>
          <TableBody>{filtered?.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-12"><Radio className="h-10 w-10 mx-auto text-muted-foreground/20" /><p className="text-muted-foreground text-[13px]">No senders registered</p></TableCell></TableRow> : filtered?.map((s: any) => (
            <TableRow key={s.id} className="hover:bg-accent/30 transition-all duration-300 ease-ios cursor-pointer ios-press" onClick={() => setDetailSender(s)}><TableCell className="font-medium text-[13px]">{s.name}</TableCell><TableCell className="text-[13px] font-mono text-muted-foreground">{s.sender_id}</TableCell><TableCell><Badge variant="secondary" className="text-[10px] capitalize rounded-lg">{s.type}</Badge></TableCell><TableCell><span className="text-[13px]">{countryFlag(s.country)} {s.country}</span></TableCell><TableCell><Badge variant="outline" className={cn("text-[10px] rounded-lg", statusColor(s.status))}>{formatStatus(s.status)}</Badge></TableCell><TableCell className="text-[11px] text-muted-foreground">{format(new Date(s.created_at), "MMM d, yyyy")}</TableCell></TableRow>))}</TableBody></Table>)}
      </div>

      <Sheet open={drawerOpen} onOpenChange={open => { setDrawerOpen(open); if (!open) resetForm(); }}><SheetContent className="w-[440px]"><SheetHeader><SheetTitle>Register Sender ID</SheetTitle></SheetHeader>
        <div className="flex items-center gap-2 mt-4 mb-6">{steps.map((s, i) => <div key={i} className="flex items-center gap-2 flex-1"><div className={cn("h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-semibold border-2 transition-all duration-300 ease-ios", i < step ? "bg-success text-success-foreground border-success" : i === step ? "bg-primary text-primary-foreground border-primary" : "bg-accent text-muted-foreground border-border/30")}>{i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}</div>{i < steps.length - 1 && <div className={cn("flex-1 h-0.5 rounded-full transition-colors duration-300", i < step ? "bg-success" : "bg-border/30")} />}</div>)}</div>
        <p className="text-[13px] font-medium mb-4">{steps[step]}</p>
        {step === 0 && <div className="space-y-4"><div className="space-y-2"><Label className="text-[13px]">Display Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. AcmeCorp" className="rounded-xl border-border/30" /></div><div className="space-y-2"><Label className="text-[13px]">Sender ID / Number *</Label><Input value={form.sender_id} onChange={e => setForm({ ...form, sender_id: e.target.value })} placeholder="e.g. ACME or +61400000000" className="font-mono rounded-xl border-border/30" /></div><div className="space-y-2"><Label className="text-[13px]">Type</Label><Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}><SelectTrigger className="rounded-xl border-border/30"><SelectValue /></SelectTrigger><SelectContent className="rounded-xl"><SelectItem value="alpha">Sender ID (Alpha)</SelectItem><SelectItem value="number">Virtual Number</SelectItem></SelectContent></Select></div></div>}
        {step === 1 && <div className="space-y-3"><p className="text-[11px] text-muted-foreground">Select countries for registration.</p>{COUNTRIES.map(c => <button key={c.code} onClick={() => toggleCountry(c.code)} className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-300 ease-ios text-left ios-press", form.countries.includes(c.code) ? "border-primary bg-primary/5 shadow-sm" : "border-border/30 hover:bg-accent/40")}><span className="text-lg">{c.flag}</span><span className="text-[13px] font-medium flex-1">{c.name}</span>{form.countries.includes(c.code) && <Check className="h-4 w-4 text-primary" />}</button>)}</div>}
        {step === 2 && <div className="space-y-4"><div className="bg-accent/30 rounded-2xl p-4 space-y-3"><div className="flex justify-between text-[13px]"><span className="text-muted-foreground">Name</span><span className="font-medium">{form.name}</span></div><div className="flex justify-between text-[13px]"><span className="text-muted-foreground">Sender ID</span><span className="font-mono">{form.sender_id}</span></div><div className="flex justify-between text-[13px]"><span className="text-muted-foreground">Type</span><span className="capitalize">{form.type}</span></div><div className="flex justify-between text-[13px]"><span className="text-muted-foreground">Countries</span><span>{form.countries.map(c => COUNTRIES.find(co => co.code === c)?.flag).join(" ") || "🇦🇺 (default)"}</span></div></div><p className="text-[11px] text-muted-foreground">Registration typically takes 1–3 business days.</p></div>}
        <SheetFooter className="mt-6">{step > 0 && <Button variant="outline" onClick={() => setStep(step - 1)} className="rounded-xl ios-press"><ChevronLeft className="h-4 w-4 mr-1" /> Back</Button>}{step < 2 ? <Button onClick={() => setStep(step + 1)} disabled={step === 0 && (!form.name || !form.sender_id)} className="bg-primary hover:bg-primary/90 rounded-xl ios-press">Next <ChevronRight className="h-4 w-4 ml-1" /></Button> : <Button onClick={() => createMutation.mutate()} className="bg-primary hover:bg-primary/90 rounded-xl ios-press">Submit Registration</Button>}</SheetFooter>
      </SheetContent></Sheet>

      <Sheet open={!!detailSender} onOpenChange={() => setDetailSender(null)}><SheetContent className="w-[400px]"><SheetHeader><SheetTitle>{detailSender?.name}</SheetTitle></SheetHeader>{detailSender && <div className="space-y-5 mt-4"><div className="flex items-center gap-3"><span className="text-2xl">{countryFlag(detailSender.country)}</span><div><p className="font-semibold text-[13px]">{detailSender.name}</p><p className="text-[11px] text-muted-foreground font-mono">{detailSender.sender_id}</p></div><Badge variant="outline" className={cn("ml-auto rounded-lg", statusColor(detailSender.status))}>{formatStatus(detailSender.status)}</Badge></div><div className="space-y-2 text-[13px]"><div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="capitalize">{detailSender.type}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Country</span><span>{detailSender.country}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Registered</span><span>{format(new Date(detailSender.created_at), "MMM d, yyyy")}</span></div></div></div>}</SheetContent></Sheet>
    </div>
  );
}
