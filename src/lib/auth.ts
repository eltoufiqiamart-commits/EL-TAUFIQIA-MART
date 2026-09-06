import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

function resolveJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= 32) {
    return new TextEncoder().encode(secret);
  }
  if (process.env.NODE_ENV === "production") {
    // A missing/weak JWT secret in production would let anyone forge admin
    // sessions. Fail hard instead of falling back to a known, hardcoded value.
    throw new Error(
      "JWT_SECRET environment variable is missing or too short (min 32 chars). Refusing to start in production."
    );
  }
  // Development-only fallback so local `next dev` works without extra setup.
  // Never reached in production because of the check above.
  console.warn(
    "[auth] JWT_SECRET not set — using an insecure development-only secret. Set JWT_SECRET before deploying."
  );
  return new TextEncoder().encode("dev-only-insecure-secret-do-not-use-in-production");
}

const JWT_SECRET = resolveJwtSecret();

const COOKIE_NAME = "toufiqia_session";

export interface SessionPayload {
  userId: string;
  email: string;
  role: "customer" | "seller" | "admin";
  iat?: number;
  exp?: number;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(payload: Omit<SessionPayload, "iat" | "exp">): Promise<string> {
  const token = await new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);
  return token;
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getProfile(userId: string) {
  const result = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  return result[0] || null;
}

export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    throw new Error("FORBIDDEN");
  }
  return session;
}

export async function requireSeller(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session || (session.role !== "seller" && session.role !== "admin")) {
    throw new Error("FORBIDDEN");
  }
  return session;
}
