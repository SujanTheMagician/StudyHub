// Sujan – quick end-to-end check of the API
// Run `npm run dev` in one terminal, then: npm run test:api
// (or API_URL=https://<deploy-preview>.netlify.app npm run test:api)

import assert from "node:assert/strict";

const BASE = process.env.API_URL || "http://localhost:8888";

async function call(method, path, body, cookie) {
  const response = await fetch(BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const setCookie = response.headers.get("set-cookie");
  const json = await response.json().catch(() => null);
  return {
    status: response.status,
    json,
    cookie: setCookie && setCookie.split(";")[0],
  };
}

const email = "test-" + Date.now() + "@example.com";
const password = "correct-horse-battery";

let r = await call("GET", "/api/me");
assert.equal(r.status, 401, "logged out /me should be 401");

r = await call("POST", "/api/signup", {
  name: "Test Student",
  email,
  password: "short",
});
assert.equal(r.status, 400, "short password rejected");

r = await call("POST", "/api/signup", {
  name: "Test Student",
  email,
  password,
});
assert.equal(r.status, 201, "signup works: " + JSON.stringify(r.json));
const cookieA = r.cookie;
assert.ok(cookieA.startsWith("studyhub_session="), "session cookie set");

r = await call("POST", "/api/signup", { name: "Again", email, password });
assert.equal(r.status, 409, "duplicate email rejected");

r = await call("POST", "/api/login", { email, password: "wrong-password" });
assert.equal(r.status, 401, "wrong password rejected");

r = await call("POST", "/api/login", { email: email.toUpperCase(), password });
assert.equal(r.status, 200, "login works (email is case-insensitive)");

r = await call("GET", "/api/me", undefined, cookieA);
assert.equal(r.json.user.email, email);

// Lists keep their order and every field, including extra ones
const notes = [
  {
    id: 3,
    title: "Third",
    content: "c",
    pinned: true,
    createdAt: "2026-10-19",
    updatedAt: "2026-10-19",
    color: "blue",
  },
  {
    id: 1,
    title: "First",
    content: "a",
    pinned: false,
    createdAt: "2026-10-18",
    updatedAt: "2026-10-18",
  },
];
r = await call("PUT", "/api/data/notes", notes, cookieA);
assert.equal(r.status, 200, "save notes: " + JSON.stringify(r.json));
r = await call("GET", "/api/data/notes", undefined, cookieA);
assert.deepEqual(
  r.json,
  notes,
  "notes come back in the same order with all fields",
);

// Saving a shorter list deletes the missing items
r = await call("PUT", "/api/data/notes", [notes[1]], cookieA);
r = await call("GET", "/api/data", undefined, cookieA);
assert.deepEqual(r.json.notes, [notes[1]], "deleted note is gone");
assert.deepEqual(r.json.tasks, [], "empty lists come back as []");

// Bad input
r = await call("PUT", "/api/data/notes", { not: "a list" }, cookieA);
assert.equal(r.status, 400);
r = await call("PUT", "/api/data/notes", [{ title: "no id" }], cookieA);
assert.equal(r.status, 400);
r = await call("PUT", "/api/data/passwords", [], cookieA);
assert.equal(r.status, 404, "unknown list name rejected");

// A second student cannot see the first student's data
r = await call("POST", "/api/signup", {
  name: "Other",
  email: "other-" + email,
  password,
});
const cookieB = r.cookie;
r = await call("GET", "/api/data/notes", undefined, cookieB);
assert.deepEqual(r.json, [], "other student sees no notes");

// A forged cookie is rejected: student A's cookie with student B's id in it
const idB = cookieB.match(/=(\d+)\./)[1];
const forged = cookieA.replace(/=\d+\./, "=" + idB + ".");
assert.notEqual(forged, cookieA);
r = await call("GET", "/api/me", undefined, forged);
assert.equal(r.status, 401, "forged session rejected");

r = await call("POST", "/api/logout", {}, cookieA);
assert.equal(r.status, 200);

console.log("✅ All API checks passed against " + BASE);
