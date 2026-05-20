import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { campaignService } from "@/services/campaignService";
import { contactService } from "@/services/contactService";
import { messagingService } from "@/services/messagingService";
import { queryKeys } from "@/constants/queryKeys";
import { senderService } from "@/services/senderService";
import { templateService } from "@/services/templateService";
import { usePageTitle } from "@/hooks/use-page-title";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MessagePreview } from "@/components/MessagePreview";
import { Send, MessageSquare, Loader2, AlertTriangle, Users, Upload, CalendarIcon, Clock, X, CheckCircle2, Plus, FileText, Image, Paperclip, Smartphone, Link2 } from "lucide-react";
import AIButton from "@/features/ai/components/AIButton";

const SAMPLE_SHORT_URL_BASE = "https://mxt.link";

// Sample placeholder used in the composer/preview while the toggle is on so
// the user can judge segment length before the real short codes are minted on
// send. The 7 X's mirror the length of a real short code from the shortener.
const SAMPLE_SHORT_PLACEHOLDER = "XXXXXXX";
const SAMPLE_SHORT_URL = `${SAMPLE_SHORT_URL_BASE}/${SAMPLE_SHORT_PLACEHOLDER}`;

// Replace every detected URL with the fixed sample short URL. Used purely for
// display + char-count purposes — the original body is what we actually run
// through the real shortener at send time.
function applySampleShortening(text: string): string {
  const urls = extractUrls(text);
  if (urls.length === 0) return text;
  const unique = Array.from(new Set(urls)).sort((a, b) => b.length - a.length);
  let out = text;
  for (const u of unique) {
    out = out.split(u).join(SAMPLE_SHORT_URL);
  }
  return out;
}

