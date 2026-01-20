import { type Platform, API_BASE, ENDPOINTS } from "@/lib/config";

export type { Platform } from "@/lib/config";

// --- API Types ---
export interface EventCreateRequest {
  prompt_text: string;
  date_time: string;
  created_by: string;
  images?: File[]; // legacy file upload
  images_base64?: string[]; // Base64 upload
  image_urls?: string[]; // NEW: direct uploaded image URLs
}

export interface PlatformDraft {
  text: string;
  hashtags: string;
  seo_keywords: string;
}

export interface GenerateResponse {
  event_id: string;
  platform_drafts: Record<Platform, PlatformDraft>;
}

export interface PublishRequest {
  event_id: string;
  platforms: Platform[];
  final_drafts: Record<Platform, PlatformDraft>;
}

export interface PublishResponse {
  success: boolean;
  published_platforms: Platform[];
  links?: Record<Platform, string>;
  message?: string;
}

export interface HistoryItem {
  event_id: string;
  title: string;
  status: "draft" | "published" | "failed";
  created_at: string;
  published_at?: string;
  platforms?: Platform[];
  links?: Record<Platform, string>;
}

export interface HistoryResponse {
  events: HistoryItem[];
  total: number;
}

// --- Custom Error Class ---
export class APIError extends Error {
  constructor(message: string, public status?: number, public response?: any) {
    super(message);
    this.name = "APIError";
  }
}

// --- Generic Fetch Wrapper ---
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {},
  timeout = 180000
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    const content = response.headers.get("content-type") || "";
    if (content.includes("application/json")) {
      return await response.json();
    }

    const text = await response.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new APIError(`Invalid JSON response: ${text}`);
    }
  } catch (error) {
    if (error instanceof APIError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new APIError(`Request timed out after ${timeout}ms`);
    }
    throw new APIError(
      `Network error: ${error instanceof Error ? error.message : "Unknown"}`
    );
  }
}

// --- API Functions ---

// CREATE EVENT
export async function createEvent(
  data: EventCreateRequest
): Promise<GenerateResponse> {
  // 1) Direct image URLs → server uploads already done
  if (data.image_urls && data.image_urls.length > 0) {
    const res = await fetch(`${API_BASE}${ENDPOINTS.EVENT_CREATE}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt_text: data.prompt_text,
        date_time: data.date_time,
        created_by: data.created_by,
        image_urls: data.image_urls,
      }),
    });

    if (!res.ok) throw new APIError(`Failed to create event`, res.status);
    return res.json();
  }

  // 2) Base64 images → automation via n8n webhook
  if (data.images_base64 && data.images_base64.length > 0) {
    const res = await fetch(`${API_BASE}${ENDPOINTS.EVENT_CREATE}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt_text: data.prompt_text,
        date_time: data.date_time,
        created_by: data.created_by,
        images_base64: data.images_base64,
      }),
    });

    if (!res.ok) throw new APIError(`Failed to create event`, res.status);
    return res.json();
  }

  // 3) Legacy file uploads
  const formData = new FormData();
  formData.append("prompt_text", data.prompt_text);
  formData.append("date_time", data.date_time);
  formData.append("created_by", data.created_by);
  data.images?.forEach((image) => formData.append("images", image));

  return fetchAPI<GenerateResponse>(ENDPOINTS.EVENT_CREATE, {
    method: "POST",
    body: formData,
  });
}

// PUBLISH EVENT
export async function publishEvent(
  data: PublishRequest
): Promise<PublishResponse> {
  return fetchAPI<PublishResponse>(
    ENDPOINTS.PUBLISH,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    120000
  );
}

// GET HISTORY (Modified to Use N8N Webhook)
export async function getHistory(
  params: {
    limit?: number;
    status?: string;
    start_date?: string;
    end_date?: string;
  } = {}
): Promise<HistoryResponse> {
  // Build query params
  const url = new URL(
    "https://automation.mysamvedana.org/webhook/webhook/history"
  );

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.append(key, value.toString());
    }
  });

  const res = await fetch(url.toString());

  if (!res.ok) {
    throw new APIError(`Failed to load history`, res.status);
  }

  return res.json();
}
