export const REVIEW_BUCKET = "book-review";
export const REVIEW_COOKIE_NAME = "review_session";
export const REVIEW_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
export const REVIEW_SIGNED_URL_TTL = 60 * 60;
export const REVIEW_COOKIE_PAYLOAD = "book-review-ok";
export const REVIEW_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const REVIEW_SIGNED_URL_BATCH = 100;
export const REVIEW_UPLOAD_MAX_BYTES = 8 * 1024 * 1024;
export const REVIEW_LOGIN_MAX_FAILURES = 5;
export const REVIEW_LOGIN_GLOBAL_MAX_FAILURES = 50;
export const REVIEW_LOGIN_WINDOW_MS = 15 * 60 * 1000;

export const GOOGLE_FONTS_STYLESHEET =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap";
