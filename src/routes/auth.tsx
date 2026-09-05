import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Staff Login — InkPark Aftercare" },
      { name: "description", content: "InkPark Tattoo Studio staff sign in for the aftercare dashboard." },
      { property: "og:title", content: "Staff Login — InkPark Aftercare" },
      { property: "og:description", content: "InkPark Tattoo Studio staff sign in for the aftercare dashboard." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate({ to: "/admin" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <div className="fixed inset-x-0 top-0 z-10 mx-auto flex w-full max-w-md items-center justify-between px-6 py-4">
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
      <p className="ink-label">InkPark Tattoo Studio</p>
      <h1 className="mt-3 text-4xl text-foreground">Staff access</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Client aftercare pages are private. Only studio staff sign in here.
      </p>

      <form onSubmit={submit} className="ink-card mt-8 space-y-4 p-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          Sign in
        </Button>
      </form>
    </main>
  );
}
