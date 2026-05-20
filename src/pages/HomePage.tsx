import { useQuery } from "@tanstack/react-query";
import { activityService } from "@/services/activityService";
import { campaignService } from "@/services/campaignService";
import { contactService } from "@/services/contactService";
import { inboxService } from "@/services/inboxService";
import { senderService } from "@/services/senderService";
import { queryKeys } from "@/constants/queryKeys";
import { usePageTitle } from "@/hooks/use-page-title";
import { useProfile } from "@/hooks/use-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import {
  PenSquare, DollarSign, ShieldCheck, Activity, Crown,
  TrendingDown, Clock, AlertTriangle, Megaphone, Users,
  Upload, BarChart3, CreditCard, MessageSquare, Mail, ArrowUpRight,
  CheckCircle2, XCircle, Loader2, Play, ChevronLeft, ChevronRight
} from "lucide-react";
import type { ActivityLogEntry, Sender } from "@/types/database";
import heroPerson from "@/assets/hero-person.png";

export default function HomePage() {
  usePageTitle("Home");
  const { data: profile } = useProfile();

  const { data: recentActivity } = useQuery<ActivityLogEntry[]>({
    queryKey: queryKeys.recentActivity,
    queryFn: () => activityService.listRecent(10),
  });

  const { data: contactCount } = useQuery<number>({
    queryKey: queryKeys.contactCount,
    queryFn: contactService.countContacts,
  });

  const { data: unreadCount } = useQuery<number>({
    queryKey: queryKeys.unreadCount,
    queryFn: inboxService.unreadCount,
  });

  const { data: senders } = useQuery<Sender[]>({
    queryKey: ["senders-all"],
    queryFn: senderService.listSenders,
  });

  const { data: campaignNext } = useQuery({
    queryKey: ["next-campaign"],
    queryFn: campaignService.getNextScheduledCampaign,
  });

  const balance = profile ? Number(profile.balance) : 0;
  const isLowBalance = balance < 20;
  const avgCostPerDay = profile ? (Number(profile.messages_used) * 0.05) / Math.max(1, 30) : 0;
  const runwayDays = avgCostPerDay > 0 ? Math.floor(balance / avgCostPerDay) : 999;
  const usagePercent = profile ? Math.round((profile.messages_used / profile.messages_limit) * 100) : 0;

  const approvedSenders = senders?.filter(s => s.status === "approved").length ?? 0;
  const pendingSenders = senders?.filter(s => s.status === "pending").length ?? 0;
  const rejectedSenders = senders?.filter(s => s.status === "rejected").length ?? 0;

  const insights: { icon: React.ElementType; color: string; bg: string; title: string; desc: string }[] = [];
  if (isLowBalance) insights.push({ icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10", title: "Low Balance Warning", desc: `Estimated ${runwayDays} days of runway remaining at current pace.` });
  if (pendingSenders > 0) insights.push({ icon: Clock, color: "text-info", bg: "bg-info/10", title: `${pendingSenders} Sender ID${pendingSenders > 1 ? "s" : ""} Pending`, desc: "Your sender ID requests are being reviewed." });
  if (campaignNext) insights.push({ icon: Megaphone, color: "text-primary", bg: "bg-primary/10", title: `Campaign "${campaignNext.name}" scheduled`, desc: `Sending to ${campaignNext.recipient_count.toLocaleString()} recipients.` });
  if (unreadCount && unreadCount > 0) insights.push({ icon: Mail, color: "text-primary", bg: "bg-primary/10", title: `${unreadCount} Unread Replies`, desc: "You have unread messages in your inbox." });
  if (usagePercent > 80) insights.push({ icon: TrendingDown, color: "text-destructive", bg: "bg-destructive/10", title: "Approaching Message Limit", desc: `You've used ${usagePercent}% of your monthly allowance.` });
  if (insights.length === 0) insights.push({ icon: CheckCircle2, color: "text-success", bg: "bg-success/10", title: "Everything looks great", desc: "Your account is healthy." });

  const statusColor = (s: string) => {
    switch (s) {
      case "delivered": return "bg-success/10 text-success border-success/20";
      case "failed": return "bg-destructive/10 text-destructive border-destructive/20";
      case "pending": return "bg-warning/10 text-warning border-warning/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const channelIcon = (ch: string) => ch === "whatsapp" ? <MessageSquare className="h-3.5 w-3.5 text-success" /> : <Mail className="h-3.5 w-3.5 text-info" />;

  return (
    <div className="space-y-6 animate-ios-fade-in">
      {/* Welcome Hero Banner */}
      <div className="relative rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-blue-400 overflow-hidden flex items-center min-h-[190px] shadow-lg shadow-primary/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="relative z-10 p-7 flex-1">
          <h1 className="text-[22px] font-bold text-primary-foreground mb-0.5">
            Welcome back, {profile?.full_name?.split(" ")[0] ?? "User"} 👋
          </h1>
          <p className="text-primary-foreground/70 text-[13px] mb-3">Your messaging hub — here's your overview</p>
          <div className="flex items-center gap-4 text-primary-foreground/60 text-[11px] mb-5">
            <span className="flex items-center gap-1"><Play className="h-3 w-3" /> {profile?.messages_used.toLocaleString() ?? "0"} Messages sent</span>
            <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {contactCount?.toLocaleString() ?? "0"} contacts</span>
          </div>
          <div className="flex gap-2.5">
            <Button size="sm" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 rounded-xl text-[13px] font-semibold px-5 shadow-md ios-press" asChild>
              <Link to="/compose"><PenSquare className="mr-1.5 h-3.5 w-3.5" /> New Message</Link>
            </Button>
            <Button size="sm" variant="ghost" className="border border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 rounded-xl text-[13px] font-medium px-5 ios-press" asChild>
              <Link to="/activity">View Activity</Link>
            </Button>
          </div>
        </div>
        <img src={heroPerson} alt="Welcome" className="hidden md:block h-44 object-contain mr-6 drop-shadow-lg" width={176} height={176} />
        <button className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full glass-subtle flex items-center justify-center text-primary-foreground ios-press">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full glass-subtle flex items-center justify-center text-primary-foreground ios-press">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass rounded-2xl border-border/30 hover:shadow-lg transition-all duration-300 ease-ios ios-press">
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-[13px] font-medium text-muted-foreground">Balance</CardTitle><div className="h-8 w-8 rounded-xl bg-success/10 flex items-center justify-center"><DollarSign className="h-4 w-4 text-success" /></div></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2"><span className="text-2xl font-bold">${balance.toFixed(2)}</span>{isLowBalance && <Badge variant="destructive" className="text-[10px] rounded-lg">LOW</Badge>}</div>
            <p className="text-[11px] text-muted-foreground mt-1">~{runwayDays} days at current pace</p>
            <Button size="sm" variant="outline" className="mt-3 w-full text-[11px] rounded-xl ios-press" asChild><Link to="/billing"><CreditCard className="mr-1.5 h-3 w-3" /> Buy Now</Link></Button>
          </CardContent>
        </Card>
        <Card className="glass rounded-2xl border-border/30 hover:shadow-lg transition-all duration-300 ease-ios ios-press">
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-[13px] font-medium text-muted-foreground">Sender IDs</CardTitle><div className="h-8 w-8 rounded-xl bg-info/10 flex items-center justify-center"><ShieldCheck className="h-4 w-4 text-info" /></div></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedSenders} approved</div>
            <div className="flex items-center gap-3 mt-1">
              {pendingSenders > 0 && <span className="text-[11px] text-warning flex items-center gap-1"><Loader2 className="h-3 w-3" />{pendingSenders} pending</span>}
              {rejectedSenders > 0 && <span className="text-[11px] text-destructive flex items-center gap-1"><XCircle className="h-3 w-3" />{rejectedSenders} rejected</span>}
              {pendingSenders === 0 && rejectedSenders === 0 && <span className="text-[11px] text-success flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />All approved</span>}
            </div>
          </CardContent>
        </Card>
        <Card className="glass rounded-2xl border-border/30 hover:shadow-lg transition-all duration-300 ease-ios ios-press">
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-[13px] font-medium text-muted-foreground">Platform Status</CardTitle><div className="h-8 w-8 rounded-xl bg-success/10 flex items-center justify-center"><Activity className="h-4 w-4 text-success" /></div></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2"><span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span></span><span className="text-sm font-semibold text-success">All systems operational</span></div>
            <p className="text-[11px] text-muted-foreground mt-2">SMS gateway, WhatsApp, API — all online</p>
          </CardContent>
        </Card>
        <Card className="glass rounded-2xl border-border/30 hover:shadow-lg transition-all duration-300 ease-ios ios-press">
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-[13px] font-medium text-muted-foreground">Current Tier</CardTitle><div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center"><Crown className="h-4 w-4 text-primary" /></div></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.tier ?? "—"}</div>
            <div className="mt-2">
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1"><span>{profile?.messages_used.toLocaleString()} sent</span><span>{profile?.messages_limit.toLocaleString()} limit</span></div>
              <Progress value={usagePercent} className="h-1.5 rounded-full" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-[15px] font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "New Message", icon: PenSquare, to: "/compose", color: "text-primary", bg: "bg-primary/10" },
            { label: "Upload Numbers", icon: Upload, to: "/contacts", color: "text-success", bg: "bg-success/10" },
            { label: "View Reports", icon: BarChart3, to: "/activity", color: "text-info", bg: "bg-info/10" },
            { label: "Buy Credits", icon: CreditCard, to: "/billing", color: "text-warning", bg: "bg-warning/10" },
          ].map((qa) => (
            <Button key={qa.label} variant="outline" className="h-auto py-4 flex flex-col gap-2 rounded-2xl border-border/30 glass hover:shadow-md transition-all duration-300 ease-ios ios-press" asChild>
              <Link to={qa.to}><div className={`rounded-xl p-2 ${qa.bg}`}><qa.icon className={`h-5 w-5 ${qa.color}`} /></div><span className="text-[13px] font-medium">{qa.label}</span></Link>
            </Button>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div>
        <h2 className="text-[15px] font-semibold mb-3 flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> Insights</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {insights.map((ins, i) => (
            <Card key={i} className="glass rounded-2xl border-border/30 hover:shadow-md transition-all duration-300 ease-ios ios-press">
              <CardContent className="flex items-start gap-3 pt-5">
                <div className={`rounded-xl p-2 ${ins.bg} shrink-0`}><ins.icon className={`h-4 w-4 ${ins.color}`} /></div>
                <div><p className="font-semibold text-[13px]">{ins.title}</p><p className="text-[11px] text-muted-foreground mt-0.5">{ins.desc}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="glass rounded-2xl border-border/30 hover:shadow-lg transition-all duration-300 ease-ios">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-[15px] flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> Recent Activity</CardTitle>
          <Button variant="ghost" size="sm" asChild className="text-[13px] ios-press"><Link to="/activity">View All <ArrowUpRight className="ml-1 h-3 w-3" /></Link></Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {recentActivity?.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl border border-border/30 p-3 hover:bg-accent/40 transition-all duration-300 ease-ios cursor-pointer ios-press">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {channelIcon(a.channel)}
                  <div className="min-w-0"><span className="font-medium text-[13px] truncate block">{a.recipient_name ?? a.recipient}</span><p className="text-[11px] text-muted-foreground truncate">{a.body}</p></div>
                </div>
                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <Badge variant="outline" className={`text-[10px] rounded-lg ${statusColor(a.status)}`}>{a.status}</Badge>
                  <span className="text-[11px] text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
            {!recentActivity?.length && <p className="text-center py-8 text-muted-foreground text-[13px]">No recent activity</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
