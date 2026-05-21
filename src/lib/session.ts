import { SignJWT, jwtVerify } from "jose";
import { getConfiguredSessionSecret } from "@/lib/config";

export const SESSION_COOKIE = "expense_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function getSecret() {
  return new TextEncoder().encode(getConfiguredSessionSecret());
}

export async function signSessionToken(username: string) {
  return new SignJWT({ sub: username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());
}

export async function verifySessionToken(token?: string) {
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSecret());
    const subject = typeof payload.sub === "string" ? payload.sub : null;

    if (!subject) {
      return null;
    }

    return { username: subject };
  } catch {
    return null;
  }
}
