import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { X, ZoomIn, ZoomOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/reply")({
  head: () => ({
    meta: [
      { title: "Photo Replies — InkPark Aftercare" },
      {
        name: "description",
        content: "Write the AI healing check and artist feedback straight onto a client's healing photo.",
      },
      { property: "og:title", content: "Photo Replies — InkPark Aftercare" },
      {
        property: "og:description",
        content: "Write the AI healing check and artist feedback straight onto a client's healing photo.",
      },
    ],
  }),
  component: ReplyPage,
});

type Row = {
  id: string;
  day_marker: number;
  created_at: string;
  note: string | null;
  concern: string | null;
  flagged: boolean;
  ai_feedback: string | null;
  ai_feedback_at: string | null;
  artist_feedback: string | null;
  artist_feedback_at: string | null;
  client_reaction: string | null;
  storage_path: string;
  url: string | null;
  clientName: string;
  clientPhone: string | null;
  accessToken: string | null;
};

function stamp(v: string | null) {
  if (!v) return null;
  return new Date(v).toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  });
}

function ReplyPage() {
  const qc = useQueryClient();
  const [onlyPending, setOnlyPending] = useState(true);

  const photos = useQuery({
    queryKey: ["reply-photos"],
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase
        .from("healing_photos")
        .select(
          "id, day_marker, created_at, note, concern, flagged, ai_feedback, ai_feedback_at, artist_feedback, artist_feedback_at, client_reaction, storage_path, tattoos(access_token, clients(full_name, phone))",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return Promise.all(
        (data ?? []).map(async (p) => {
          const { data: s } = await supabase.storage
            .from("healing-photos")
            .createSignedUrl(p.storage_path, 3600);
          const t = p.tattoos as { clients: { full_name: string } | null } | null;
          return {
            ...p,
            url: s?.signedUrl ?? null,
            clientName: t?.clients?.full_name ?? "Client",
          } as Row;
        }),
      );
    },
  });

  const rows = (photos.data ?? []).filter((p) =>
    onlyPending ? !p.ai_feedback || !p.artist_feedback : true,
  );

  return (
    <AdminShell title="Photo replies" back={{ to: "/admin", label: "← Back to dashboard" }}>
      <div className="space-y-5">
        <div className="ink-card flex items-center justify-between p-4">
          <p className="ink-label">
            {onlyPending ? "Waiting for a reply" : "All uploads"} · {rows.length}
          </p>
          <Button variant="outline" size="sm" onClick={() => setOnlyPending((v) => !v)}>
            {onlyPending ? "Show all" : "Show pending only"}
          </Button>
        </div>

        {photos.isPending ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="ink-card p-5 text-sm text-muted-foreground">Nothing to reply to right now.</p>
        ) : (
          rows.map((p) => (
            <PhotoReply
              key={p.id}
              row={p}
              onSaved={() => qc.invalidateQueries({ queryKey: ["reply-photos"] })}
            />
          ))
        )}
      </div>
    </AdminShell>
  );
}

