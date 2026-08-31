import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
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
  updateReminderSetting,
} from "@/lib/portal.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UploadZone } from "@/components/UploadZone";
import { toast } from "sonner";
import { BN_LABELS, BN_STAGES } from "@/lib/aftercare-bn";
import { FAQS, searchFaqs, type Faq } from "@/lib/aftercare-faq";
import { cn } from "@/lib/utils";
import { CONCERN_OPTIONS } from "@/lib/portal-shared";



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
  flagged: boolean;
  concern: string | null;
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
      <div className="relative">
        <div className="fixed inset-x-0 top-0 z-10 mx-auto flex w-full max-w-md items-center justify-between bg-background/90 px-5 py-4 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="ink-label inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 transition-colors hover:bg-accent"
          >
            ← Back
          </button>
          <Link
            to="/"
            className="ink-label inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 transition-colors hover:bg-accent"
          >
            Home
          </Link>
        </div>
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
      </div>
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
      <div className="fixed inset-x-0 top-0 z-10 mx-auto flex w-full max-w-md items-center justify-between bg-background/90 px-5 py-4 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="ink-label inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 transition-colors hover:bg-accent"
        >
          ← Back
        </button>
        <Link
          to="/"
          className="ink-label inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 transition-colors hover:bg-accent"
        >
          Home
        </Link>
      </div>
      <header className="text-center">
        <p className="ink-label">InkPark Tattoo Studio</p>
      </header>

      <div className="ink-card mt-4 border-foreground p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-5xl leading-none text-foreground">{client.full_name}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Day {day} of healing{artist ? ` · ${artist.name}` : ""}
            </p>
          </div>
          <DayReminderBell
            token={token}
            enabled={tattoo.reminders_enabled}
            onSaved={() => qc.invalidateQueries({ queryKey: ["portal", token] })}
          />
        </div>

        <dl className="mt-5 grid grid-cols-3 gap-4">
          <Meta label="Date" value={tattoo.tattoo_date} />
          <Meta label="Style" value={tattoo.style ?? "—"} />
          <Meta label="Placement" value={tattoo.placement ?? "—"} />
        </dl>

        <p className="mt-5 border-t border-border pt-4 text-center text-sm text-foreground">
          {healed
            ? "Fully healed — keep it moisturised and out of strong sun."
            : todayDone
              ? `Day ${todayMarker} photo saved. Next checkpoint: day ${nextDay ?? "—"}.`
              : `Next checkpoint: day ${nextDay ?? todayMarker}.`}
        </p>
      </div>

      {tattoo.photo_url ? (
        <img
          src={tattoo.photo_url}
          alt="Your finished tattoo, photographed at the studio"
          className="mt-4 w-full rounded-lg object-cover"
        />
      ) : null}

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

