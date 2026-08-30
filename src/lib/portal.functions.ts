import { createServerFn } from "@tanstack/react-start";

export const getPortal = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string }) => ({ token: String(d.token ?? "") }))
  .handler(async ({ data }) => {
    const { loadPortal } = await import("./portal.server");
    return loadPortal(data.token);
  });

export const startPortalUpload = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; kind: "healing" | "support"; fileName: string }) => ({
    token: String(d.token ?? ""),
    kind: d.kind === "support" ? ("support" as const) : ("healing" as const),
    fileName: String(d.fileName ?? "photo.jpg"),
  }))
  .handler(async ({ data }) => {
    const { createPortalUpload } = await import("./portal.server");
    return createPortalUpload(data.token, data.kind, data.fileName);
  });

export const addHealingPhoto = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; dayMarker: number; storagePath: string; note?: string | null }) => ({
    token: String(d.token ?? ""),
    dayMarker: Number(d.dayMarker),
    storagePath: String(d.storagePath ?? ""),
    note: d.note ? String(d.note).slice(0, 300) : null,
  }))
  .handler(async ({ data }) => {
    const { saveHealingPhoto } = await import("./portal.server");
    return saveHealingPhoto(data.token, data.dayMarker, data.storagePath, data.note);
  });

export const removeHealingPhoto = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; photoId: string }) => ({
    token: String(d.token ?? ""),
    photoId: String(d.photoId ?? ""),
  }))
  .handler(async ({ data }) => {
    const { deleteHealingPhoto } = await import("./portal.server");
    return deleteHealingPhoto(data.token, data.photoId);
  });

export const sendSupport = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; message: string; storagePath?: string | null }) => ({
    token: String(d.token ?? ""),
    message: String(d.message ?? ""),
    storagePath: d.storagePath ? String(d.storagePath) : null,
  }))
  .handler(async ({ data }) => {
    const { sendSupportMessage } = await import("./portal.server");
    return sendSupportMessage(data.token, data.message, data.storagePath);
  });

export const markPortalStep = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; action: "review" | "rebooking" }) => ({
    token: String(d.token ?? ""),
    action: d.action === "rebooking" ? ("rebooking" as const) : ("review" as const),
  }))
  .handler(async ({ data }) => {
    const { markPortalAction } = await import("./portal.server");
    return markPortalAction(data.token, data.action);
  });

export const reactToArtistFeedback = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; photoId: string; reaction: string }) => ({
    token: String(d.token ?? ""),
    photoId: String(d.photoId ?? ""),
    reaction: String(d.reaction ?? ""),
  }))
  .handler(async ({ data }) => {
    const { saveClientReaction } = await import("./portal.server");
    return saveClientReaction(data.token, data.photoId, data.reaction);
  });

export const requestPhotoAiFeedback = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; photoId: string }) => ({
    token: String(d.token ?? ""),
    photoId: String(d.photoId ?? ""),
  }))
  .handler(async ({ data }) => {
    const { requestAiFeedback } = await import("./portal.server");
    return requestAiFeedback(data.token, data.photoId);
  });
