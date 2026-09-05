import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/AdminShell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/faq")({
  head: () => ({
    meta: [
      { title: "Knowledge Hub Editor — InkPark" },
      {
        name: "description",
        content: "Create and edit the aftercare questions and answers clients see in the InkPark portal.",
      },
      { property: "og:title", content: "Knowledge Hub Editor — InkPark" },
      {
        property: "og:description",
        content: "Create and edit the aftercare questions and answers clients see in the InkPark portal.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FaqEditor,
});

type FaqRow = {
  id: string;
  question: string;
  keywords: string;
  short: string;
  do_text: string;
  avoid_text: string;
  concern: string;
  question_bn: string;
  short_bn: string;
  do_bn: string;
  avoid_bn: string;
  concern_bn: string;
  sort_order: number;
  active: boolean;
};

const EMPTY = {
  question: "",
  keywords: "",
  short: "",
  do_text: "",
  avoid_text: "",
  concern: "",
  question_bn: "",
  short_bn: "",
  do_bn: "",
  avoid_bn: "",
  concern_bn: "",
  sort_order: 0,
  active: true,
};

function FaqEditor() {
  const qc = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const { data, isPending } = useQuery({
    queryKey: ["admin-faqs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aftercare_faqs")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as FaqRow[];
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("aftercare_faqs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Question deleted");
      qc.invalidateQueries({ queryKey: ["admin-faqs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async (row: FaqRow) => {
      const { error } = await supabase
        .from("aftercare_faqs")
        .update({ active: !row.active })
        .eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-faqs"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AdminShell title="Knowledge Hub" back={{ to: "/admin", label: "← Dashboard" }}>
      <p className="text-sm text-muted-foreground">
        These questions and answers are what clients see in the Aftercare Knowledge Hub.
      </p>

      <div className="ink-card mt-5 divide-y divide-border">
        {isPending ? (
          <p className="p-5 text-sm text-muted-foreground">Loading…</p>
        ) : (data?.length ?? 0) === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">No questions yet — add your first below.</p>
        ) : (
          data!.map((row, i) => (
            <div key={row.id} className="p-4">
              <div className="flex items-start gap-3">
                <span className="font-display text-lg text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base text-foreground">{row.question}</p>
                  <p className="ink-label mt-1">
                    {row.active ? "Visible to clients" : "Hidden"} · order {row.sort_order}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenId(openId === row.id ? null : row.id)}
                  className="ink-label shrink-0 underline underline-offset-4"
                >
                  {openId === row.id ? "Close" : "Edit"}
                </button>
              </div>

              {openId === row.id ? (
                <FaqForm
                  key={row.id}
                  initial={row}
                  onSaved={() => {
                    qc.invalidateQueries({ queryKey: ["admin-faqs"] });
                    setOpenId(null);
                  }}
                  extra={
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => toggle.mutate(row)}>
                        {row.active ? "Hide from clients" : "Show to clients"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          if (confirm("Delete this question?")) remove.mutate(row.id);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  }
                />
              ) : null}
            </div>
          ))
        )}
      </div>

      <div className="mt-6">
        {creating ? (
          <div className="ink-card p-4">
            <p className="ink-label">New question</p>
            <FaqForm
              initial={{ ...EMPTY, sort_order: ((data?.at(-1)?.sort_order ?? 0) + 10) }}
              onSaved={() => {
                qc.invalidateQueries({ queryKey: ["admin-faqs"] });
                setCreating(false);
              }}
              extra={
                <Button type="button" variant="ghost" onClick={() => setCreating(false)}>
                  Cancel
                </Button>
              }
            />
          </div>
        ) : (
          <Button className="w-full" onClick={() => setCreating(true)}>
            Add a question
          </Button>
        )}
      </div>
    </AdminShell>
  );
}

function FaqForm({
  initial,
  onSaved,
  extra,
}: {
  initial: Partial<FaqRow> & typeof EMPTY;
  onSaved: () => void;
  extra?: React.ReactNode;
}) {
  const [form, setForm] = useState({ ...initial });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        question: form.question.trim(),
        keywords: form.keywords.trim(),
        short: form.short.trim(),
        do_text: form.do_text.trim(),
        avoid_text: form.avoid_text.trim(),
        concern: form.concern.trim(),
        question_bn: form.question_bn.trim(),
        short_bn: form.short_bn.trim(),
        do_bn: form.do_bn.trim(),
        avoid_bn: form.avoid_bn.trim(),
        concern_bn: form.concern_bn.trim(),
        sort_order: Number(form.sort_order) || 0,
        active: form.active,
      };
      if (!payload.question) throw new Error("Question is required");
      if (initial.id) {
        const { error } = await supabase.from("aftercare_faqs").update(payload).eq("id", initial.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("aftercare_faqs").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Saved");
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function field(key: keyof typeof EMPTY, label: string, long = false) {
    const value = String(form[key] ?? "");
    return (
      <div key={key}>
        <p className="ink-label mb-1">{label}</p>
        {long ? (
          <Textarea
            value={value}
            rows={3}
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          />
        ) : (
          <Input value={value} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} />
        )}
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      {field("question", "Question (English)")}
      {field("keywords", "Search keywords (comma separated)")}
      {field("short", "Short answer", true)}
      {field("do_text", "What to do", true)}
      {field("avoid_text", "What to avoid", true)}
      {field("concern", "When to be concerned", true)}

      <div className="border-t border-border pt-4 space-y-4">
        <p className="ink-label">Bangla version (optional)</p>
        {field("question_bn", "প্রশ্ন")}
        {field("short_bn", "সংক্ষিপ্ত উত্তর", true)}
        {field("do_bn", "যা করবেন", true)}
        {field("avoid_bn", "যা এড়িয়ে চলবেন", true)}
        {field("concern_bn", "কখন চিন্তার কারণ", true)}
      </div>

      <div>
        <p className="ink-label mb-1">Order</p>
        <Input
          type="number"
          value={String(form.sort_order)}
          onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save"}
        </Button>
        {extra}
      </div>
    </div>
  );
}
