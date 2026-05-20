import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inboxService } from "@/services/inboxService";
import { queryKeys } from "@/constants/queryKeys";
import { usePageTitle } from "@/hooks/use-page-title";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Send, Star, MessageSquare, Mail, Eye, EyeOff, X, Tag, StickyNote, Keyboard, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";

export default function InboxPage() {
  usePageTitle("Inbox");
  const queryClient = useQueryClient();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [reply, setReply] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "starred" | "closed">("all");
  const [showContext, setShowContext] = useState(true);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState<{ text: string; time: string }[]>([]);
  const replyRef = useRef<HTMLTextAreaElement>(null);

  const { data: threads, isLoading: threadsLoading } = useQuery({ queryKey: queryKeys.inboxThreads, queryFn: inboxService.listThreads });
  const { data: messages, isLoading: messagesLoading } = useQuery({ queryKey: ["inbox-messages", selectedThreadId], enabled: !!selectedThreadId, queryFn: () => inboxService.listMessages(selectedThreadId!) });

  const selectedThread = threads?.find((t: any) => t.id === selectedThreadId);

  const markReadMutation = useMutation({ mutationFn: (threadId: string) => inboxService.updateThread(threadId, { unread: false }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.inboxThreads }); queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount }); } });
  const toggleStarMutation = useMutation({ mutationFn: ({ threadId, starred }: { threadId: string; starred: boolean }) => inboxService.updateThread(threadId, { starred: !starred }), onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.inboxThreads }) });
  const toggleReadMutation = useMutation({ mutationFn: ({ threadId, unread }: { threadId: string; unread: boolean }) => inboxService.updateThread(threadId, { unread: !unread }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.inboxThreads }); queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount }); } });
  const closeThreadMutation = useMutation({ mutationFn: ({ threadId, status }: { threadId: string; status: string }) => inboxService.updateThread(threadId, { status: status === "closed" ? "open" : "closed" }), onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.inboxThreads }) });
  const sendReplyMutation = useMutation({ mutationFn: async () => { if (!selectedThreadId || !reply.trim()) return; await inboxService.sendReply(selectedThreadId, reply.trim()); }, onSuccess: () => { toast.success("Reply sent"); setReply(""); queryClient.invalidateQueries({ queryKey: ["inbox-messages", selectedThreadId] }); queryClient.invalidateQueries({ queryKey: queryKeys.inboxThreads }); }, onError: (err: any) => toast.error(err.message) });

  const selectThread = useCallback((threadId: string) => { setSelectedThreadId(threadId); const thread = threads?.find((t: any) => t.id === threadId); if (thread?.unread) markReadMutation.mutate(threadId); }, [threads]);

  const filteredThreads = threads?.filter((t: any) => {
    if (filter === "unread" && !t.unread) return false;
    if (filter === "starred" && !t.starred) return false;
    if (filter === "closed" && t.status !== "closed") return false;
    if (filter === "all" && t.status === "closed") return false;
    if (search) { const s = search.toLowerCase(); if (!t.contact_name.toLowerCase().includes(s) && !t.contact_phone.includes(s) && !(t.last_message || "").toLowerCase().includes(s)) return false; }
    return true;
  });

  const currentIndex = filteredThreads?.findIndex((t: any) => t.id === selectedThreadId) ?? -1;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); sendReplyMutation.mutate(); } return; }
      if (e.key === "j" && filteredThreads) { const next = Math.min(currentIndex + 1, filteredThreads.length - 1); if (next >= 0) selectThread(filteredThreads[next].id); }
      if (e.key === "k" && filteredThreads) { const prev = Math.max(currentIndex - 1, 0); if (prev >= 0) selectThread(filteredThreads[prev].id); }
      if (e.key === "r" && selectedThreadId) { e.preventDefault(); replyRef.current?.focus(); }
      if (e.key === "e" && selectedThread) toggleReadMutation.mutate({ threadId: selectedThread.id, unread: selectedThread.unread });
      if (e.key === "s" && selectedThread) toggleStarMutation.mutate({ threadId: selectedThread.id, starred: selectedThread.starred });
      if (e.key === "?" ) setShortcutsOpen(true);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [filteredThreads, currentIndex, selectedThreadId, selectedThread]);

  const timeAgo = (d: string) => { const date = new Date(d); if (Date.now() - date.getTime() < 86400000) return formatDistanceToNow(date, { addSuffix: true }); return format(date, "MMM d"); };
  const groupMessagesByDate = (msgs: any[]) => { const groups: { date: string; messages: any[] }[] = []; msgs.forEach((m) => { const d = new Date(m.sent_at); const label = isToday(d) ? "Today" : isYesterday(d) ? "Yesterday" : format(d, "MMMM d, yyyy"); const existing = groups.find((g) => g.date === label); if (existing) existing.messages.push(m); else groups.push({ date: label, messages: [m] }); }); return groups; };
  const addNote = () => { if (!note.trim()) return; setNotes((prev) => [...prev, { text: note.trim(), time: new Date().toISOString() }]); setNote(""); };

  return (
    <div className="flex h-[calc(100vh-7rem)] -m-5 overflow-hidden animate-ios-fade-in rounded-2xl">
      {/* Thread List */}
      <div className="w-80 min-w-80 border-r border-border/30 flex flex-col glass">
        <div className="p-3 space-y-3 border-b border-border/30">
          <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search conversations..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9 text-[13px] bg-accent/50 rounded-xl border-border/30" /></div>
          <div className="flex gap-1">{(["all", "unread", "starred", "closed"] as const).map((c) => (<button key={c} onClick={() => setFilter(c)} className={`px-2.5 py-1 text-[11px] rounded-full font-medium transition-all duration-300 ease-ios capitalize ios-press ${filter === c ? "bg-primary text-primary-foreground shadow-sm" : "bg-accent/60 text-muted-foreground hover:bg-accent"}`}>{c}</button>))}</div>
        </div>
        <ScrollArea className="flex-1">
          {threadsLoading ? <div className="p-3 space-y-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div> : filteredThreads?.length === 0 ? <div className="p-8 text-center text-muted-foreground text-[13px]">No conversations found</div> : filteredThreads?.map((t: any) => (
            <div key={t.id} onClick={() => selectThread(t.id)} className={`flex items-start gap-3 px-3 py-3 cursor-pointer border-b border-border/20 transition-all duration-300 ease-ios hover:bg-accent/40 ios-press ${selectedThreadId === t.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}>
              <div className="relative"><Avatar className="h-9 w-9"><AvatarFallback className="bg-primary/10 text-[11px] font-semibold">{t.contact_name.charAt(0)}</AvatarFallback></Avatar>{t.unread && <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-card" />}</div>
              <div className="flex-1 min-w-0"><div className="flex items-center justify-between"><span className={`text-[13px] truncate ${t.unread ? "font-semibold" : "font-medium text-foreground/80"}`}>{t.contact_name}</span><span className="text-[10px] text-muted-foreground ml-2">{t.last_message_at ? timeAgo(t.last_message_at) : ""}</span></div><p className={`text-[11px] truncate mt-0.5 ${t.unread ? "text-foreground/70 font-medium" : "text-muted-foreground"}`}>{t.last_message || "No messages yet"}</p><div className="flex items-center gap-1.5 mt-1"><Smartphone className="h-3 w-3 text-muted-foreground" />{t.starred && <Star className="h-3 w-3 text-warning fill-warning" />}{t.status === "closed" && <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 rounded-md">Closed</Badge>}</div></div>
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* Message Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selectedThreadId ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground"><div className="text-center space-y-2"><MessageSquare className="h-12 w-12 mx-auto opacity-20" /><p className="text-[13px] font-medium">Select a conversation</p><p className="text-[11px]">Use J/K to navigate, ? for shortcuts</p></div></div>
        ) : (<>
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 glass">
            <div className="flex items-center gap-3"><Avatar className="h-8 w-8"><AvatarFallback className="bg-primary/10 text-[11px]">{selectedThread?.contact_name?.charAt(0)}</AvatarFallback></Avatar><div><p className="text-[13px] font-semibold">{selectedThread?.contact_name}</p><p className="text-[11px] text-muted-foreground font-mono">{selectedThread?.contact_phone}</p></div></div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl ios-press" onClick={() => selectedThread && toggleStarMutation.mutate({ threadId: selectedThread.id, starred: selectedThread.starred })}><Star className={`h-4 w-4 ${selectedThread?.starred ? "text-warning fill-warning" : "text-muted-foreground"}`} /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl ios-press" onClick={() => selectedThread && toggleReadMutation.mutate({ threadId: selectedThread.id, unread: selectedThread.unread })}>{selectedThread?.unread ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl ios-press" onClick={() => selectedThread && closeThreadMutation.mutate({ threadId: selectedThread.id, status: selectedThread.status })}><X className="h-4 w-4" /></Button>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            {messagesLoading ? <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className={`h-12 rounded-2xl ${i % 2 ? "ml-auto w-2/3" : "w-2/3"}`} />)}</div> : (
              <div className="space-y-1 max-w-2xl mx-auto">
                {groupMessagesByDate(messages || []).map((group) => (
                  <div key={group.date}><div className="flex items-center gap-3 my-4"><Separator className="flex-1" /><span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{group.date}</span><Separator className="flex-1" /></div>
                    {group.messages.map((m: any) => (<div key={m.id} className={`flex mb-2 ${m.direction === "outbound" ? "justify-end" : "justify-start"}`}><div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-[13px] transition-all duration-300 ease-ios ${m.direction === "outbound" ? "bg-primary text-primary-foreground rounded-br-md shadow-sm" : "bg-accent/60 rounded-bl-md"}`}><p>{m.body}</p><p className={`text-[10px] mt-1 ${m.direction === "outbound" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{format(new Date(m.sent_at), "h:mm a")}</p></div></div>))}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="border-t border-border/30 glass p-3"><div className="flex gap-2 items-end max-w-2xl mx-auto"><div className="flex-1 relative"><Textarea ref={replyRef} placeholder="Type a reply... (⌘+Enter to send)" value={reply} onChange={(e) => setReply(e.target.value)} className="min-h-[44px] max-h-32 resize-none pr-16 text-[13px] rounded-xl border-border/30" rows={1} /><span className="absolute bottom-2 right-3 text-[10px] text-muted-foreground">{reply.length}/160</span></div><Button onClick={() => sendReplyMutation.mutate()} disabled={!reply.trim()} className="bg-primary hover:bg-primary/90 h-[44px] px-4 rounded-xl ios-press shadow-sm"><Send className="h-4 w-4" /></Button></div></div>
        </>)}
      </div>

      {/* Context Panel */}
      {showContext && selectedThread && (
        <div className="w-72 min-w-72 border-l border-border/30 glass flex flex-col overflow-hidden">
          <ScrollArea className="flex-1"><div className="p-4 space-y-5">
            <div className="text-center space-y-2"><Avatar className="h-16 w-16 mx-auto"><AvatarFallback className="bg-primary/10 text-lg font-bold">{selectedThread.contact_name.charAt(0)}</AvatarFallback></Avatar><div><p className="font-semibold text-[13px]">{selectedThread.contact_name}</p><p className="text-[11px] text-muted-foreground font-mono">{selectedThread.contact_phone}</p></div></div>
            <Separator className="bg-border/30" />
            <div className="grid grid-cols-3 gap-2 text-center"><div><p className="text-[11px] text-muted-foreground">Messages</p><p className="text-[11px] font-medium">{messages?.length ?? 0}</p></div></div>
            <Separator className="bg-border/30" />
            <div className="space-y-2"><h4 className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-1"><StickyNote className="h-3 w-3" /> Notes</h4>
              {notes.map((n, i) => <div key={i} className="bg-accent/40 rounded-xl p-2 text-[11px]"><p>{n.text}</p><p className="text-[10px] text-muted-foreground mt-1">{format(new Date(n.time), "MMM d, h:mm a")}</p></div>)}
              <div className="flex gap-1.5"><Input placeholder="Add a note..." value={note} onChange={(e) => setNote(e.target.value)} className="h-7 text-[11px] rounded-lg border-border/30" onKeyDown={(e) => e.key === "Enter" && addNote()} /><Button variant="outline" size="sm" className="h-7 px-2 text-[11px] rounded-lg ios-press" onClick={addNote}>Add</Button></div>
            </div>
          </div></ScrollArea>
        </div>
      )}

      <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}><DialogContent className="max-w-sm rounded-2xl"><DialogHeader><DialogTitle className="flex items-center gap-2 text-[15px]"><Keyboard className="h-4 w-4" /> Keyboard Shortcuts</DialogTitle></DialogHeader><div className="space-y-2 text-[13px]">{[["J / K", "Navigate threads"], ["R", "Focus reply"], ["⌘+Enter", "Send reply"], ["E", "Toggle read/unread"], ["S", "Star/unstar"], ["?", "Show shortcuts"]].map(([key, desc]) => <div key={key} className="flex items-center justify-between py-1"><span className="text-muted-foreground">{desc}</span><kbd className="px-2 py-0.5 bg-accent/60 rounded-lg text-[11px] font-mono">{key}</kbd></div>)}</div></DialogContent></Dialog>
    </div>
  );
}
