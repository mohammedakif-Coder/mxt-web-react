import { format } from "date-fns";
import { ChevronLeft, Video, Plus, Mic, Image as ImageIcon, Paperclip, Wifi, Battery, Signal } from "lucide-react";

interface MessagePreviewProps {
  channel: "sms" | "mms" | "whatsapp";
  message: string;
  from: string;
  mediaFiles?: File[];
  mediaPreviewUrls?: string[];
  /** Substring to render in blue inside message bubbles (e.g. sample short URL). */
  highlightUrl?: string;
}

/**
 * Render `text` splitting on `highlight` so every occurrence is wrapped in a
 * blue span. Used to flag sample shortened URLs in the live preview.
 */
function HighlightedText({ text, highlight }: { text: string; highlight?: string }) {
  if (!highlight || !text.includes(highlight)) return <>{text}</>;
  const parts = text.split(highlight);
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && (
            <span className="text-[#007AFF] underline break-all">{highlight}</span>
          )}
        </span>
      ))}
    </>
  );
}

/**
 * Shared iOS-style chrome (status bar + contact header + input bar) for SMS/MMS,
 * modeled after the iMessage screenshot. Background stays neutral white so blue
 * outgoing bubbles read correctly in both light and dark themes.
 */
function IOSFrame({
  from,
  channelLabel,
  children,
}: {
  from: string;
  channelLabel: string;
  children: React.ReactNode;
}) {
  const initial = (from || "S").charAt(0).toUpperCase();
  return (
    <div className="flex flex-col h-full bg-white text-black dark:bg-[#000] dark:text-white">
      {/* iOS status bar */}
      <div className="px-5 py-1.5 flex items-center justify-between">
        <span className="text-[12px] font-semibold tracking-tight">{format(new Date(), "h:mm")}</span>
        <div className="flex items-center gap-1">
          <Signal className="h-3 w-3" strokeWidth={2.5} />
          <Wifi className="h-3 w-3" strokeWidth={2.5} />
          <Battery className="h-3.5 w-3.5" strokeWidth={2.5} />
        </div>
      </div>

      {/* Contact header */}
      <div className="relative flex flex-col items-center pt-1 pb-2 border-b border-[#d1d1d6]/70 dark:border-white/10 bg-white dark:bg-[#000]">
        <button className="absolute left-3 top-2 text-[#007AFF]" aria-label="Back">
          <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
        </button>
        <button className="absolute right-3 top-2 text-[#007AFF]" aria-label="FaceTime">
          <Video className="h-4 w-4" strokeWidth={2.25} />
        </button>
        <div className="h-9 w-9 rounded-full bg-gradient-to-b from-[#A8B0BD] to-[#6B7280] flex items-center justify-center text-white text-[12px] font-semibold shadow-sm">
          {initial}
        </div>
        <div className="flex items-center gap-0.5 mt-0.5">
          <span className="text-[11px] font-medium">{from || "Sender"}</span>
          <ChevronLeft className="h-3 w-3 rotate-180 text-[#8e8e93]" strokeWidth={2.5} />
        </div>
      </div>

      {/* Conversation */}
      <div className="flex-1 px-3 py-2 overflow-hidden bg-white dark:bg-[#000]">
        <div className="flex flex-col items-center mb-2">
          <span className="text-[10px] text-[#8e8e93] font-semibold">{channelLabel}</span>
          <span className="text-[10px] text-[#8e8e93]">Today {format(new Date(), "h:mm a")}</span>
        </div>
        {children}
      </div>

      {/* iOS input bar */}
      <div className="px-2 py-2 border-t border-[#d1d1d6]/70 dark:border-white/10 bg-white dark:bg-[#000] flex items-center gap-2">
        <button className="h-7 w-7 rounded-full bg-[#e5e5ea] dark:bg-white/10 flex items-center justify-center text-[#8e8e93]">
          <Plus className="h-4 w-4" strokeWidth={2.5} />
        </button>
        <div className="flex-1 h-7 rounded-full border border-[#d1d1d6] dark:border-white/15 flex items-center justify-between px-3">
          <span className="text-[11px] text-[#8e8e93]">{channelLabel}</span>
          <Mic className="h-3.5 w-3.5 text-[#8e8e93]" strokeWidth={2.25} />
        </div>
      </div>
    </div>
  );
}

