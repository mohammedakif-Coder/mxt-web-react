import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import {
  Home, PenSquare, Inbox, Activity, Megaphone, Users, FileText,
  Radio, Puzzle, Code2, Settings, CreditCard, HelpCircle, Zap, AlertTriangle, Clock, MailOpen, Contact,
} from "lucide-react";

const navEntries = [
  { label: "Home", url: "/", icon: Home },
  { label: "Compose", url: "/compose", icon: PenSquare },
  { label: "Inbox", url: "/inbox", icon: Inbox },
  { label: "Activity", url: "/activity", icon: Activity },
  { label: "Campaigns", url: "/campaigns", icon: Megaphone },
  { label: "Contacts", url: "/contacts-lists", icon: Contact },
  { label: "Numbers", url: "/contacts", icon: Users },
  { label: "Templates", url: "/templates", icon: FileText },
  { label: "Senders", url: "/senders", icon: Radio },
  { label: "Integrations", url: "/integrations", icon: Puzzle },
  { label: "Developers", url: "/developers", icon: Code2 },
  { label: "Settings", url: "/settings", icon: Settings },
  { label: "Billing", url: "/billing", icon: CreditCard },
  { label: "Help", url: "/help", icon: HelpCircle },
];

const quickActions = [
  { label: "Compose New Message", url: "/compose", icon: PenSquare },
  { label: "Top Up Account", url: "/billing", icon: Zap },
];

const deepLinks = [
  { label: "Failed Messages", url: "/activity?status=failed", icon: AlertTriangle },
  { label: "Scheduled Sends", url: "/campaigns?status=scheduled", icon: Clock },
  { label: "Unread Replies", url: "/inbox?filter=unread", icon: MailOpen },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setOpen((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const go = (url: string) => { setOpen(false); navigate(url); };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {navEntries.map((e) => (
            <CommandItem key={e.url} onSelect={() => go(e.url)}>
              <e.icon className="mr-2 h-4 w-4" />{e.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Quick Actions">
          {quickActions.map((e) => (
            <CommandItem key={e.label} onSelect={() => go(e.url)}>
              <e.icon className="mr-2 h-4 w-4" />{e.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Filtered Views">
          {deepLinks.map((e) => (
            <CommandItem key={e.label} onSelect={() => go(e.url)}>
              <e.icon className="mr-2 h-4 w-4" />{e.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
