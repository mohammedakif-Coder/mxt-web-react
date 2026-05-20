import { useState, useEffect } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import { useProfile } from "@/hooks/use-profile";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { profileService } from "@/services/profileService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

export default function SettingsPage() {
  usePageTitle("Settings");
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "" });

  useEffect(() => {
    if (profile) {
      setForm({ full_name: profile.full_name, email: profile.email });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;
    if (!form.full_name.trim()) { toast.error("Name is required"); return; }
    if (!form.email.trim()) { toast.error("Email is required"); return; }
    setSaving(true);
    try {
      await profileService.updateProfile({ full_name: form.full_name.trim(), email: form.email.trim() });
      toast.success("Settings saved");
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-ios-fade-in">
      <div><h1 className="text-2xl font-bold">Settings</h1><p className="text-[13px] text-muted-foreground">Manage your account preferences</p></div>
      <Tabs defaultValue="general">
        <TabsList className="bg-accent/40 rounded-xl"><TabsTrigger value="general" className="rounded-lg text-[13px]">General</TabsTrigger><TabsTrigger value="sms" className="rounded-lg text-[13px]">SMS Settings</TabsTrigger></TabsList>
        <TabsContent value="general" className="space-y-4 mt-4"><Card className="glass rounded-2xl border-border/30"><CardHeader><CardTitle className="text-[15px]">Account Information</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label className="text-[13px]">Full Name</Label><Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="rounded-xl border-border/30" /></div><div className="space-y-2"><Label className="text-[13px]">Email</Label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="rounded-xl border-border/30" /></div></div><Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground rounded-xl ios-press shadow-sm">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save Changes</Button></CardContent></Card></TabsContent>
        <TabsContent value="sms" className="space-y-4 mt-4"><Card className="glass rounded-2xl border-border/30"><CardHeader><CardTitle className="text-[15px]">SMS Preferences</CardTitle></CardHeader><CardContent className="space-y-4"><div className="flex items-center justify-between"><Label className="text-[13px]">Auto-append opt-out text</Label><Switch defaultChecked /></div><div className="flex items-center justify-between"><Label className="text-[13px]">Unicode encoding</Label><Switch /></div><div className="flex items-center justify-between"><Label className="text-[13px]">Delivery receipt notifications</Label><Switch defaultChecked /></div></CardContent></Card></TabsContent>
      </Tabs>
    </div>
  );
}
