import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const HEALING_DAYS = [1, 2, 3, 5, 7, 15, 30] as const;
const SIGNED_TTL = 60 * 60;

function fail(message: string): never {
  throw new Error(message);
}

export type PortalStage = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  day_from: number;
  day_to: number | null;
  cleaning: string | null;
  moisturizing: string | null;
  avoid: string | null;
  normal: string | null;
  contact: string | null;
};

export type PortalHealingPhoto = {
  id: string;
  day_marker: number;
  note: string | null;
  created_at: string;
  url: string | null;
  ai_feedback: string | null;
  ai_status: string;
  artist_feedback: string | null;
  artist_feedback_at: string | null;
};


export type PortalData = {
  tattoo: {
    id: string;
    tattoo_date: string;
    style: string | null;
    placement: string | null;
    photo_url: string | null;
    review_submitted: boolean;
    rebooking_requested: boolean;
  };
  client: { full_name: string };
  artist: { name: string; instagram: string | null } | null;
  stages: PortalStage[];
  photos: PortalHealingPhoto[];
  settings: {
    whatsapp_number: string | null;
    contact_email: string | null;
    review_url: string | null;
    booking_url: string | null;
  } | null;
};

async function resolveTattoo(token: string) {
  const clean = token.trim();
  if (!clean || clean.length < 16 || !/^[a-f0-9]+$/i.test(clean)) fail("Invalid link");
  const { data, error } = await supabaseAdmin
    .from("tattoos")
    .select("id, tattoo_date, style, placement, photo_path, review_submitted, rebooking_requested, client_id, artist_id")
    .eq("access_token", clean)
    .maybeSingle();
  if (error) fail(error.message);
  if (!data) fail("This aftercare link is not valid.");
  return data;
}

async function signed(bucket: string, path: string | null) {
  if (!path) return null;
  const { data } = await supabaseAdmin.storage.from(bucket).createSignedUrl(path, SIGNED_TTL);
  return data?.signedUrl ?? null;
}

