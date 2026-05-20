import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { aiService } from "@/services/aiService";
import { messagingService } from "@/services/messagingService";
import { activityService } from "@/services/activityService";
import { usePageTitle } from "@/hooks/use-page-title";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Loader2,
  Lightbulb,
  Send,
} from "lucide-react";
import type { Message, ActivityLogEntry } from "@/types/database";
import AIButton from "@/features/ai/components/AIButton";

type DateRange = "7d" | "30d" | "90d" | "all";
type ChannelFilter = "all" | "sms" | "mms" | "whatsapp";

function getDateOffset(range: DateRange): Date | null {
  const now = new Date();
  switch (range) {
    case "7d": return new Date(now.getTime() - 7 * 86400000);
    case "30d": return new Date(now.getTime() - 30 * 86400000);
    case "90d": return new Date(now.getTime() - 90 * 86400000);
    default: return null;
  }
}

const CHANNEL_COLORS: Record<string, string> = {
  sms: "hsl(211, 100%, 50%)",
  mms: "hsl(262, 83%, 58%)",
  whatsapp: "hsl(142, 70%, 45%)",
};

const STATUS_COLORS: Record<string, string> = {
  delivered: "hsl(142, 71%, 45%)",
  sent: "hsl(211, 100%, 50%)",
  failed: "hsl(0, 72%, 51%)",
  pending: "hsl(38, 92%, 50%)",
};

const channelChartConfig: ChartConfig = {
  sms: { label: "SMS", color: CHANNEL_COLORS.sms },
  mms: { label: "MMS", color: CHANNEL_COLORS.mms },
  whatsapp: { label: "WhatsApp", color: CHANNEL_COLORS.whatsapp },
};

const statusChartConfig: ChartConfig = {
  delivered: { label: "Delivered", color: STATUS_COLORS.delivered },
  sent: { label: "Sent", color: STATUS_COLORS.sent },
  failed: { label: "Failed", color: STATUS_COLORS.failed },
  pending: { label: "Pending", color: STATUS_COLORS.pending },
};

const DATE_LABELS: Record<DateRange, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  all: "All time",
};