// Matches http(s):// URLs and bare www.* URLs. Trailing punctuation that
// commonly hugs a URL in prose (.,;:!?)) is excluded so we don't shorten it.
const URL_REGEX = /\b((?:https?:\/\/|www\.)[^\s<>()"']+[^\s<>()"'.,;:!?)\]])/gi;

function extractUrls(text: string): string[] {
  const matches = text.match(URL_REGEX) ?? [];
  return Array.from(new Set(matches));
}

// Replace each detected URL with its shortened version. Duplicate URLs share
// a single API call. On failure we fall back to the original URL for that
// entry and surface a toast to the caller.
async function shortenUrlsInText(text: string): Promise<{ text: string; failed: string[] }> {
  const urls = extractUrls(text);
  if (urls.length === 0) return { text, failed: [] };
  return messagingService.shortenUrlsInText(text, urls);
}

// Brand-accurate WhatsApp glyph used in the channel selector.
const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M16.003 3C9.376 3 4 8.376 4 15.003c0 2.27.63 4.49 1.824 6.43L4 29l7.74-1.79a12.01 12.01 0 0 0 4.262.78h.005C22.633 27.99 28 22.614 28 15.99 28 12.78 26.75 9.77 24.482 7.508A11.93 11.93 0 0 0 16.003 3Zm0 21.79h-.004a9.96 9.96 0 0 1-3.804-.78l-.273-.108-4.59 1.06 1.075-4.475-.18-.29a9.94 9.94 0 0 1-1.526-5.197c.002-5.51 4.488-9.995 10.005-9.995 2.673 0 5.184 1.04 7.073 2.93a9.92 9.92 0 0 1 2.93 7.07c-.003 5.512-4.49 10-10.006 10ZM21.49 17.65c-.3-.15-1.77-.873-2.045-.973-.275-.1-.475-.15-.674.15-.2.3-.774.972-.95 1.172-.175.2-.35.224-.65.075-.3-.15-1.265-.466-2.41-1.486-.89-.794-1.49-1.776-1.665-2.076-.175-.3-.018-.462.13-.612.133-.133.3-.35.45-.524.15-.175.2-.3.3-.5.1-.2.05-.374-.025-.524-.075-.15-.674-1.625-.924-2.225-.244-.585-.49-.506-.674-.515l-.575-.01c-.2 0-.524.075-.8.374-.275.3-1.05 1.025-1.05 2.5s1.075 2.9 1.225 3.1c.15.2 2.116 3.23 5.124 4.527.717.31 1.276.495 1.712.633.72.23 1.374.197 1.892.12.577-.087 1.77-.724 2.02-1.422.25-.7.25-1.298.175-1.422-.075-.125-.275-.2-.575-.35Z"/>
  </svg>
);
import { useAIPanel } from "@/contexts/AIPanelContext";
import type { Sender, Template, Contact, ContactList } from "@/types/database";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type RecipientMode = "manual" | "contacts" | "list" | "csv";
type Channel = "sms" | "mms" | "whatsapp";

export default function ComposePage() {
  usePageTitle("Messages");
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const { openPanel, composeData, generatedMessage, setGeneratedMessage } = useAIPanel();

  const [recipientMode, setRecipientMode] = useState<RecipientMode>("manual");
  const [manualRecipients, setManualRecipients] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [selectedListId, setSelectedListId] = useState("");
  const [csvRecipients, setCsvRecipients] = useState<string[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [body, setBody] = useState("");

  // When the AI compose flow finishes, drop the generated message into the body.
  useEffect(() => {
    if (generatedMessage) {
      setBody(generatedMessage);
      setGeneratedMessage("");
    }
  }, [generatedMessage, setGeneratedMessage]);
  const [channel, setChannel] = useState<Channel>("sms");
  const [senderId, setSenderId] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date>();
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [dismissedWarnings, setDismissedWarnings] = useState<string[]>([]);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviewUrls, setMediaPreviewUrls] = useState<string[]>([]);
  const [shortenUrls, setShortenUrls] = useState(false);

  // Detected URLs in the message body — drives the toggle's enabled state
  // and is also used to short-circuit the shortening step on send.
  const detectedUrls = useMemo(() => extractUrls(body), [body]);
  const hasUrls = detectedUrls.length > 0;

  // Auto-disable the toggle if the user removes every URL from the body.
  useEffect(() => {
    if (!hasUrls && shortenUrls) setShortenUrls(false);
  }, [hasUrls, shortenUrls]);

  // Body with each URL swapped for the fixed sample short URL — this is what
  // the composer textarea + preview render whenever the Shorten URLs toggle
  // is on, so the user can judge final character/segment counts before send.
  const displayBody = useMemo(
    () => (shortenUrls && hasUrls ? applySampleShortening(body) : body),
    [shortenUrls, hasUrls, body],
  );

  const { data: senders } = useQuery<Sender[]>({ queryKey: queryKeys.sendersApproved, queryFn: senderService.listApprovedSenders });
  const { data: templates } = useQuery<Template[]>({ queryKey: queryKeys.templates, queryFn: templateService.listTemplates });
  const { data: contacts } = useQuery<Contact[]>({ queryKey: queryKeys.contacts, queryFn: () => contactService.listContacts() });
  const { data: contactLists } = useQuery<ContactList[]>({ queryKey: queryKeys.contactLists, queryFn: contactService.listContactLists });
  const { data: listMemberCount } = useQuery<number>({ queryKey: ["list-member-count", selectedListId], enabled: !!selectedListId, queryFn: () => contactService.countMembers(selectedListId) });

  const filteredContacts = contacts?.filter(c => c.full_name.toLowerCase().includes(contactSearch.toLowerCase()) || c.phone.includes(contactSearch)).slice(0, 8);

  const recipientCount = useMemo(() => {
    switch (recipientMode) {
      case "manual": return manualRecipients.split(/[,;\n]/).filter(r => r.trim()).length;
      case "contacts": return selectedContacts.length;
      case "list": return listMemberCount ?? 0;
      case "csv": return csvRecipients.length;
      default: return 0;
    }
  }, [recipientMode, manualRecipients, selectedContacts, listMemberCount, csvRecipients]);

  // Char/segment counts reflect what the recipient will actually see — so
  // when the Shorten URLs toggle is on we count the sample-shortened body.
  const charCount = displayBody.length;
  const smsSegments = Math.max(1, Math.ceil(charCount / 160));
  const costPerMsg = channel === "sms" ? smsSegments * 0.05 : channel === "mms" ? 0.15 : 0.08;
  const totalCost = costPerMsg * Math.max(1, recipientCount);
  const mergeFields = body.match(/\{\{(\w+)\}\}/g) ?? [];

  const warnings: { id: string; severity: "warning" | "error"; text: string }[] = [];
  if (!senders?.length) warnings.push({ id: "no-senders", severity: "error", text: "No approved sender IDs available." });
  if (smsSegments > 3 && channel === "sms") warnings.push({ id: "long-msg", severity: "warning", text: `Message is ${smsSegments} segments (${charCount} chars).` });
  if (mergeFields.length > 0 && recipientMode === "manual") warnings.push({ id: "merge-no-data", severity: "warning", text: `Merge fields used but no contact data to resolve them.` });
  if (totalCost > (profile ? Number(profile.balance) : 0)) warnings.push({ id: "insufficient", severity: "error", text: `Estimated cost $${totalCost.toFixed(2)} exceeds balance.` });
  if (channel === "mms" && mediaFiles.length === 0) warnings.push({ id: "no-media", severity: "warning", text: "MMS selected but no media attached." });

  const activeWarnings = warnings.filter(w => !dismissedWarnings.includes(w.id));
  const canSend = recipientCount > 0 && body.trim().length > 0 && senderId;

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const maxSize = 5 * 1024 * 1024; // 5MB
    const validFiles = files.filter(f => {
      if (f.size > maxSize) { toast.error(`${f.name} exceeds 5MB limit`); return false; }
      return true;
    });

    setMediaFiles(prev => [...prev, ...validFiles]);

    validFiles.forEach(file => {
      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        setMediaPreviewUrls(prev => [...prev, url]);
      }
    });

    // Auto-switch to MMS if adding media while on SMS
    if (channel === "sms" && validFiles.length > 0) {
      setChannel("mms");
      toast.info("Switched to MMS for media attachment");
    }
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviewUrls(prev => {
      const url = prev[index];
      if (url) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { const text = ev.target?.result as string; const phones = text.split("\n").slice(1).map(l => l.split(",")[0]?.trim()).filter(Boolean); setCsvRecipients(phones); toast.success(`Loaded ${phones.length} recipients`); };
    reader.readAsText(file);
  };

  const insertMergeField = (field: string) => setBody(prev => prev + `{{${field}}}`);

  const sendMutation = useMutation({
    mutationFn: async () => {
      const selectedSender = senders?.find(s => s.id === senderId);
      const recipientsList = recipientMode === "manual" ? manualRecipients.split(/[,;\n]/).filter(r => r.trim()) : recipientMode === "contacts" ? selectedContacts.map(cid => contacts?.find(c => c.id === cid)?.phone ?? "") : recipientMode === "csv" ? csvRecipients : [];
      const primaryRecipient = recipientsList[0] ?? "bulk";

      let realSendStatus: "delivered" | "failed" = "delivered";
      let realSendError: string | null = null;

      // Run URL shortening once up-front (before personalization) when the
      // toggle is on. We share the shortened result across every recipient
      // so we don't burn an API call per contact for the same link.
      let bodyToSend = body;
      if (shortenUrls && hasUrls) {
        try {
          const { text, failed } = await shortenUrlsInText(body);
          bodyToSend = text;
          if (failed.length > 0) {
            toast.warning(`Could not shorten ${failed.length} URL${failed.length > 1 ? "s" : ""} — original link${failed.length > 1 ? "s" : ""} kept.`);
          }
        } catch (e) {
          toast.warning("URL shortener unavailable — sending original links.");
        }
      }

      // Resolve {{merge_field}} placeholders against a contact (when available).
      // Falls back to an empty string for unknown fields so recipients never see
      // raw "{{first_name}}" tokens in the SMS they receive.
      const personalize = (template: string, contact?: Contact): string => {
        const fullName = contact?.full_name?.trim() ?? "";
        const [firstName, ...rest] = fullName.split(/\s+/);
        const lastName = rest.join(" ");
        const fields: Record<string, string> = {
          first_name: firstName ?? "",
          last_name: lastName ?? "",
          full_name: fullName,
          name: fullName,
          phone: contact?.phone ?? "",
          email: contact?.email ?? "",
          company: "",
        };
        return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => fields[key] ?? "");
      };

      // Only SMS goes through SMSGlobal. MMS/WhatsApp remain simulated.
      if (channel === "sms" && recipientsList.length > 0) {
        const cleanedDest = recipientsList
          .map(r => r.replace(/[^\d+]/g, ""))
          .filter(Boolean);
        const origin = selectedSender?.sender_id ?? "MXT";

        // If the message uses merge fields and we have contact data, send one
        // personalized SMS per recipient. Otherwise fall back to a single bulk
        // send with any unresolved tokens stripped.
        const hasMergeFields = /\{\{\s*\w+\s*\}\}/.test(bodyToSend);
        if (hasMergeFields && recipientMode === "contacts") {
          for (const cid of selectedContacts) {
            const contact = contacts?.find(c => c.id === cid);
            const dest = (contact?.phone ?? "").replace(/[^\d+]/g, "");
            if (!dest) continue;
            const personalizedBody = personalize(bodyToSend, contact);
            await messagingService.sendTestMessage({ destination: dest, body: personalizedBody, origin });
          }
        } else {
          const cleanedBody = personalize(bodyToSend);
          await Promise.all(cleanedDest.map((destination) => messagingService.sendTestMessage({ destination, body: cleanedBody, origin })));
        }
      }

      // For MMS/WhatsApp, upload local attachments to the public mms-media
      // bucket so they have a real URL we can persist on the message and
      // (in the future) hand to a carrier. SMS never carries media.
      let uploadedMediaUrls: string[] = [];
      if ((channel === "mms" || channel === "whatsapp") && mediaFiles.length > 0) {
        try {
          uploadedMediaUrls = await messagingService.uploadMedia(mediaFiles);
        } catch (e) {
          realSendStatus = "failed";
          realSendError = e instanceof Error ? `Media upload failed: ${e.message}` : "Media upload failed";
        }
      }

      // Prototype reality check: we don't yet have an MMS-capable carrier
      // wired up, so MMS messages are stored + previewed but not delivered
      // to the handset. Make that explicit instead of silently faking it.
      if (channel === "mms" && realSendStatus === "delivered") {
        toast.info("MMS saved (simulated)", {
          description: "No MMS carrier is configured yet — the message and media are stored but not delivered to the handset.",
        });
      }

      const contactMatch = contacts?.find(c => c.phone === primaryRecipient);
      const msg = await messagingService.sendMessage({
        recipients: recipientsList,
        body: bodyToSend,
        channel,
        senderId: selectedSender?.sender_id ?? "MXT",
        cost: totalCost,
        mediaUrls: uploadedMediaUrls,
        recipientName: contactMatch?.full_name ?? null,
      });
      if (campaignName.trim()) {
        await campaignService.createCampaign({
          name: campaignName,
          body: bodyToSend,
          channel,
          status: scheduleEnabled ? "scheduled" : realSendStatus === "failed" ? "failed" : "completed",
          recipient_count: recipientCount,
          delivered_count: realSendStatus === "delivered" ? recipientCount : 0,
          failed_count: realSendStatus === "failed" ? recipientCount : 0,
          scheduled_at: scheduleEnabled && scheduleDate ? scheduleDate.toISOString() : null,
          sent_at: scheduleEnabled ? null : new Date().toISOString(),
        });
      }
      if (realSendError) throw new Error(realSendError);
      return msg;
    },
    onSuccess: (msg) => { toast.success("Message sent!", { description: `ID: ${msg.id.slice(0, 8)}` }); queryClient.invalidateQueries({ queryKey: queryKeys.activityLog }); queryClient.invalidateQueries({ queryKey: queryKeys.recentActivity }); queryClient.invalidateQueries({ queryKey: queryKeys.profile }); queryClient.invalidateQueries({ queryKey: queryKeys.campaigns }); navigate("/activity"); },
    onError: (err: Error) => toast.error("Failed to send", { description: err.message }),
  });

  const channelConfig: { value: Channel; label: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
    { value: "sms", label: "SMS", icon: MessageSquare, color: "bg-primary text-primary-foreground" },
    { value: "mms", label: "MMS", icon: Image, color: "bg-violet-600 text-white" },
    { value: "whatsapp", label: "WhatsApp", icon: WhatsAppIcon, color: "bg-[#25D366] text-white" },
  ];

  const senderName = senders?.find(s => s.id === senderId)?.name || senders?.find(s => s.id === senderId)?.sender_id || "MXT";

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-ios-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Compose Message</h1><p className="text-[13px] text-muted-foreground">Send SMS, MMS or WhatsApp messages</p></div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("text-[11px] rounded-lg border-border/30", channel === "whatsapp" && "border-[#25D366]/30 text-[#25D366]", channel === "mms" && "border-violet-500/30 text-violet-600")}>
            {channelConfig.find(c => c.value === channel)?.label}
          </Badge>
          <Badge variant="outline" className="text-[11px] rounded-lg border-primary/20 text-primary">Est. ${totalCost.toFixed(2)}</Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-4">
          {/* Channel selector */}
          <Card className="glass rounded-2xl border-border/30">
            <CardContent className="pt-4 pb-4">
              <div className="flex justify-center gap-2">
                {channelConfig.map(ch => (
                  <Button
                    key={ch.value}
                    variant={channel === ch.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setChannel(ch.value)}
                    className={cn(
                      "rounded-xl ios-press transition-all duration-300",
                      channel === ch.value ? `${ch.color} shadow-sm` : "border-border/30"
                    )}
                  >
                    <ch.icon className="mr-1.5 h-4 w-4" /> {ch.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recipients — bumped z-index so the contact-search dropdown sits
              above the next "From" card (both use `glass` which creates a
              stacking context that would otherwise clip the popover). */}
          <Card className="glass rounded-2xl border-border/30 relative z-30">
            <CardHeader className="pb-3">
              <CardTitle className="text-[13px] font-medium flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="shrink-0">To</span>
                  <div className="flex gap-1 flex-nowrap overflow-x-auto">
                    {(["manual", "contacts", "list", "csv"] as RecipientMode[]).map(mode => (
                      <Button key={mode} variant={recipientMode === mode ? "default" : "ghost"} size="sm" className={cn("text-[11px] rounded-xl ios-press shrink-0 h-7 px-2.5", recipientMode === mode ? "bg-primary/10 text-primary hover:bg-primary/20 shadow-sm" : "")} onClick={() => setRecipientMode(mode)}>
                        {mode === "manual" ? "Phone Numbers" : mode === "contacts" ? "Contacts" : mode === "list" ? "Contact List" : "CSV Upload"}
                      </Button>
                    ))}
                  </div>
                </div>
                {recipientCount > 0 && <Badge variant="secondary" className="text-[11px] rounded-lg shrink-0"><Users className="mr-1 h-3 w-3" />{recipientCount} recipient{recipientCount !== 1 ? "s" : ""}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recipientMode === "manual" && <Textarea placeholder="Enter phone numbers (comma-separated)" value={manualRecipients} onChange={e => setManualRecipients(e.target.value)} className="min-h-[80px] font-mono text-[13px] rounded-xl border-border/30" />}
              {recipientMode === "contacts" && (
                <div className="relative">
                  <Input placeholder="Search contacts..." value={contactSearch} onChange={e => { setContactSearch(e.target.value); setShowContactDropdown(true); }} onFocus={() => setShowContactDropdown(true)} onBlur={() => setTimeout(() => setShowContactDropdown(false), 200)} className="rounded-xl border-border/30" />
                  {showContactDropdown && contactSearch && filteredContacts && filteredContacts.length > 0 && (
                    <div className="absolute z-50 mt-1 w-full rounded-xl border border-border/30 bg-popover text-popover-foreground shadow-lg max-h-48 overflow-auto">
                      {filteredContacts.map(c => (
                        <button key={c.id} className="flex w-full items-center gap-2 px-3 py-2 text-[13px] hover:bg-accent/40 transition-colors duration-300 ease-ios" onMouseDown={() => { if (!selectedContacts.includes(c.id)) setSelectedContacts(prev => [...prev, c.id]); setContactSearch(""); setShowContactDropdown(false); }}>
                          <span className="font-medium">{c.full_name}</span><span className="text-muted-foreground">{c.phone}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedContacts.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {selectedContacts.map(cid => { const c = contacts?.find(x => x.id === cid); return c ? <Badge key={cid} variant="secondary" className="text-[11px] rounded-lg gap-1">{c.full_name}<X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedContacts(prev => prev.filter(x => x !== cid))} /></Badge> : null; })}
                    </div>
                  )}
                </div>
              )}
              {recipientMode === "list" && <Select value={selectedListId} onValueChange={setSelectedListId}><SelectTrigger className="rounded-xl border-border/30"><SelectValue placeholder="Choose a contact list..." /></SelectTrigger><SelectContent className="rounded-xl">{contactLists?.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent></Select>}
              {recipientMode === "csv" && (
                <div className="border-2 border-dashed border-border/30 rounded-2xl p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-[13px] text-muted-foreground mb-2">Upload CSV with phone numbers</p>
                  <Input type="file" accept=".csv" onChange={handleCsvUpload} className="max-w-xs mx-auto rounded-xl" />
                  {csvRecipients.length > 0 && <Badge variant="secondary" className="mt-2 rounded-lg"><CheckCircle2 className="mr-1 h-3 w-3" />{csvRecipients.length} loaded</Badge>}
                </div>
              )}
            </CardContent>
          </Card>

          {/* From */}
          <Card className="glass rounded-2xl border-border/30 relative z-10">
            <CardHeader className="pb-3"><CardTitle className="text-[13px] font-medium">From</CardTitle></CardHeader>
            <CardContent>
              {senders && senders.length > 0 ? (
                <Select value={senderId} onValueChange={setSenderId}>
                  <SelectTrigger className="rounded-xl border-border/30"><SelectValue placeholder="Select sender ID" /></SelectTrigger>
                  <SelectContent className="rounded-xl">{senders.map(s => <SelectItem key={s.id} value={s.id}><span className="font-medium">{s.name}</span> <span className="text-muted-foreground">({s.sender_id})</span></SelectItem>)}</SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-2 text-[13px] text-warning bg-warning/10 rounded-xl p-3"><AlertTriangle className="h-4 w-4 shrink-0" /><span>No approved sender IDs.</span></div>
              )}
            </CardContent>
          </Card>

          {/* Message */}
          <Card className="glass rounded-2xl border-border/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-[13px] font-medium flex items-center justify-between gap-2">
                <span>Message</span>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-normal">
                  <span>{charCount} chars</span>
                  {channel === "sms" && <Badge variant="secondary" className="text-[10px] rounded-lg">{smsSegments} segment{smsSegments > 1 ? "s" : ""}</Badge>}
                  {channel === "mms" && <Badge variant="secondary" className="text-[10px] rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">{mediaFiles.length} file{mediaFiles.length !== 1 ? "s" : ""}</Badge>}
                  <AIButton
                    size="sm"
                    shape="pill"
                    onClick={() => openPanel("compose-guide")}
                    className="h-7 px-3 text-[11px] ml-1"
                  >
                    Compose with AI
                  </AIButton>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Type your message..."
                value={displayBody}
                onChange={e => setBody(e.target.value)}
                readOnly={shortenUrls && hasUrls}
                className={cn(
                  "min-h-[140px] rounded-xl border-border/30 text-[13px]",
                  shortenUrls && hasUrls && "bg-muted/40 cursor-not-allowed",
                )}
              />
              {shortenUrls && hasUrls && (
                <p className="text-[11px] text-muted-foreground -mt-1">
                  Showing sample shortened URLs. Turn off "Shorten URLs" to edit links.
                </p>
              )}

              {/* Media attachments for MMS/WhatsApp */}
              {(channel === "mms" || channel === "whatsapp") && (
                <div className="space-y-3">
                  {mediaPreviewUrls.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {mediaPreviewUrls.map((url, i) => (
                        <div key={i} className="relative group">
                          <img src={url} alt={`Attachment ${i + 1}`} className="h-20 w-20 object-cover rounded-xl border border-border/30" />
                          <button
                            onClick={() => removeMedia(i)}
                            className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {mediaFiles.filter(f => !f.type.startsWith("image/")).length > 0 && (
                    <div className="space-y-1.5">
                      {mediaFiles.filter(f => !f.type.startsWith("image/")).map((f, i) => (
                        <div key={i} className="flex items-center gap-2 bg-muted/40 rounded-xl px-3 py-2 text-[12px]">
                          <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="truncate flex-1">{f.name}</span>
                          <span className="text-muted-foreground">{(f.size / 1024).toFixed(0)}KB</span>
                          <button onClick={() => removeMedia(mediaFiles.indexOf(f))}><X className="h-3 w-3 text-muted-foreground hover:text-destructive" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  <input ref={mediaInputRef} type="file" accept="image/*,video/*,.pdf,.doc,.docx" multiple className="hidden" onChange={handleMediaUpload} />
                  <Button variant="outline" size="sm" className="text-[11px] rounded-xl border-border/30 ios-press" onClick={() => mediaInputRef.current?.click()}>
                    <Paperclip className="mr-1.5 h-3.5 w-3.5" /> Attach Media
                  </Button>
                </div>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                <Popover>
                  <PopoverTrigger asChild><Button variant="outline" size="sm" className="text-[11px] rounded-xl border-border/30 ios-press"><Plus className="mr-1 h-3 w-3" /> Merge Field</Button></PopoverTrigger>
                  <PopoverContent className="w-48 p-2 rounded-xl" align="start">
                    {["first_name", "last_name", "phone", "company"].map(f => <button key={f} className="w-full text-left px-2 py-1.5 text-[13px] rounded-lg hover:bg-accent/40 transition-colors duration-300 ease-ios" onClick={() => insertMergeField(f)}>{`{{${f}}}`}</button>)}
                  </PopoverContent>
                </Popover>
                <Select onValueChange={id => { const t = templates?.find(x => x.id === id); if (t) setBody(t.body); }}>
                  <SelectTrigger className="w-[180px] h-8 text-[11px] rounded-xl border-border/30"><FileText className="mr-1 h-3 w-3" /><SelectValue placeholder="Insert template..." /></SelectTrigger>
                  <SelectContent className="rounded-xl">{templates?.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
                <div
                  className={cn(
                    "ml-auto flex items-center gap-2 rounded-xl border px-2.5 py-1.5 transition-colors",
                    hasUrls
                      ? "border-primary/30 bg-primary/5"
                      : "border-border/30 bg-muted/30 opacity-60",
                  )}
                  title={hasUrls ? "Replace URLs with shortened links" : "Add a URL to enable shortening"}
                >
                  <Link2 className={cn("h-3.5 w-3.5", hasUrls ? "text-primary" : "text-muted-foreground")} />
                  <Label htmlFor="shorten-urls-toggle" className="text-[11px] font-medium cursor-pointer select-none">
                    Shorten URLs
                    {hasUrls && (
                      <span className="ml-1 text-muted-foreground font-normal">
                        ({detectedUrls.length})
                      </span>
                    )}
                  </Label>
                  <Switch
                    id="shorten-urls-toggle"
                    checked={shortenUrls}
                    onCheckedChange={setShortenUrls}
                    disabled={!hasUrls}
                    className="scale-90"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card className="glass rounded-2xl border-border/30">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /><Label className="text-[13px] font-medium">Schedule for later</Label></div>
                <Switch checked={scheduleEnabled} onCheckedChange={setScheduleEnabled} />
              </div>
              {scheduleEnabled && (
                <div className="flex items-center gap-3 mt-3">
                  <Popover>
                    <PopoverTrigger asChild><Button variant="outline" size="sm" className={cn("text-[11px] rounded-xl border-border/30", !scheduleDate && "text-muted-foreground")}><CalendarIcon className="mr-1.5 h-3 w-3" />{scheduleDate ? format(scheduleDate, "PPP") : "Pick date"}</Button></PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-xl" align="start"><Calendar mode="single" selected={scheduleDate} onSelect={setScheduleDate} disabled={d => d < new Date()} className="p-3 pointer-events-auto" /></PopoverContent>
                  </Popover>
                  <Input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} className="w-32 h-8 text-[11px] rounded-xl border-border/30" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Campaign name */}
          <Card className="glass rounded-2xl border-border/30">
            <CardContent className="pt-4 pb-4">
              <Label className="text-[13px] font-medium flex items-center gap-2 mb-2">Campaign Name <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input placeholder="e.g. June Promo Blast" value={campaignName} onChange={e => setCampaignName(e.target.value)} className="rounded-xl border-border/30" />
            </CardContent>
          </Card>
        </div>

        {/* Right column: Preview + Warnings + Summary */}
        <div className="lg:col-span-5 space-y-4">
          {/* Channel-specific preview */}
          <MessagePreview
            channel={channel}
            message={displayBody}
            from={senderName}
            mediaFiles={mediaFiles}
            mediaPreviewUrls={mediaPreviewUrls}
            highlightUrl={shortenUrls && hasUrls ? SAMPLE_SHORT_URL : undefined}
          />

          {activeWarnings.length > 0 && (
            <Card className="glass rounded-2xl border-warning/30">
              <CardHeader className="pb-2"><CardTitle className="text-[13px] font-medium flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" /> Pre-flight Checks</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {activeWarnings.map(w => (
                  <div key={w.id} className={cn("flex items-start gap-2 text-[11px] rounded-xl p-2", w.severity === "error" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning")}>
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" /><span className="flex-1">{w.text}</span>
                    <button className="ios-press" onClick={() => setDismissedWarnings(prev => [...prev, w.id])}><X className="h-3 w-3" /></button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="glass rounded-2xl border-border/30">
            <CardHeader className="pb-2"><CardTitle className="text-[13px] font-medium">Send Summary</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-[13px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Recipients</span><span className="font-medium">{recipientCount}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Channel</span><span className="font-medium">{channel.toUpperCase()}</span></div>
              {channel === "sms" && <div className="flex justify-between"><span className="text-muted-foreground">Segments</span><span className="font-medium">{smsSegments}</span></div>}
              {(channel === "mms" || channel === "whatsapp") && <div className="flex justify-between"><span className="text-muted-foreground">Attachments</span><span className="font-medium">{mediaFiles.length}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Cost per msg</span><span className="font-medium">${costPerMsg.toFixed(2)}</span></div>
              <div className="border-t border-border/30 pt-2 flex justify-between font-semibold"><span>Total Est.</span><span className="text-primary">${totalCost.toFixed(2)}</span></div>
            </CardContent>
          </Card>

          <Button onClick={() => sendMutation.mutate()} disabled={!canSend || sendMutation.isPending} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/15 h-12 text-base rounded-xl ios-press">
            {sendMutation.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
            {scheduleEnabled ? "Schedule Send" : "Send Message"}
          </Button>
          <div className="text-center text-[11px] text-muted-foreground">Balance: <span className="font-medium">${Number(profile?.balance ?? 0).toFixed(2)}</span></div>
        </div>
      </div>
    </div>
  );
}
