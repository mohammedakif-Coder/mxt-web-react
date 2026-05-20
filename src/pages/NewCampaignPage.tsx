import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { campaignService } from "@/services/campaignService";
import { contactService } from "@/services/contactService";
import { messagingService } from "@/services/messagingService";
import { queryKeys } from "@/constants/queryKeys";
import { senderService } from "@/services/senderService";
import { templateService } from "@/services/templateService";
import { usePageTitle } from "@/hooks/use-page-title";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  Users,
  UserPlus,
  FileUp,
  MessageSquareText,
  Send,
  CalendarClock,
  Hourglass,
  Lightbulb,
  Plus,
  X,
  CheckCircle2,
  Loader2,
  CalendarIcon,
  Info,
} from "lucide-react";
import type { Sender, Template, ContactList } from "@/types/database";

type StepKey = "who" | "what" | "when" | "confirm";
type SendMode = "now" | "schedule" | "stagger";

const STEPS: { key: StepKey; label: string }[] = [
  { key: "who", label: "Who" },
  { key: "what", label: "What" },
  { key: "when", label: "When" },
  { key: "confirm", label: "Test & Confirm" },
];

const STEP_TIPS: Record<StepKey, { num: number; title: string; body: React.ReactNode }> = {
  who: {
    num: 1,
    title: "Step 1",
    body: (
      <>
        <p>
          Let's begin by picking a <strong>name</strong> for your Campaign. This name will be used in reporting to identify
          this Campaign and for comparison against other Campaigns.
        </p>
        <p className="mt-3">
          Pick the contact list to send to and choose a sender ID. You can manage lists from the Contacts area and senders
          from Sender IDs.
        </p>
      </>
    ),
  },
  what: {
    num: 4,
    title: "Step 2",
    body: (
      <>
        <p>
          The content of the message is the most important step! Use <strong>merge fields</strong> to personalize each SMS
          (e.g. <code>{`{{first_name}}`}</code>).
        </p>
        <p className="mt-3">
          You can also load a previously saved <strong>Template</strong>. Remember a single SMS is up to 160 characters —
          longer messages will split into multiple parts.
        </p>
        <p className="mt-3">Use <strong>Reply Rules</strong> to auto-handle common keywords like STOP, HELP or YES.</p>
      </>
    ),
  },
  when: {
    num: 5,
    title: "Step 3",
    body: (
      <>
        <p>Each option lets you send your Campaign in a different way to suit your business.</p>
        <p className="mt-2"><strong>Send it now</strong> — goes out immediately after you confirm.</p>
        <p className="mt-2"><strong>Schedule for later</strong> — pick a future date &amp; time for the entire Campaign.</p>
        <p className="mt-2">
          <strong>Stagger my Campaign</strong> — send in batches (e.g. 100 contacts every hour) until none remain. Great for
          monitoring response in detail.
        </p>
      </>
    ),
  },
  confirm: {
    num: 6,
    title: "Step 4",
    body: (
      <>
        <p>Review your Campaign carefully — once sent, it cannot be recalled.</p>
        <p className="mt-2">
          You can send a <strong>Test message</strong> to your own number to preview exactly how it will look on a handset.
        </p>
        <p className="mt-2">The estimated cost is calculated from segments × recipients.</p>
      </>
    ),
  },
};

const STOP_KEYWORDS = ["STOP", "STOPALL", "UNSUBSCRIBE"];

type ReplyTrigger = { id: string; keyword: string; response: string };

