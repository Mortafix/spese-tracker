"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  createSession,
  destroySession,
  isPasswordValid,
} from "@/lib/auth";
import { getConfiguredUsername } from "@/lib/config";
import {
  clearLoginAttempts,
  isLoginRateLimited,
  loginRateLimitKey,
  recordFailedLogin,
} from "@/lib/rate-limit";

function clientIpFromHeaders(requestHeaders: { get(name: string): string | null }) {
  const forwardedFor = requestHeaders.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return (
    requestHeaders.get("x-real-ip") ||
    requestHeaders.get("cf-connecting-ip") ||
    "unknown"
  );
}

function safeNextPath(value: FormDataEntryValue | null) {
  const raw = String(value || "/dashboard");

  if (!raw.startsWith("/") || raw.startsWith("//")) {
    return "/dashboard";
  }

  return raw;
}

export async function loginAction(formData: FormData) {
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");
  const nextPath = safeNextPath(formData.get("next"));
  const requestHeaders = await headers();
  const attemptKey = loginRateLimitKey(clientIpFromHeaders(requestHeaders), username);

  if (isLoginRateLimited(attemptKey)) {
    redirect(`/login?error=rate_limited&next=${encodeURIComponent(nextPath)}`);
  }

  if (
    username !== getConfiguredUsername() ||
    !(await isPasswordValid(password))
  ) {
    recordFailedLogin(attemptKey);
    redirect(`/login?error=1&next=${encodeURIComponent(nextPath)}`);
  }

  clearLoginAttempts(attemptKey);
  await createSession(username);
  redirect(nextPath);
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
