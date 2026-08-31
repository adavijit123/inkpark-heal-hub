import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, type CSSProperties } from "react";
import {
  addHealingPhoto,
  getPortal,
  markPortalStep,
  removeHealingPhoto,
  reactToArtistFeedback,
  requestPhotoAiFeedback,
  sendSupport,
  startPortalUpload,
  toggleStageFollowed,
} from "@/lib/portal.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UploadZone } from "@/components/UploadZone";
import { toast } from "sonner";
import { BN_LABELS, BN_STAGES } from "@/lib/aftercare-bn";
import { FAQS, searchFaqs, type Faq } from "@/lib/aftercare-faq";
import { cn } from "@/lib/utils";


const HEALING_DAYS = [1, 2, 3, 5, 7, 15, 30];

function currentMarker(day: number) {
  const due = HEALING_DAYS.filter((d) => d <= day);
  return due.length ? due[due.length - 1] : HEALING_DAYS[0];
}

function nextMarker(day: number) {
  return HEALING_DAYS.find((d) => d > day) ?? null;
}

type TrackerPhoto = {
  id: string;
  day_marker: number;
  note: string | null;
  url: string | null;
  ai_feedback: string | null;
  ai_status: string;
  artist_feedback: string | null;
  client_reaction: string | null;
};


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
  const [showAllStages, setShowAllStages] = useState(false);
  const [openSection, setOpenSection] = useState<"timeline" | "tracker" | "knowledge" | null>(null);
  const [lang, setLang] = useState<"en" | "bn">("en");


  if (portal.isPending) {
    return <Centered>Loading your aftercare…</Centered>;
  }

  if (portal.error || !portal.data) {
    const expired = portal.error instanceof Error && portal.error.message.includes("EXPIRED_LINK");
    return (
      <Centered>
        <span className="block text-lg text-foreground">
          {expired ? "This aftercare page has closed" : "This aftercare link isn't valid"}
        </span>
        <span className="mt-2 block text-sm text-muted-foreground">
          {expired
            ? "Your 30-day healing window is complete, so the link is now deactivated. Your photos and notes are safely kept in your InkPark client record — message the studio if you need them."
            : "Ask your InkPark artist to resend your personal link."}
        </span>
      </Centered>
    );
  }

  const { tattoo, client, artist, stages, photos, settings, followedStages } = portal.data;
  const day = dayCount(tattoo.tattoo_date);
  const currentStage =
    stages.find((s) => day >= s.day_from && (s.day_to === null || day <= s.day_to)) ?? stages[stages.length - 1];
  const healed = day > 30;
  const nextDay = nextMarker(day);
  const todayMarker = currentMarker(day);
  const todayDone = photos.some((p) => p.day_marker === todayMarker);

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

      <div className="ink-card mt-6 border-foreground p-5">
        <p className="ink-label">Today's reminder</p>
        <p className="mt-2 text-lg text-foreground">
          {healed
            ? "Your tattoo is fully healed — keep it moisturised and out of strong sun."
            : `Day ${day} — ${
                todayDone
                  ? `day ${todayMarker} photo is saved. Next checkpoint${nextDay ? `: day ${nextDay}` : ": all done"}.`
                  : `time for your day ${todayMarker} photo and today's care steps.`
              }`}
        </p>
        {currentStage ? (
          <p className="mt-2 text-sm text-muted-foreground">{currentStage.title}</p>
        ) : null}
      </div>



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

      <section className="mt-8 grid grid-cols-1 gap-3">
        <SectionButton
          active={openSection === "timeline"}
          index="01"
          title="Healing timeline"
          onClick={() => setOpenSection((s) => (s === "timeline" ? null : "timeline"))}
        />
        <SectionButton
          active={openSection === "tracker"}
          index="02"
          title="Healing photo tracker"
          onClick={() => setOpenSection((s) => (s === "tracker" ? null : "tracker"))}
        />
        <SectionButton
          active={openSection === "knowledge"}
          index="03"
          title="Aftercare knowledge hub"
          onClick={() => setOpenSection((s) => (s === "knowledge" ? null : "knowledge"))}
        />
      </section>

      {openSection === "timeline" ? (
        <section className="mt-8">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-2xl text-foreground">Healing timeline</h2>
          </div>
          <button className="ink-label mt-2 underline" onClick={() => setShowAllStages((v) => !v)}>
            {showAllStages ? "Show today only" : "See all stages"}
          </button>
          {!showAllStages ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {`Showing today's care only — day ${day}${nextDay ? ` · next checkpoint day ${nextDay}` : ""}.`}
            </p>
          ) : null}
          <ol className="mt-4 space-y-3">
            {(showAllStages ? stages : stages.filter((s) => s.id === currentStage?.id)).map((s) => {
              const active = currentStage?.id === s.id;
              const bn = lang === "bn" ? BN_STAGES[s.slug] : undefined;
              const t = bn ?? s;
              return (
                <li key={s.id} className={`ink-card p-5 ${active ? "border-foreground" : ""}`}>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-xl text-foreground">{t.title}</h3>
                    <LangToggle lang={lang} setLang={setLang} />
                  </div>
                  {t.subtitle ? <p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p> : null}
                  <div className="mt-4 space-y-3 text-sm text-foreground">
                    <Instruction label={lang === "bn" ? BN_LABELS.clean : "Clean"} text={t.cleaning} />
                    <Instruction label={lang === "bn" ? BN_LABELS.moisturize : "Moisturize"} text={t.moisturizing} />
                    <Instruction label={lang === "bn" ? BN_LABELS.avoid : "Avoid"} text={t.avoid} />
                    <Instruction label={lang === "bn" ? BN_LABELS.normal : "Normal"} text={t.normal} />
                    <Instruction label={lang === "bn" ? BN_LABELS.contact : "Call us if"} text={t.contact} />
                  </div>
                  <div className="mt-4 flex justify-center">
                    <FollowButton
                      token={token}
                      stageId={s.id}
                      following={followedStages.includes(s.id)}
                      lang={lang}
                      onSaved={() => qc.invalidateQueries({ queryKey: ["portal", token] })}
                    />
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      {openSection === "tracker" ? <PhotoTracker token={token} photos={photos} qc={qc} day={day} /> : null}

      {openSection === "knowledge" ? <KnowledgeSection wa={wa} /> : null}



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

function SectionButton({
  active,
  index,
  title,
  onClick,
}: {
  active: boolean;
  index: string;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`ink-card group flex w-full items-center justify-between gap-4 p-6 text-left transition-colors ${
        active ? "border-foreground bg-foreground text-background" : ""
      }`}
    >
      <span className="flex items-baseline gap-4">
        <span className={`ink-label text-xs ${active ? "opacity-60" : "text-muted-foreground"}`}>{index}</span>
        <span className="text-2xl uppercase tracking-[0.14em]">{title}</span>
      </span>
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-lg leading-none transition-colors ${
          active ? "border-background/40" : "border-foreground/30"
        }`}
      >
        {active ? "−" : "+"}
      </span>
    </button>
  );
}

function FollowButton({
  token,
  stageId,
  following,
  lang,
  onSaved,
}: {
  token: string;
  stageId: string;
  following: boolean;
  lang: "en" | "bn";
  onSaved: () => void;
}) {
  const toggle = useServerFn(toggleStageFollowed);
  const [busy, setBusy] = useState(false);

  async function onPress() {
    setBusy(true);
    try {
      await toggle({ data: { token, stageId } });
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onPress}
      disabled={busy}
      aria-pressed={following}
      className={cn(
        "ink-label inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 tracking-[0.12em] transition-all duration-200 active:scale-[0.98]",
        following
          ? "animate-emoji-pop border-foreground bg-foreground text-background"
          : "border-foreground/30 text-muted-foreground hover:border-foreground hover:text-foreground",
      )}
    >
      <span
        className={cn(
          "flex size-3.5 items-center justify-center rounded-full border text-[9px] leading-none",
          following ? "border-background/60" : "border-current",
        )}
      >
        {following ? "✓" : ""}
      </span>
      {following
        ? lang === "bn"
          ? "আমি ধাপগুলো ফলো করছি ✓"
          : "I'm following these steps"
        : lang === "bn"
          ? "আমি ধাপগুলো ফলো করছি"
          : "Mark as following"}
    </button>
  );
}

function LangToggle({
  lang,
  setLang,
}: {
  lang: "en" | "bn";
  setLang: (l: "en" | "bn") => void;
}) {
  const base = "ink-label rounded-full px-3 py-1.5 transition-colors";
  return (
    <div className="flex shrink-0 items-center rounded-full border border-foreground/30 p-1">
      <button
        onClick={() => setLang("en")}
        className={`${base} ${lang === "en" ? "bg-foreground text-background" : "text-muted-foreground"}`}
      >
        English
      </button>
      <button
        onClick={() => setLang("bn")}
        className={`${base} ${lang === "bn" ? "bg-foreground text-background" : "text-muted-foreground"}`}
      >
        বাংলা
      </button>
    </div>
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
  photos: TrackerPhoto[];
  qc: ReturnType<typeof useQueryClient>;
  day: number;
}) {
  const startUpload = useServerFn(startPortalUpload);
  const save = useServerFn(addHealingPhoto);
  const remove = useServerFn(removeHealingPhoto);
  const react = useServerFn(reactToArtistFeedback);
  const askAi = useServerFn(requestPhotoAiFeedback);
  const [busy, setBusy] = useState<number | null>(null);
  const [aiBusy, setAiBusy] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const visibleDays = showAll
    ? HEALING_DAYS.filter((d) => d <= day)
    : HEALING_DAYS.filter((d) => d === currentMarker(day));

  const doneDays = HEALING_DAYS.filter((d) => photos.some((p) => p.day_marker === d)).length;

  async function runAi(photoId: string, silent = false) {
    setAiBusy(photoId);
    try {
      await askAi({ data: { token, photoId } });
      if (!silent) toast.success("AI feedback ready");
      qc.invalidateQueries({ queryKey: ["portal", token] });
    } catch (e) {
      if (!silent) toast.error(e instanceof Error ? e.message : "AI feedback failed");
    } finally {
      setAiBusy(null);
    }
  }

  async function upload(file: File, marker: number) {
    setBusy(marker);
    try {
      const target = await startUpload({ data: { token, kind: "healing", fileName: file.name } });
      const { error } = await supabase.storage
        .from(target.bucket)
        .uploadToSignedUrl(target.path, target.token, file);
      if (error) throw new Error(error.message);
      await save({ data: { token, dayMarker: marker, storagePath: target.path } });
      toast.success("Photo saved privately · asking AI for a check…");
      const fresh = await qc.invalidateQueries({ queryKey: ["portal", token] });
      void fresh;
      const latest = qc.getQueryData<{ photos: TrackerPhoto[] }>(["portal", token]);
      const created = latest?.photos.find((p) => p.day_marker === marker && !p.ai_feedback);
      if (created) await runAi(created.id, true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="mt-10">
      <div className="ink-card overflow-hidden p-5">
        <h2 className="text-center text-2xl text-foreground">Healing Photo Tracker</h2>
        <div className="mt-4 flex items-baseline justify-between">
          <span className="ink-label">Healing Progress</span>
          <span className="font-display text-2xl leading-none tracking-wide text-foreground">
            {Math.round((doneDays / HEALING_DAYS.length) * 100)}%
          </span>
        </div>

        <div className="mt-4">
          {/* milestone rail */}
          <div className="relative">
            <div className="absolute top-1/2 right-0 left-0 h-px -translate-y-1/2 bg-border" />
            <div
              className="absolute top-1/2 left-0 h-0.5 -translate-y-1/2 bg-foreground transition-all duration-700 ease-out"
              style={{ width: `${(doneDays / HEALING_DAYS.length) * 100}%` }}
            />
            <div className="relative flex justify-between">
              {HEALING_DAYS.map((m) => {
                const shot = photos.some((p) => p.day_marker === m);
                const isCurrent = m === currentMarker(day);
                return (
                  <div key={m} className="flex flex-col items-center gap-1.5">
                    <div
                      className={cn(
                        "flex size-7 items-center justify-center rounded-full border text-[10px] font-semibold tracking-wider transition-all duration-500",
                        shot
                          ? "border-foreground bg-foreground text-background"
                          : isCurrent
                            ? "border-foreground bg-background text-foreground ring-4 ring-foreground/10"
                            : "border-border bg-background text-muted-foreground"
                      )}
                    >
                      {shot ? "✓" : m}
                    </div>
                    <span
                      className={cn(
                        "text-[9px] tracking-[0.15em] uppercase",
                        shot || isCurrent ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      D{m}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <p className="mt-4 border-t border-border pt-3 text-center text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
          {doneDays === HEALING_DAYS.length
            ? "Fully healed — congratulations"
            : doneDays === 0
              ? "Day 1 — your healing journey begins"
              : `${doneDays} of ${HEALING_DAYS.length} checkpoints complete`}
        </p>

        <div className="mt-3 flex justify-center">
          <button
            onClick={() => setShowAll((v) => !v)}
            className={cn(
              "ink-label inline-flex items-center justify-center rounded-full border px-4 py-2 tracking-[0.12em] transition-all duration-300 active:scale-[0.98]",
              showAll
                ? "animate-emoji-pop border-foreground bg-foreground text-background"
                : "border-foreground/30 text-muted-foreground hover:border-foreground hover:text-foreground",
            )}
          >
            {showAll ? "Show today only" : "See all days"}
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {visibleDays.map((marker) => {
          const shots = photos.filter((p) => p.day_marker === marker);
          const unlocked = day >= marker;
          return (
            <div key={marker} className={`ink-card p-5 ${unlocked && !shots.length ? "border-foreground" : ""}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg text-foreground">Day {marker}</h3>
                <span className="ink-label">
                  {shots.length ? `${shots.length} photo${shots.length > 1 ? "s" : ""}` : unlocked ? "due now" : "upcoming"}
                </span>
              </div>

              {shots.length ? (
                <ul className="mt-3 space-y-4">
                  {shots.map((p) => (
                    <li key={p.id} className="space-y-3">
                      <div className="flex gap-3">
                        {p.url ? (
                          <img
                            src={p.url}
                            alt={`Your healing photo from day ${marker}`}
                            className="h-24 w-24 shrink-0 rounded-md object-cover"
                          />
                        ) : null}
                        <div className="min-w-0 flex-1">
                          {p.note ? <p className="text-sm text-foreground">“{p.note}”</p> : null}
                          <button
                            onClick={async () => {
                              await remove({ data: { token, photoId: p.id } });
                              qc.invalidateQueries({ queryKey: ["portal", token] });
                            }}
                            className="ink-label mt-2 underline"
                          >
                            Delete photo
                          </button>
                          <label
                            className={`ink-label mt-2 inline-flex cursor-pointer items-center rounded-md border border-border px-3 py-2 uppercase transition-colors hover:bg-muted ${busy === marker ? "pointer-events-none opacity-50" : ""}`}
                          >
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={busy === marker}
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) upload(f, marker);
                                e.currentTarget.value = "";
                              }}
                            />
                            Add another photo
                          </label>
                        </div>
                      </div>

                      <div className="rounded-md border border-border p-3">
                        <p className="ink-label">AI healing check</p>
                        {p.ai_feedback ? (
                          <p className="mt-2 whitespace-pre-line text-sm text-foreground">{p.ai_feedback}</p>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            disabled={aiBusy === p.id}
                            onClick={() => runAi(p.id)}
                          >
                            {aiBusy === p.id ? "Checking…" : "Get AI feedback"}
                          </Button>
                        )}
                      </div>

                      <div className="rounded-md border border-border p-3">
                        <p className="ink-label">Artist feedback</p>
                        <p className="mt-2 text-sm text-foreground">
                          {p.artist_feedback ?? "Your artist hasn't replied to this photo yet."}
                        </p>
                        {p.artist_feedback ? (
                          <ReactionBar
                            token={token}
                            photoId={p.id}
                            current={p.client_reaction}
                            onSaved={() => qc.invalidateQueries({ queryKey: ["portal", token] })}
                          />
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}

              {shots.length === 0 ? (
                <div className="mt-4">
                  <UploadZone
                    id={`upload-${marker}`}
                    title={`Day ${marker} photo`}
                    caption="Camera or gallery"
                    disabled={busy === marker}
                    onFile={(f) => upload(f, marker)}
                  />
                </div>
              ) : null}
              {busy === marker ? (
                <p className="ink-label mt-3 flex items-center gap-2">
                  <span className="inline-block size-1.5 animate-pulse rounded-full bg-foreground" />
                  Uploading…
                </p>
              ) : null}
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

const REACTIONS = ["❤️", "😊", "👍", "😢", "😟"] as const;

function ReactionBar({
  token,
  photoId,
  current,
  onSaved,
}: {
  token: string;
  photoId: string;
  current: string | null;
  onSaved: () => void;
}) {
  const react = useServerFn(reactToArtistFeedback);
  const [burst, setBurst] = useState<{ emoji: string; id: number } | null>(null);
  const [saved, setSaved] = useState(false);

  async function pick(emoji: string) {
    setBurst({ emoji, id: Date.now() });
    setSaved(false);
    try {
      await react({ data: { token, photoId, reaction: emoji } });
      setSaved(true);
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save reaction");
    }
  }

  return (
    <div className="mt-3 border-t border-border pt-3">
      <p className="ink-label">How does this make you feel?</p>
      <div className="relative mt-2 flex gap-2">
        {burst ? (
          <div key={burst.id} className="pointer-events-none absolute inset-0 z-10" aria-hidden>
            {[-2, -1.2, 0, 1.2, 2].map((i, idx) => (
              <span
                key={idx}
                className="animate-emoji-float absolute left-1/2 top-1/2 text-lg will-change-transform"
                style={
                  {
                    "--dx": `${i * 22}px`,
                    "--dy": `${-30 - Math.abs(i) * 10 - (idx % 2 === 0 ? 8 : 0)}px`,
                    animationDelay: `${idx * 60}ms`,
                  } as CSSProperties
                }
              >
                {burst.emoji}
              </span>
            ))}
          </div>
        ) : null}
        {REACTIONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            aria-label={`React with ${emoji}`}
            aria-pressed={current === emoji}
            onClick={() => pick(emoji)}
            className={cn(
              "group flex size-10 items-center justify-center rounded-full border text-lg transition-all duration-200 active:scale-90",
              current === emoji
                ? "animate-emoji-pop border-foreground bg-foreground/10 shadow-[0_0_0_3px_oklch(0_0_0/0.06)]"
                : "border-border hover:border-foreground/50",
            )}
          >
            <span className="block group-hover:animate-emoji-wiggle group-active:animate-emoji-wiggle">
              {emoji}
            </span>
          </button>
        ))}
      </div>
      <p
        aria-live="polite"
        className={cn(
          "ink-label mt-2 transition-opacity duration-300",
          saved ? "opacity-100" : "opacity-0"
        )}
      >
        Saved ✓
      </p>
    </div>
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