function SMSPreview({ message, from, highlightUrl }: { message: string; from: string; highlightUrl?: string }) {
  return (
    <IOSFrame from={from} channelLabel="Text Message">
      {message ? (
        <div className="flex flex-col items-start gap-0.5">
          {/* Incoming iMessage-style gray bubble */}
          <div className="max-w-[78%] bg-[#E9E9EB] dark:bg-[#26252A] text-black dark:text-white rounded-[18px] rounded-bl-[6px] px-3 py-1.5 shadow-sm">
            <p className="text-[12px] leading-snug whitespace-pre-wrap break-words">
              <HighlightedText text={message} highlight={highlightUrl} />
            </p>
          </div>
        </div>
      ) : (
        <p className="text-[11px] text-[#8e8e93] text-center mt-10">
          Your message preview will appear here
        </p>
      )}
    </IOSFrame>
  );
}

function MMSPreview({
  message,
  from,
  mediaPreviewUrls,
  highlightUrl,
}: {
  message: string;
  from: string;
  mediaPreviewUrls?: string[];
  highlightUrl?: string;
}) {
  const hasContent = message || (mediaPreviewUrls && mediaPreviewUrls.length > 0);
  return (
    <IOSFrame from={from} channelLabel="Text Message">
      {hasContent ? (
        <div className="flex flex-col items-start gap-1">
          {mediaPreviewUrls && mediaPreviewUrls.length > 0 && (
            <div className="max-w-[78%] flex flex-col gap-1">
              {mediaPreviewUrls.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Attachment ${i + 1}`}
                  className="w-full max-h-40 object-cover rounded-[18px] shadow-sm"
                />
              ))}
            </div>
          )}
          {message && (
            <div className="max-w-[78%] bg-[#E9E9EB] dark:bg-[#26252A] text-black dark:text-white rounded-[18px] rounded-bl-[6px] px-3 py-1.5 shadow-sm">
              <p className="text-[12px] leading-snug whitespace-pre-wrap break-words">
                <HighlightedText text={message} highlight={highlightUrl} />
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center mt-10 space-y-2">
          <ImageIcon className="h-8 w-8 mx-auto text-[#c7c7cc]" />
          <p className="text-[11px] text-[#8e8e93]">Add media and text to preview MMS</p>
        </div>
      )}
    </IOSFrame>
  );
}

function WhatsAppPreview({ message, from, mediaPreviewUrls, highlightUrl }: { message: string; from: string; mediaPreviewUrls?: string[]; highlightUrl?: string }) {
  const time = format(new Date(), "HH:mm");

  return (
    <div className="flex flex-col h-full">
      {/* WhatsApp-style status bar */}
      <div className="bg-[#075E54] dark:bg-[#1F2C34] px-4 py-1.5 flex items-center justify-between">
        <span className="text-[10px] text-white/90 font-medium">{format(new Date(), "HH:mm")}</span>
        <div className="flex items-center gap-1">
          <Signal className="h-3 w-3 text-white/80" />
          <Wifi className="h-3 w-3 text-white/80" />
          <Battery className="h-3 w-3 text-white/80" />
        </div>
      </div>
      {/* WhatsApp header */}
      <div className="bg-[#075E54] dark:bg-[#1F2C34] px-3 py-2 flex items-center gap-2.5">
        <svg className="h-4 w-4 text-white/90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 19l-7-7 7-7" /></svg>
        <div className="h-8 w-8 rounded-full bg-[#DFE5E7] dark:bg-[#6B7B85] flex items-center justify-center">
          <span className="text-[11px] font-bold text-[#075E54]">{from.charAt(0)}</span>
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-white">{from || "Sender"}</p>
          <p className="text-[10px] text-white/70">Business Account</p>
        </div>
        <div className="flex items-center gap-3">
          <svg className="h-4 w-4 text-white/90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
          <svg className="h-4 w-4 text-white/90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>
        </div>
      </div>
      {/* Chat area - WhatsApp wallpaper (light/dark) */}
      <div className="flex-1 p-3 space-y-1 bg-[#ECE5DD] dark:bg-[#0B141A]">
        {/* System message */}
        <div className="flex justify-center mb-2">
          <div className="bg-[#E2F7CB]/60 dark:bg-[#1D3B2E]/60 rounded-lg px-3 py-1">
            <p className="text-[10px] text-[#54656F] dark:text-[#8696A0] text-center">
              🔒 Messages and calls are end-to-end encrypted.
            </p>
          </div>
        </div>

        {/* Date chip */}
        <div className="flex justify-center mb-2">
          <div className="bg-white/80 dark:bg-[#233138]/80 rounded-lg px-3 py-1 shadow-sm">
            <p className="text-[10px] text-[#54656F] dark:text-[#8696A0] font-medium">{format(new Date(), "EEEE")}</p>
          </div>
        </div>

        {(message || (mediaPreviewUrls && mediaPreviewUrls.length > 0)) ? (
          <div className="flex justify-start">
            <div className="max-w-[80%] bg-white dark:bg-[#202C33] rounded-lg rounded-tl-none overflow-hidden shadow-sm relative">
              {/* Incoming WhatsApp bubble tail */}
              <div className="absolute -left-2 top-0 w-0 h-0 border-r-8 border-r-white dark:border-r-[#202C33] border-t-8 border-t-transparent" />
              {mediaPreviewUrls && mediaPreviewUrls.length > 0 && (
                <div className="p-1 space-y-1">
                  {mediaPreviewUrls.map((url, i) => (
                    <img key={i} src={url} alt={`Media ${i + 1}`} className="w-full h-32 object-cover rounded-md" />
                  ))}
                </div>
              )}
              <div className="px-2.5 py-1.5">
                {message && (
                  <p className="text-[12px] leading-relaxed text-[#111B21] dark:text-[#E9EDEF] whitespace-pre-wrap break-words">
                    <HighlightedText text={message} highlight={highlightUrl} />
                  </p>
                )}
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  <span className="text-[9px] text-[#667781] dark:text-[#8696A0]">{time}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center mt-6">
            <div className="bg-white/80 dark:bg-[#233138]/80 rounded-lg px-4 py-3 shadow-sm">
              <p className="text-[10px] text-[#54656F] dark:text-[#8696A0] text-center">Message preview will appear here</p>
            </div>
          </div>
        )}
      </div>

      {/* WhatsApp input bar */}
      <div className="bg-[#F0F0F0] dark:bg-[#1F2C34] px-2 py-2 flex items-center gap-2">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-[#54656F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" /></svg>
        </div>
        <div className="flex-1 bg-white dark:bg-[#2A3942] rounded-full px-4 py-1.5 flex items-center">
          <span className="text-[11px] text-[#667781]">Type a message</span>
        </div>
        <div className="flex items-center gap-2">
          <Paperclip className="h-5 w-5 text-[#54656F] rotate-45" />
          <svg className="h-5 w-5 text-[#54656F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></svg>
        </div>
      </div>
    </div>
  );
}

export function MessagePreview({ channel, message, from, mediaFiles, mediaPreviewUrls, highlightUrl }: MessagePreviewProps) {
  return (
    <div className="rounded-2xl border border-border/30 overflow-hidden bg-card shadow-sm">
      <div className="px-4 py-2.5 border-b border-border/20 bg-muted/30">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {channel === "sms" ? "SMS Preview" : channel === "mms" ? "MMS Preview" : "WhatsApp Preview"}
        </p>
      </div>
      <div className="h-[420px] overflow-hidden">
        {channel === "sms" && <SMSPreview message={message} from={from} highlightUrl={highlightUrl} />}
        {channel === "mms" && <MMSPreview message={message} from={from} mediaPreviewUrls={mediaPreviewUrls} highlightUrl={highlightUrl} />}
        {channel === "whatsapp" && <WhatsAppPreview message={message} from={from} mediaPreviewUrls={mediaPreviewUrls} highlightUrl={highlightUrl} />}
      </div>
    </div>
  );
}
