import { usePageTitle } from "@/hooks/use-page-title";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Mail, MessageSquare, BookOpen, ExternalLink } from "lucide-react";

const faqs = [
  { q: "How do I send my first SMS?", a: "Go to Compose, enter a recipient number, choose a sender ID, type your message and click Send." },
  { q: "What are sender IDs?", a: "Sender IDs are the name or number that appears as the sender on a recipient's phone." },
  { q: "How does billing work?", a: "MXT uses a prepaid credit system. Top up your balance and messages are deducted at per-message rates." },
  { q: "Can I send WhatsApp messages?", a: "Yes! Toggle the channel to WhatsApp in the Compose page." },
  { q: "How do I import contacts?", a: "Go to Contacts and use the CSV upload option in Compose to import phone numbers." },
  { q: "What happens when someone opts out?", a: "They are automatically marked as opted-out and will not receive further messages." },
];

const supportChannels = [
  { icon: Mail, title: "Email Support", desc: "support@smsglobal.com", btn: "Send Email", color: "text-primary" },
  { icon: MessageSquare, title: "Live Chat", desc: "Mon–Fri 9am–6pm AEST", btn: "Start Chat", color: "text-success" },
  { icon: BookOpen, title: "Documentation", desc: "API docs and guides", btn: "View Docs", color: "text-info" },
];

export default function HelpPage() {
  usePageTitle("Help");
  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-ios-fade-in">
      <div><h1 className="text-2xl font-bold">Help & Support</h1><p className="text-[13px] text-muted-foreground">Get help with MXT or browse our documentation</p></div>
      <div className="grid gap-4 md:grid-cols-3">{supportChannels.map(ch => <Card key={ch.title} className="text-center glass rounded-2xl border-border/30 hover:shadow-lg transition-all duration-300 ease-ios ios-press"><CardContent className="pt-6 space-y-3"><div className="mx-auto h-12 w-12 rounded-2xl bg-accent/40 flex items-center justify-center"><ch.icon className={`h-6 w-6 ${ch.color}`} /></div><h3 className="font-semibold text-[13px]">{ch.title}</h3><p className="text-[11px] text-muted-foreground">{ch.desc}</p><Button variant="outline" size="sm" className="w-full rounded-xl border-border/30 ios-press text-[11px]">{ch.btn} <ExternalLink className="ml-1 h-3 w-3" /></Button></CardContent></Card>)}</div>
      <Card className="glass rounded-2xl border-border/30"><CardHeader><CardTitle className="text-[15px]">Frequently Asked Questions</CardTitle></CardHeader><CardContent><Accordion type="single" collapsible>{faqs.map((f, i) => <AccordionItem key={i} value={`faq-${i}`}><AccordionTrigger className="text-[13px] font-medium">{f.q}</AccordionTrigger><AccordionContent className="text-[13px] text-muted-foreground">{f.a}</AccordionContent></AccordionItem>)}</Accordion></CardContent></Card>
    </div>
  );
}
