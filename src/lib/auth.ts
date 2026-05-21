import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getConfiguredPasswordHash, getConfiguredUsername } from "@/lib/config";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  signSessionToken,
  verifySessionToken,
} from "@/lib/session";

export async function isPasswordValid(password: string) {
  const hash = getConfiguredPasswordHash();

  if (!hash) {
    if (process.env.NODE_ENV === "production") {
      return false;
    }

    return password === "password";
  }

  return bcrypt.compare(password, hash);
}

export async function createSession(username: string) {
  const token = await signSessionToken(username);
  const cookieStore = await cookies();

  cookieStore.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);

  if (!session || session.username !== getConfiguredUsername()) {
    return null;
  }

  return session;
}

export async function requireSession() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}
