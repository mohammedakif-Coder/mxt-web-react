import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { contactService } from "@/services/contactService";
import { queryKeys } from "@/constants/queryKeys";
import { usePageTitle } from "@/hooks/use-page-title";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus, Trash2, Edit, UserX, Users, List, ChevronRight, ArrowLeft, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { AISegmentDialog } from "@/features/ai/components/AISegmentDialog";
import { Sparkles, X } from "lucide-react";
import AIButton from "@/features/ai/components/AIButton";

export default function ContactsListPage() {
  usePageTitle("Contacts");
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("all");

  // Contact list state
  const [createListOpen, setCreateListOpen] = useState(false);
  const [editList, setEditList] = useState<any>(null);
  const [listForm, setListForm] = useState({ name: "", email_keyword: "", default_sender: "shared", is_global: false, description: "" });

  // Detail (manage list) state
  const [activeList, setActiveList] = useState<any>(null);
  const [memberPickerOpen, setMemberPickerOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [pickedContactIds, setPickedContactIds] = useState<string[]>([]);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddForm, setQuickAddForm] = useState({ full_name: "", phone: "", email: "" });

  // All-contacts tab state
  const [allSearch, setAllSearch] = useState("");
  const [editContact, setEditContact] = useState<any>(null);
  const [contactForm, setContactForm] = useState({ full_name: "", phone: "", email: "", opt_out: false });
  const [createContactOpen, setCreateContactOpen] = useState(false);

  // AI segment state
  const [aiSegmentOpen, setAiSegmentOpen] = useState(false);
  const [aiSegment, setAiSegment] = useState<{ name: string; ids: Set<string> } | null>(null);

  const { data: lists, isLoading: listsLoading } = useQuery({
    queryKey: queryKeys.contactLists,
    queryFn: contactService.listContactLists,
  });
  const { data: contacts } = useQuery({
    queryKey: queryKeys.contacts,
    queryFn: () => contactService.listContacts({ includeOptedOut: true }),
  });
  const { data: members } = useQuery({
    queryKey: queryKeys.contactListMembers,
    queryFn: contactService.listMembers,
  });

  const optOutCount = contacts?.filter((c: any) => c.opt_out).length ?? 0;
  const memberCount = (listId: string) => members?.filter((m: any) => m.list_id === listId).length ?? 0;
  const membersForList = (listId: string) => {
    const ids = new Set(members?.filter((m: any) => m.list_id === listId).map((m: any) => m.contact_id));
    return contacts?.filter((c: any) => ids.has(c.id)) ?? [];
  };

  const upsertListMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        name: listForm.name,
        email_keyword: listForm.email_keyword || null,
        default_sender: listForm.default_sender,
        is_global: listForm.is_global,
        description: listForm.description || null,
      };
      await contactService.upsertContactList(payload, editList?.id);
    },
    onSuccess: () => {
      toast.success(editList ? "Contact list updated" : "Contact list created");
      queryClient.invalidateQueries({ queryKey: queryKeys.contactLists });
      setCreateListOpen(false);
      resetListForm();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const addMembersMutation = useMutation({
    mutationFn: async () => {
      if (!activeList || pickedContactIds.length === 0) return;
      const existing = new Set(members?.filter((m: any) => m.list_id === activeList.id).map((m: any) => m.contact_id));
      const toAdd = pickedContactIds.filter((id) => !existing.has(id));
      if (toAdd.length === 0) {
        toast.info("All selected contacts are already in this list");
        return;
      }
      await contactService.addMembers(activeList.id, toAdd);
    },
    onSuccess: () => {
      toast.success("Contacts added to list");
      queryClient.invalidateQueries({ queryKey: queryKeys.contactListMembers });
      setMemberPickerOpen(false);
      setPickedContactIds([]);
      setMemberSearch("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const removeMemberMutation = useMutation({
    mutationFn: async ({ listId, contactId }: { listId: string; contactId: string }) => {
      await contactService.removeMember(listId, contactId);
    },
    onSuccess: () => {
      toast.success("Removed from list");
      queryClient.invalidateQueries({ queryKey: queryKeys.contactListMembers });
    },
  });

  const quickAddContactMutation = useMutation({
    mutationFn: async () => {
      const created = await contactService.upsertContact({ full_name: quickAddForm.full_name, phone: quickAddForm.phone, email: quickAddForm.email || null });
      if (activeList && created) await contactService.addMembers(activeList.id, [created.id]);
      if (created) void contactService.syncContactToCrm(created);
    },
    onSuccess: () => {
      toast.success("Contact added");
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts });
      queryClient.invalidateQueries({ queryKey: queryKeys.contactListMembers });
      setQuickAddOpen(false);
      setQuickAddForm({ full_name: "", phone: "", email: "" });
    },
    onError: (err: any) => toast.error(err.message),
  });

  // ----- All Contacts mutations -----
  const upsertContactMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        full_name: contactForm.full_name,
        phone: contactForm.phone,
        email: contactForm.email || null,
        opt_out: contactForm.opt_out,
      };
      if (editContact) {
        const updated = await contactService.upsertContact(payload, editContact.id);
        void contactService.syncContactToCrm(updated);
      } else {
        const created = await contactService.upsertContact(payload);
        void contactService.syncContactToCrm(created);
      }
    },
    onSuccess: () => {
      toast.success(editContact ? "Contact updated" : "Contact created");
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts });
      setEditContact(null);
      setCreateContactOpen(false);
      setContactForm({ full_name: "", phone: "", email: "", opt_out: false });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (id: string) => {
      await contactService.deleteContact(id);
    },
    onSuccess: () => {
      toast.success("Contact deleted");
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts });
      queryClient.invalidateQueries({ queryKey: queryKeys.contactListMembers });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const openCreateContact = () => {
    setEditContact(null);
    setContactForm({ full_name: "", phone: "", email: "", opt_out: false });
    setCreateContactOpen(true);
  };
  const openEditContact = (c: any) => {
    setEditContact(c);
    setContactForm({ full_name: c.full_name, phone: c.phone, email: c.email ?? "", opt_out: !!c.opt_out });
    setCreateContactOpen(true);
  };

  const resetListForm = () => {
    setListForm({ name: "", email_keyword: "", default_sender: "shared", is_global: false, description: "" });
    setEditList(null);
  };
  const openCreateList = () => {
    resetListForm();
    setCreateListOpen(true);
  };
  const openEditList = (l: any) => {
    setEditList(l);
    setListForm({
      name: l.name,
      email_keyword: l.email_keyword ?? "",
      default_sender: l.default_sender ?? "shared",
      is_global: l.is_global ?? false,
      description: l.description ?? "",
    });
    setCreateListOpen(true);
  };

  const formatTime = (d: string) => {
    const date = new Date(d);
    if (Date.now() - date.getTime() < 86400000) return formatDistanceToNow(date, { addSuffix: true });
    return format(date, "MMM d, yyyy");
  };

  // Available contacts for picker (exclude existing members)
  const existingMemberIds = activeList ? new Set(members?.filter((m: any) => m.list_id === activeList.id).map((m: any) => m.contact_id)) : new Set();
  const pickableContacts = contacts?.filter((c: any) => {
    if (existingMemberIds.has(c.id)) return false;
    if (!memberSearch) return true;
    const s = memberSearch.toLowerCase();
    return c.full_name.toLowerCase().includes(s) || c.phone.includes(s) || (c.email || "").toLowerCase().includes(s);
  });

  // ------- Detail view ("Manage list") -------
  if (activeList) {
    const listMembers = membersForList(activeList.id);
    return (
      <div className="space-y-4 animate-ios-fade-in">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setActiveList(null)} className="rounded-xl ios-press">
            <ArrowLeft className="h-4 w-4 mr-1" /> Contact Lists
          </Button>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
          <span className="text-[13px] font-medium">{activeList.name}</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{activeList.name}</h1>
            <p className="text-muted-foreground text-[13px]">{listMembers.length} contacts in this list</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setQuickAddOpen(true)} className="rounded-xl ios-press">
              <UserPlus className="mr-2 h-4 w-4" /> Add New Contact
            </Button>
            <Button onClick={() => { setPickedContactIds([]); setMemberSearch(""); setMemberPickerOpen(true); }} className="bg-primary hover:bg-primary/90 rounded-xl ios-press shadow-sm">
              <Plus className="mr-2 h-4 w-4" /> Add Existing Contacts
            </Button>
          </div>
        </div>

        <Card className="glass rounded-2xl border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-[13px]">List Settings</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[13px]">
            <div><p className="text-[11px] text-muted-foreground">Email keyword</p><p className="font-mono">{activeList.email_keyword || "—"}</p></div>
            <div><p className="text-[11px] text-muted-foreground">Default sender</p><p className="capitalize">{activeList.default_sender === "shared" ? "Shared numbers" : activeList.default_sender}</p></div>
            <div><p className="text-[11px] text-muted-foreground">Global list</p><p>{activeList.is_global ? "Yes" : "No"}</p></div>
            <div><p className="text-[11px] text-muted-foreground">Created</p><p>{format(new Date(activeList.created_at), "MMM d, yyyy")}</p></div>
            <div className="col-span-full flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => openEditList(activeList)} className="rounded-xl ios-press text-[12px]">
                <Edit className="h-3.5 w-3.5 mr-1" /> Edit list settings
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="glass rounded-2xl border border-border/30 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-accent/30">
                <TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>Email</TableHead><TableHead>Tags</TableHead><TableHead className="w-28">Added</TableHead><TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listMembers.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12">
                  <Users className="h-10 w-10 mx-auto text-muted-foreground/20" />
                  <p className="text-muted-foreground text-[13px] mt-2">No contacts in this list yet</p>
                  <p className="text-muted-foreground text-[11px]">Click "Add Existing Contacts" or "Add New Contact" to get started.</p>
                </TableCell></TableRow>
              ) : listMembers.map((c: any) => (
                <TableRow key={c.id} className="hover:bg-accent/30 transition-all duration-300 ease-ios">
                  <TableCell className="font-medium text-[13px]">{c.full_name}</TableCell>
                  <TableCell className="text-[13px] text-muted-foreground font-mono">{c.phone}</TableCell>
                  <TableCell className="text-[13px] text-muted-foreground">{c.email || "—"}</TableCell>
                  <TableCell><div className="flex gap-1 flex-wrap">{c.tags?.map((t: string) => <Badge key={t} variant="secondary" className="text-[10px] rounded-lg">{t}</Badge>)}</div></TableCell>
                  <TableCell className="text-[11px] text-muted-foreground">{formatTime(c.updated_at)}</TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-destructive ios-press"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-2xl">
                        <AlertDialogHeader><AlertDialogTitle>Remove {c.full_name} from list?</AlertDialogTitle><AlertDialogDescription>The contact stays in your overall contacts — only the list membership is removed.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => removeMemberMutation.mutate({ listId: activeList.id, contactId: c.id })} className="rounded-xl">Remove</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Picker for existing contacts */}
        <Dialog open={memberPickerOpen} onOpenChange={setMemberPickerOpen}>
          <DialogContent className="rounded-2xl max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add contacts to "{activeList.name}"</DialogTitle>
              <DialogDescription className="text-[12px]">Select existing contacts to add to this list.</DialogDescription>
            </DialogHeader>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} placeholder="Search contacts..." className="pl-8 h-9 text-[13px] rounded-xl border-border/30" />
            </div>
            <div className="max-h-80 overflow-y-auto border border-border/30 rounded-xl divide-y divide-border/30">
              {pickableContacts?.length === 0 ? (
                <p className="text-center text-[13px] text-muted-foreground py-8">No contacts available</p>
              ) : pickableContacts?.map((c: any) => {
                const checked = pickedContactIds.includes(c.id);
                return (
                  <label key={c.id} className="flex items-center gap-3 px-3 py-2 hover:bg-accent/30 cursor-pointer">
                    <Checkbox checked={checked} onCheckedChange={(v) => { setPickedContactIds((prev) => v ? [...prev, c.id] : prev.filter((id) => id !== c.id)); }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate">{c.full_name}</p>
                      <p className="text-[11px] text-muted-foreground font-mono truncate">{c.phone}{c.email ? ` · ${c.email}` : ""}</p>
                    </div>
                  </label>
                );
              })}
            </div>
            <DialogFooter>
              <p className="text-[11px] text-muted-foreground mr-auto self-center">{pickedContactIds.length} selected</p>
              <Button variant="outline" onClick={() => setMemberPickerOpen(false)} className="rounded-xl">Cancel</Button>
              <Button onClick={() => addMembersMutation.mutate()} disabled={pickedContactIds.length === 0} className="bg-primary hover:bg-primary/90 rounded-xl">Add {pickedContactIds.length || ""}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Quick add a new contact directly into list */}
        <Sheet open={quickAddOpen} onOpenChange={setQuickAddOpen}>
          <SheetContent className="w-[400px]">
            <SheetHeader>
              <SheetTitle>Add Contact to "{activeList.name}"</SheetTitle>
              <SheetDescription className="text-[12px]">Creates a new contact and adds it to this list.</SheetDescription>
            </SheetHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2"><Label className="text-[13px]">Full Name *</Label><Input value={quickAddForm.full_name} onChange={(e) => setQuickAddForm({ ...quickAddForm, full_name: e.target.value })} className="rounded-xl border-border/30" /></div>
              <div className="space-y-2"><Label className="text-[13px]">Phone *</Label><Input value={quickAddForm.phone} onChange={(e) => setQuickAddForm({ ...quickAddForm, phone: e.target.value })} placeholder="+61400000000" className="font-mono rounded-xl border-border/30" /></div>
              <div className="space-y-2"><Label className="text-[13px]">Email</Label><Input value={quickAddForm.email} onChange={(e) => setQuickAddForm({ ...quickAddForm, email: e.target.value })} className="rounded-xl border-border/30" /></div>
            </div>
            <SheetFooter className="mt-6">
              <Button variant="outline" onClick={() => setQuickAddOpen(false)} className="rounded-xl">Cancel</Button>
              <Button onClick={() => quickAddContactMutation.mutate()} disabled={!quickAddForm.full_name || !quickAddForm.phone} className="bg-primary hover:bg-primary/90 rounded-xl ios-press">Add to list</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Edit list settings reuses createListOpen */}
        <CreateListSheet
          open={createListOpen}
          onOpenChange={(o) => { setCreateListOpen(o); if (!o) resetListForm(); }}
          form={listForm}
          setForm={setListForm}
          editing={!!editList}
          onSubmit={() => upsertListMutation.mutate()}
        />
      </div>
    );
  }

  // ------- Index view (lists + opt-outs) -------
  return (
    <div className="space-y-4 animate-ios-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contacts</h1>
          <p className="text-muted-foreground text-[13px]">{lists?.length ?? 0} contact lists · {contacts?.length ?? 0} contacts total</p>
        </div>
        {tab === "lists" && (
          <Button onClick={openCreateList} className="bg-primary hover:bg-primary/90 rounded-xl ios-press shadow-sm">
            <Plus className="mr-2 h-4 w-4" /> Add Contact List
          </Button>
        )}
        {tab === "all" && (
          <div className="flex items-center gap-2">
            <AIButton onClick={() => setAiSegmentOpen(true)}>AI Segment</AIButton>
            <Button onClick={openCreateContact} className="bg-primary hover:bg-primary/90 rounded-xl ios-press shadow-sm">
              <UserPlus className="mr-2 h-4 w-4" /> Add Contact
            </Button>
          </div>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-accent/40 rounded-xl">
          <TabsTrigger value="all" className="gap-1.5 rounded-lg text-[13px]"><Users className="h-3.5 w-3.5" /> All Contacts</TabsTrigger>
          <TabsTrigger value="lists" className="gap-1.5 rounded-lg text-[13px]"><List className="h-3.5 w-3.5" /> Contact Lists</TabsTrigger>
          <TabsTrigger value="opt-out" className="gap-1.5 rounded-lg text-[13px]"><UserX className="h-3.5 w-3.5" /> Opt-Out List</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-4">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative max-w-md flex-1 min-w-[240px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={allSearch}
                onChange={(e) => setAllSearch(e.target.value)}
                placeholder="Search by name, phone or email..."
                className="pl-8 h-9 text-[13px] rounded-xl border-border/30"
              />
            </div>
            {aiSegment && (
              <Badge variant="secondary" className="rounded-xl gap-1.5 py-1.5 px-2.5 text-[12px]">
                <Sparkles className="h-3 w-3 text-primary" />
                {aiSegment.name} · {aiSegment.ids.size}
                <button onClick={() => setAiSegment(null)} className="ml-1 hover:text-destructive"><X className="h-3 w-3" /></button>
              </Badge>
            )}
          </div>
          <div className="glass rounded-2xl border border-border/30 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-accent/30">
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="w-24 text-center">Status</TableHead>
                  <TableHead className="w-28">Updated</TableHead>
                  <TableHead className="w-24 text-right pr-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  const filtered = (contacts ?? []).filter((c: any) => {
                    if (aiSegment && !aiSegment.ids.has(c.id)) return false;
                    if (!allSearch) return true;
                    const s = allSearch.toLowerCase();
                    return (
                      c.full_name.toLowerCase().includes(s) ||
                      c.phone.includes(s) ||
                      (c.email || "").toLowerCase().includes(s)
                    );
                  });
                  if (filtered.length === 0) {
                    return (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <Users className="h-10 w-10 mx-auto text-muted-foreground/20" />
                          <p className="text-muted-foreground text-[13px] mt-2">
                            {contacts?.length ? "No contacts match your search" : "No contacts yet"}
                          </p>
                          <p className="text-muted-foreground text-[11px]">
                            {contacts?.length ? "Try a different keyword." : "Click \"Add Contact\" to create your first one."}
                          </p>
                        </TableCell>
                      </TableRow>
                    );
                  }
                  return filtered.map((c: any) => (
                    <TableRow key={c.id} className="hover:bg-accent/30 transition-all duration-300 ease-ios">
                      <TableCell className="font-medium text-[13px]">{c.full_name}</TableCell>
                      <TableCell className="text-[13px] text-muted-foreground font-mono">{c.phone}</TableCell>
                      <TableCell className="text-[13px] text-muted-foreground">{c.email || "—"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {c.tags?.map((t: string) => (
                            <Badge key={t} variant="secondary" className="text-[10px] rounded-lg">{t}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {c.opt_out ? (
                          <Badge variant="outline" className="text-[10px] rounded-lg text-destructive border-destructive/30">Opted out</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] rounded-lg">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-[11px] text-muted-foreground">{formatTime(c.updated_at)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg ios-press" onClick={() => openEditContact(c)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-destructive ios-press">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-2xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete {c.full_name}?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This permanently removes the contact and any list memberships. This cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteContactMutation.mutate(c.id)}
                                  className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ));
                })()}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="lists" className="space-y-4 mt-4">
          <div className="glass rounded-2xl border border-border/30 overflow-hidden">
            {listsLoading ? (
              <div className="p-4 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-accent/30">
                    <TableHead>Name</TableHead>
                    <TableHead>Email Keyword</TableHead>
                    <TableHead>Default Sender</TableHead>
                    <TableHead className="w-24 text-center">Contacts</TableHead>
                    <TableHead className="w-20 text-center">Global</TableHead>
                    <TableHead className="w-28">Created</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lists?.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-12">
                      <List className="h-10 w-10 mx-auto text-muted-foreground/20" />
                      <p className="text-muted-foreground text-[13px] mt-2">No contact lists yet</p>
                      <p className="text-muted-foreground text-[11px]">Click "Add Contact List" to create your first list.</p>
                    </TableCell></TableRow>
                  ) : lists?.map((l: any) => (
                    <TableRow key={l.id} className="hover:bg-accent/30 transition-all duration-300 ease-ios cursor-pointer ios-press" onClick={() => setActiveList(l)}>
                      <TableCell><span className="font-medium text-[13px]">{l.name}</span></TableCell>
                      <TableCell className="text-[13px] text-muted-foreground font-mono">{l.email_keyword || "—"}</TableCell>
                      <TableCell className="text-[13px] text-muted-foreground capitalize">{l.default_sender === "shared" ? "Shared numbers" : l.default_sender}</TableCell>
                      <TableCell className="text-center"><Badge variant="secondary" className="text-[10px] rounded-lg">{memberCount(l.id)}</Badge></TableCell>
                      <TableCell className="text-center">{l.is_global ? <Badge variant="outline" className="text-[10px] rounded-lg">Global</Badge> : <span className="text-[11px] text-muted-foreground">—</span>}</TableCell>
                      <TableCell className="text-[11px] text-muted-foreground">{format(new Date(l.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg ios-press" onClick={() => openEditList(l)}><Edit className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="opt-out" className="space-y-4 mt-4">
          <Card className="glass rounded-2xl border-destructive/20 bg-destructive/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-[13px] flex items-center gap-2">
                <UserX className="h-4 w-4 text-destructive" /> Opt-Out List
                <Badge variant="outline" className="text-destructive border-destructive/20 text-[10px] rounded-lg">System</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-muted-foreground mb-2">Automatically managed opt-out list. Contacts here will never receive messages.</p>
              <p className="text-[13px] font-semibold">{optOutCount} contacts</p>
            </CardContent>
          </Card>
          <div className="glass rounded-2xl border border-border/30 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-accent/30">
                  <TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>Email</TableHead><TableHead>Opted Out Since</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts?.filter((c: any) => c.opt_out).length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-12"><UserX className="h-10 w-10 mx-auto text-muted-foreground/20" /><p className="text-muted-foreground text-[13px] mt-2">No opted-out contacts</p></TableCell></TableRow>
                ) : contacts?.filter((c: any) => c.opt_out).map((c: any) => (
                  <TableRow key={c.id} className="hover:bg-accent/30 transition-all">
                    <TableCell className="font-medium text-[13px]">{c.full_name}</TableCell>
                    <TableCell className="text-[13px] text-muted-foreground font-mono">{c.phone}</TableCell>
                    <TableCell className="text-[13px] text-muted-foreground">{c.email || "—"}</TableCell>
                    <TableCell className="text-[11px] text-muted-foreground">{formatTime(c.updated_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <CreateListSheet
        open={createListOpen}
        onOpenChange={(o) => { setCreateListOpen(o); if (!o) resetListForm(); }}
        form={listForm}
        setForm={setListForm}
        editing={!!editList}
        onSubmit={() => upsertListMutation.mutate()}
      />

      <AISegmentDialog
        open={aiSegmentOpen}
        onOpenChange={setAiSegmentOpen}
        contacts={contacts ?? []}
        onApply={(ids, name) => {
          setAiSegment({ name, ids: new Set(ids) });
          setTab("all");
          toast.success(`Filtered to "${name}" (${ids.length} contacts)`);
        }}
      />

      {/* Create / edit a contact directly (All Contacts tab) */}
      <Sheet
        open={createContactOpen}
        onOpenChange={(o) => {
          setCreateContactOpen(o);
          if (!o) {
            setEditContact(null);
            setContactForm({ full_name: "", phone: "", email: "", opt_out: false });
          }
        }}
      >
        <SheetContent className="w-[400px] sm:max-w-[400px]">
          <SheetHeader>
            <SheetTitle>{editContact ? "Edit Contact" : "Add Contact"}</SheetTitle>
            <SheetDescription className="text-[12px]">
              {editContact ? "Update this contact's details." : "Save a new contact to your address book."}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-[13px]"><span className="text-destructive">*</span> Full Name</Label>
              <Input
                value={contactForm.full_name}
                onChange={(e) => setContactForm({ ...contactForm, full_name: e.target.value })}
                className="rounded-xl border-border/30"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px]"><span className="text-destructive">*</span> Phone</Label>
              <Input
                value={contactForm.phone}
                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                placeholder="+61400000000"
                className="font-mono rounded-xl border-border/30"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px]">Email</Label>
              <Input
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                className="rounded-xl border-border/30"
              />
            </div>
            <div className="flex items-start gap-2">
              <Checkbox
                id="contact-opt-out"
                checked={contactForm.opt_out}
                onCheckedChange={(v) => setContactForm({ ...contactForm, opt_out: !!v })}
                className="mt-0.5"
              />
              <div>
                <Label htmlFor="contact-opt-out" className="text-[13px] cursor-pointer">Opted out</Label>
                <p className="text-[11px] text-muted-foreground italic">Excluded from all sends.</p>
              </div>
            </div>
          </div>
          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => setCreateContactOpen(false)} className="rounded-xl">Cancel</Button>
            <Button
              onClick={() => upsertContactMutation.mutate()}
              disabled={!contactForm.full_name || !contactForm.phone}
              className="bg-primary hover:bg-primary/90 rounded-xl ios-press"
            >
              {editContact ? "Save Changes" : "Add Contact"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

interface CreateListSheetProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  form: { name: string; email_keyword: string; default_sender: string; is_global: boolean; description: string };
  setForm: (f: any) => void;
  editing: boolean;
  onSubmit: () => void;
}

function CreateListSheet({ open, onOpenChange, form, setForm, editing, onSubmit }: CreateListSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[440px] sm:max-w-[440px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{editing ? "Edit Contact List" : "Create New Contact List"}</SheetTitle>
          <SheetDescription className="text-[12px]">Group contacts together to send bulk messages or run campaigns.</SheetDescription>
        </SheetHeader>
        <div className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label className="text-[13px]"><span className="text-destructive">*</span> Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Contact List Name" className="rounded-xl border-border/30" />
          </div>

          <div className="space-y-2">
            <Label className="text-[13px]">Email Keyword</Label>
            <Input value={form.email_keyword} onChange={(e) => setForm({ ...form, email_keyword: e.target.value })} placeholder="Email Keyword" className="rounded-xl border-border/30" />
            <p className="text-[11px] text-muted-foreground italic">A keyword for use with Email to SMS.</p>
          </div>

          <div className="space-y-2">
            <Label className="text-[13px]"><span className="text-destructive">*</span> Default From Address</Label>
            <Select value={form.default_sender} onValueChange={(v) => setForm({ ...form, default_sender: v })}>
              <SelectTrigger className="rounded-xl border-border/30"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="shared">Use shared numbers</SelectItem>
                <SelectItem value="virtual">Use virtual number</SelectItem>
                <SelectItem value="alpha">Use sender ID (Alpha)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-start gap-2">
            <Checkbox id="is-global" checked={form.is_global} onCheckedChange={(v) => setForm({ ...form, is_global: !!v })} className="mt-0.5" />
            <div>
              <Label htmlFor="is-global" className="text-[13px] cursor-pointer">Make this a Global Contact List</Label>
              <p className="text-[11px] text-muted-foreground italic">Share this contact list with your sub accounts.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[13px]">Description</Label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional" className="rounded-xl border-border/30" />
          </div>
        </div>
        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">Cancel</Button>
          <Button onClick={onSubmit} disabled={!form.name} className="bg-primary hover:bg-primary/90 rounded-xl ios-press">
            {editing ? "Save Changes" : "Add Contact List"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
