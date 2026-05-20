import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { billingService } from "@/services/billingService";
import { queryKeys } from "@/constants/queryKeys";
import { usePageTitle } from "@/hooks/use-page-title";
import { useProfile } from "@/hooks/use-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { DollarSign, CreditCard, Zap, TrendingUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Invoice } from "@/types/database";
import { formatStatus } from "@/lib/utils";

export default function BillingPage() {
  usePageTitle("Billing");
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("50");
  const [processing, setProcessing] = useState(false);
  const { data: invoices } = useQuery<Invoice[]>({ queryKey: queryKeys.invoices, queryFn: billingService.listInvoices });

  const handleTopUp = async () => {
    if (!profile) return;
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount <= 0) { toast.error("Enter a valid amount"); return; }
    setProcessing(true);
    try {
      await billingService.topUpBalance(amount);
      toast.success(`$${amount.toFixed(2)} added to your balance`);
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      setTopUpOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to process top up");
    } finally {
      setProcessing(false);
    }
  };

  const statusColor = (s: string) => { switch (s) { case "paid": return "bg-success/10 text-success border-success/20"; case "pending": return "bg-warning/10 text-warning border-warning/20"; case "overdue": return "bg-destructive/10 text-destructive border-destructive/20"; default: return ""; } };

  return (
    <div className="space-y-6 animate-ios-fade-in">
      <div><h1 className="text-2xl font-bold">Billing</h1><p className="text-[13px] text-muted-foreground">Manage your balance and invoices</p></div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass rounded-2xl border-border/30 ios-press hover:shadow-lg transition-all duration-300 ease-ios"><CardHeader className="pb-2"><CardTitle className="text-[13px] text-muted-foreground flex items-center gap-2"><div className="h-8 w-8 rounded-xl bg-success/10 flex items-center justify-center"><DollarSign className="h-4 w-4 text-success" /></div> Balance</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">${profile ? Number(profile.balance).toFixed(2) : "—"}</div><Button size="sm" className="mt-2 bg-primary text-primary-foreground rounded-xl ios-press shadow-sm" onClick={() => setTopUpOpen(true)}>Top Up</Button></CardContent></Card>
        <Card className="glass rounded-2xl border-border/30 ios-press hover:shadow-lg transition-all duration-300 ease-ios"><CardHeader className="pb-2"><CardTitle className="text-[13px] text-muted-foreground flex items-center gap-2"><div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center"><CreditCard className="h-4 w-4 text-primary" /></div> Plan</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">{profile?.tier ?? "—"}</div><p className="text-[11px] text-muted-foreground">{profile?.messages_limit.toLocaleString()} messages/month</p></CardContent></Card>
        <Card className="glass rounded-2xl border-border/30 ios-press hover:shadow-lg transition-all duration-300 ease-ios"><CardHeader className="pb-2"><CardTitle className="text-[13px] text-muted-foreground flex items-center gap-2"><div className="h-8 w-8 rounded-xl bg-warning/10 flex items-center justify-center"><Zap className="h-4 w-4 text-warning" /></div> Auto Top Up</CardTitle></CardHeader><CardContent><div className="flex items-center gap-3"><Switch defaultChecked /><Label className="text-[13px]">$50 when below $10</Label></div></CardContent></Card>
      </div>
      <Dialog open={topUpOpen} onOpenChange={setTopUpOpen}><DialogContent className="rounded-2xl"><DialogHeader><DialogTitle>Top Up Balance</DialogTitle></DialogHeader><div className="space-y-4 py-4"><div className="grid grid-cols-3 gap-2">{["25", "50", "100"].map(amt => <Button key={amt} variant={topUpAmount === amt ? "default" : "outline"} onClick={() => setTopUpAmount(amt)} className={`rounded-xl ios-press ${topUpAmount === amt ? "bg-primary text-primary-foreground shadow-sm" : "border-border/30"}`}>${amt}</Button>)}</div><div className="space-y-2"><Label className="text-[13px]">Custom Amount</Label><Input type="number" value={topUpAmount} onChange={e => setTopUpAmount(e.target.value)} className="rounded-xl border-border/30" /></div></div><DialogFooter><DialogClose asChild><Button variant="outline" className="rounded-xl">Cancel</Button></DialogClose><Button onClick={handleTopUp} disabled={processing} className="bg-primary text-primary-foreground rounded-xl ios-press shadow-sm">{processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TrendingUp className="mr-2 h-4 w-4" />} Pay ${topUpAmount}</Button></DialogFooter></DialogContent></Dialog>
      <Card className="glass rounded-2xl border-border/30"><CardHeader><CardTitle className="text-[15px]">Invoices</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow className="bg-accent/30"><TableHead>Invoice</TableHead><TableHead>Description</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Issued</TableHead></TableRow></TableHeader><TableBody>{invoices?.map(inv => <TableRow key={inv.id} className="hover:bg-accent/30 transition-all duration-300 ease-ios ios-press"><TableCell className="font-mono text-[13px]">{inv.invoice_number}</TableCell><TableCell className="text-[13px] text-muted-foreground">{inv.description}</TableCell><TableCell className="font-semibold">${Number(inv.amount).toFixed(2)}</TableCell><TableCell><Badge variant="outline" className={`rounded-lg ${statusColor(inv.status)}`}>{formatStatus(inv.status)}</Badge></TableCell><TableCell className="text-[13px] text-muted-foreground">{new Date(inv.issued_at).toLocaleDateString()}</TableCell></TableRow>)}{!invoices?.length && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-[13px]">No invoices yet</TableCell></TableRow>}</TableBody></Table></CardContent></Card>
    </div>
  );
}