function PhotoReply({ row, onSaved }: { row: Row; onSaved: () => void }) {
  const [ai, setAi] = useState(row.ai_feedback ?? "");
  const [artist, setArtist] = useState(row.artist_feedback ?? "");
  const [saving, setSaving] = useState<"ai" | "artist" | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

  async function save(kind: "ai" | "artist") {
    setSaving(kind);
    const now = new Date().toISOString();
    const patch =
      kind === "ai"
        ? { ai_feedback: ai.trim() || null, ai_feedback_at: ai.trim() ? now : null, ai_status: ai.trim() ? "done" : "pending" }
        : { artist_feedback: artist.trim() || null, artist_feedback_at: artist.trim() ? now : null };
    const { error } = await supabase.from("healing_photos").update(patch).eq("id", row.id);
    setSaving(null);
    if (error) toast.error(error.message);
    else {
      toast.success(kind === "ai" ? "AI healing check saved" : "Artist feedback sent to the client page");
      onSaved();
    }
  }

  return (
    <section className="ink-card space-y-4 p-5">
      <div className="flex gap-3">
        {row.url ? (
          <button
            type="button"
            aria-label={`Preview healing photo day ${row.day_marker} for ${row.clientName}`}
            className="relative h-24 w-24 shrink-0 cursor-zoom-in overflow-hidden rounded-md"
            onClick={() => {
              setZoom(1);
              setPreviewOpen(true);
            }}
          >
            <img
              src={row.url}
              alt={`Healing photo day ${row.day_marker} for ${row.clientName}`}
              className="h-24 w-24 rounded-md object-cover"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors hover:bg-black/30">
              <ZoomIn className="h-5 w-5 text-white opacity-0 transition-opacity hover:opacity-100" />
            </span>
          </button>
        ) : null}
        <div className="min-w-0">
          <p className="truncate text-base text-foreground">{row.clientName}</p>
          <p className="ink-label mt-1">
            Day {row.day_marker} · {stamp(row.created_at)}
          </p>
          {row.flagged ? (
            <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-red-600/40 bg-red-50 px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-red-700 uppercase">
              ⚠️ {row.concern ?? "Needs attention"}
            </span>
          ) : null}
          {row.note ? <p className="mt-1 text-sm text-muted-foreground">“{row.note}”</p> : null}
          {row.client_reaction ? (
            <p className="ink-label mt-2">Client reacted {row.client_reaction}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={`ai-${row.id}`} className="ink-label">
            AI healing check
          </Label>
          <span className="ink-label">{row.ai_feedback ? `Done · ${stamp(row.ai_feedback_at)}` : "Pending"}</span>
        </div>
        <Textarea
          id={`ai-${row.id}`}
          rows={4}
          value={ai}
          placeholder="Healing looks on track for this stage — keep it clean and lightly moisturised."
          onChange={(e) => setAi(e.target.value)}
        />
        <Button size="sm" disabled={saving !== null} onClick={() => save("ai")}>
          {saving === "ai" ? "Saving…" : "Save AI healing check"}
        </Button>
      </div>

      <div className="space-y-2 border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <Label htmlFor={`artist-${row.id}`} className="ink-label">
            Artist feedback
          </Label>
          <span className="ink-label">
            {row.artist_feedback ? `Done · ${stamp(row.artist_feedback_at)}` : "Pending"}
          </span>
        </div>
        <Textarea
          id={`artist-${row.id}`}
          rows={4}
          value={artist}
          placeholder="Looking clean at this stage — keep it light on the balm."
          onChange={(e) => setArtist(e.target.value)}
        />
        <Button size="sm" disabled={saving !== null} onClick={() => save("artist")}>
          {saving === "artist" ? "Saving…" : "Save artist feedback"}
        </Button>
      </div>

      {previewOpen && row.url ? (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/90"
          role="dialog"
          aria-modal="true"
          aria-label={`Photo preview day ${row.day_marker}`}
          onClick={() => setPreviewOpen(false)}
        >
          <div className="flex items-center justify-between gap-2 p-4" onClick={(e) => e.stopPropagation()}>
            <p className="text-xs font-semibold tracking-[0.18em] text-white/80 uppercase">
              {row.clientName} · Day {row.day_marker}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Zoom out"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 text-white transition-colors hover:bg-white/10 disabled:opacity-40"
                disabled={zoom <= 1}
                onClick={() => setZoom((z) => Math.max(1, +(z - 0.5).toFixed(1)))}
              >
                <ZoomOut className="h-5 w-5" />
              </button>
              <span className="w-12 text-center text-xs font-semibold text-white/80">{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                aria-label="Zoom in"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 text-white transition-colors hover:bg-white/10 disabled:opacity-40"
                disabled={zoom >= 4}
                onClick={() => setZoom((z) => Math.min(4, +(z + 0.5).toFixed(1)))}
              >
                <ZoomIn className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Close preview"
                className="ml-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-black transition-colors hover:bg-white/80"
                onClick={() => setPreviewOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center overflow-auto p-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={row.url}
              alt={`Healing photo day ${row.day_marker} for ${row.clientName}`}
              className="max-h-full max-w-full rounded-md object-contain transition-transform duration-200"
              style={{ transform: `scale(${zoom})` }}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
