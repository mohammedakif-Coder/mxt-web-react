import { useState } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Copy, Eye, EyeOff, Key, Globe, Code2, Webhook, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const initialKeys = [
  { id: "1", name: "Production Key", key: "mxt_live_k7x9m2p4q8r1s5t3u6v0w", created: "Jan 15, 2025", lastUsed: "2 hours ago" },
  { id: "2", name: "Development Key", key: "mxt_test_a1b2c3d4e5f6g7h8i9j0k", created: "Mar 3, 2025", lastUsed: "Yesterday" },
];
const sdks = [
  { lang: "PHP", version: "v3.2.1", color: "bg-purple-500" }, { lang: "Python", version: "v2.8.0", color: "bg-blue-500" },
  { lang: "Node.js", version: "v4.1.0", color: "bg-green-600" }, { lang: "Ruby", version: "v1.5.3", color: "bg-red-500" }, { lang: "Java", version: "v2.0.0", color: "bg-orange-500" },
];
const initialWebhooks = [
  { id: "1", event: "Delivery Receipt", url: "https://app.acme.com/webhooks/dlr", status: "active" },
  { id: "2", event: "Inbound Message", url: "https://app.acme.com/webhooks/inbound", status: "active" },
];

export default function DevelopersPage() {
  usePageTitle("Developers");
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [keys, setKeys] = useState(initialKeys);
  const [webhooks, setWebhooks] = useState(initialWebhooks);
  const [newKeyDialog, setNewKeyDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newWebhookDialog, setNewWebhookDialog] = useState(false);
  const [webhookForm, setWebhookForm] = useState({ event: "", url: "" });

  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copied to clipboard"); };
  const generateKey = () => { setKeys([...keys, { id: String(keys.length + 1), name: newKeyName || `Key ${keys.length + 1}`, key: `mxt_live_${Math.random().toString(36).substring(2, 24)}`, created: "Just now", lastUsed: "Never" }]); setNewKeyDialog(false); setNewKeyName(""); toast.success("API key generated"); };
  const revokeKey = (id: string) => { setKeys(keys.filter(k => k.id !== id)); toast.success("API key revoked"); };
  const addWebhook = () => { setWebhooks([...webhooks, { id: String(webhooks.length + 1), event: webhookForm.event, url: webhookForm.url, status: "active" }]); setNewWebhookDialog(false); setWebhookForm({ event: "", url: "" }); toast.success("Webhook created"); };

  return (
    <div className="space-y-6 animate-ios-fade-in">
      <div><h1 className="text-2xl font-bold">Developers</h1><p className="text-[13px] text-muted-foreground">API keys, SDKs, and webhook configuration</p></div>

      <Card className="glass rounded-2xl border-border/30"><CardHeader className="flex-row items-center justify-between"><div className="flex items-center gap-2"><div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center"><Key className="h-4 w-4 text-primary" /></div><div><CardTitle className="text-[13px]">REST API Keys</CardTitle><p className="text-[11px] text-muted-foreground">Manage API keys for REST access</p></div></div><Badge variant="outline" className="text-success border-success/20 text-[10px] rounded-lg">Active</Badge></CardHeader>
      <CardContent><Table><TableHeader><TableRow className="bg-accent/30"><TableHead>Name</TableHead><TableHead>Key</TableHead><TableHead>Created</TableHead><TableHead>Last Used</TableHead><TableHead className="w-24">Actions</TableHead></TableRow></TableHeader><TableBody>{keys.map(k => (<TableRow key={k.id} className="hover:bg-accent/30 transition-all duration-300 ease-ios"><TableCell className="font-medium text-[13px]">{k.name}</TableCell><TableCell><div className="flex items-center gap-1.5"><code className="text-[11px] font-mono text-muted-foreground">{showKeys[k.id] ? k.key : "•".repeat(24)}</code><Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg ios-press" onClick={() => setShowKeys(p => ({ ...p, [k.id]: !p[k.id] }))}>{showKeys[k.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}</Button></div></TableCell><TableCell className="text-[11px] text-muted-foreground">{k.created}</TableCell><TableCell className="text-[11px] text-muted-foreground">{k.lastUsed}</TableCell><TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg ios-press" onClick={() => copyToClipboard(k.key)}><Copy className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-destructive ios-press" onClick={() => revokeKey(k.id)}><Trash2 className="h-3.5 w-3.5" /></Button></div></TableCell></TableRow>))}</TableBody></Table><Button variant="outline" size="sm" className="mt-3 rounded-xl border-border/30 ios-press" onClick={() => setNewKeyDialog(true)}><Plus className="h-3.5 w-3.5 mr-1" /> Generate New Key</Button></CardContent></Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="glass rounded-2xl border-border/30 ios-press hover:shadow-md transition-all duration-300 ease-ios"><CardHeader><div className="flex items-center gap-2"><div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center"><Globe className="h-4 w-4 text-primary" /></div><div><CardTitle className="text-[13px]">SOAP API</CardTitle><p className="text-[11px] text-muted-foreground">Legacy SOAP interface</p></div></div></CardHeader><CardContent className="space-y-3"><div className="space-y-1"><Label className="text-[11px]">Endpoint</Label><div className="flex gap-1.5"><Input value="https://api.smsglobal.com/soap/v1" readOnly className="font-mono text-[11px] bg-accent/30 h-8 rounded-xl border-border/30" /><Button variant="outline" size="icon" className="h-8 w-8 shrink-0 rounded-lg border-border/30 ios-press" onClick={() => copyToClipboard("https://api.smsglobal.com/soap/v1")}><Copy className="h-3 w-3" /></Button></div></div></CardContent></Card>
        <Card className="glass rounded-2xl border-border/30 ios-press hover:shadow-md transition-all duration-300 ease-ios"><CardHeader><div className="flex items-center gap-2"><div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center"><Code2 className="h-4 w-4 text-primary" /></div><div><CardTitle className="text-[13px]">HTTP API</CardTitle><p className="text-[11px] text-muted-foreground">Simple HTTP GET/POST interface</p></div></div></CardHeader><CardContent className="space-y-3"><div className="space-y-1"><Label className="text-[11px]">Endpoint</Label><div className="flex gap-1.5"><Input value="https://api.smsglobal.com/http/v1" readOnly className="font-mono text-[11px] bg-accent/30 h-8 rounded-xl border-border/30" /><Button variant="outline" size="icon" className="h-8 w-8 shrink-0 rounded-lg border-border/30 ios-press" onClick={() => copyToClipboard("https://api.smsglobal.com/http/v1")}><Copy className="h-3 w-3" /></Button></div></div></CardContent></Card>
      </div>

      <Card className="glass rounded-2xl border-border/30"><CardHeader><div className="flex items-center gap-2"><div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center"><Code2 className="h-4 w-4 text-primary" /></div><div><CardTitle className="text-[13px]">SDKs & Libraries</CardTitle><p className="text-[11px] text-muted-foreground">Official client libraries</p></div></div></CardHeader><CardContent><div className="grid grid-cols-2 md:grid-cols-5 gap-3">{sdks.map(sdk => (<div key={sdk.lang} className="border border-border/30 rounded-2xl p-3 text-center hover:shadow-md transition-all duration-300 ease-ios cursor-pointer group ios-press" onClick={() => toast.success(`Opening ${sdk.lang} SDK docs...`)}><div className={`h-10 w-10 rounded-xl ${sdk.color} flex items-center justify-center text-white font-bold text-[13px] mx-auto mb-2`}>{sdk.lang.charAt(0)}</div><p className="text-[13px] font-medium">{sdk.lang}</p><p className="text-[10px] text-muted-foreground">{sdk.version}</p></div>))}</div></CardContent></Card>

      <Card className="glass rounded-2xl border-border/30"><CardHeader className="flex-row items-center justify-between"><div className="flex items-center gap-2"><div className="h-8 w-8 rounded-xl bg-warning/10 flex items-center justify-center"><Webhook className="h-4 w-4 text-warning" /></div><div><CardTitle className="text-[13px]">Webhooks</CardTitle><p className="text-[11px] text-muted-foreground">Configure webhook endpoints</p></div></div><Badge variant="outline" className="text-[10px] rounded-lg">{webhooks.length} configured</Badge></CardHeader>
      <CardContent><Table><TableHeader><TableRow className="bg-accent/30"><TableHead>Event</TableHead><TableHead>URL</TableHead><TableHead>Status</TableHead><TableHead className="w-16">Actions</TableHead></TableRow></TableHeader><TableBody>{webhooks.map(wh => (<TableRow key={wh.id} className="hover:bg-accent/30 transition-all duration-300 ease-ios"><TableCell className="text-[13px] font-medium">{wh.event}</TableCell><TableCell className="text-[11px] font-mono text-muted-foreground">{wh.url}</TableCell><TableCell><Badge variant="outline" className="text-success border-success/20 text-[10px] capitalize rounded-lg">{wh.status}</Badge></TableCell><TableCell><Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-destructive ios-press" onClick={() => { setWebhooks(webhooks.filter(w => w.id !== wh.id)); toast.success("Webhook removed"); }}><Trash2 className="h-3.5 w-3.5" /></Button></TableCell></TableRow>))}</TableBody></Table><Button variant="outline" size="sm" className="mt-3 rounded-xl border-border/30 ios-press" onClick={() => setNewWebhookDialog(true)}><Plus className="h-3.5 w-3.5 mr-1" /> New Webhook</Button></CardContent></Card>

      <Dialog open={newKeyDialog} onOpenChange={setNewKeyDialog}><DialogContent className="max-w-sm rounded-2xl"><DialogHeader><DialogTitle>Generate New API Key</DialogTitle></DialogHeader><div className="space-y-2"><Label className="text-[13px]">Key Name</Label><Input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="e.g. Production, Staging" className="rounded-xl border-border/30" /></div><DialogFooter><DialogClose asChild><Button variant="outline" className="rounded-xl">Cancel</Button></DialogClose><Button onClick={generateKey} className="bg-primary hover:bg-primary/90 rounded-xl ios-press">Generate</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={newWebhookDialog} onOpenChange={setNewWebhookDialog}><DialogContent className="max-w-sm rounded-2xl"><DialogHeader><DialogTitle>New Webhook</DialogTitle></DialogHeader><div className="space-y-4"><div className="space-y-2"><Label className="text-[13px]">Event Type</Label><Input value={webhookForm.event} onChange={e => setWebhookForm({ ...webhookForm, event: e.target.value })} placeholder="e.g. Delivery Receipt" className="rounded-xl border-border/30" /></div><div className="space-y-2"><Label className="text-[13px]">URL</Label><Input value={webhookForm.url} onChange={e => setWebhookForm({ ...webhookForm, url: e.target.value })} placeholder="https://..." className="font-mono text-[11px] rounded-xl border-border/30" /></div></div><DialogFooter><DialogClose asChild><Button variant="outline" className="rounded-xl">Cancel</Button></DialogClose><Button onClick={addWebhook} disabled={!webhookForm.event || !webhookForm.url} className="bg-primary hover:bg-primary/90 rounded-xl ios-press">Create</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
