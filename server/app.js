// Sujan – StudyHub API (Express)
//
//   POST /api/signup        { name, email, password }  -> { user }
//   POST /api/login         { email, password }        -> { user }
//   POST /api/logout                                   -> { ok }
//   GET  /api/me                                       -> { user }
//   DELETE /api/me          { password }               -> { ok }  (deletes the account and all its data)
//   GET  /api/data                                    -> { tasks: [], focus: [], ... }
//   GET  /api/data/:name                               -> [ ...items ]
//   PUT  /api/data/:name    [ ...items ]               -> { ok, count }
//
// Every /api/data call only reads or writes the logged-in student's rows.

import express from "express";
import { getPool } from "./db.js";
import {
  SESSION_COOKIE,
  checkPassword,
  clearedSessionCookie,
  createSessionToken,
  hashPassword,
  readCookie,
  readSessionToken,
  sessionCookie,
} from "./auth.js";

// loadData("<name>") in api.js  ->  database table
const COLLECTION_TABLES = {
  tasks: "tasks",
  focus: "focus_sessions",
  notes: "notes",
  habits: "habits",
  events: "events",
};

const MAX_ITEMS_PER_COLLECTION = 5000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicUser(row) {
  return { id: String(row.id), name: row.name, email: row.email };
}

function sendError(res, status, message) {
  res.status(status).json({ error: message });
}

// Only accept JSON bodies. Browsers cannot send JSON cross-site without a
// preflight, so together with SameSite cookies this blocks CSRF.
function requireJson(req, res, next) {
  if (req.method !== "GET" && !req.is("application/json")) {
    return sendError(res, 415, "Send JSON (Content-Type: application/json)");
  }
  next();
}

function requireUser(req, res, next) {
  const userId = readSessionToken(
    readCookie(req.headers.cookie, SESSION_COOKIE),
  );
  if (!userId) {
    return sendError(res, 401, "Please log in");
  }
  req.userId = userId;
  next();
}

// Express 4 does not catch errors thrown in async handlers, so pass them on
function handleAsync(handler) {
  return function (req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

const router = express.Router();
router.use(express.json({ limit: "2mb" }));
router.use(requireJson);
router.use(function (req, res, next) {
  res.set("Cache-Control", "no-store");
  next();
});

router.post(
  "/signup",
  handleAsync(async function (req, res) {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body.password || "");

    if (name.length < 1 || name.length > 60) {
      return sendError(res, 400, "Enter your name (up to 60 characters)");
    }
    if (!EMAIL_PATTERN.test(email) || email.length > 200) {
      return sendError(res, 400, "Enter a valid email address");
    }
    if (password.length < 8 || password.length > 200) {
      return sendError(res, 400, "Password must be at least 8 characters");
    }

    const result = await getPool().query(
      "INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) " +
        "ON CONFLICT (email) DO NOTHING RETURNING id, name, email",
      [email, name, hashPassword(password)],
    );
    if (result.rows.length === 0) {
      return sendError(
        res,
        409,
        "An account with this email already exists. Log in instead.",
      );
    }

    const user = result.rows[0];
    res.set("Set-Cookie", sessionCookie(createSessionToken(user.id)));
    res.status(201).json({ user: publicUser(user) });
  }),
);

router.post(
  "/login",
  handleAsync(async function (req, res) {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body.password || "");

    const result = await getPool().query(
      "SELECT id, name, email, password_hash FROM users WHERE email = $1",
      [email],
    );
    const user = result.rows[0];
    if (!user || !checkPassword(password, user.password_hash)) {
      return sendError(res, 401, "Wrong email or password");
    }

    res.set("Set-Cookie", sessionCookie(createSessionToken(user.id)));
    res.json({ user: publicUser(user) });
  }),
);

router.post("/logout", function (req, res) {
  res.set("Set-Cookie", clearedSessionCookie());
  res.json({ ok: true });
});

// Delete the account. Every task, note, habit, etc. goes too (ON DELETE CASCADE).
router.delete(
  "/me",
  requireUser,
  handleAsync(async function (req, res) {
    const result = await getPool().query(
      "SELECT password_hash FROM users WHERE id = $1",
      [req.userId],
    );
    const user = result.rows[0];
    if (
      !user ||
      !checkPassword(String(req.body.password || ""), user.password_hash)
    ) {
      return sendError(res, 401, "Wrong password");
    }
    await getPool().query("DELETE FROM users WHERE id = $1", [req.userId]);
    res.set("Set-Cookie", clearedSessionCookie());
    res.json({ ok: true });
  }),
);

