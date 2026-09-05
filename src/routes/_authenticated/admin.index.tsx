import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Studio Dashboard — InkPark Aftercare" },
      { name: "description", content: "Manage InkPark clients, tattoo sessions, artists and aftercare content." },
      { property: "og:title", content: "Studio Dashboard — InkPark Aftercare" },
      { property: "og:description", content: "Manage InkPark clients, tattoo sessions, artists and aftercare content." },
    ],
  }),
  component: AdminHome,
});

function AdminHome() {
  return (
    <AdminShell title="Dashboard">
      <Link
        to="/admin/reply"
        className="ink-card mb-3 flex items-center justify-between p-4 hover:bg-accent"
      >
        <span className="text-base text-foreground">Photo replies</span>
        <span className="ink-label">Write AI check &amp; artist feedback →</span>
      </Link>
      <Link
        to="/admin/faq"
        className="ink-card mb-6 flex items-center justify-between p-4 hover:bg-accent"
      >
        <span className="text-base text-foreground">Knowledge Hub</span>
        <span className="ink-label">Edit client questions &amp; answers →</span>
      </Link>
      <Tabs defaultValue="sessions">

        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="sessions">Ink</TabsTrigger>
          <TabsTrigger value="clients">People</TabsTrigger>
          <TabsTrigger value="artists">Artists</TabsTrigger>
          <TabsTrigger value="care">Care</TabsTrigger>
          <TabsTrigger value="settings">Setup</TabsTrigger>
        </TabsList>
        <TabsContent value="sessions" className="mt-6">
          <Sessions />
        </TabsContent>
        <TabsContent value="clients" className="mt-6">
          <Clients />
        </TabsContent>
        <TabsContent value="artists" className="mt-6">
          <Artists />
        </TabsContent>
        <TabsContent value="care" className="mt-6">
          <CareEditor />
        </TabsContent>
        <TabsContent value="settings" className="mt-6">
          <Settings />
        </TabsContent>
      </Tabs>
    </AdminShell>
  );
}

/* ---------------- sessions ---------------- */

