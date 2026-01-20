// src/lib/config.ts

// Base API URL (no trailing slash)
export const API_BASE = "https://automation.mysamvedana.org";

export const ENDPOINTS = {
  EVENT_CREATE: "/webhook/create-event", // check exact webhook path in n8n
  PUBLISH: "/webhook/publish",
  HISTORY: "/webhook/history",
} as const;

export const APP_CONFIG = {
  API_BASE_URL: API_BASE,
  MAX_IMAGES_PER_EVENT: 5,
  MAX_IMAGE_SIZE: 5 * 1024 * 1024,
  SUPPORTED_IMAGE_FORMATS: ["image/jpeg", "image/png", "image/webp"],
  PLATFORMS: ["linkedin", "instagram", "facebook", "twitter"],
};

export type Platform = (typeof APP_CONFIG.PLATFORMS)[number];
