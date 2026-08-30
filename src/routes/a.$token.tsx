import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  addHealingPhoto,
  getPortal,
  markPortalStep,
  removeHealingPhoto,
  sendSupport,
  startPortalUpload,
} from "@/lib/portal.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const HEALING_DAYS = [1, 3, 7, 14, 30];

export const Route = createFileRoute("/a/$token")({
  head: () => ({
    meta: [
      { title: "Your Aftercare — InkPark Tattoo Studio" },
      {
        name: "description",
        content: "Private healing guide for your InkPark tattoo: day-by-day care, photo tracker and direct studio support.",
      },
      { property: "og:title", content: "Your Aftercare — InkPark Tattoo Studio" },
      {
        property: "og:description",
        content: "Private healing guide for your InkPark tattoo: day-by-day care, photo tracker and direct studio support.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Portal,
});

function dayCount(dateStr: string) {
  const start = new Date(`${dateStr}T00:00:00`);
  const now = new Date();
  return Math.max(1, Math.floor((now.getTime() - start.getTime()) / 86_400_000) + 1);
}

function Portal() {
  const { token } = Route.useParams();
  const qc = useQueryClient();
  const portalFn = useServerFn(getPortal);

  const portal = useQuery({
    queryKey: ["portal", token],
    queryFn: () => portalFn({ data: { token } }),
    retry: false,
  });

  if (portal.isPending) {
    return <Centered>Loading your aftercare…</Centered>;
  }

  if (portal.error || !portal.data) {
    return (
      <Centered>
        <span className="block text-lg text-foreground">This aftercare link isn't valid</span>
        <span className="mt-2 block text-sm text-muted-foreground">
          Ask your InkPark artist to resend your personal link.
        </span>
      </Centered>
    );
  }

  const { tattoo, client, artist, stages, photos, settings } = portal.data;
  const day = dayCount(tattoo.tattoo_date);
  const currentStage =
    stages.find((s) => day >= s.day_from && (s.day_to === null || day <= s.day_to)) ?? stages[stages.length - 1];
  const healed = day > 30;

  const wa = settings?.whatsapp_number
    ? `https://wa.me/${settings.whatsapp_number.replace(/[^\d]/g, "")}?text=${encodeURIComponent(
        `Hi InkPark, this is ${client.full_name} — question about my tattoo healing (day ${day}).`,
      )}`
    : null;

  return (
    <main className="mx-auto w-full max-w-md px-5 pb-32 pt-10">
      <header>
        <p className="ink-label">InkPark Tattoo Studio</p>
        <h1 className="mt-2 text-4xl leading-none text-foreground">{client.full_name}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Day {day} of healing{artist ? ` · ${artist.name}` : ""}
        </p>
      </header>

      {tattoo.photo_url ? (
        <img
          src={tattoo.photo_url}
          alt="Your finished tattoo, photographed at the studio"
          className="mt-6 w-full rounded-lg object-cover"
        />
      ) : null}

      <dl className="ink-card mt-6 grid grid-cols-3 gap-4 p-5">
        <Meta label="Date" value={tattoo.tattoo_date} />
        <Meta label="Style" value={tattoo.style ?? "—"} />
        <Meta label="Placement" value={tattoo.placement ?? "—"} />
      </dl>

      <section className="mt-10">
        <h2 className="text-2xl text-foreground">Healing timeline</h2>
        <ol className="mt-4 space-y-3">
          {stages.map((s) => {
            const active = currentStage?.id === s.id;
            const done = s.day_to !== null && day > s.day_to;
            return (
              <li key={s.id} className={`ink-card p-5 ${active ? "border-foreground" : ""}`}>
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-xl text-foreground">{s.title}</h3>
                  <span className="ink-label shrink-0">{done ? "done" : active ? "now" : "soon"}</span>
                </div>
                {s.subtitle ? <p className="mt-1 text-sm text-muted-foreground">{s.subtitle}</p> : null}
                <div className="mt-4 space-y-3 text-sm text-foreground">
                  <Instruction label="Clean" text={s.cleaning} />
                  <Instruction label="Moisturize" text={s.moisturizing} />
                  <Instruction label="Avoid" text={s.avoid} />
                  <Instruction label="Normal" text={s.normal} />
                  <Instruction label="Call us if" text={s.contact} />
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <PhotoTracker token={token} photos={photos} qc={qc} day={day} />

      <SupportBox token={token} wa={wa} />

      {healed ? <PostHealing token={token} settings={settings} tattoo={tattoo} qc={qc} /> : null}

      <p className="mt-10 text-center text-xs text-muted-foreground">
        This page is private to you. Your photos are never shared without your permission.
      </p>

      {wa ? (
        <a
          href={wa}
          target="_blank"
          rel="noreferrer"
          className="fixed inset-x-5 bottom-5 mx-auto flex max-w-md items-center justify-center rounded-full bg-primary py-4 text-sm font-medium uppercase tracking-[0.2em] text-primary-foreground shadow-lg"
        >
          WhatsApp the studio
        </a>
      ) : null}
    </main>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 text-center text-sm text-muted-foreground">
      <div>{children}</div>
    </main>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="ink-label">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{value}</dd>
    </div>
  );
}

function Instruction({ label, text }: { label: string; text: string | null }) {
  if (!text) return null;
  return (
    <p>
      <span className="ink-label mr-2">{label}</span>
      {text}
    </p>
  );
}

function PhotoTracker({
  token,
  photos,
  qc,
  day,
}: {
  token: string;
  photos: { id: string; day_marker: number; note: string | null; url: string | null }[];
  qc: ReturnType<typeof useQueryClient>;
  day: number;
}) {
  const startUpload = useServerFn(startPortalUpload);
  const save = useServerFn(addHealingPhoto);
  const remove = useServerFn(removeHealingPhoto);
  const [busy, setBusy] = useState<number | null>(null);
  const [note, setNote] = useState("");

  async function upload(file: File, marker: number) {
    setBusy(marker);
    try {
      const target = await startUpload({ data: { token, kind: "healing", fileName: file.name } });
      const { error } = await supabase.storage
        .from(target.bucket)
        .uploadToSignedUrl(target.path, target.token, file);
      if (error) throw new Error(error.message);
      await save({ data: { token, dayMarker: marker, storagePath: target.path, note: note || null } });
      setNote("");
      toast.success("Photo saved privately");
      qc.invalidateQueries({ queryKey: ["portal", token] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="mt-10">
      <h2 className="text-2xl text-foreground">Healing photo tracker</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Private to you and your artist. Track how the ink settles.
      </p>

      <div className="mt-4 space-y-2">
        <Label htmlFor="note">Note (optional)</Label>
        <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Feels itchy today" />
      </div>

      <div className="mt-4 space-y-3">
        {HEALING_DAYS.map((marker) => {
          const shots = photos.filter((p) => p.day_marker === marker);
          const unlocked = day >= marker;
          return (
            <div key={marker} className="ink-card p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg text-foreground">Day {marker}</h3>
                <span className="ink-label">{shots.length ? `${shots.length} photo(s)` : unlocked ? "open" : "upcoming"}</span>
              </div>

              {shots.length ? (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {shots.map((p) => (
                    <figure key={p.id} className="relative">
                      {p.url ? (
                        <img src={p.url} alt={`Your healing photo from day ${marker}`} className="aspect-square w-full rounded-md object-cover" />
                      ) : null}
                      <button
                        onClick={async () => {
                          await remove({ data: { token, photoId: p.id } });
                          qc.invalidateQueries({ queryKey: ["portal", token] });
                        }}
                        className="absolute right-1 top-1 rounded bg-background/90 px-1.5 text-xs text-foreground"
                        aria-label="Delete photo"
                      >
                        ×
                      </button>
                    </figure>
                  ))}
                </div>
              ) : null}

              <Input
                type="file"
                accept="image/*"
                capture="environment"
                disabled={busy === marker}
                className="mt-3"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) upload(f, marker);
                  e.target.value = "";
                }}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SupportBox({ token, wa }: { token: string; wa: string | null }) {
  const send = useServerFn(sendSupport);
  const [message, setMessage] = useState("");
  const mutation = useMutation({
    mutationFn: (text: string) => send({ data: { token, message: text } }),
    onSuccess: () => {
      setMessage("");
      toast.success("Sent to the studio");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="mt-10">
      <h2 className="text-2xl text-foreground">Need help?</h2>
      <div className="ink-card mt-4 space-y-3 p-5">
        <Textarea
          rows={3}
          value={message}
          placeholder="Describe what you're seeing…"
          onChange={(e) => setMessage(e.target.value)}
        />
        <Button className="w-full" disabled={mutation.isPending} onClick={() => mutation.mutate(message)}>
          Send to InkPark
        </Button>
        {wa ? (
          <Button variant="outline" className="w-full" asChild>
            <a href={wa} target="_blank" rel="noreferrer">
              Or message on WhatsApp
            </a>
          </Button>
        ) : null}
      </div>
    </section>
  );
}

function PostHealing({
  token,
  settings,
  tattoo,
  qc,
}: {
  token: string;
  settings: { review_url: string | null; booking_url: string | null } | null;
  tattoo: { review_submitted: boolean; rebooking_requested: boolean };
  qc: ReturnType<typeof useQueryClient>;
}) {
  const mark = useServerFn(markPortalStep);

  async function go(action: "review" | "rebooking", url: string | null) {
    await mark({ data: { token, action } });
    qc.invalidateQueries({ queryKey: ["portal", token] });
    if (url) window.open(url, "_blank", "noopener");
  }

  return (
    <section className="mt-10">
      <h2 className="text-2xl text-foreground">Fully healed</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Loving it? Two quick things that mean a lot to the studio.
      </p>
      <div className="ink-card mt-4 space-y-3 p-5">
        <Button className="w-full" onClick={() => go("review", settings?.review_url ?? null)}>
          {tattoo.review_submitted ? "Thanks for the review ★" : "Leave a review"}
        </Button>
        <Button variant="outline" className="w-full" onClick={() => go("rebooking", settings?.booking_url ?? null)}>
          {tattoo.rebooking_requested ? "Rebooking requested ↻" : "Book your next session"}
        </Button>
      </div>
    </section>
  );
}