function DayReminderBell({
  token,
  enabled,
  onSaved,
}: {
  token: string;
  enabled: boolean;
  onSaved: () => void;
}) {
  const save = useServerFn(updateReminderSetting);
  const [pending, setPending] = useState(false);

  const toggle = async () => {
    setPending(true);
    try {
      await save({ data: { token, enabled: !enabled } });
      onSaved();
      toast.success(!enabled ? "Day reminders turned on" : "Day reminders turned off");
    } catch {
      toast.error("Could not save your reminder setting");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex shrink-0 flex-col items-center gap-1.5 pt-1">
      <p className="ink-label">Today's reminder</p>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="Day reminders"
        disabled={pending}
        onClick={toggle}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-200 active:scale-95 disabled:opacity-50",
          enabled ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:bg-accent",
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
          {enabled ? null : <path d="M3 3l18 18" />}
        </svg>
      </button>
    </div>
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

  const [concerns, setConcerns] = useState<Record<number, string | null>>({});

  async function upload(file: File, marker: number) {
    setBusy(marker);
    try {
      const target = await startUpload({ data: { token, kind: "healing", fileName: file.name } });
      const { error } = await supabase.storage
        .from(target.bucket)
        .uploadToSignedUrl(target.path, target.token, file);
      if (error) throw new Error(error.message);
      const concern = concerns[marker] ?? null;
      const result = await save({ data: { token, dayMarker: marker, storagePath: target.path, concern } });
      setConcerns((c) => ({ ...c, [marker]: null }));
      toast.success(
        result?.flagged
          ? "Photo saved · the studio has been alerted about your concern"
          : "Photo saved privately · asking AI for a check…",
      );
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
                          {p.flagged ? (
                            <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-red-600/40 bg-red-50 px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-red-700 uppercase">
                              ⚠️ Concern reported{p.concern ? ` — ${p.concern}` : ""}
                            </p>
                          ) : null}
                          {p.note ? <p className="text-sm text-foreground">“{p.note}”</p> : null}
                          <div className="mt-3 flex items-center gap-2.5">
                            <button
                              onClick={async () => {
                                await remove({ data: { token, photoId: p.id } });
                                qc.invalidateQueries({ queryKey: ["portal", token] });
                              }}
                              aria-label="Delete photo"
                              className="flex size-9 items-center justify-center rounded-lg text-destructive transition-colors hover:bg-destructive/10"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                                <path d="M3 6h18" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                            <label
                              className={`ink-label inline-flex cursor-pointer items-center rounded-full border border-foreground/40 px-4 py-2 tracking-[0.12em] transition-colors hover:bg-muted ${busy === marker ? "pointer-events-none opacity-50" : ""}`}
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

              {unlocked ? (
                <div className={shots.length ? "mt-4 border-t border-border pt-4" : "mt-4"}>
                  <p className="ink-label text-center text-muted-foreground">
                    ⚠️ Something worrying you? Tap it before uploading — the studio gets alerted
                  </p>
                  <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                    {CONCERN_OPTIONS.map((c) => {
                      const active = concerns[marker] === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setConcerns((prev) => ({ ...prev, [marker]: active ? null : c }))}
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-[11px] tracking-wide transition-all duration-200 active:scale-[0.97]",
                            active
                              ? "animate-emoji-pop border-red-600 bg-red-600 text-white"
                              : "border-border text-muted-foreground hover:border-red-600/50 hover:text-red-700",
                          )}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>
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

  function handleSend() {
    const text = message.trim();
    if (wa) {
      const url = text ? `${wa}${wa.includes("?") ? "&" : "?"}text=${encodeURIComponent(text)}` : wa;
      window.open(url, "_blank", "noreferrer");
      if (text) mutation.mutate(text);
      return;
    }
    mutation.mutate(text);
  }

  return (
    <section className="mt-10">
      <h2 className="ink-section-title text-2xl uppercase tracking-wide text-foreground">Need help?</h2>
      <div className="ink-card mt-4 space-y-4 rounded-2xl p-4">
        <Textarea
          rows={4}
          value={message}
          placeholder="Describe what you're seeing…"
          onChange={(e) => setMessage(e.target.value)}
          className="rounded-xl border-border/70 bg-background shadow-sm"
        />
        <button
          type="button"
          className="w-full rounded-full bg-foreground py-3.5 text-sm font-medium tracking-wide text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
          disabled={mutation.isPending}
          onClick={handleSend}
        >
          {wa ? "message on WhatsApp" : "Send to InkPark"}
        </button>
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
      <p className="ink-label text-center">How does this make you feel?</p>
      <div className="relative mt-2 flex justify-center gap-2">
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

function KnowledgeSection({ wa }: { wa: string | null }) {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const waBase = wa ? (wa.split("?")[0] ?? null) : null;

  const results = useMemo(() => searchFaqs(query), [query]);
  const open = FAQS.find((f) => f.id === openId) ?? null;

  if (open) {
    return <KnowledgeAnswer faq={open} waBase={waBase} onBack={() => setOpenId(null)} />;
  }

  return (
    <section className="mt-8">
      <h2 className="text-2xl text-foreground">Aftercare Knowledge Hub</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Straight answers to the questions every client asks while healing.
      </p>

      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search your aftercare question…"
        aria-label="Search aftercare questions"
        className="mt-4 h-auto rounded-md border-border bg-transparent px-4 py-3 text-sm"
      />
      <p className="ink-label mt-2">
        {query.trim() ? `${results.length} result${results.length === 1 ? "" : "s"}` : "Popular questions"}
      </p>

      <div className="ink-card mt-3 divide-y divide-border">
        {results.length === 0 ? (
          <div className="p-5">
            <p className="text-sm text-muted-foreground">
              No matching answer. Try words like “gym”, “water”, “sun”, “itchy” or “peeling” — or message
              the studio directly.
            </p>
          </div>
        ) : (
          results.map((f, i) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setOpenId(f.id)}
              className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-accent"
            >
              <span className="font-display text-lg text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="flex-1 text-base text-foreground">{f.question}</span>
              <span className="ink-label shrink-0">→</span>
            </button>
          ))
        )}
      </div>
    </section>
  );
}

function KnowledgeAnswer({
  faq,
  waBase,
  onBack,
}: {
  faq: Faq;
  waBase: string | null;
  onBack: () => void;
}) {
  const [vote, setVote] = useState<"up" | "down" | null>(() => {
    try {
      const v = localStorage.getItem(`faq-vote-${faq.id}`);
      return v === "up" || v === "down" ? v : null;
    } catch {
      return null;
    }
  });

  function cast(v: "up" | "down") {
    try {
      localStorage.setItem(`faq-vote-${faq.id}`, v);
    } catch {
      /* private mode — still show the choice */
    }
    setVote(v);
    toast.success(v === "up" ? "Glad it helped" : "Thanks — we'll improve this answer");
  }

  const sections: [string, string][] = [
    ["What to do", faq.do],
    ["What to avoid", faq.avoid],
    ["When to be concerned", faq.concern],
  ];

  return (
    <section className="mt-8 space-y-4">
      <button type="button" onClick={onBack} className="ink-label underline underline-offset-4">
        ← All questions
      </button>

      <div className="ink-card space-y-5 p-5">
        <div>
          <p className="ink-label">Short answer</p>
          <h3 className="mt-2 text-2xl leading-tight text-foreground">{faq.question}</h3>
          <p className="mt-3 text-sm leading-relaxed text-foreground">{faq.short}</p>
        </div>

        {sections.map(([label, body]) => (
          <div key={label} className="border-t border-border pt-4">
            <p className="ink-label">{label}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
          </div>
        ))}

        {waBase ? (
          <a
            href={`${waBase}?text=${encodeURIComponent(`Hi InkPark, question about aftercare: ${faq.question}`)}`}
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center justify-center rounded-md bg-foreground px-4 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Talk to InkPark on WhatsApp
          </a>
        ) : null}

        <div className="flex items-center justify-center gap-3 border-t border-border pt-4">
          <p className="ink-label mr-1">Was this helpful?</p>
          {(
            [
              ["up", "👍", "Helpful"],
              ["down", "👎", "Not helpful"],
            ] as const
          ).map(([v, emoji, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => cast(v)}
              className={cn(
                "ink-label inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 transition-colors hover:bg-accent",
                vote === v && "border-foreground bg-foreground text-background animate-emoji-pop",
              )}
            >
              <span className="text-base leading-none">{emoji}</span> {label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
