import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/AdminShell";
import { UploadZone } from "@/components/UploadZone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/tattoo/$id")({
  head: () => ({
    meta: [
      { title: "Session Record — InkPark Aftercare" },
      { name: "description", content: "Manage a tattoo session, its client link, healing photos and reminders." },
      { property: "og:title", content: "Session Record — InkPark Aftercare" },
      { property: "og:description", content: "Manage a tattoo session, its client link, healing photos and reminders." },
    ],
  }),
  component: TattooDetail,
});

function TattooDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();

  const tattoo = useQuery({
    queryKey: ["tattoo", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tattoos")
        .select(
          "id, tattoo_date, style, placement, photo_path, access_token, review_submitted, rebooking_requested, clients(full_name, phone), artists(name)",
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const photoUrl = useQuery({
    queryKey: ["tattoo-photo", tattoo.data?.photo_path],
    enabled: Boolean(tattoo.data?.photo_path),
    queryFn: async () => {
      const { data } = await supabase.storage
        .from("tattoo-photos")
        .createSignedUrl(tattoo.data!.photo_path!, 3600);
      return data?.signedUrl ?? null;
    },
  });

  const healing = useQuery({
    queryKey: ["healing", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("healing_photos")
        .select("id, day_marker, storage_path, created_at, note, ai_feedback, artist_feedback, client_reaction, flagged, concern")
        .eq("tattoo_id", id)
        .order("day_marker");
      if (error) throw error;
      const signed = await Promise.all(
        data.map(async (p) => {
          const { data: s } = await supabase.storage.from("healing-photos").createSignedUrl(p.storage_path, 3600);
          return { ...p, url: s?.signedUrl ?? null };
        }),
      );
      return signed;
    },
  });


  const messages = useQuery({
    queryKey: ["support", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_messages")
        .select("id, message, created_at, handled")
        .eq("tattoo_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const reminders = useQuery({
    queryKey: ["reminders", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reminders")
        .select("id, day_marker, scheduled_for, sent_at, enabled")
        .eq("tattoo_id", id)
        .order("day_marker");
      if (error) throw error;
      return data;
    },
  });

  const follows = useQuery({
    queryKey: ["stage-follows", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stage_follows")
        .select("id, created_at, aftercare_stages(title)")
        .eq("tattoo_id", id)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const link =
    typeof window !== "undefined" && tattoo.data
      ? `${window.location.origin}/a/${tattoo.data.access_token}`
      : "";

  useEffect(() => {
    if (!link) return;
    QRCode.toDataURL(link, { margin: 1, width: 480, color: { dark: "#111111", light: "#ffffff" } })
      .then(setQr)
      .catch(() => setQr(null));
  }, [link]);

  async function uploadTattooPhoto(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${id}/main-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("tattoo-photos").upload(path, file);
    if (error) {
      toast.error(error.message);
      return;
    }
    await supabase.from("tattoos").update({ photo_path: path }).eq("id", id);
    toast.success("Photo added");
    qc.invalidateQueries({ queryKey: ["tattoo", id] });
  }

  const t = tattoo.data;

  return (
    <AdminShell title="Session" back={{ to: "/admin", label: "← Back to dashboard" }}>
      {!t ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-6">
          <section className="ink-card p-5">
            <p className="ink-label">Client</p>
            <h2 className="mt-1 text-2xl text-foreground">
              {(t.clients as { full_name: string } | null)?.full_name}
            </h2>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <Field label="Date" value={t.tattoo_date} />
              <Field label="Artist" value={(t.artists as { name: string } | null)?.name ?? "—"} />
              <Field label="Style" value={t.style ?? "—"} />
              <Field label="Placement" value={t.placement ?? "—"} />
            </dl>
            <div className="mt-5 space-y-3">
              <EditableField id={id} field="style" label="Style" value={t.style} qc={qc} />
              <EditableField id={id} field="placement" label="Placement" value={t.placement} qc={qc} />
            </div>
            <div className="mt-5 border-t border-border pt-4">
              <p className="ink-label">Care steps client is following</p>
              {follows.data && follows.data.length > 0 ? (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {follows.data.map((f) => (
                    <li
                      key={f.id}
                      className="ink-label rounded-full border border-foreground/30 px-3 py-1 text-foreground"
                    >
                      ✓ {(f.aftercare_stages as { title: string } | null)?.title ?? "Stage"}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">Client hasn't marked any stage yet.</p>
              )}
            </div>
          </section>

          <section className="ink-card p-5">
            <p className="ink-label">Tattoo photo</p>
            {photoUrl.data ? (
              <img
                src={photoUrl.data}
                alt="Studio photo of the finished tattoo"
                className="mt-3 w-full rounded-md object-cover"
              />
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No photo uploaded yet.</p>
            )}
            <div className="mt-3">
              <UploadZone
                id="tattoo-photo"
                title={photoUrl.data ? "Replace studio photo" : "Upload studio photo"}
                caption="Camera or gallery"
                onFile={(f) => uploadTattooPhoto(f)}
              />
            </div>
          </section>

          <section className="ink-card p-5">
            <p className="ink-label">Client aftercare link</p>
            {(() => {
              const start = new Date(`${t.tattoo_date}T00:00:00Z`).getTime();
              const now = new Date();
              const days = Math.floor(
                (Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - start) / 86400000,
              );
              const expiresOn = new Date(start + 30 * 86400000).toISOString().slice(0, 10);
              const expired = days > 30;
              return (
                <p className="mt-2 text-sm text-foreground">
                  {expired
                    ? `Deactivated — 30-day window ended ${expiresOn}. All records below are preserved.`
                    : `Active — expires ${expiresOn} (${30 - days} day${30 - days === 1 ? "" : "s"} left).`}
                </p>
              );
            })()}
            {qr ? <img src={qr} alt="QR code for the client aftercare page" className="mt-3 w-40" /> : null}
            <p className="mt-3 break-all text-xs text-muted-foreground">{link}</p>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(link);
                  toast.success("Link copied");
                }}
              >
                Copy link
              </Button>
              {qr ? (
                <Button size="sm" variant="outline" asChild>
                  <a href={qr} download={`inkpark-qr-${id.slice(0, 6)}.png`}>
                    Download QR
                  </a>
                </Button>
              ) : null}
            </div>
          </section>

          {(healing.data ?? []).some((p) => p.flagged) ? (
            <section className="rounded-lg border-2 border-red-600 bg-red-50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-base font-bold tracking-wide text-red-700 uppercase">
                    ⚠️ Client Needs Attention
                  </p>
                  <p className="mt-1 text-sm text-red-700/80">
                    {(healing.data ?? []).filter((p) => p.flagged).length} flagged upload
                    {(healing.data ?? []).filter((p) => p.flagged).length > 1 ? "s" : ""} — latest: “
                    {(healing.data ?? []).filter((p) => p.flagged).slice(-1)[0]?.concern ?? "concern reported"}”
                  </p>
                </div>
                {(() => {
                  const phone = t.clients?.phone?.replace(/[^0-9]/g, "") ?? "";
                  return phone ? (
                    <a
                      href={`https://wa.me/${phone}?text=${encodeURIComponent(
                        `Hi ${t.clients?.full_name ?? "there"}, this is InkPark Tattoo Studio — we saw your healing update and want to check in. How is the tattoo feeling?`,
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-xs font-semibold tracking-[0.12em] text-white uppercase transition-transform hover:scale-[1.03] active:scale-[0.98]"
                    >
                      Message client on WhatsApp →
                    </a>
                  ) : (
                    <p className="text-xs text-red-700/70">No phone on file for this client.</p>
                  );
                })()}
              </div>
            </section>
          ) : null}

          <section className="ink-card p-5">
            <p className="ink-label">Healing photos &amp; feedback</p>
            {(healing.data ?? []).length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Client hasn't uploaded any yet.</p>
            ) : (
              <ul className="mt-3 space-y-5">
                {(healing.data ?? []).map((p) => (
                  <li key={p.id} className="space-y-3 border-t border-border pt-4 first:border-0 first:pt-0">
                    <div className="flex gap-3">
                      {p.url ? (
                        <img
                          src={p.url}
                          alt={`Healing photo day ${p.day_marker}`}
                          className="h-24 w-24 shrink-0 rounded-md object-cover"
                        />
                      ) : null}
                      <div className="min-w-0">
                        <p className="text-sm text-foreground">
                          Day {p.day_marker}
                          {p.client_reaction ? (
                            <span className="ml-2 rounded-full border border-border px-2 py-0.5 text-sm" title="Client reaction to your feedback">
                              {p.client_reaction} <span className="ink-label ml-1">client felt</span>
                            </span>
                          ) : null}
                        </p>
                        {p.flagged ? (
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full border border-red-600/40 bg-red-50 px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-red-700 uppercase">
                              ⚠️ {p.concern ?? "Needs attention"}
                            </span>
                            <button
                              className="ink-label underline"
                              onClick={async () => {
                                await supabase.from("healing_photos").update({ flagged: false }).eq("id", p.id);
                                qc.invalidateQueries({ queryKey: ["healing", id] });
                                toast.success("Flag cleared");
                              }}
                            >
                              Mark handled
                            </button>
                          </div>
                        ) : null}
                        {p.note ? <p className="mt-1 text-sm text-muted-foreground">“{p.note}”</p> : null}
                        {p.ai_feedback ? (
                          <p className="mt-2 whitespace-pre-line text-xs text-muted-foreground">
                            AI: {p.ai_feedback}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <ArtistReply id={p.id} initial={p.artist_feedback} onSaved={() => qc.invalidateQueries({ queryKey: ["healing", id] })} />
                  </li>
                ))}
              </ul>
            )}
          </section>


          <section className="ink-card p-5">
            <p className="ink-label">Reminders</p>
            <div className="mt-3 divide-y divide-border">
              {(reminders.data ?? []).map((r) => (
                <div key={r.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm text-foreground">Day {r.day_marker}</p>
                    <p className="ink-label mt-1">
                      {r.scheduled_for} · {r.sent_at ? "sent" : "pending"}
                    </p>
                  </div>
                  <Switch
                    checked={r.enabled}
                    onCheckedChange={async (v) => {
                      await supabase.from("reminders").update({ enabled: v }).eq("id", r.id);
                      qc.invalidateQueries({ queryKey: ["reminders", id] });
                    }}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="ink-card p-5">
            <p className="ink-label">Client messages</p>
            {(messages.data ?? []).length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No messages.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {(messages.data ?? []).map((m) => (
                  <li key={m.id} className="border-l-2 border-border pl-3">
                    <p className="text-sm text-foreground">{m.message}</p>
                    <p className="ink-label mt-1">{new Date(m.created_at).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="ink-card p-5">
            <p className="ink-label">Review &amp; rebooking</p>
            <p className="mt-2 text-sm text-foreground">
              Review: {t.review_submitted ? "opened ★" : "not yet"}
            </p>
            <p className="mt-1 text-sm text-foreground">
              Rebooking: {t.rebooking_requested ? "requested ↻" : "not yet"}
            </p>
          </section>
        </div>
      )}
    </AdminShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="ink-label">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{value}</dd>
    </div>
  );
}

function EditableField({
  id,
  field,
  label,
  value,
  qc,
}: {
  id: string;
  field: "style" | "placement";
  label: string;
  value: string | null;
  qc: ReturnType<typeof useQueryClient>;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        defaultValue={value ?? ""}
        onBlur={async (e) => {
          if (e.target.value === (value ?? "")) return;
          const patch = field === "style" ? { style: e.target.value } : { placement: e.target.value };
          await supabase.from("tattoos").update(patch).eq("id", id);
          qc.invalidateQueries({ queryKey: ["tattoo", id] });
          toast.success("Updated");
        }}
      />
    </div>
  );
}

function ArtistReply({
  id,
  initial,
  onSaved,
}: {
  id: string;
  initial: string | null;
  onSaved: () => void;
}) {
  const [text, setText] = useState(initial ?? "");
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor={`reply-${id}`} className="ink-label">
        Artist feedback to client
      </Label>
      <Textarea
        id={`reply-${id}`}
        rows={3}
        value={text}
        placeholder="Looking clean at this stage — keep it light on the balm."
        onChange={(e) => setText(e.target.value)}
      />
      <Button
        size="sm"
        disabled={saving}
        onClick={async () => {
          setSaving(true);
          const { error } = await supabase
            .from("healing_photos")
            .update({ artist_feedback: text.trim() || null, artist_feedback_at: new Date().toISOString() })
            .eq("id", id);
          setSaving(false);
          if (error) toast.error(error.message);
          else {
            toast.success("Feedback sent to the client page");
            onSaved();
          }
        }}
      >
        {saving ? "Saving…" : "Save feedback"}
      </Button>
    </div>
  );
}
