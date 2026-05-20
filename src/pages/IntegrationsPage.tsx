import { usePageTitle } from "@/hooks/use-page-title";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Loader2, RefreshCw, Users, Clock, Building2, Zap, CheckCircle2, ArrowUpRight, ArrowDownLeft, ArrowLeftRight, MessageSquare, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { integrationService, type SyncAction } from "@/services/integrationService";
import { Separator } from "@/components/ui/separator";
import { useQueryClient } from "@tanstack/react-query";

const integrations = [
  { name: "HubSpot", desc: "Sync contacts and trigger SMS from HubSpot workflows", status: "connected", category: "CRM", color: "bg-orange-500", lastSync: "2 hours ago", account: "acme@hubspot.com", manageUrl: "https://app.hubspot.com/", connectUrl: "https://app.hubspot.com/signup-hubspot/crm" },
  { name: "Slack", desc: "Get delivery notifications and replies in Slack channels", status: "connected", category: "Notifications", color: "bg-purple-600", lastSync: "5 min ago", account: "#sms-alerts", manageUrl: "https://slack.com/apps/manage", connectUrl: "https://slack.com/get-started" },
  { name: "Zapier", desc: "Connect MXT with 5,000+ apps via Zapier automations", status: "not_connected", category: "Automation", color: "bg-orange-400", connectUrl: "https://zapier.com/sign-up" },
  { name: "Zoho", desc: "Two-way sync between Zoho CRM and your MXT contacts", status: "not_connected", category: "CRM", color: "bg-red-500", connectUrl: "https://www.zoho.com/crm/signup.html" },
  { name: "Xero", desc: "Auto-send invoice reminders via SMS from Xero", status: "not_connected", category: "Accounting", color: "bg-blue-500", connectUrl: "https://www.xero.com/signup/" },
  { name: "Shopify", desc: "Send order confirmations and shipping updates via SMS", status: "not_connected", category: "E-Commerce", color: "bg-green-600", connectUrl: "https://www.shopify.com/free-trial" },
];

