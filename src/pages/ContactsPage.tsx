import { useState } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Phone, ShieldCheck, Settings, Type, Monitor, AlertCircle } from "lucide-react";
import { toast } from "sonner";

// Mock data for Virtual Numbers and Verified Numbers
const mockVirtualNumbers: any[] = [];
const mockVerifiedNumbers: any[] = [];

export default function ContactsPage() {
  usePageTitle("Numbers");
  const [tab, setTab] = useState("virtual-numbers");
  const [virtualNumbers] = useState(mockVirtualNumbers);
  const [verifiedNumbers] = useState(mockVerifiedNumbers);
  const [showRequestDialog, setShowRequestDialog] = useState(false);

  return (
    <div className="space-y-4 animate-ios-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Numbers</h1>
          <p className="text-muted-foreground text-[13px]">Manage virtual and verified numbers used for sending</p>
        </div>
        {tab === "virtual-numbers" && (
          <Button onClick={() => setShowRequestDialog(true)} className="bg-primary hover:bg-primary/90 rounded-xl ios-press shadow-sm">
            <Plus className="mr-2 h-4 w-4" /> Request Number
          </Button>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-accent/40 rounded-xl">
          <TabsTrigger value="virtual-numbers" className="gap-1.5 rounded-lg text-[13px]"><Phone className="h-3.5 w-3.5" /> Virtual Numbers</TabsTrigger>
          <TabsTrigger value="verified-numbers" className="gap-1.5 rounded-lg text-[13px]"><ShieldCheck className="h-3.5 w-3.5" /> Verified Numbers</TabsTrigger>
        </TabsList>

        {/* Virtual Numbers Tab */}
        <TabsContent value="virtual-numbers" className="space-y-5 mt-4">
          <div className="glass rounded-2xl border border-border/30 overflow-hidden">
            <div className="px-6 py-4 border-b border-border/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-base font-semibold">Virtual Numbers</h3>
              </div>
            </div>

            {virtualNumbers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/30 text-left bg-accent/30">
                      <th className="px-6 py-3 text-xs font-medium text-muted-foreground">Number</th>
                      <th className="px-6 py-3 text-xs font-medium text-muted-foreground">Capabilities</th>
                      <th className="px-6 py-3 text-xs font-medium text-muted-foreground">Send Replies To</th>
                      <th className="px-6 py-3 text-xs font-medium text-muted-foreground text-center">Auto Reply</th>
                      <th className="px-6 py-3 text-xs font-medium text-muted-foreground text-center">Keywords</th>
                      <th className="px-6 py-3 text-xs font-medium text-muted-foreground">Expiry Date</th>
                      <th className="px-6 py-3 text-xs font-medium text-muted-foreground text-center">Auto Renew</th>
                      <th className="px-6 py-3 text-xs font-medium text-muted-foreground text-center">Conversation</th>
                      <th className="px-6 py-3 text-xs font-medium text-muted-foreground text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {virtualNumbers.map((n: any, i: number) => (
                      <tr key={i} className="border-b border-border/30 last:border-0 hover:bg-accent/30 transition-colors">
                        <td className="px-6 py-3 font-mono font-medium">{n.number}</td>
                        <td className="px-6 py-3 text-sm">{n.capabilities}</td>
                        <td className="px-6 py-3 text-sm">{n.sendRepliesTo}</td>
                        <td className="px-6 py-3 text-center"><AlertCircle className="mx-auto h-4 w-4 text-muted-foreground" /></td>
                        <td className="px-6 py-3 text-center font-mono">{n.keywords}</td>
                        <td className="px-6 py-3 font-mono">{n.expiryDate}</td>
                        <td className="px-6 py-3 text-center"><Switch checked={n.autoRenew} /></td>
                        <td className="px-6 py-3 text-center"><Switch checked={n.conversation} /></td>
                        <td className="px-6 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"><Settings className="h-4 w-4" /></button>
                            <button className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"><Type className="h-4 w-4" /></button>
                            <button className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"><Monitor className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-16 text-center">
                <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-accent/60 mb-3">
                  <Phone className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium mb-1">No virtual numbers</p>
                <p className="text-xs text-muted-foreground">Click "Request Number" to add your first virtual number.</p>
              </div>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            Looking to add a private shared number pool to your account?{" "}
            <a href="#" className="font-medium text-primary hover:text-primary/80 transition-colors">Submit an enquiry</a>.
          </p>
        </TabsContent>

        {/* Verified Numbers Tab */}
        <TabsContent value="verified-numbers" className="space-y-5 mt-4">
          <div className="glass rounded-2xl border border-border/30 overflow-hidden">
            <div className="px-6 py-4 border-b border-border/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">Verified Numbers</h3>
                  <p className="text-xs text-muted-foreground">Numbers you own externally, such as your mobile number.</p>
                </div>
              </div>
              <Button onClick={() => toast.info("Add verified number flow coming soon")} className="rounded-xl ios-press shadow-sm">
                <Plus className="h-4 w-4 mr-2" /> Add
              </Button>
            </div>

            {verifiedNumbers.length > 0 ? (
              <div className="p-6">{/* verified numbers content */}</div>
            ) : (
              <div className="px-6 py-16 text-center">
                <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-accent/60 mb-3">
                  <ShieldCheck className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium mb-1">No verified numbers</p>
                <p className="text-xs text-muted-foreground">Click "Add" to verify your first number.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Request Virtual Number Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="rounded-2xl max-w-3xl p-8 gap-0 overflow-hidden">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-semibold text-center">Please Select Virtual Number</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end mb-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Country</label>
              <Select defaultValue="australia">
                <SelectTrigger className="rounded-xl border-border/30 text-sm h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="australia">Australia</SelectItem>
                  <SelectItem value="usa">United States</SelectItem>
                  <SelectItem value="uk">United Kingdom</SelectItem>
                  <SelectItem value="india">India</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</label>
              <Select defaultValue="standard">
                <SelectTrigger className="rounded-xl border-border/30 text-sm h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Number</label>
              <Select defaultValue="61447100291">
                <SelectTrigger className="rounded-xl border-border/30 text-sm font-mono h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="61447100291">61447100291</SelectItem>
                  <SelectItem value="61447100292">61447100292</SelectItem>
                  <SelectItem value="61447100293">61447100293</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contract</label>
              <Select defaultValue="1month">
                <SelectTrigger className="rounded-xl border-border/30 text-sm h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1month">1 Month</SelectItem>
                  <SelectItem value="3months">3 Months</SelectItem>
                  <SelectItem value="6months">6 Months</SelectItem>
                  <SelectItem value="12months">12 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="rounded-xl font-semibold gap-2 h-10 shadow-sm">
              <Plus className="h-4 w-4" /> Select
            </Button>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs font-medium text-muted-foreground italic">Checkout with</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="text-center space-y-5">
            <div className="flex items-center justify-center gap-4">
              <button className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 transition-all px-8 py-3.5 text-sm font-bold min-w-[170px] shadow-sm">PayPal</button>
              <button className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all px-8 py-3.5 text-sm font-bold min-w-[170px] shadow-sm">Credit Card</button>
            </div>
            <div className="flex items-center justify-center gap-5 text-[11px] font-bold text-muted-foreground/60 uppercase tracking-[0.15em]">
              <span>Visa</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
              <span>MasterCard</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
              <span>Amex</span>
            </div>
            <p className="text-xs text-muted-foreground flex items-start gap-2 max-w-lg mx-auto">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
              <span>We follow a standard review procedure for PayPal payments to ensure legitimate use of our service and to prevent fraudulent activities. The manual review can take up to 24 hrs.</span>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