export default function NewCampaignPage() {
  usePageTitle("New Campaign");
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  const [step, setStep] = useState<StepKey>("who");

  // Step 1 — Who
  const [campaignName, setCampaignName] = useState("");
  const [selectedListId, setSelectedListId] = useState("");
  const [senderId, setSenderId] = useState("");

  // Step 2 — What
  const [body, setBody] = useState("");
  const [replyTriggers, setReplyTriggers] = useState<ReplyTrigger[]>([]);

  // Step 3 — When
  const [sendMode, setSendMode] = useState<SendMode>("now");
  const [scheduleDate, setScheduleDate] = useState<Date>();
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [staggerBatch, setStaggerBatch] = useState(100);
  const [staggerInterval, setStaggerInterval] = useState(60);

  // Step 4 — Test & Confirm
  const [testNumber, setTestNumber] = useState("");

  const { data: senders } = useQuery<Sender[]>({
    queryKey: queryKeys.sendersApproved,
    queryFn: senderService.listApprovedSenders,
  });
  const { data: contactLists } = useQuery<ContactList[]>({
    queryKey: queryKeys.contactLists,
    queryFn: contactService.listContactLists,
  });

  // Apply AI plan passed via navigation state from CampaignsPage
  useEffect(() => {
    const plan = (location.state as { aiPlan?: any } | null)?.aiPlan;
    if (!plan) return;
    if (plan.campaign_name) setCampaignName(plan.campaign_name);
    if (plan.message_body) setBody(plan.message_body);
    if (plan.recommended_list_id && contactLists?.some((l) => l.id === plan.recommended_list_id)) {
      setSelectedListId(plan.recommended_list_id);
    }
    const st = plan.send_time;
    if (st?.mode === "schedule" && st.recommended_iso) {
      const d = new Date(st.recommended_iso);
      if (!isNaN(d.getTime())) {
        setSendMode("schedule");
        setScheduleDate(d);
        setScheduleTime(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
      }
    } else if (st?.mode === "stagger") {
      setSendMode("stagger");
    } else if (st?.mode === "now") {
      setSendMode("now");
    }
    toast.success("AI plan applied — review each step before launching");
    // Clear state so refresh doesn't re-apply
    navigate(location.pathname, { replace: true, state: {} });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, contactLists]);
  const { data: templates } = useQuery<Template[]>({
    queryKey: queryKeys.templates,
    queryFn: templateService.listTemplates,
  });
  const { data: listMemberCount } = useQuery<number>({
    queryKey: ["list-member-count", selectedListId],
    enabled: !!selectedListId,
    queryFn: () => contactService.countMembers(selectedListId),
  });

  const recipientCount = listMemberCount ?? 0;
  const charCount = body.length;
  const segments = Math.max(1, Math.ceil(charCount / 160));
  const charsLeft = segments * 160 - charCount;
  const costPerMsg = segments * 0.05;
  const totalCost = costPerMsg * Math.max(1, recipientCount);

  const selectedList = contactLists?.find((l) => l.id === selectedListId);
  const selectedSender = senders?.find((s) => s.id === senderId);

  const insertMergeField = (field: string) => setBody((prev) => prev + `{{${field}}}`);

  const addTrigger = () =>
    setReplyTriggers((prev) => [...prev, { id: crypto.randomUUID(), keyword: "", response: "" }]);
  const updateTrigger = (id: string, patch: Partial<ReplyTrigger>) =>
    setReplyTriggers((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const removeTrigger = (id: string) => setReplyTriggers((prev) => prev.filter((t) => t.id !== id));

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  const canAdvance = useMemo(() => {
    if (step === "who") return !!campaignName.trim() && !!selectedListId && !!senderId;
    if (step === "what") return body.trim().length > 0;
    if (step === "when") {
      if (sendMode === "schedule") return !!scheduleDate;
      return true;
    }
    return true;
  }, [step, campaignName, selectedListId, senderId, body, sendMode, scheduleDate]);

  const goNext = () => {
    if (!canAdvance) return;
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next.key);
  };
  const goBack = () => {
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev.key);
  };

  const sendTestMutation = useMutation({
    mutationFn: async () => {
      const dest = testNumber.replace(/[^\d+]/g, "");
      if (!dest) throw new Error("Enter a test number");
      const origin = selectedSender?.sender_id ?? "MXT";
      await messagingService.sendTestMessage({ destination: dest, body, origin });
    },
    onSuccess: () => toast.success("Test message sent"),
    onError: (e: Error) => toast.error("Test failed", { description: e.message }),
  });

  const launchMutation = useMutation({
    mutationFn: async () => {
      const scheduledAt =
        sendMode === "schedule" && scheduleDate
          ? (() => {
              const [h, m] = scheduleTime.split(":").map(Number);
              const d = new Date(scheduleDate);
              d.setHours(h ?? 9, m ?? 0, 0, 0);
              return d.toISOString();
            })()
          : null;

      const status = sendMode === "now" ? "completed" : "scheduled";
      const sentAt = sendMode === "now" ? new Date().toISOString() : null;
      const delivered = sendMode === "now" ? recipientCount : 0;

      return campaignService.createCampaign({
        name: campaignName,
        body,
        channel: "sms",
        status,
        recipient_count: recipientCount,
        delivered_count: delivered,
        failed_count: 0,
        scheduled_at: scheduledAt,
        sent_at: sentAt,
      });
    },
    onSuccess: () => {
      toast.success(
        sendMode === "now" ? "Campaign sent!" : sendMode === "schedule" ? "Campaign scheduled" : "Stagger started",
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns });
      queryClient.invalidateQueries({ queryKey: queryKeys.activityLog });
      navigate("/campaigns");
    },
    onError: (e: Error) => toast.error("Failed to launch", { description: e.message }),
  });

  const tip = STEP_TIPS[step];

  return (
    <div className="mx-auto max-w-6xl space-y-5 animate-ios-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">New Campaign</h1>
          <p className="text-[13px] text-muted-foreground">Create &amp; send a bulk SMS campaign in 4 steps</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/campaigns")} className="rounded-xl ios-press">
            <X className="mr-1.5 h-4 w-4" /> Cancel
          </Button>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-stretch gap-1.5 overflow-x-auto">
        {STEPS.map((s, i) => {
          const active = i === stepIndex;
          const done = i < stepIndex;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => {
                if (i <= stepIndex) setStep(s.key);
              }}
              className={cn(
                "relative flex-1 min-w-[110px] h-10 px-5 text-[13px] font-semibold flex items-center justify-center transition-all duration-300 ease-ios",
                "[clip-path:polygon(0_0,calc(100%-14px)_0,100%_50%,calc(100%-14px)_100%,0_100%,14px_50%)]",
                i === 0 && "[clip-path:polygon(0_0,calc(100%-14px)_0,100%_50%,calc(100%-14px)_100%,0_100%)]",
                i === STEPS.length - 1 && "[clip-path:polygon(0_0,100%_0,100%_100%,0_100%,14px_50%)]",
                active && "bg-primary text-primary-foreground shadow-sm",
                done && "bg-primary/80 text-primary-foreground",
                !active && !done && "bg-accent/60 text-muted-foreground",
              )}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        {/* Form column */}
        <div className="lg:col-span-8">
          <Card className="glass rounded-2xl border-border/30">
            <CardContent className="p-5 space-y-5">
              {step === "who" && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-medium">
                      <span className="text-destructive mr-0.5">*</span> Campaign Name
                    </Label>
                    <Input
                      placeholder="Give your campaign a name"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      className="rounded-xl border-border/30"
                    />
                    <p className="text-[11px] text-muted-foreground italic">
                      Make sure it's something that you can easily identify later.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-medium">
                      <span className="text-destructive mr-0.5">*</span> To
                    </Label>
                    <Select value={selectedListId} onValueChange={setSelectedListId}>
                      <SelectTrigger className="rounded-xl border-border/30">
                        <SelectValue placeholder="Please select contact lists to send to" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {contactLists?.length ? (
                          contactLists.map((l) => (
                            <SelectItem key={l.id} value={l.id}>
                              {l.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-[12px] text-muted-foreground">No lists yet</div>
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground italic">
                      Choose the groups that you'd like to send to.
                    </p>
                    {recipientCount > 0 && (
                      <Badge variant="secondary" className="text-[11px] rounded-lg mt-1">
                        <Users className="mr-1 h-3 w-3" />
                        {recipientCount} recipient{recipientCount !== 1 ? "s" : ""}
                      </Badge>
                    )}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => navigate("/contacts-lists")}
                        className="h-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-[11px] ios-press"
                      >
                        <UserPlus className="mr-1.5 h-3 w-3" /> Forgot to create a group?
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => navigate("/contacts")}
                        className="h-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-[11px] ios-press"
                      >
                        <FileUp className="mr-1.5 h-3 w-3" /> Need to import contacts from a file?
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-medium">
                      <span className="text-destructive mr-0.5">*</span> From
                    </Label>
                    <Select value={senderId} onValueChange={setSenderId}>
                      <SelectTrigger className="rounded-xl border-border/30">
                        <SelectValue placeholder="Use shared numbers" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {senders?.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            <span className="font-medium">{s.name}</span>{" "}
                            <span className="text-muted-foreground">({s.sender_id})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {step === "what" && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-medium">
                      <span className="text-destructive mr-0.5">*</span> Message
                    </Label>
                    <Textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Type your campaign message here..."
                      className="min-h-[140px] rounded-xl border-border/30 text-[13px]"
                    />
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">{charCount} characters</span>
                      <span className="text-primary font-medium">
                        {charsLeft} characters left
                        {segments > 1 && <span className="text-muted-foreground ml-1">· {segments} parts</span>}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            size="sm"
                            className="h-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-[11px] ios-press"
                          >
                            <Plus className="mr-1 h-3 w-3" /> Insert Merge Field
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 rounded-xl" align="start">
                          {["first_name", "last_name", "phone", "company"].map((f) => (
                            <button
                              key={f}
                              className="w-full text-left px-2 py-1.5 text-[13px] rounded-lg hover:bg-accent/40"
                              onClick={() => insertMergeField(f)}
                            >{`{{${f}}}`}</button>
                          ))}
                        </PopoverContent>
                      </Popover>
                      <Select onValueChange={(id) => { const t = templates?.find((x) => x.id === id); if (t) setBody(t.body); }}>
                        <SelectTrigger className="w-[200px] h-8 text-[11px] rounded-xl border-border/30">
                          <SelectValue placeholder="Insert template..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {templates?.map((t) => (
                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Reply Rules */}
                  <div className="border-t border-border/30 pt-4 space-y-3">
                    <div>
                      <h3 className="text-[15px] font-semibold text-primary">Reply Rules</h3>
                      <p className="text-[12px] text-muted-foreground mt-0.5">When someone replies with:</p>
                    </div>

                    <div className="space-y-2 text-[11px] text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <span className="italic">
                          Please note that all keywords must be totally unique. E.g. Keywords "Apple" and "Apple1" would both
                          be activated by a response of "Apple".
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <span className="italic">
                          The replies {STOP_KEYWORDS.map((k, i) => <span key={k}>"{k}"{i < STOP_KEYWORDS.length - 1 ? ", " : ""}</span>)} are considered opt-out responses.
                        </span>
                      </div>
                    </div>

                    {replyTriggers.length > 0 && (
                      <div className="space-y-2">
                        {replyTriggers.map((t) => (
                          <div key={t.id} className="grid grid-cols-12 gap-2 items-start bg-accent/30 rounded-xl p-2.5">
                            <Input
                              placeholder="Keyword (e.g. YES)"
                              value={t.keyword}
                              onChange={(e) => updateTrigger(t.id, { keyword: e.target.value })}
                              className="col-span-4 h-8 text-[12px] rounded-lg border-border/30"
                            />
                            <Input
                              placeholder="Auto-reply response"
                              value={t.response}
                              onChange={(e) => updateTrigger(t.id, { response: e.target.value })}
                              className="col-span-7 h-8 text-[12px] rounded-lg border-border/30"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTrigger(t.id)}
                              className="col-span-1 h-8 w-8 p-0 rounded-lg ios-press"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <Button
                      type="button"
                      size="sm"
                      onClick={addTrigger}
                      className="h-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-[11px] ios-press"
                    >
                      <Plus className="mr-1 h-3 w-3" /> Create Reply Trigger
                    </Button>
                  </div>
                </>
              )}

              {step === "when" && (
                <div className="space-y-4">
                  <Label className="text-[14px] font-medium text-primary">
                    <span className="text-destructive mr-0.5">*</span> When do you want to send your campaign?
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {([
                      { v: "now", label: "Send it now", icon: Send },
                      { v: "schedule", label: "Schedule for later", icon: CalendarClock },
                      { v: "stagger", label: "Stagger my campaign", icon: Hourglass },
                    ] as { v: SendMode; label: string; icon: React.ComponentType<{ className?: string }> }[]).map((opt) => (
                      <button
                        key={opt.v}
                        type="button"
                        onClick={() => setSendMode(opt.v)}
                        className={cn(
                          "flex items-center justify-center gap-2 h-12 px-4 rounded-xl text-[13px] font-medium transition-all duration-300 ease-ios ios-press border",
                          sendMode === opt.v
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-accent/40 text-muted-foreground border-border/30",
                        )}
                      >
                        <opt.icon className="h-4 w-4" />
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {sendMode === "schedule" && (
                    <div className="bg-accent/30 rounded-xl p-3 space-y-2">
                      <Label className="text-[12px] font-medium">Pick a date &amp; time</Label>
                      <div className="flex items-center gap-3">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className={cn("text-[12px] rounded-xl border-border/30", !scheduleDate && "text-muted-foreground")}
                            >
                              <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                              {scheduleDate ? format(scheduleDate, "PPP") : "Pick date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                            <Calendar
                              mode="single"
                              selected={scheduleDate}
                              onSelect={setScheduleDate}
                              disabled={(d) => d < new Date()}
                              className="p-3 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <Input
                          type="time"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          className="w-32 h-9 text-[12px] rounded-xl border-border/30"
                        />
                      </div>
                    </div>
                  )}

                  {sendMode === "stagger" && (
                    <div className="bg-accent/30 rounded-xl p-3 space-y-3">
                      <Label className="text-[12px] font-medium">Batch settings</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-[11px] text-muted-foreground">Contacts per batch</Label>
                          <Input
                            type="number"
                            min={1}
                            value={staggerBatch}
                            onChange={(e) => setStaggerBatch(Number(e.target.value) || 1)}
                            className="rounded-xl border-border/30 h-9 text-[13px]"
                          />
                        </div>
                        <div>
                          <Label className="text-[11px] text-muted-foreground">Interval (minutes)</Label>
                          <Input
                            type="number"
                            min={1}
                            value={staggerInterval}
                            onChange={(e) => setStaggerInterval(Number(e.target.value) || 1)}
                            className="rounded-xl border-border/30 h-9 text-[13px]"
                          />
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground italic">
                        We'll send {staggerBatch} contacts every {staggerInterval} minutes until all {recipientCount}{" "}
                        recipients have received the message.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {step === "confirm" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-[15px] font-semibold">Review &amp; confirm</h3>
                    <p className="text-[12px] text-muted-foreground">
                      Double-check everything before you launch — campaigns can't be recalled.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[12px]">
                    {[
                      { k: "Campaign", v: campaignName || "—" },
                      { k: "List", v: selectedList?.name ?? "—" },
                      { k: "Recipients", v: recipientCount.toString() },
                      { k: "From", v: selectedSender?.sender_id ?? "—" },
                      {
                        k: "Send mode",
                        v:
                          sendMode === "now"
                            ? "Send it now"
                            : sendMode === "schedule"
                              ? scheduleDate
                                ? `${format(scheduleDate, "PP")} at ${scheduleTime}`
                                : "Schedule for later"
                              : `Stagger ${staggerBatch}/${staggerInterval}m`,
                      },
                      { k: "Segments", v: `${segments} (${charCount} chars)` },
                      { k: "Cost / msg", v: `$${costPerMsg.toFixed(2)}` },
                      { k: "Reply triggers", v: replyTriggers.length.toString() },
                    ].map((row) => (
                      <div key={row.k} className="flex justify-between bg-accent/30 rounded-xl px-3 py-2">
                        <span className="text-muted-foreground">{row.k}</span>
                        <span className="font-medium truncate ml-2">{row.v}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 space-y-2">
                    <Label className="text-[12px] font-medium">Send a test message first</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="+15551234567"
                        value={testNumber}
                        onChange={(e) => setTestNumber(e.target.value)}
                        className="rounded-xl border-border/30 h-9 text-[13px]"
                      />
                      <Button
                        size="sm"
                        onClick={() => sendTestMutation.mutate()}
                        disabled={!testNumber.trim() || sendTestMutation.isPending}
                        className="rounded-xl ios-press"
                      >
                        {sendTestMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send test"}
                      </Button>
                    </div>
                  </div>

                  <div className="bg-accent/30 rounded-xl p-3">
                    <p className="text-[11px] text-muted-foreground mb-1">Message preview</p>
                    <p className="text-[13px] whitespace-pre-wrap">{body || <span className="text-muted-foreground italic">No message</span>}</p>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <div className="text-[12px]">
                      <span className="text-muted-foreground">Total estimated cost: </span>
                      <span className="font-semibold text-primary">${totalCost.toFixed(2)}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      Balance: ${Number(profile?.balance ?? 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Nav buttons */}
              <div className="flex justify-between items-center pt-2 border-t border-border/30">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goBack}
                  disabled={stepIndex === 0}
                  className="rounded-xl ios-press border-border/30"
                >
                  <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
                </Button>

                {step !== "confirm" ? (
                  <Button
                    size="sm"
                    onClick={goNext}
                    disabled={!canAdvance}
                    className="rounded-xl ios-press bg-primary hover:bg-primary/90"
                  >
                    Next <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => launchMutation.mutate()}
                    disabled={launchMutation.isPending || recipientCount === 0}
                    className="rounded-xl ios-press bg-primary hover:bg-primary/90 px-5"
                  >
                    {launchMutation.isPending ? (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-1.5 h-4 w-4" />
                    )}
                    {sendMode === "now" ? "Launch Campaign" : sendMode === "schedule" ? "Schedule Campaign" : "Start Stagger"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tip column */}
        <div className="lg:col-span-4">
          <div className="sticky top-4">
            <div className="rounded-2xl overflow-hidden border border-primary/30 shadow-sm bg-card">
              <div className="bg-primary text-primary-foreground px-4 py-2.5 flex items-center justify-between">
                <span className="text-[14px] font-semibold">{tip.title}</span>
                <Lightbulb className="h-4 w-4 opacity-90" />
              </div>
              <div className="p-4 text-[12.5px] leading-relaxed text-foreground/85 space-y-1">{tip.body}</div>
              <div className="px-4 pb-3 -mt-1">
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="inline-flex items-center gap-1 text-[12px] text-primary hover:underline"
                >
                  <MessageSquareText className="h-3 w-3" /> Still need help?
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
