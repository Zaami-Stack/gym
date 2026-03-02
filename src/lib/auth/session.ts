import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export type SessionRole = "admin" | "customer";

export type SessionUser = {
  id: string;
  email: string;
  role: SessionRole;
  name: string;
};

type SessionPayload = {
  sub: string;
  email: string;
  role: SessionRole;
  name: string;
  exp: number;
};

const SESSION_COOKIE = "gym_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24;

function base64urlEncode(value: string) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64urlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = normalized.length % 4 === 0 ? 0 : 4 - (normalized.length % 4);
  return Buffer.from(normalized + "=".repeat(padLength), "base64").toString("utf8");
}

function getAuthSecret() {
  return process.env.AUTH_SECRET || "change-this-auth-secret";
}

function hasValidSecret() {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  const secret = process.env.AUTH_SECRET || "";
  return secret.length >= 24 && secret !== "change-this-auth-secret";
}

function signToken(payload: SessionPayload) {
  const header = base64urlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64urlEncode(JSON.stringify(payload));
  const unsigned = `${header}.${body}`;
  const signature = createHmac("sha256", getAuthSecret())
    .update(unsigned)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `${unsigned}.${signature}`;
}

function verifyToken(token: string | undefined) {
  if (!token) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [header, body, signature] = parts;
  const unsigned = `${header}.${body}`;
  const expected = createHmac("sha256", getAuthSecret())
    .update(unsigned)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (receivedBuffer.length !== expectedBuffer.length) {
    return null;
  }
  if (!timingSafeEqual(receivedBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64urlDecode(body)) as SessionPayload;
    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < now) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function safeEqual(leftValue: string, rightValue: string) {
  const left = Buffer.from(String(leftValue), "utf8");
  const right = Buffer.from(String(rightValue), "utf8");
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

export function normalizeEmail(email: string) {
  return String(email || "").trim().toLowerCase();
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(String(password), salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(storedPassword: string, inputPassword: string) {
  const stored = String(storedPassword || "");
  const input = String(inputPassword || "");

  if (!stored.startsWith("scrypt$")) {
    return safeEqual(stored, input);
  }

  const parts = stored.split("$");
  if (parts.length !== 3) {
    return false;
  }

  const [, salt, expectedHashHex] = parts;
  const inputHashHex = scryptSync(input, salt, 64).toString("hex");
  const expected = Buffer.from(expectedHashHex, "hex");
  const actual = Buffer.from(inputHashHex, "hex");
  if (expected.length !== actual.length) {
    return false;
  }
  return timingSafeEqual(expected, actual);
}

export function isAuthConfigured() {
  return hasValidSecret();
}

export async function setSessionCookie(user: SessionUser) {
  const cookieStore = await cookies();
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    exp: now + SESSION_TTL_SECONDS,
  };

  cookieStore.set(SESSION_COOKIE, signToken(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const payload = verifyToken(token);

  if (!payload) {
    return null;
  }

  return {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
    name: payload.name || "",
  } satisfies SessionUser;
}
