import { Settings, HelpCircle, LogOut, Moon, Sun } from "lucide-react";
import AIButton from "@/features/ai/components/AIButton";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useProfile } from "@/hooks/use-profile";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/use-theme";
interface DashboardHeaderProps {
  onToggleAIPanel: () => void;
  aiPanelOpen: boolean;
}

const routeLabels: Record<string, string> = {
  "/": "Home", "/compose": "Compose", "/inbox": "Inbox", "/activity": "Activity",
  "/campaigns": "Campaigns", "/contacts": "Numbers", "/templates": "Templates",
  "/senders": "Senders", "/integrations": "Integrations", "/developers": "Developers",
  "/settings": "Settings", "/billing": "Billing", "/help": "Help",
};

const DashboardHeader = ({ onToggleAIPanel, aiPanelOpen }: DashboardHeaderProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const currentLabel = routeLabels[location.pathname] || "MXT";
  const authName = typeof user?.name === "string" ? user.name : typeof user?.username === "string" ? user.username : "";

  const initials = (authName || profile?.full_name)
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "MX";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="liquid-header h-[56px] flex items-center justify-between px-5 shrink-0 z-20">
      {/* Left: Logo + breadcrumb */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[18px] font-bold leading-none text-primary-foreground tracking-tight bg-primary px-2 py-1">MXT</span>
          <span className="text-[11px] font-medium text-muted-foreground leading-none">by</span>
          <span className="font-serif-brand text-[13px] leading-none text-foreground/80 tracking-tight lowercase">smsglobal</span>
        </div>
        {location.pathname !== "/" && (
          <>
            <span className="text-muted-foreground/30 text-[13px]">/</span>
            <span className="text-[13px] text-foreground/70 font-medium">{currentLabel}</span>
          </>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 transition-all duration-300 ease-out">
        {/* Balance pill */}
        <div className="liquid-pill flex items-center gap-0 rounded-full h-8 mr-2">
          <div className="flex items-center gap-1.5 pl-3.5 pr-2.5 text-sm">
            <span className="text-muted-foreground/70 text-[11px] font-medium tracking-wide uppercase">Balance</span>
            <span className="font-semibold text-[13px] tabular-nums">${profile ? Number(profile.balance).toFixed(2) : "—"}</span>
          </div>
          <Link to="/billing">
            <Button size="sm" className="rounded-full h-[26px] px-3 text-[11px] font-semibold mr-[3px] shadow-none bg-primary hover:bg-primary/90">
              Top Up
            </Button>
          </Link>
        </div>

        {/* Icon buttons */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="liquid-icon-btn h-8 w-8 rounded-full text-muted-foreground/80 hover:text-foreground ios-press" onClick={toggleTheme}>
              {theme === "dark" ? <Sun className="h-[15px] w-[15px]" /> : <Moon className="h-[15px] w-[15px]" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">{theme === "dark" ? "Light mode" : "Dark mode"}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="liquid-icon-btn h-8 w-8 rounded-full text-muted-foreground/80 hover:text-foreground ios-press" asChild>
              <Link to="/settings"><Settings className="h-[15px] w-[15px]" /></Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">Settings</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="liquid-icon-btn h-8 w-8 rounded-full text-muted-foreground/80 hover:text-foreground ios-press" asChild>
              <Link to="/help"><HelpCircle className="h-[15px] w-[15px]" /></Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">Help</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="liquid-icon-btn h-8 w-8 rounded-full text-muted-foreground/80 hover:text-foreground ios-press" onClick={handleLogout}>
              <LogOut className="h-[15px] w-[15px]" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">Logout</TooltipContent>
        </Tooltip>

        {/* Avatar */}
        <Avatar className="h-7 w-7 ring-1 ring-border/50 ml-1.5 shadow-sm">
          <AvatarFallback className="text-[10px] font-semibold bg-gradient-to-br from-primary/15 to-primary/5 text-primary">{initials}</AvatarFallback>
        </Avatar>

        {/* AI Panel toggle — hides when panel is open */}
        <div
          className={`overflow-hidden flex items-center transition-all duration-300 ease-out ${
            aiPanelOpen
              ? "max-w-0 opacity-0 -translate-x-2 ml-0 pl-0"
              : "max-w-[140px] opacity-100 translate-x-0 ml-2 pl-2 border-l border-border/50"
          }`}
          aria-hidden={aiPanelOpen}
        >
          <AIButton
            onClick={onToggleAIPanel}
            size="sm"
            shape="pill"
            tabIndex={aiPanelOpen ? -1 : 0}
          >
            Ask AI
          </AIButton>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