router.get(
  "/me",
  requireUser,
  handleAsync(async function (req, res) {
    const result = await getPool().query(
      "SELECT id, name, email FROM users WHERE id = $1",
      [req.userId],
    );
    if (result.rows.length === 0) {
      res.set("Set-Cookie", clearedSessionCookie());
      return sendError(res, 401, "Please log in");
    }
    res.json({ user: publicUser(result.rows[0]) });
  }),
);

async function loadCollection(table, userId) {
  const result = await getPool().query(
    "SELECT data FROM " + table + " WHERE user_id = $1 ORDER BY position, id",
    [userId],
  );
  return result.rows.map(function (row) {
    return row.data;
  });
}

router.get(
  "/data",
  requireUser,
  handleAsync(async function (req, res) {
    const names = Object.keys(COLLECTION_TABLES);
    const lists = await Promise.all(
      names.map(function (name) {
        return loadCollection(COLLECTION_TABLES[name], req.userId);
      }),
    );
    const all = {};
    names.forEach(function (name, index) {
      all[name] = lists[index];
    });
    res.json(all);
  }),
);

router.get(
  "/data/:name",
  requireUser,
  handleAsync(async function (req, res) {
    const table = COLLECTION_TABLES[req.params.name];
    if (!table) {
      return sendError(res, 404, "Unknown data name: " + req.params.name);
    }
    res.json(await loadCollection(table, req.userId));
  }),
);

// Replace the whole list, exactly like saveData() does with localStorage
router.put(
  "/data/:name",
  requireUser,
  handleAsync(async function (req, res) {
    const table = COLLECTION_TABLES[req.params.name];
    if (!table) {
      return sendError(res, 404, "Unknown data name: " + req.params.name);
    }
    if (!Array.isArray(req.body)) {
      return sendError(res, 400, "Send the full list as a JSON array");
    }
    if (req.body.length > MAX_ITEMS_PER_COLLECTION) {
      return sendError(
        res,
        413,
        "Too many items (max " + MAX_ITEMS_PER_COLLECTION + ")",
      );
    }

    // Keep the last copy of each id
    const itemsById = new Map();
    for (const item of req.body) {
      if (!item || typeof item !== "object" || !Number.isSafeInteger(item.id)) {
        return sendError(
          res,
          400,
          "Every item needs a whole-number id (use Date.now())",
        );
      }
      itemsById.set(item.id, item);
    }
    const items = Array.from(itemsById.values());
    const ids = items.map(function (item) {
      return String(item.id);
    });

    const client = await getPool().connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "DELETE FROM " +
          table +
          " WHERE user_id = $1 AND NOT (id = ANY($2::bigint[]))",
        [req.userId, ids],
      );
      if (items.length > 0) {
        await client.query(
          "INSERT INTO " +
            table +
            " (user_id, id, data, position, updated_at) " +
            "SELECT $1, (item->>'id')::bigint, item, place, now() " +
            "FROM jsonb_array_elements($2::jsonb) WITH ORDINALITY AS list (item, place) " +
            "ON CONFLICT (user_id, id) DO UPDATE " +
            "SET data = excluded.data, position = excluded.position, updated_at = now() " +
            "WHERE (" +
            table +
            ".data, " +
            table +
            ".position) IS DISTINCT FROM (excluded.data, excluded.position)",
          [req.userId, JSON.stringify(items)],
        );
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    res.json({ ok: true, count: items.length });
  }),
);

router.use(function (req, res) {
  sendError(res, 404, "Not found");
});

// eslint-disable-next-line no-unused-vars
router.use(function (error, req, res, next) {
  if (error.type === "entity.parse.failed") {
    return sendError(res, 400, "That is not valid JSON");
  }
  if (error.type === "entity.too.large") {
    return sendError(res, 413, "Too much data in one request");
  }
  console.error(error);
  sendError(res, 500, "Something went wrong on the server");
});

const app = express();
app.disable("x-powered-by");
// Netlify can pass either path, depending on how the request reached the function
app.use("/api", router);
app.use("/.netlify/functions/api", router);

export default app;
