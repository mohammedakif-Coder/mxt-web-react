import { createContext, useContext, useState, ReactNode } from "react";

export type AIPanelMode = "chat" | "compose-guide";

export interface ComposeGuideData {
  type: string;
  length: string;
  tone: string;
  context: string;
}

interface AIPanelContextValue {
  open: boolean;
  mode: AIPanelMode;
  composeData: ComposeGuideData;
  generatedMessage: string;
  openPanel: (mode?: AIPanelMode) => void;
  closePanel: () => void;
  togglePanel: () => void;
  setMode: (mode: AIPanelMode) => void;
  setComposeData: (data: ComposeGuideData) => void;
  setGeneratedMessage: (msg: string) => void;
}

const AIPanelContext = createContext<AIPanelContextValue | undefined>(undefined);

export function AIPanelProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AIPanelMode>("chat");
  const [composeData, setComposeData] = useState<ComposeGuideData>({
    type: "",
    length: "",
    tone: "",
    context: "",
  });
  const [generatedMessage, setGeneratedMessage] = useState("");

  const openPanel = (m?: AIPanelMode) => {
    if (m) setMode(m);
    setOpen(true);
  };
  const closePanel = () => setOpen(false);
  const togglePanel = () => setOpen((v) => !v);

  return (
    <AIPanelContext.Provider
      value={{ open, mode, composeData, generatedMessage, openPanel, closePanel, togglePanel, setMode, setComposeData, setGeneratedMessage }}
    >
      {children}
    </AIPanelContext.Provider>
  );
}

export function useAIPanel() {
  const ctx = useContext(AIPanelContext);
  if (!ctx) throw new Error("useAIPanel must be used within AIPanelProvider");
  return ctx;
}
