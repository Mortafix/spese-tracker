import { NextResponse, type NextRequest } from "next/server";
import { isPasswordValid, sessionCookieOptions } from "@/lib/auth";
import { getConfiguredUsername } from "@/lib/config";
import {
  clearLoginAttempts,
  isLoginRateLimited,
  loginRateLimitKey,
  recordFailedLogin,
} from "@/lib/rate-limit";
import { SESSION_COOKIE, signSessionToken } from "@/lib/session";

function clientIpFromHeaders(requestHeaders: Headers) {
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

function loginRedirect(request: NextRequest, error: string, nextPath: string) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("error", error);
  loginUrl.searchParams.set("next", nextPath);
  return NextResponse.redirect(loginUrl, 303);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");
  const nextPath = safeNextPath(formData.get("next"));
  const attemptKey = loginRateLimitKey(
    clientIpFromHeaders(request.headers),
    username,
  );

  if (isLoginRateLimited(attemptKey)) {
    return loginRedirect(request, "rate_limited", nextPath);
  }

  if (
    username !== getConfiguredUsername() ||
    !(await isPasswordValid(password))
  ) {
    recordFailedLogin(attemptKey);
    return loginRedirect(request, "1", nextPath);
  }

  clearLoginAttempts(attemptKey);

  const response = NextResponse.redirect(new URL(nextPath, request.url), 303);
  response.cookies.set({
    name: SESSION_COOKIE,
    value: await signSessionToken(username),
    ...sessionCookieOptions(),
  });

  return response;
}