export async function loadPortal(token: string): Promise<PortalData> {
  const tattoo = await resolveTattoo(token);

  const [clientRes, artistRes, stagesRes, photosRes, settingsRes] = await Promise.all([
    supabaseAdmin.from("clients").select("full_name").eq("id", tattoo.client_id).maybeSingle(),
    tattoo.artist_id
      ? supabaseAdmin.from("artists").select("name, instagram").eq("id", tattoo.artist_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabaseAdmin
      .from("aftercare_stages")
      .select("id, slug, title, subtitle, day_from, day_to, cleaning, moisturizing, avoid, normal, contact")
      .order("sort_order"),
    supabaseAdmin
      .from("healing_photos")
      .select("id, day_marker, note, created_at, storage_path, ai_feedback, ai_status, artist_feedback, artist_feedback_at, client_reaction")
      .eq("tattoo_id", tattoo.id)
      .order("day_marker"),
    supabaseAdmin
      .from("studio_settings")
      .select("whatsapp_number, contact_email, review_url, booking_url")
      .maybeSingle(),
  ]);

  const photos = await Promise.all(
    (photosRes.data ?? []).map(async (p) => ({
      id: p.id,
      day_marker: p.day_marker,
      note: p.note,
      created_at: p.created_at,
      url: await signed("healing-photos", p.storage_path),
      ai_feedback: p.ai_feedback,
      ai_status: p.ai_status,
      artist_feedback: p.artist_feedback,
      artist_feedback_at: p.artist_feedback_at,
      client_reaction: p.client_reaction,
    })),
  );


  return {
    tattoo: {
      id: tattoo.id,
      tattoo_date: tattoo.tattoo_date,
      style: tattoo.style,
      placement: tattoo.placement,
      photo_url: await signed("tattoo-photos", tattoo.photo_path),
      review_submitted: tattoo.review_submitted,
      rebooking_requested: tattoo.rebooking_requested,
    },
    client: { full_name: clientRes.data?.full_name ?? "Client" },
    artist: artistRes.data ? { name: artistRes.data.name, instagram: artistRes.data.instagram } : null,
    stages: (stagesRes.data ?? []) as PortalStage[],
    photos,
    settings: settingsRes.data ?? null,
  };
}

function safeExt(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "jpg";
  return /^(jpg|jpeg|png|webp|heic|heif)$/.test(ext) ? ext : "jpg";
}

export async function createPortalUpload(token: string, kind: "healing" | "support", fileName: string) {
  const tattoo = await resolveTattoo(token);
  const bucket = kind === "healing" ? "healing-photos" : "healing-photos";
  const path = `${tattoo.id}/${kind}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${safeExt(fileName)}`;
  const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUploadUrl(path);
  if (error || !data) fail(error?.message ?? "Could not start upload");
  return { bucket, path, token: data.token };
}

export async function saveHealingPhoto(
  token: string,
  dayMarker: number,
  storagePath: string,
  note: string | null,
) {
  const tattoo = await resolveTattoo(token);
  if (!HEALING_DAYS.includes(dayMarker as (typeof HEALING_DAYS)[number])) fail("Unknown healing stage");
  if (!storagePath.startsWith(`${tattoo.id}/`)) fail("Invalid upload");
  const { error } = await supabaseAdmin
    .from("healing_photos")
    .insert({ tattoo_id: tattoo.id, day_marker: dayMarker, storage_path: storagePath, note });
  if (error) fail(error.message);
  return { ok: true };
}

export async function saveClientReaction(token: string, photoId: string, reaction: string) {
  const tattoo = await resolveTattoo(token);
  const allowed = ["❤️", "😊", "👍", "😢", "😟"];
  if (!allowed.includes(reaction)) fail("Unknown reaction");
  const { error } = await supabaseAdmin
    .from("healing_photos")
    .update({ client_reaction: reaction })
    .eq("id", photoId)
    .eq("tattoo_id", tattoo.id);
  if (error) fail(error.message);
  return { ok: true };
}

export async function deleteHealingPhoto(token: string, photoId: string) {
  const tattoo = await resolveTattoo(token);
  const { data } = await supabaseAdmin
    .from("healing_photos")
    .select("storage_path")
    .eq("id", photoId)
    .eq("tattoo_id", tattoo.id)
    .maybeSingle();
  if (!data) fail("Photo not found");
  await supabaseAdmin.storage.from("healing-photos").remove([data.storage_path]);
  await supabaseAdmin.from("healing_photos").delete().eq("id", photoId).eq("tattoo_id", tattoo.id);
  return { ok: true };
}

export async function sendSupportMessage(token: string, message: string, storagePath: string | null) {
  const tattoo = await resolveTattoo(token);
  const text = message.trim().slice(0, 2000);
  if (text.length < 2) fail("Please write a short message");
  if (storagePath && !storagePath.startsWith(`${tattoo.id}/`)) fail("Invalid upload");
  const { error } = await supabaseAdmin
    .from("support_messages")
    .insert({ tattoo_id: tattoo.id, message: text, storage_path: storagePath });
  if (error) fail(error.message);
  return { ok: true };
}

export async function markPortalAction(token: string, action: "review" | "rebooking") {
  const tattoo = await resolveTattoo(token);
  const patch = action === "review" ? { review_submitted: true } : { rebooking_requested: true };
  const { error } = await supabaseAdmin.from("tattoos").update(patch).eq("id", tattoo.id);
  if (error) fail(error.message);
  return { ok: true };
}

export async function requestAiFeedback(token: string, photoId: string) {
  const tattoo = await resolveTattoo(token);
  const { data: photo } = await supabaseAdmin
    .from("healing_photos")
    .select("id, day_marker, note, storage_path")
    .eq("id", photoId)
    .eq("tattoo_id", tattoo.id)
    .maybeSingle();
  if (!photo) fail("Photo not found");

  const file = await supabaseAdmin.storage.from("healing-photos").download(photo.storage_path);
  if (file.error || !file.data) fail("Could not read the photo");
  const buf = Buffer.from(await file.data.arrayBuffer());
  const dataUrl = `data:${file.data.type || "image/jpeg"};base64,${buf.toString("base64")}`;

  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) fail("AI feedback is not configured");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "You are a tattoo aftercare assistant for a studio. Look at the healing photo and give short, calm, practical feedback in 3 lines max: (1) how the healing looks at this stage, (2) one concrete care tip for the next few days, (3) whether anything looks like it needs the artist or a doctor. Never diagnose medically; if you see strong redness, pus, swelling or spreading rash, tell them to contact the studio and a doctor. No markdown.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `This is day ${photo.day_marker} of healing. Client note: ${photo.note ?? "none"}.`,
            },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    }),
  });

  if (res.status === 429) fail("AI is busy right now, please try again in a minute.");
  if (res.status === 402) fail("AI credits are exhausted for this studio.");
  if (!res.ok) fail("AI feedback failed, please try again.");

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) fail("AI returned no feedback");

  await supabaseAdmin
    .from("healing_photos")
    .update({ ai_feedback: text, ai_status: "done" })
    .eq("id", photo.id)
    .eq("tattoo_id", tattoo.id);

  return { ok: true, feedback: text };
}