export default function ReportsPage() {
  usePageTitle("Reports");
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");

  const { data: messages, isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["reports-messages", dateRange],
    queryFn: async () => {
      const from = getDateOffset(dateRange);
      return messagingService.listMessages({ from: from?.toISOString() ?? null });
    },
  });

  const { data: activityLog, isLoading: activityLoading } = useQuery<ActivityLogEntry[]>({
    queryKey: ["reports-activity", dateRange],
    queryFn: async () => {
      const from = getDateOffset(dateRange);
      const activity = await activityService.listActivity();
      return from ? activity.filter((entry) => entry.created_at >= from.toISOString()).reverse() : activity.reverse();
    },
  });

  const isLoading = messagesLoading || activityLoading;

  const filtered = useMemo(() => {
    if (!messages) return [];
    if (channelFilter === "all") return messages;
    return messages.filter((m) => m.channel === channelFilter);
  }, [messages, channelFilter]);

  const kpis = useMemo(() => {
    const total = filtered.length;
    const delivered = filtered.filter((m) => m.status === "delivered").length;
    const failed = filtered.filter((m) => m.status === "failed").length;
    const pending = filtered.filter((m) => m.status === "pending").length;
    const totalCost = filtered.reduce((s, m) => s + Number(m.cost), 0);
    const deliveryRate = total > 0 ? Math.round((delivered / total) * 100) : 0;
    return { total, delivered, failed, pending, totalCost, deliveryRate };
  }, [filtered]);

  const channelDistribution = useMemo(() => {
    if (!filtered.length) return [];
    const counts: Record<string, number> = {};
    filtered.forEach((m) => { counts[m.channel] = (counts[m.channel] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const statusBreakdown = useMemo(() => {
    if (!filtered.length) return [];
    const counts: Record<string, number> = {};
    filtered.forEach((m) => { counts[m.status] = (counts[m.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      fill: STATUS_COLORS[name] || "hsl(220, 9%, 46%)",
    }));
  }, [filtered]);

  const trendData = useMemo(() => {
    if (!filtered.length) return [];
    const byDay: Record<string, { sms: number; mms: number; whatsapp: number }> = {};
    filtered.forEach((m) => {
      const day = m.created_at.slice(0, 10);
      if (!byDay[day]) byDay[day] = { sms: 0, mms: 0, whatsapp: 0 };
      if (m.channel in byDay[day]) {
        byDay[day][m.channel as keyof typeof byDay[typeof day]]++;
      }
    });
    return Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, channels]) => ({
        date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        fullDate: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        ...channels,
        total: channels.sms + channels.mms + channels.whatsapp,
      }));
  }, [filtered]);

  // Pick ~7 evenly spaced ticks across the trend range so dates show in between
  const trendTicks = useMemo(() => {
    if (trendData.length <= 7) return trendData.map((d) => d.date);
    const targetCount = 7;
    const step = (trendData.length - 1) / (targetCount - 1);
    const ticks: string[] = [];
    for (let i = 0; i < targetCount; i++) {
      ticks.push(trendData[Math.round(i * step)].date);
    }
    return ticks;
  }, [trendData]);

  const channelComparison = useMemo(() => {
    if (!messages) return [];
    return ["sms", "mms", "whatsapp"].map((ch) => {
      const msgs = messages.filter((m) => m.channel === ch);
      return {
        channel: ch === "sms" ? "SMS" : ch === "mms" ? "MMS" : "WhatsApp",
        total: msgs.length,
        delivered: msgs.filter((m) => m.status === "delivered").length,
        failed: msgs.filter((m) => m.status === "failed").length,
      };
    });
  }, [messages]);

  // Build a compact stats payload for the AI
  const aiStats = useMemo(() => ({
    date_range_label: DATE_LABELS[dateRange],
    channel_filter: channelFilter,
    totals: {
      total: kpis.total,
      delivered: kpis.delivered,
      failed: kpis.failed,
      pending: kpis.pending,
      total_cost: Number(kpis.totalCost.toFixed(2)),
      delivery_rate_pct: kpis.deliveryRate,
    },
    by_channel: channelComparison.map((c) => ({
      channel: c.channel, total: c.total, delivered: c.delivered, failed: c.failed,
    })),
    daily_trend: trendData.slice(-30).map((d) => ({
      date: d.fullDate, sms: d.sms, mms: d.mms, whatsapp: d.whatsapp, total: d.total,
    })),
    status_breakdown: statusBreakdown.map((s) => ({ status: s.name, count: s.value })),
  }), [dateRange, channelFilter, kpis, channelComparison, trendData, statusBreakdown]);

  const [summary, setSummary] = useState<{ headline: string; bullets: string[]; recommendations: { action: string; expected_impact: string }[] } | null>(null);
  const [qaQuestion, setQaQuestion] = useState("");
  const [qaAnswer, setQaAnswer] = useState<string | null>(null);

  const summaryMutation = useMutation({
    mutationFn: async () => {
      return aiService.reportSummary(aiStats);
    },
    onSuccess: (d) => setSummary(d),
    onError: (e: Error) => toast.error("Couldn't generate insights", { description: e.message }),
  });

  const qaMutation = useMutation({
    mutationFn: async () => {
      return aiService.answerReportQuestion(qaQuestion);
    },
    onSuccess: (a) => setQaAnswer(a),
    onError: (e: Error) => toast.error("Couldn't answer", { description: e.message }),
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Reports</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">Messaging analytics across all channels</p>
        </div>
        <div className="flex items-center gap-2">
          {(["7d", "30d", "90d", "all"] as DateRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                dateRange === range
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {range === "all" ? "All" : range}
            </button>
          ))}
          <div className="w-px h-5 bg-border mx-1" />
          <Select value={channelFilter} onValueChange={(v) => setChannelFilter(v as ChannelFilter)}>
            <SelectTrigger className="w-[120px] h-8 text-xs rounded-lg border-border/50 bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="mms">MMS</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* AI Insights */}
      <Card className="border-primary/30 shadow-sm overflow-hidden bg-gradient-to-br from-primary/[0.04] to-transparent">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">AI Insights</p>
                <p className="text-[11px] text-muted-foreground">Get an executive summary or ask anything about this report.</p>
              </div>
            </div>
            <AIButton
              size="sm"
              onClick={() => summaryMutation.mutate()}
              disabled={kpis.total === 0}
              loading={summaryMutation.isPending}
            >
              {summary ? "Regenerate" : "Explain this report"}
            </AIButton>
          </div>

          {summary && (
            <div className="space-y-2.5">
              <p className="text-[14px] font-semibold leading-snug">{summary.headline}</p>
              <ul className="space-y-1.5">
                {summary.bullets.map((b, i) => (
                  <li key={i} className="text-[12.5px] leading-relaxed flex gap-2">
                    <span className="text-primary mt-0.5">•</span><span>{b}</span>
                  </li>
                ))}
              </ul>
              {summary.recommendations.length > 0 && (
                <div className="bg-accent/40 rounded-xl p-3 space-y-2">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold flex items-center gap-1">
                    <Lightbulb className="h-3 w-3" /> Recommended actions
                  </p>
                  {summary.recommendations.map((r, i) => (
                    <div key={i} className="space-y-0.5">
                      <p className="text-[12.5px] font-medium">{r.action}</p>
                      <p className="text-[11px] text-muted-foreground italic">Expected: {r.expected_impact}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Q&A */}
          <div className="border-t border-border/30 pt-3 space-y-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Ask a question</p>
            <div className="flex gap-2">
              <Input
                value={qaQuestion}
                onChange={(e) => setQaQuestion(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && qaQuestion.trim() && !qaMutation.isPending) qaMutation.mutate(); }}
                placeholder='e.g. "Why are MMS messages failing more than SMS?"'
                className="rounded-xl border-border/30 text-[13px] h-9"
              />
              <AIButton
                size="sm"
                onClick={() => qaMutation.mutate()}
                disabled={!qaQuestion.trim() || kpis.total === 0}
                loading={qaMutation.isPending}
                icon={<Send className="h-3 w-3" />}
                className="h-9"
              >
                Ask
              </AIButton>
            </div>
            {qaAnswer && (
              <div className="bg-accent/40 rounded-xl p-3 text-[12.5px] leading-relaxed">{qaAnswer}</div>
            )}
            {kpis.total === 0 && (
              <Badge variant="outline" className="text-[10px] rounded-lg">No messages in this range — send some to unlock insights</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard icon={MessageSquare} label="Total Sent" value={kpis.total} loading={isLoading} gradient="from-blue-500/10 to-blue-600/5" iconColor="text-blue-500" />
        <KpiCard icon={CheckCircle2} label="Delivered" value={kpis.delivered} loading={isLoading} gradient="from-green-500/10 to-green-600/5" iconColor="text-green-500" subtitle={`${kpis.deliveryRate}% rate`} />
        <KpiCard icon={XCircle} label="Failed" value={kpis.failed} loading={isLoading} gradient="from-red-500/10 to-red-600/5" iconColor="text-red-500" />
        <KpiCard icon={Clock} label="Pending" value={kpis.pending} loading={isLoading} gradient="from-amber-500/10 to-amber-600/5" iconColor="text-amber-500" />
        <KpiCard icon={TrendingUp} label="Total Cost" value={`$${kpis.totalCost.toFixed(2)}`} loading={isLoading} gradient="from-purple-500/10 to-purple-600/5" iconColor="text-purple-500" />
      </div>

      {/* Trend Area Chart */}
      <Card className="border-border/40 shadow-sm overflow-hidden">
        <div className="px-5 pt-5 pb-1">
          <p className="text-sm font-semibold text-foreground">Message Trends</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Daily volume by channel</p>
        </div>
        <CardContent className="pb-4 pt-2 px-2">
          {isLoading ? (
            <Skeleton className="h-[260px] w-full rounded-xl" />
          ) : trendData.length === 0 ? (
            <EmptyChart />
          ) : (
            <ChartContainer config={channelChartConfig} className="h-[300px] w-full">
              <AreaChart data={trendData} margin={{ top: 8, right: 16, left: -4, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradSms" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHANNEL_COLORS.sms} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={CHANNEL_COLORS.sms} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradMms" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHANNEL_COLORS.mms} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={CHANNEL_COLORS.mms} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradWhatsapp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHANNEL_COLORS.whatsapp} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={CHANNEL_COLORS.whatsapp} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/20" vertical={false} />
                <XAxis
                  dataKey="date"
                  ticks={trendTicks}
                  interval="preserveStartEnd"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                  minTickGap={20}
                />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} className="text-muted-foreground" allowDecimals={false} />
                <ChartTooltip
                  cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1, strokeDasharray: "3 3" }}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(_label, payload) => {
                        const item = payload?.[0]?.payload as { fullDate?: string } | undefined;
                        return item?.fullDate ?? _label;
                      }}
                    />
                  }
                />
                <Area type="monotone" dataKey="sms" stroke={CHANNEL_COLORS.sms} strokeWidth={2} fill="url(#gradSms)" dot={false} activeDot={{ r: 4, strokeWidth: 2 }} />
                <Area type="monotone" dataKey="mms" stroke={CHANNEL_COLORS.mms} strokeWidth={2} fill="url(#gradMms)" dot={false} activeDot={{ r: 4, strokeWidth: 2 }} />
                <Area type="monotone" dataKey="whatsapp" stroke={CHANNEL_COLORS.whatsapp} strokeWidth={2} fill="url(#gradWhatsapp)" dot={false} activeDot={{ r: 4, strokeWidth: 2 }} />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Bottom charts row */}
      <div className="grid md:grid-cols-3 gap-3">
        {/* Channel Comparison */}
        <Card className="border-border/40 shadow-sm">
          <div className="px-5 pt-5 pb-1">
            <p className="text-sm font-semibold text-foreground">By Channel</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Total messages per channel</p>
          </div>
          <CardContent className="pb-4 pt-2 px-2">
            {isLoading ? (
              <Skeleton className="h-[200px] w-full rounded-xl" />
            ) : channelComparison.every((c) => c.total === 0) ? (
              <EmptyChart height={200} />
            ) : (
              <ChartContainer config={channelChartConfig} className="h-[200px] w-full">
                <BarChart data={channelComparison} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/20" vertical={false} />
                  <XAxis dataKey="channel" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="total" radius={[8, 8, 4, 4]} barSize={32}>
                    {channelComparison.map((entry) => (
                      <Cell key={entry.channel} fill={CHANNEL_COLORS[entry.channel.toLowerCase()] || CHANNEL_COLORS.sms} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Channel Distribution Donut */}
        <Card className="border-border/40 shadow-sm">
          <div className="px-5 pt-5 pb-1">
            <p className="text-sm font-semibold text-foreground">Distribution</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Channel share breakdown</p>
          </div>
          <CardContent className="flex flex-col items-center justify-center pb-4 pt-2">
            {isLoading ? (
              <Skeleton className="h-[180px] w-[180px] rounded-full" />
            ) : channelDistribution.length === 0 ? (
              <EmptyChart height={200} />
            ) : (
              <div className="relative">
                <ChartContainer config={channelChartConfig} className="h-[200px] w-full">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={channelDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      strokeWidth={0}
                      paddingAngle={3}
                    >
                      {channelDistribution.map((entry) => (
                        <Cell key={entry.name} fill={CHANNEL_COLORS[entry.name] || "hsl(220, 9%, 46%)"} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                {/* Center label */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{filtered.length}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">Total</p>
                  </div>
                </div>
              </div>
            )}
            {/* Legend */}
            {channelDistribution.length > 0 && !isLoading && (
              <div className="flex items-center gap-4 mt-1">
                {channelDistribution.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: CHANNEL_COLORS[entry.name] }} />
                    <span className="text-[11px] text-muted-foreground font-medium uppercase">{entry.name}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Breakdown */}
        <Card className="border-border/40 shadow-sm">
          <div className="px-5 pt-5 pb-1">
            <p className="text-sm font-semibold text-foreground">Delivery Status</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Message outcome breakdown</p>
          </div>
          <CardContent className="pb-4 pt-2 px-2">
            {isLoading ? (
              <Skeleton className="h-[200px] w-full rounded-xl" />
            ) : statusBreakdown.length === 0 ? (
              <EmptyChart height={200} />
            ) : (
              <ChartContainer config={statusChartConfig} className="h-[200px] w-full">
                <BarChart data={statusBreakdown} layout="vertical" margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/20" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={65} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" radius={[4, 8, 8, 4]} barSize={20}>
                    {statusBreakdown.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  loading,
  gradient,
  iconColor,
  subtitle,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  loading: boolean;
  gradient?: string;
  iconColor?: string;
  subtitle?: string;
}) {
  return (
    <Card className="border-border/40 shadow-sm overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground font-medium tracking-wide uppercase">{label}</p>
            {loading ? (
              <Skeleton className="h-7 w-14 mt-1.5" />
            ) : (
              <p className="text-2xl font-bold text-foreground mt-1 tracking-tight">
                {typeof value === "number" ? value.toLocaleString() : value}
              </p>
            )}
            {subtitle && !loading && (
              <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
          <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${gradient || "from-accent to-accent"} flex items-center justify-center shrink-0`}>
            <Icon className={`h-4 w-4 ${iconColor || "text-primary"}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyChart({ height = 220 }: { height?: number }) {
  return (
    <div className="flex items-center justify-center text-muted-foreground text-sm" style={{ height }}>
      <div className="text-center">
        <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-20" />
        <p className="text-xs">No data available</p>
      </div>
    </div>
  );
}
