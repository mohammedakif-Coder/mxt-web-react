import { useState } from "react";
import { Phone, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { usePageTitle } from "@/hooks/use-page-title";

const virtualNumbers = ["61485834172", "61485834173", "61485834174"];

interface CallRecord {
  direction: string;
  from: string;
  to: string;
  startTime: string;
  endTime: string;
  answerTime: string;
  duration: string;
  billableDuration: string;
}

const mockRecords: CallRecord[] = [];

export default function VoicePage() {
  usePageTitle("Voice");
  const [virtualNumber, setVirtualNumber] = useState(virtualNumbers[0]);
  const [inputNumber, setInputNumber] = useState("61");
  const [destinationNumber, setDestinationNumber] = useState("61");

  const handleBridge = () => {
    if (!inputNumber || !destinationNumber) {
      toast.error("Please fill in all required fields");
      return;
    }
    toast.success("Bridge call initiated successfully");
  };

  const handleReset = () => {
    setVirtualNumber(virtualNumbers[0]);
    setInputNumber("61");
    setDestinationNumber("61");
  };

  return (
    <div className="space-y-6 animate-ios-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Voice</h1>
        <p className="text-muted-foreground text-[13px]">Bridge a call between two numbers using a virtual number.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Bridge Call Form */}
        <div className="lg:col-span-4 glass rounded-2xl border border-border/30 p-6">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="virtual-number" className="text-sm font-medium">
                Virtual Number to use for bridge<span className="text-destructive">*</span>
              </Label>
              <Select value={virtualNumber} onValueChange={setVirtualNumber}>
                <SelectTrigger id="virtual-number" className="rounded-xl border-border/30 bg-accent/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {virtualNumbers.map((num) => (
                    <SelectItem key={num} value={num}>{num}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="input-number" className="text-sm font-medium">
                Input number to take the call<span className="text-destructive">*</span>
              </Label>
              <Input
                id="input-number"
                value={inputNumber}
                onChange={(e) => setInputNumber(e.target.value)}
                className="rounded-xl border-border/30 bg-accent/30 font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination-number" className="text-sm font-medium">
                Destination Number<span className="text-destructive">*</span>
              </Label>
              <Input
                id="destination-number"
                value={destinationNumber}
                onChange={(e) => setDestinationNumber(e.target.value)}
                className="rounded-xl border-border/30 bg-accent/30 font-mono"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleBridge} className="rounded-xl px-6 ios-press">
                <Phone className="h-4 w-4 mr-2" />
                Bridge
              </Button>
              <Button onClick={handleReset} variant="secondary" className="rounded-xl px-6 ios-press">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </div>

        {/* Last 10 Records */}
        <div className="lg:col-span-8 glass rounded-2xl border border-border/30 overflow-hidden">
          <div className="px-6 py-4 border-b border-border/30">
            <h3 className="text-base font-semibold">Last 10 Records</h3>
          </div>
          {mockRecords.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-accent/60 mb-3">
                <Phone className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium mb-1">No call records</p>
              <p className="text-xs text-muted-foreground">Bridge a call to see your recent records here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/30 text-left bg-accent/30">
                    <th className="px-6 py-3 text-xs font-medium text-muted-foreground">Direction</th>
                    <th className="px-6 py-3 text-xs font-medium text-muted-foreground">From</th>
                    <th className="px-6 py-3 text-xs font-medium text-muted-foreground">To</th>
                    <th className="px-6 py-3 text-xs font-medium text-muted-foreground">Start Time</th>
                    <th className="px-6 py-3 text-xs font-medium text-muted-foreground">End Time</th>
                    <th className="px-6 py-3 text-xs font-medium text-muted-foreground">Answer Time</th>
                    <th className="px-6 py-3 text-xs font-medium text-muted-foreground">Duration</th>
                    <th className="px-6 py-3 text-xs font-medium text-muted-foreground">Billable</th>
                  </tr>
                </thead>
                <tbody>
                  {mockRecords.map((record, i) => (
                    <tr key={i} className="border-b border-border/30 last:border-0 hover:bg-accent/30 transition-colors">
                      <td className="px-6 py-3 text-sm">{record.direction}</td>
                      <td className="px-6 py-3 text-sm font-mono">{record.from}</td>
                      <td className="px-6 py-3 text-sm font-mono">{record.to}</td>
                      <td className="px-6 py-3 text-sm text-muted-foreground">{record.startTime}</td>
                      <td className="px-6 py-3 text-sm text-muted-foreground">{record.endTime}</td>
                      <td className="px-6 py-3 text-sm text-muted-foreground">{record.answerTime}</td>
                      <td className="px-6 py-3 text-sm">{record.duration}</td>
                      <td className="px-6 py-3 text-sm">{record.billableDuration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
