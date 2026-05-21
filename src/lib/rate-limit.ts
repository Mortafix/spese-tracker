const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;
const MAX_TRACKED_KEYS = 5000;

type LoginAttempt = {
  count: number;
  resetAt: number;
};

const loginAttempts = new Map<string, LoginAttempt>();

function normalizePart(value: string) {
  return value.trim().toLowerCase() || "unknown";
}

function pruneExpired(now: number) {
  if (loginAttempts.size < MAX_TRACKED_KEYS) {
    return;
  }

  for (const [key, attempt] of loginAttempts.entries()) {
    if (attempt.resetAt <= now) {
      loginAttempts.delete(key);
    }
  }
}

function currentAttempt(key: string, now: number) {
  const attempt = loginAttempts.get(key);

  if (!attempt) {
    return null;
  }

  if (attempt.resetAt <= now) {
    loginAttempts.delete(key);
    return null;
  }

  return attempt;
}

export function loginRateLimitKey(ipAddress: string, username: string) {
  return `${normalizePart(ipAddress)}:${normalizePart(username)}`;
}

export function isLoginRateLimited(key: string, now = Date.now()) {
  const attempt = currentAttempt(key, now);
  return Boolean(attempt && attempt.count >= LOGIN_MAX_ATTEMPTS);
}

export function recordFailedLogin(key: string, now = Date.now()) {
  pruneExpired(now);

  const attempt = currentAttempt(key, now);

  if (!attempt) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return;
  }

  attempt.count += 1;
}

export function clearLoginAttempts(key: string) {
  loginAttempts.delete(key);
}
