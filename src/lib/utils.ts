// src/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { APP_CONFIG } from "@/lib/config";

/** Tailwind class helper (keeps existing helper) */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ----------------- Types ----------------- */
export type Platform = "linkedin" | "instagram" | "facebook" | "twitter";

export interface PlatformDraft {
  text?: string;
  hashtags?: string | string[];
  seo_keywords?: string;
  alt_text?: string;
  cta?: string;
  [key: string]: any;
}

export interface GenerateResponse {
  event_id: string;
  platform_drafts?: Record<Platform, PlatformDraft>;
  diagnostics?: any;
  [key: string]: any;
}

/* ----------------- Helpers ----------------- */
async function safeJsonResponse(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("safeJsonResponse: failed to parse json", {
      status: res.status,
      text,
    });
    throw new Error(
      "Invalid JSON response from API. See console for raw body."
    );
  }
}

/* ----------------- API FUNCTIONS ----------------- */
/**
 * Create an event. The server (n8n webhook) is expected to return:
 * { event_id: string, platform_drafts: { linkedin: {...}, ... } }
 *
 * Uses multipart/form-data to allow image File uploads.
 */
export async function createEvent(payload: {
  prompt_text: string;
  date_time: string;
  created_by: string;
  images: File[];
}): Promise<GenerateResponse> {
  const url = `${APP_CONFIG.API_BASE_URL.replace(/\/$/, "")}/create-event`;
  const form = new FormData();

  // Best-effort mapping that the n8n Set node expects
  form.append("title", (payload.prompt_text || "").split("\n")[0] || "");
  form.append("description", payload.prompt_text || "");
  form.append("date_time", payload.date_time || "");
  form.append("created_by", payload.created_by || "");

  (payload.images || []).forEach((file) => {
    form.append("images[]", file, file.name);
  });

  const res = await fetch(url, {
    method: "POST",
    body: form,
    // don't set Content-Type for FormData
  });

  // If server returns non-2xx, still attempt to parse body for diagnostics
  if (!res.ok) {
    const raw = await res.text();
    console.error("createEvent: non-OK response", { status: res.status, raw });
    throw new Error(`createEvent failed: ${res.status} ${res.statusText}`);
  }

  const data = await safeJsonResponse(res);
  console.debug("createEvent raw response:", data);

  // Defensive: ensure event_id exists
  if (!data || !data.event_id) {
    console.warn("createEvent: response missing event_id", data);
    throw new Error(
      "createEvent: missing event_id in response. Check server logs."
    );
  }

  return data as GenerateResponse;
}

/**
 * Regenerate / fetch drafts for a previously created event.
 * Called from EventDrafts page. The server should accept JSON { event_id }.
 */
export async function generateDrafts(
  eventId: string
): Promise<GenerateResponse> {
  const url = `${APP_CONFIG.API_BASE_URL.replace(/\/$/, "")}/generate-drafts`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event_id: eventId }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("generateDrafts: non-OK response", {
      status: res.status,
      text,
    });
    throw new Error(`generateDrafts failed: ${res.status} ${res.statusText}`);
  }

  const data = await safeJsonResponse(res);
  console.debug("generateDrafts raw response:", data);
  return data as GenerateResponse;
}

/**
 * Publish final drafts to the selected platforms.
 * Expects payload: { event_id, platforms: string[], final_drafts: {platform: {text, hashtags, ...}} }
 */
export async function publishEvent(payload: {
  event_id: string;
  platforms: string[];
  final_drafts: Record<string, PlatformDraft>;
}) {
  const url = `${APP_CONFIG.API_BASE_URL.replace(/\/$/, "")}/publish-event`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("publishEvent: non-OK response", {
      status: res.status,
      text,
    });
    throw new Error(`publishEvent failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  console.debug("publishEvent raw response:", data);
  return data;
}

/**
 * Get history (used by Dashboard).
 * Endpoint: GET /history?limit=#
 */
export async function getHistory(opts?: { limit?: number }) {
  const limit = opts?.limit ?? 10;
  const url = `${APP_CONFIG.API_BASE_URL.replace(
    /\/$/,
    ""
  )}/history?limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    console.error("getHistory: non-OK response", { status: res.status, text });
    throw new Error(`getHistory failed: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  console.debug("getHistory raw response:", data);
  return data;
}