export default function IntegrationsPage() {
  usePageTitle("Integrations");
  const [hubspotOpen, setHubspotOpen] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [syncingAction, setSyncingAction] = useState<null | SyncAction>(null);
  const [hubspotData, setHubspotData] = useState<any>(null);
  const [actionLogs, setActionLogs] = useState<Record<string, any>>({});
  const queryClient = useQueryClient();

  const refreshContacts = () => {
    queryClient.invalidateQueries({ queryKey: ["contacts"] });
  };

  const loadHubspotStatus = async () => {
    setStatusLoading(true);
    try {
      const data = await integrationService.getHubspotStatus();
      setHubspotData(data);
      const logs = await integrationService.listHubspotLogs();
      const map: Record<string, any> = {};
      for (const l of logs ?? []) if (!map[l.action]) map[l.action] = l;
      setActionLogs(map);
    } catch (e: any) {
      toast.error(`Failed to load HubSpot status: ${e.message ?? e}`);
    } finally {
      setStatusLoading(false);
    }
  };

  const runSync = async (action: SyncAction, label: string) => {
    setSyncingAction(action);
    try {
      const { success = 0, failed = 0 } = await integrationService.runHubspotSync(action);
      if (failed === 0) toast.success(`${label}: ${success} succeeded`);
      else toast.warning(`${label}: ${success} succeeded, ${failed} failed`);
      await loadHubspotStatus();
      refreshContacts();
    } catch (e: any) {
      toast.error(`${label} failed: ${e.message ?? e}`);
    } finally {
      setSyncingAction(null);
    }
  };

  useEffect(() => {
    if (hubspotOpen && !hubspotData) loadHubspotStatus();
  }, [hubspotOpen]);

  // Silent background sync: once on mount + every 2 minutes while page is open
  useEffect(() => {
    let cancelled = false;
    const silentPull = async () => {
      try {
        const data = await integrationService.backgroundSyncFromHubspot();
        if (cancelled) return;
        if (data && (data.success ?? 0) > 0) {
          refreshContacts();
        }
      } catch {
        /* silent */
      }
    };
    silentPull();
    const id = setInterval(silentPull, 120_000);
    return () => { cancelled = true; clearInterval(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAction = (int: typeof integrations[number]) => {
    if (int.name === "HubSpot" && int.status === "connected") {
      setHubspotOpen(true);
      return;
    }
    const url = int.status === "connected" ? int.manageUrl : int.connectUrl;
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
      toast.success(int.status === "connected" ? `Opening ${int.name} settings...` : `Redirecting to ${int.name}...`);
    } else {
      toast.error(`No URL configured for ${int.name}`);
    }
  };

  return (
    <div className="space-y-6 animate-ios-fade-in">
      <div><h1 className="text-2xl font-bold">Integrations</h1><p className="text-[13px] text-muted-foreground">Connect MXT with your favourite tools</p></div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{integrations.map(int => (
        <Card key={int.name} className="glass rounded-2xl border-border/30 hover:shadow-md transition-all duration-300 ease-ios ios-press"><CardHeader className="pb-3"><div className="flex items-start justify-between"><div className="flex items-center gap-3"><div className={`h-10 w-10 rounded-xl ${int.color} flex items-center justify-center text-white font-bold text-[13px]`}>{int.name.charAt(0)}</div><div><CardTitle className="text-[13px]">{int.name}</CardTitle><Badge variant="secondary" className="text-[10px] mt-0.5 rounded-lg">{int.category}</Badge></div></div>{int.status === "connected" ? <Badge className="bg-success/10 text-success border-success/20 text-[10px] rounded-lg"><Check className="h-3 w-3 mr-1" /> Connected</Badge> : <Badge variant="outline" className="text-[10px] text-muted-foreground rounded-lg">Not Connected</Badge>}</div></CardHeader>
        <CardContent className="space-y-3"><p className="text-[11px] text-muted-foreground">{int.desc}</p>{int.status === "connected" && <div className="space-y-1 text-[10px] text-muted-foreground bg-accent/30 rounded-xl p-2"><p>Last sync: {int.lastSync}</p><p>Account: {int.account}</p></div>}<Button variant={int.status === "connected" ? "outline" : "default"} size="sm" className={`w-full text-[11px] rounded-xl ios-press ${int.status !== "connected" ? "bg-primary hover:bg-primary/90 shadow-sm" : "border-border/30"}`} onClick={() => handleAction(int)}>{int.status === "connected" ? "Manage" : "Connect"} <ArrowRight className="h-3 w-3 ml-1" /></Button></CardContent></Card>
      ))}</div>

      <Dialog open={hubspotOpen} onOpenChange={setHubspotOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-orange-500 flex items-center justify-center text-white font-bold">H</div>
              <div>
                <DialogTitle>HubSpot</DialogTitle>
                <DialogDescription className="text-[12px]">Manage your HubSpot CRM connection</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {statusLoading && !hubspotData ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-border/40 p-3">
                <span className="text-[12px] text-muted-foreground">Status</span>
                {hubspotData?.connected ? (
                  <Badge className="bg-success/10 text-success border-success/20 text-[10px] rounded-lg"><Check className="h-3 w-3 mr-1" /> Connected</Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] rounded-lg">Disconnected</Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border/40 p-3">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1"><Building2 className="h-3 w-3" /> Account</div>
                  <div className="text-[12px] font-medium truncate">{hubspotData?.account?.uiDomain ?? hubspotData?.account?.portalId ?? "—"}</div>
                  {hubspotData?.account?.accountType && <div className="text-[10px] text-muted-foreground mt-0.5">{hubspotData.account.accountType}</div>}
                </div>
                <div className="rounded-xl border border-border/40 p-3">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1"><Clock className="h-3 w-3" /> Last sync</div>
                  <div className="text-[12px] font-medium">{hubspotData?.lastSync ? new Date(hubspotData.lastSync).toLocaleString() : "Never"}</div>
                  {hubspotData?.lastSyncStats && <div className="text-[10px] text-muted-foreground mt-0.5">{hubspotData.lastSyncStats.success} ok · {hubspotData.lastSyncStats.failed} failed</div>}
                </div>
              </div>

              <div className="rounded-xl border border-border/40 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[12px]">Contacts in MXT</span>
                </div>
                <span className="text-[14px] font-semibold">{hubspotData?.contactCount ?? 0}</span>
              </div>

              <div className="rounded-xl border border-border/40 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="text-[12px]">Total synced to HubSpot</span>
                </div>
                <span className="text-[14px] font-semibold">{hubspotData?.syncedCount ?? 0}</span>
              </div>

              <div className="rounded-xl border border-border/40 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <div>
                    <div className="text-[12px] font-medium">Auto sync</div>
                    <div className="text-[10px] text-muted-foreground">New contacts sync instantly on creation</div>
                  </div>
                </div>
                <Badge className="bg-success/10 text-success border-success/20 text-[10px] rounded-lg"><Check className="h-3 w-3 mr-1" /> Enabled</Badge>
              </div>

              <Separator />

              <p className="text-[11px] text-muted-foreground">
                Two-way sync matches contacts by email first, then phone. New contacts created on either side are added; edits update the matched record.
              </p>

              <div className="grid gap-2">
                {([
                  { action: "sync_to_hubspot" as const, label: "Sync MXT to HubSpot", icon: ArrowUpRight, primary: false },
                  { action: "sync_from_hubspot" as const, label: "Sync HubSpot to MXT", icon: ArrowDownLeft, primary: false },
                  { action: "sync_two_way" as const, label: "Full Two-Way Sync", icon: ArrowLeftRight, primary: true },
                  { action: "sync_companies" as const, label: "Sync Companies", icon: Building2, primary: false },
                  { action: "push_sms_activity" as const, label: "Push SMS Activity", icon: MessageSquare, primary: false },
                  { action: "push_campaign_activity" as const, label: "Push Campaign Activity", icon: Megaphone, primary: false },
                ]).map(({ action, label, icon: Icon, primary }) => {
                  const log = actionLogs[action];
                  const isLoading = syncingAction === action;
                  return (
                    <Button
                      key={action}
                      size="sm"
                      variant={primary ? "default" : "outline"}
                      className={`rounded-xl justify-between ${primary ? "bg-primary hover:bg-primary/90" : ""}`}
                      disabled={!!syncingAction || !hubspotData?.connected}
                      onClick={() => runSync(action, label)}
                    >
                      <span className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5" /> {label}
                      </span>
                      <span className="flex items-center gap-2">
                        {log && (
                          <span className="text-[10px] text-muted-foreground hidden sm:inline">
                            {log.status === "success" ? "✓" : log.status === "failed" ? "✗" : "~"} {new Date(log.created_at).toLocaleDateString()}
                          </span>
                        )}
                        {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" className="rounded-xl" onClick={loadHubspotStatus} disabled={statusLoading || !!syncingAction}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${statusLoading ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
