import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/AdminShell";
import { Input } from "@/components/ui/input";
import { FAQS, searchFaqs, type Faq } from "@/lib/aftercare-faq";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/knowledge")({
  head: () => ({
    meta: [
      { title: "Aftercare Knowledge Hub — InkPark" },
      { name: "description", content: "Searchable tattoo aftercare FAQ for InkPark staff and clients." },
      { property: "og:title", content: "Aftercare Knowledge Hub — InkPark" },
      { property: "og:description", content: "Searchable tattoo aftercare FAQ for InkPark staff and clients." },
    ],
  }),
  component: KnowledgeHub,
});

function useWhatsApp() {
  const settings = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("studio_settings")
        .select("whatsapp_number")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const num = (settings.data?.whatsapp_number ?? "").replace(/[^0-9]/g, "");
  return num ? `https://wa.me/${num}` : null;
}

function KnowledgeHub() {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const wa = useWhatsApp();

  const results = useMemo(() => searchFaqs(query), [query]);
  const open = FAQS.find((f) => f.id === openId) ?? null;

  return (
    <AdminShell title="Knowledge Hub" back={{ to: "/admin", label: "← Dashboard" }}>
      {open ? (
        <FaqDetail faq={open} wa={wa} onBack={() => setOpenId(null)} />
      ) : (
        <div className="space-y-5">
          <div className="space-y-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your aftercare question…"
              aria-label="Search aftercare questions"
              autoFocus
            />
            <p className="ink-label">
              {query.trim() ? `${results.length} result${results.length === 1 ? "" : "s"}` : "Popular questions"}
            </p>
          </div>

          <div className="ink-card divide-y divide-border">
            {results.length === 0 ? (
              <div className="p-5">
                <p className="text-sm text-muted-foreground">
                  No matching answer. Try words like “gym”, “water”, “sun”, “itchy” or “peeling” — or
                  message the studio directly.
                </p>
                {wa ? (
                  <a
                    href={wa}
                    target="_blank"
                    rel="noreferrer"
                    className="ink-label mt-4 inline-flex rounded-full border border-border px-4 py-2 hover:bg-accent"
                  >
                    Talk to InkPark on WhatsApp
                  </a>
                ) : null}
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
        </div>
      )}
    </AdminShell>
  );
}

function FaqDetail({ faq, wa, onBack }: { faq: Faq; wa: string | null; onBack: () => void }) {
  const [vote, setVote] = useState<"up" | "down" | null>(() => {
    const v = localStorage.getItem(`faq-vote-${faq.id}`);
    return v === "up" || v === "down" ? v : null;
  });

  function cast(v: "up" | "down") {
    localStorage.setItem(`faq-vote-${faq.id}`, v);
    setVote(v);
    toast.success(v === "up" ? "Glad it helped" : "Thanks — we'll improve this answer");
  }

  const sections: [string, string][] = [
    ["What to do", faq.do],
    ["What to avoid", faq.avoid],
    ["When to be concerned", faq.concern],
  ];

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="ink-label underline underline-offset-4 hover:text-foreground"
      >
        ← All questions
      </button>

      <div className="ink-card space-y-5 p-5">
        <div>
          <p className="ink-label">Short answer</p>
          <h2 className="mt-2 text-2xl leading-tight text-foreground">{faq.question}</h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground">{faq.short}</p>
        </div>

        {sections.map(([label, body]) => (
          <div key={label} className="border-t border-border pt-4">
            <p className="ink-label">{label}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
          </div>
        ))}

        {wa ? (
          <a
            href={`${wa}?text=${encodeURIComponent(`Hi InkPark, question about aftercare: ${faq.question}`)}`}
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
                vote === v && "border-foreground bg-foreground text-background animate-emoji-pop"
              )}
            >
              <span className="text-base leading-none">{emoji}</span> {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
