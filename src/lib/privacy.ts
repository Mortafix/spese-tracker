export const PRIVACY_COOKIE_NAME = "spese_privacy";
export const PRIVACY_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function privacyModeFromCookie(value?: string) {
  return value === "1";
}
