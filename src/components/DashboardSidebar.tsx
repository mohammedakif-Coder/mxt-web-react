import {
  Home, PenSquare, Activity, Megaphone, Users,
  FileText, Radio, Puzzle, Code2, Settings, CreditCard, HelpCircle, ChevronLeft, Phone, BarChart3, Contact,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useProfile } from "@/hooks/use-profile";
import { useUnreadCount } from "@/hooks/use-unread-count";
import { cn } from "@/lib/utils";

const mainNav = [
  { title: "Home", url: "/", icon: Home },
  { title: "Messages", url: "/compose", icon: PenSquare },
  { title: "Activity", url: "/activity", icon: Activity },
  { title: "Campaigns", url: "/campaigns", icon: Megaphone },
  { title: "Contacts", url: "/contacts-lists", icon: Contact },
  { title: "Numbers", url: "/contacts", icon: Users },
  { title: "Templates", url: "/templates", icon: FileText },
  { title: "Senders", url: "/senders", icon: Radio },
  { title: "Voice", url: "/voice", icon: Phone },
  { title: "Reports", url: "/reports", icon: BarChart3 },
];

const bottomNav = [
  { title: "Integrations", url: "/integrations", icon: Puzzle },
  { title: "Developers", url: "/developers", icon: Code2 },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Billing", url: "/billing", icon: CreditCard },
  { title: "Help", url: "/help", icon: HelpCircle },
];

interface DashboardSidebarProps {
  open: boolean;
  onClose: () => void;
  onOpen: () => void;
}

const DashboardSidebar = ({ open, onClose, onOpen }: DashboardSidebarProps) => {
  const location = useLocation();
  const { data: profile } = useProfile();
  const { data: unreadCount } = useUnreadCount();

  const isActive = (url: string) =>
    url === "/"
      ? location.pathname === "/"
      : location.pathname === url || location.pathname.startsWith(url + "/");

  const handleNavClick = () => {
    if (!open) onOpen();
  };

  const renderNav = (items: typeof mainNav) =>
    items.map((item) => (
      <li key={item.title}>
        <Tooltip>
          <TooltipTrigger asChild>
            <NavLink
              to={item.url}
              end={item.url === "/"}
              onClick={handleNavClick}
              className={cn(
                "relative flex items-center gap-3 w-full px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-300 ease-ios ios-press",
                isActive(item.url)
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/30 font-semibold"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                !open && "justify-center px-0"
              )}
              activeClassName="bg-primary text-primary-foreground shadow-md shadow-primary/30 font-semibold"
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {open && <span className="flex-1">{item.title}</span>}
              {open && "badge" in item && item.badge && unreadCount && unreadCount > 0 ? (
                <Badge className="h-5 min-w-5 justify-center rounded-full px-1.5 text-[10px] bg-primary border-0 text-primary-foreground">
                  {unreadCount}
                </Badge>
              ) : null}
              {!open && "badge" in item && item.badge && unreadCount && unreadCount > 0 ? (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
              ) : null}
            </NavLink>
          </TooltipTrigger>
          {!open && <TooltipContent side="right">{item.title}</TooltipContent>}
        </Tooltip>
      </li>
    ));

  return (
    <div className="relative shrink-0 flex z-10">
      <aside
        className={cn(
          "bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-500 ease-ios overflow-hidden",
          open ? "w-52" : "w-14"
        )}
      >
        <div className={cn("py-3", open ? "px-4" : "px-2")}>
          {/* spacer for collapsed state alignment */}
        </div>
        <nav className="flex-1 overflow-y-auto py-2 px-2 scrollbar-thin">
          <div className="mb-5">
            {open && <p className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60 mb-1.5 px-3">Main</p>}
            <ul className="space-y-0.5">{renderNav(mainNav)}</ul>
          </div>
          <div className="mb-5">
            {open && <p className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60 mb-1.5 px-3">General</p>}
            <ul className="space-y-0.5">{renderNav(bottomNav)}</ul>
          </div>
        </nav>
      </aside>
      {/* Collapse/expand toggle on the border */}
      <Button
        variant="ghost"
        size="icon"
        onClick={open ? onClose : onOpen}
        className="absolute -right-3 top-3 h-6 w-6 rounded-full border-2 border-white dark:border-white/80 bg-background shadow-md text-muted-foreground hover:bg-accent ios-press z-20"
      >
        <ChevronLeft className={cn("h-3.5 w-3.5 transition-transform duration-300", !open && "rotate-180")} />
      </Button>
    </div>
  );
};

export default DashboardSidebar;
