// Sujan – passwords and login sessions
//
// Passwords are hashed with scrypt (built into Node, no extra package).
// A session is a signed cookie: "<userId>.<expiresAt>.<signature>".
// The signature uses SESSION_SECRET, so nobody can fake a cookie for another user.

import crypto from "node:crypto";

export const SESSION_COOKIE = "studyhub_session";
const SESSION_DAYS = 30;

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET is missing or shorter than 32 characters");
  }
  return secret;
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return "scrypt$" + salt.toString("base64") + "$" + hash.toString("base64");
}

export function checkPassword(password, stored) {
  const [scheme, saltText, hashText] = String(stored).split("$");
  if (scheme !== "scrypt" || !saltText || !hashText) {
    return false;
  }
  const expected = Buffer.from(hashText, "base64");
  const actual = crypto.scryptSync(
    password,
    Buffer.from(saltText, "base64"),
    expected.length,
  );
  return crypto.timingSafeEqual(actual, expected);
}

function signSession(payload) {
  return crypto
    .createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");
}

export function createSessionToken(userId) {
  const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = userId + "." + expiresAt;
  return payload + "." + signSession(payload);
}

// Returns the user id from a valid, unexpired token, or null
export function readSessionToken(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) {
    return null;
  }
  const [userId, expiresAt, signature] = parts;
  const expected = Buffer.from(signSession(userId + "." + expiresAt));
  const actual = Buffer.from(signature);
  if (
    actual.length !== expected.length ||
    !crypto.timingSafeEqual(actual, expected)
  ) {
    return null;
  }
  if (Number(expiresAt) < Date.now() || !/^\d+$/.test(userId)) {
    return null;
  }
  return userId;
}

export function sessionCookie(token) {
  return (
    SESSION_COOKIE +
    "=" +
    token +
    "; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=" +
    SESSION_DAYS * 24 * 60 * 60
  );
}

export function clearedSessionCookie() {
  return (
    SESSION_COOKIE + "=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0"
  );
}

export function readCookie(header, name) {
  for (const part of String(header || "").split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) {
      return rest.join("=");
    }
  }
  return null;
}
