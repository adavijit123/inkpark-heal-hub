import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "InkPark Tattoo Aftercare Portal" },
      {
        name: "description",
        content:
          "Every InkPark client gets a private aftercare page: day-by-day healing instructions, a photo tracker and direct studio support.",
      },
      { property: "og:title", content: "InkPark Tattoo Aftercare Portal" },
      {
        property: "og:description",
        content:
          "Private aftercare pages for InkPark Tattoo Studio clients — healing timeline, photo tracker and studio support.",
      },
    ],
  }),
  component: Landing,
});

const ITEMS = [
  {
    n: "01",
    title: "Your tattoo",
    body: "Artist, style, placement and the studio photo of your fresh piece.",
    detail:
      "Your page opens with the exact record we saved at the studio — session date, artist, style and placement — so you always know what you're caring for.",
  },
  {
    n: "02",
    title: "Healing timeline",
    body: "Day 1 through fully healed, with studio-approved instructions.",
    detail:
      "Six stages: Day 1, Days 2–3, Days 4–6, Week 2, Weeks 3–4 and Fully healed. Each one tells you how to clean, how to moisturize, what to avoid, what's normal and when to call us.",
  },
  {
    n: "03",
    title: "Photo tracker",
    body: "Upload Day 1, 3, 7, 14 and 30 photos to a private timeline.",
    detail:
      "Shoot straight from your phone. Photos are stored privately — only you and your artist can open them, and you can delete any shot at any time.",
  },
  {
    n: "04",
    title: "Studio support",
    body: "One tap to message InkPark if something doesn't look right.",
    detail:
      "Send a note straight from your aftercare page, or jump into WhatsApp with your session details already attached. We usually reply within studio hours.",
  },
];

function Landing() {
  const navigate = useNavigate();
  const [open, setOpen] = useState<string | null>(null);
  const [code, setCode] = useState("");

  function openPortal() {
    const token = code.trim().replace(/^.*\/a\//, "");
    if (!/^[a-f0-9]{16,}$/i.test(token)) {
      toast.error("Paste the full link or code from your artist");
      return;
    }
    navigate({ to: "/a/$token", params: { token } });
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-14">
      <p className="ink-label">InkPark Tattoo Studio</p>
      <h1 className="mt-4 text-5xl leading-[0.95] text-foreground">
        Tattoo
        <br />
        Aftercare
        <br />
        Portal
      </h1>
      <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
        Every InkPark client gets their own private aftercare page — opened with the QR code or link
        we hand you after your session. No accounts, no apps.
      </p>

      <div className="ink-card mt-10 divide-y divide-border">
        {ITEMS.map((item) => {
          const expanded = open === item.n;
          return (
            <button
              key={item.n}
              type="button"
              aria-expanded={expanded}
              onClick={() => setOpen(expanded ? null : item.n)}
              className="flex w-full gap-4 p-5 text-left transition-colors hover:bg-accent"
            >
              <span className="font-display text-xl text-muted-foreground">{item.n}</span>
              <div className="flex-1">
                <h2 className="flex items-center justify-between gap-3 text-lg leading-none text-foreground">
                  {item.title}
                  <span className="ink-label shrink-0">{expanded ? "−" : "+"}</span>
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                {expanded ? (
                  <p className="mt-3 border-l-2 border-border pl-3 text-sm leading-relaxed text-foreground">
                    {item.detail}
                  </p>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      <section className="ink-card mt-8 space-y-3 p-5">
        <h2 className="text-lg leading-none text-foreground">Already have a link?</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Paste the aftercare link or code your artist gave you.
        </p>
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") openPortal();
          }}
          placeholder="inkpark.app/a/…"
          aria-label="Aftercare link or code"
        />
        <Button className="w-full" onClick={openPortal}>
          Open my aftercare page
        </Button>
      </section>

      <div className="mt-auto pt-12">
        <Link
          to="/auth"
          className="ink-label inline-flex items-center gap-2 underline underline-offset-4 hover:text-foreground"
        >
          Studio staff login
        </Link>
      </div>
    </main>
  );
}