function Sessions() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [artistId, setArtistId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [style, setStyle] = useState("");
  const [placement, setPlacement] = useState("");

  const tattoos = useQuery({
    queryKey: ["tattoos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tattoos")
        .select("id, tattoo_date, style, placement, review_submitted, rebooking_requested, clients(full_name), artists(name)")
        .order("tattoo_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const clients = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, full_name").order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const artists = useQuery({
    queryKey: ["artists"],
    queryFn: async () => {
      const { data, error } = await supabase.from("artists").select("id, name").eq("active", true).order("name");
      if (error) throw error;
      return data;
    },
  });

  const flags = useQuery({
    queryKey: ["healing-flags"],
    queryFn: async () => {
      const { data, error } = await supabase.from("healing_photos").select("tattoo_id").eq("flagged", true);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.tattoo_id as string));
    },
  });

  async function create() {
    if (!clientId) {
      toast.error("Pick a client first");
      return;
    }
    const { error } = await supabase.from("tattoos").insert({
      client_id: clientId,
      artist_id: artistId || null,
      tattoo_date: date,
      style: style || null,
      placement: placement || null,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Session created — reminders scheduled");
    setOpen(false);
    setStyle("");
    setPlacement("");
    qc.invalidateQueries({ queryKey: ["tattoos"] });
  }

  return (
    <div className="space-y-4">
      <Button className="w-full" onClick={() => setOpen(!open)}>
        {open ? "Cancel" : "New tattoo session"}
      </Button>

      {open ? (
        <div className="ink-card space-y-4 p-5">
          <div className="space-y-2">
            <Label>Client</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {(clients.data ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Artist</Label>
            <Select value={artistId} onValueChange={setArtistId}>
              <SelectTrigger>
                <SelectValue placeholder="Select artist" />
              </SelectTrigger>
              <SelectContent>
                {(artists.data ?? []).map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="d">Tattoo date</Label>
            <Input id="d" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s">Style</Label>
            <Input id="s" value={style} onChange={(e) => setStyle(e.target.value)} placeholder="Fine line, blackwork…" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p">Placement</Label>
            <Input id="p" value={placement} onChange={(e) => setPlacement(e.target.value)} placeholder="Left forearm" />
          </div>
          <Button className="w-full" onClick={create}>
            Create session
          </Button>
        </div>
      ) : null}

      <div className="ink-card divide-y divide-border">
        {(tattoos.data ?? []).length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">No sessions yet.</p>
        ) : null}
        {(tattoos.data ?? []).map((t) => (
          <Link
            key={t.id}
            to="/admin/tattoo/$id"
            params={{ id: t.id }}
            className="flex items-center justify-between gap-3 p-4 hover:bg-accent"
          >
            <div className="min-w-0">
              <p className="truncate text-base text-foreground">
                {(t.clients as { full_name: string } | null)?.full_name ?? "Client"}
              </p>
              <p className="ink-label mt-1 truncate">
                {t.tattoo_date} · {(t.artists as { name: string } | null)?.name ?? "No artist"} ·{" "}
                {t.style ?? "—"}
              </p>
            </div>
            <span className="ink-label shrink-0">
              {flags.data?.has(t.id) ? (
                <span className="mr-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  ⚠️ ATTENTION
                </span>
              ) : null}
              {t.review_submitted ? "★" : ""} {t.rebooking_requested ? "↻" : ""}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ---------------- clients ---------------- */

function Clients() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const clients = useQuery({
    queryKey: ["clients-full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, full_name, phone, email, photo_sharing_consent")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  async function add() {
    if (!name.trim()) {
      toast.error("Name required");
      return;
    }
    const { error } = await supabase
      .from("clients")
      .insert({ full_name: name.trim(), phone: phone || null, email: email || null });
    if (error) {
      toast.error(error.message);
      return;
    }
    setName("");
    setPhone("");
    setEmail("");
    toast.success("Client added");
    qc.invalidateQueries({ queryKey: ["clients-full"] });
    qc.invalidateQueries({ queryKey: ["clients"] });
  }

  async function toggleConsent(id: string, value: boolean) {
    const { error } = await supabase.from("clients").update({ photo_sharing_consent: value }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["clients-full"] });
  }

  async function remove(id: string, clientName: string) {
    if (!window.confirm(`Delete client "${clientName}"? Their sessions will also be removed. This cannot be undone.`))
      return;
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Client deleted");
    qc.invalidateQueries({ queryKey: ["clients-full"] });
    qc.invalidateQueries({ queryKey: ["clients"] });
    qc.invalidateQueries({ queryKey: ["tattoos"] });
  }

  return (
    <div className="space-y-4">
      <div className="ink-card space-y-3 p-5">
        <Label htmlFor="cn">New client</Label>
        <Input id="cn" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Phone (WhatsApp)" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button className="w-full" onClick={add}>
          Add client
        </Button>
      </div>

      <div className="ink-card divide-y divide-border">
        {(clients.data ?? []).length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">No clients yet.</p>
        ) : null}
        {(clients.data ?? []).map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-base text-foreground">{c.full_name}</p>
              <p className="ink-label mt-1 truncate">{c.phone ?? c.email ?? "No contact"}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Switch
                checked={c.photo_sharing_consent}
                onCheckedChange={(v) => toggleConsent(c.id, v)}
              />
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => remove(c.id, c.full_name)}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Photos and client details are private by default. The “Share OK” switch only records explicit
        client permission — it never publishes anything automatically.
      </p>
    </div>
  );
}

/* ---------------- artists ---------------- */

function Artists() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [instagram, setInstagram] = useState("");

  const artists = useQuery({
    queryKey: ["artists-full"],
    queryFn: async () => {
      const { data, error } = await supabase.from("artists").select("id, name, instagram, active").order("name");
      if (error) throw error;
      return data;
    },
  });

  async function add() {
    if (!name.trim()) {
      toast.error("Name required");
      return;
    }
    const { error } = await supabase.from("artists").insert({ name: name.trim(), instagram: instagram || null });
    if (error) {
      toast.error(error.message);
      return;
    }
    setName("");
    setInstagram("");
    qc.invalidateQueries({ queryKey: ["artists-full"] });
    qc.invalidateQueries({ queryKey: ["artists"] });
  }

  async function remove(id: string, artistName: string) {
    if (!window.confirm(`Delete artist "${artistName}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("artists").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Artist deleted");
    qc.invalidateQueries({ queryKey: ["artists-full"] });
    qc.invalidateQueries({ queryKey: ["artists"] });
  }

  return (
    <div className="space-y-4">
      <div className="ink-card divide-y divide-border">
        {(artists.data ?? []).length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">No artists yet.</p>
        ) : null}
        {(artists.data ?? []).map((a) => (
          <div key={a.id} className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-base text-foreground">{a.name}</p>
              <p className="ink-label mt-1 block truncate">{a.instagram ?? "—"}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Switch
                checked={a.active}
                onCheckedChange={async (v) => {
                  await supabase.from("artists").update({ active: v }).eq("id", a.id);
                  qc.invalidateQueries({ queryKey: ["artists-full"] });
                }}
              />
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => remove(a.id, a.name)}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="ink-card space-y-3 p-5">
        <Label htmlFor="an">New artist</Label>
        <Input id="an" placeholder="Artist name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="@instagram" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
        <Button className="w-full" onClick={add}>
          Add artist
        </Button>
      </div>
    </div>
  );
}

/* ---------------- aftercare editor ---------------- */

const CARE_FIELDS = [
  ["cleaning", "Cleaning"],
  ["moisturizing", "Moisturizing"],
  ["avoid", "What to avoid"],
  ["normal", "What is normal"],
  ["contact", "When to contact InkPark"],
] as const;

function CareEditor() {
  const qc = useQueryClient();
  const stages = useQuery({
    queryKey: ["stages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aftercare_stages")
        .select("id, title, subtitle, cleaning, moisturizing, avoid, normal, contact, sort_order")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  async function save(id: string, patch: Record<string, string>) {
    const { error } = await supabase.from("aftercare_stages").update(patch as never).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Instructions updated");
    qc.invalidateQueries({ queryKey: ["stages"] });
  }

  return (
    <div className="space-y-4">
      {(stages.data ?? []).map((s) => (
        <details key={s.id} className="ink-card p-5">
          <summary className="cursor-pointer text-lg text-foreground">{s.title}</summary>
          <div className="mt-4 space-y-4">
            {CARE_FIELDS.map(([field, label]) => (
              <div key={field} className="space-y-2">
                <Label>{label}</Label>
                <Textarea
                  defaultValue={(s as Record<string, unknown>)[field] as string | null ?? ""}
                  rows={3}
                  onBlur={(e) => {
                    const value = e.target.value;
                    if (value !== ((s as Record<string, unknown>)[field] ?? "")) {
                      save(s.id, { [field]: value });
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}

/* ---------------- settings ---------------- */

function Settings() {
  const qc = useQueryClient();
  const settings = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("studio_settings")
        .select("id, whatsapp_number, contact_email, review_url, booking_url")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  async function save(patch: Record<string, string>) {
    const { error } = await supabase.from("studio_settings").update(patch as never).eq("id", true);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Saved");
    qc.invalidateQueries({ queryKey: ["settings"] });
  }

  const s = settings.data;
  if (!s) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const fields: [string, string, string][] = [
    ["whatsapp_number", "WhatsApp number", "+8801700000000"],
    ["contact_email", "Contact email", "hello@inkpark.studio"],
    ["review_url", "Review Generator link", "https://…"],
    ["booking_url", "Booking link", "https://…"],
  ];

  return (
    <div className="ink-card space-y-4 p-5">
      {fields.map(([key, label, placeholder]) => (
        <div key={key} className="space-y-2">
          <Label>{label}</Label>
          <Input
            defaultValue={(s as Record<string, unknown>)[key] as string | null ?? ""}
            placeholder={placeholder}
            onBlur={(e) => {
              if (e.target.value !== ((s as Record<string, unknown>)[key] ?? "")) {
                save({ [key]: e.target.value });
              }
            }}
          />
        </div>
      ))}
    </div>
  );
}
