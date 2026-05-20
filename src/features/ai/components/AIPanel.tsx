import { Bot, Send, X, Sparkles, ArrowLeft, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAIPanel } from "@/contexts/AIPanelContext";
import { useState, useEffect, useRef } from "react";
import { aiService } from "@/services/aiService";
import { toast } from "sonner";

interface AIPanelProps {
  open: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    key: "type" as const,
    question: "What type of message are you sending?",
    options: [
      "Appointments & Reminders",
      "Promotions & Offers",
      "Sales Follow-ups",
      "Transactional Updates",
      "Feedback & Engagement",
    ],
  },
  {
    key: "length" as const,
    question: "What should be the length of your message?",
    options: ["Short", "Medium", "Long"],
  },
  {
    key: "tone" as const,
    question: "What tone should your message have?",
    options: ["Formal", "Casual", "Semi-Formal"],
  },
];

const ComposeGuide = () => {
  const { composeData, setComposeData, setGeneratedMessage, closePanel } = useAIPanel();
  const [step, setStep] = useState(0);
  const [contextDraft, setContextDraft] = useState(composeData.context);
  const [generating, setGenerating] = useState(false);

  // Reset draft when context changes externally
  useEffect(() => setContextDraft(composeData.context), [composeData.context]);

  const totalSteps = STEPS.length + 1;
  const isContextStep = step === STEPS.length;

  const handleSelect = (key: "type" | "length" | "tone", value: string) => {
    setComposeData({ ...composeData, [key]: value });
    // Auto-advance
    setTimeout(() => setStep((s) => Math.min(s + 1, totalSteps - 1)), 150);
  };

  const handleBack = () => setStep((s) => Math.max(0, s - 1));

  const handleFinish = async () => {
    const finalData = { ...composeData, context: contextDraft };
    setComposeData(finalData);
    setGenerating(true);
    try {
      const msg = await aiService.composeMessage(finalData);
      setGeneratedMessage(msg);
      toast.success("Message generated", { description: "Inserted into the editor." });
      closePanel();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error("Couldn't generate message", { description: message });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <div className="px-4 pt-1 pb-3">
        <div className="bg-accent/50 rounded-2xl p-3">
          <p className="text-[12px] leading-relaxed text-foreground">
            Hello, let's get you started on writing your message. Help me out with some starter questions.
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="px-4 pb-2 flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground">
          Step {step + 1} of {totalSteps}
        </span>
        <div className="flex gap-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 w-6 rounded-full transition-colors duration-300",
                i <= step ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-3 scrollbar-thin">
        {!isContextStep ? (
          <div className="animate-ios-fade-in space-y-3">
            <p className="text-[13px] font-medium text-foreground">{STEPS[step].question}</p>
            <div className="flex flex-col gap-2">
              {STEPS[step].options.map((opt) => {
                const selected = composeData[STEPS[step].key] === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => handleSelect(STEPS[step].key, opt)}
                    className={cn(
                      "text-left text-[13px] px-3 py-2.5 rounded-xl border transition-all duration-200 ios-press flex items-center justify-between",
                      selected
                        ? "border-primary bg-primary/10 text-primary font-medium shadow-sm"
                        : "border-border/40 hover:border-border hover:bg-accent/40"
                    )}
                  >
                    <span>{opt}</span>
                    {selected && <Check className="h-3.5 w-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="animate-ios-fade-in space-y-3">
            <p className="text-[13px] font-medium text-foreground">
              Now tell me briefly what it's going to be about specifically.
            </p>
            <Textarea
              value={contextDraft}
              onChange={(e) => setContextDraft(e.target.value)}
              placeholder="e.g. Appointment reminder for dental check-up tomorrow at 5 PM"
              className="min-h-[120px] rounded-xl text-[13px] border-border/40"
            />
            <div className="rounded-xl bg-muted/40 p-3 space-y-1">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Summary</p>
              <p className="text-[12px]"><span className="text-muted-foreground">Type:</span> {composeData.type || "—"}</p>
              <p className="text-[12px]"><span className="text-muted-foreground">Length:</span> {composeData.length || "—"}</p>
              <p className="text-[12px]"><span className="text-muted-foreground">Tone:</span> {composeData.tone || "—"}</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 flex gap-2 border-t border-border/30">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          disabled={step === 0 || generating}
          className="rounded-xl ios-press"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
        </Button>
        {isContextStep && (
          <Button
            size="sm"
            onClick={handleFinish}
            disabled={!contextDraft.trim() || generating}
            className="ml-auto rounded-xl ios-press bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {generating ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1" />}
            {generating ? "Generating..." : "Generate"}
          </Button>
        )}
      </div>
    </>
  );
};

type ChatMsg = { role: "user" | "assistant"; content: string };

const DefaultChat = () => {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    const next: ChatMsg[] = [...messages, { role: "user", content: text }, { role: "assistant", content: "" }];
    setMessages(next);
    setStreaming(true);

    try {
      const assistantText = await aiService.chat(next.slice(0, -1));
      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content: assistantText };
        return copy;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error("Chat failed", { description: message });
      setMessages(prev => prev.slice(0, -2)); // drop user + empty assistant
    } finally {
      setStreaming(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-3 scrollbar-thin">
        {messages.length === 0 && (
          <div className="animate-ios-fade-in">
            <div className="bg-accent/60 rounded-2xl rounded-tl-md p-3">
              <p className="text-[11px] font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <Bot className="h-3 w-3" /> MXT Assistant
              </p>
              <p className="text-[13px] leading-relaxed text-foreground">
                Hi! Ask me anything about your messages, contacts, campaigns or how to use the app.
              </p>
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={cn("animate-ios-fade-in", m.role === "user" && "flex justify-end")}>
            {m.role === "assistant" ? (
              <div className="bg-accent/60 rounded-2xl rounded-tl-md p-3">
                <p className="text-[11px] font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <Bot className="h-3 w-3" /> MXT Assistant
                </p>
                <p className="text-[13px] leading-relaxed text-foreground whitespace-pre-wrap">
                  {m.content || (streaming && i === messages.length - 1 ? "…" : "")}
                </p>
              </div>
            ) : (
              <div className="bg-primary rounded-2xl rounded-tr-md p-3 max-w-[85%]">
                <p className="text-[13px] leading-relaxed text-primary-foreground whitespace-pre-wrap">{m.content}</p>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="p-3">
        <div className="flex gap-2 bg-accent/50 rounded-2xl p-1.5 pl-4 items-center">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={streaming}
            placeholder={streaming ? "Thinking…" : "Ask anything..."}
            className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/60 outline-none disabled:opacity-60"
          />
          <Button
            size="icon"
            onClick={sendMessage}
            disabled={streaming || !input.trim()}
            className="h-8 w-8 rounded-xl shrink-0 ios-press shadow-sm"
          >
            {streaming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
    </>
  );
};

const AIPanel = ({ open, onClose }: AIPanelProps) => {
  const { mode } = useAIPanel();

  return (
    <aside
      className={cn(
        "shrink-0 glass border-l flex flex-col transition-all duration-500 ease-ios overflow-hidden z-10",
        open ? "w-80" : "w-0"
      )}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-[13px] font-semibold text-foreground">Ask AI</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg text-muted-foreground hover:bg-accent ios-press" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {mode === "compose-guide" ? <ComposeGuide /> : <DefaultChat />}
    </aside>
  );
};

export default AIPanel;
