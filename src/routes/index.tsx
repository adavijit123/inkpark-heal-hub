import { createFileRoute, Link } from "@tanstack/react-router";

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

function Landing() {
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
        {[
          ["01", "Your tattoo", "Artist, style, placement and the studio photo of your fresh piece."],
          ["02", "Healing timeline", "Day 1 through fully healed, with studio-approved instructions."],
          ["03", "Photo tracker", "Upload Day 1, 3, 7, 14 and 30 photos to a private timeline."],
          ["04", "Studio support", "One tap to message InkPark if something doesn't look right."],
        ].map(([n, title, body]) => (
          <div key={n} className="flex gap-4 p-5">
            <span className="font-display text-xl text-muted-foreground">{n}</span>
            <div>
              <h2 className="text-lg leading-none text-foreground">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          </div>
        ))}
      </div>

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
