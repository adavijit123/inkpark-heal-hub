import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { ReactNode } from "react";
import { getStaffStatus } from "@/lib/staff.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function AdminShell({
  title,
  back,
  children,
}: {
  title: string;
  back?: { to: string; label: string };
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const staffFn = useServerFn(getStaffStatus);
  const { data, isPending } = useQuery({
    queryKey: ["staff-status"],
    queryFn: () => staffFn({ data: undefined }),
  });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-5 pb-24 pt-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="ink-label">InkPark Studio</p>
          <h1 className="mt-2 text-3xl leading-none text-foreground">{title}</h1>
          {back ? (
            <Link to={back.to} className="ink-label mt-3 inline-block underline underline-offset-4">
              {back.label}
            </Link>
          ) : null}
        </div>
        <Button variant="ghost" size="sm" onClick={signOut}>
          Sign out
        </Button>
      </header>

      <div className="mt-8">
        {isPending ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : data?.isStaff ? (
          children
        ) : (
          <div className="ink-card p-5">
            <h2 className="text-xl text-foreground">No studio access</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This account isn't registered as InkPark staff. Ask a studio admin to add you.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
