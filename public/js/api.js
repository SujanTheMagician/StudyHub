// Sujan – Data bridge (save and load data for every module)
//
// Every module saves and loads its data ONLY through these two functions.
// Do not call localStorage directly in your module.
//
//   let tasks = loadData("tasks");
//   saveData("tasks", tasks);
//
// Phase 3: when the student is logged in, every saveData() is also sent to
// the database (/api/data/...), and their data is downloaded when they log in.
// loadData() still answers straight away from the browser's copy, so your
// module code does not change.
//
// No backend (Live Server, or offline)? Everything keeps working in the
// browser only, exactly like Phase 2, and is sent up later.

// Lists that are kept in the database. Anything else stays in the browser.
const STUDYHUB_SYNCED_DATA = ["tasks", "focus", "notes", "habits", "events"];
const STUDYHUB_PENDING_KEY = "studyhub-pending";
const STUDYHUB_USER_KEY = "studyhub-user";
const STUDYHUB_RELOADED_KEY = "studyhub-reloaded-at";

// "checking" until we know; "online" = logged in; "local" = browser only
let studyhubMode = "checking";
const studyhubSaveTimers = {};

function readStudyhubKey(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch (error) {
    console.warn("StudyHub: could not read " + key, error);
    return null;
  }
}

function writeStudyhubKey(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn("StudyHub: could not save " + key, error);
    return false;
  }
}

// Load a list by name, for example loadData("tasks").
// Returns an empty array [] if nothing has been saved yet, or if the saved
// data is broken or the browser blocks storage (private mode).
function loadData(name) {
  const saved = readStudyhubKey("studyhub-" + name);
  return saved === null ? [] : saved;
}

// Save a list by name, for example saveData("tasks", tasks).
// Returns true if it saved, false if the browser refused (storage full or blocked).
function saveData(name, data) {
  const saved = writeStudyhubKey("studyhub-" + name, data);
  if (STUDYHUB_SYNCED_DATA.includes(name)) {
    markStudyhubPending(name, true);
    scheduleStudyhubUpload(name);
  }
  return saved;
}

// ===== Sending saves to the database =====

function getStudyhubPending() {
  const pending = readStudyhubKey(STUDYHUB_PENDING_KEY);
  return Array.isArray(pending) ? pending : [];
}

function markStudyhubPending(name, isPending) {
  const pending = getStudyhubPending().filter(function (item) {
    return item !== name;
  });
  if (isPending) {
    pending.push(name);
  }
  writeStudyhubKey(STUDYHUB_PENDING_KEY, pending);
}

// Wait half a second so typing fast does not send a request per key
function scheduleStudyhubUpload(name) {
  if (studyhubMode !== "online") {
    return; // sent once we know the student is logged in
  }
  clearTimeout(studyhubSaveTimers[name]);
  studyhubSaveTimers[name] = setTimeout(function () {
    uploadStudyhubData(name);
  }, 500);
}

function uploadStudyhubData(name) {
  clearTimeout(studyhubSaveTimers[name]);
  delete studyhubSaveTimers[name];

  const body = JSON.stringify(loadData(name));
  return fetch("/api/data/" + name, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: body,
    // keepalive lets the save finish even if the page is closing (max 64 KB)
    keepalive: body.length < 60000,
  })
    .then(function (response) {
      if (response.status === 401) {
        goToStudyhubLogin();
        return;
      }
      if (response.ok) {
        markStudyhubPending(name, false);
      } else {
        console.warn("StudyHub: server did not save " + name, response.status);
      }
    })
    .catch(function () {
      // Offline: it stays pending and is sent next time
    });
}

function uploadAllPendingStudyhubData() {
  return Promise.all(getStudyhubPending().map(uploadStudyhubData));
}

// Send waiting saves right away when the tab is closed or hidden
window.addEventListener("pagehide", function () {
  if (studyhubMode === "online") {
    Object.keys(studyhubSaveTimers).forEach(uploadStudyhubData);
  }
});

// ===== Session: who is logged in =====

function goToStudyhubLogin() {
  if (document.body.dataset.studyhubPage !== "login") {
    window.location.href = "login.html";
  }
}

// Forget everything saved for the last student (keeps the theme choice)
function clearStudyhubCache() {
  try {
    Object.keys(localStorage).forEach(function (key) {
      if (key.startsWith("studyhub-") && key !== "studyhub-theme") {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn("StudyHub: could not clear saved data", error);
  }
}

// Compare two lists, ignoring the order of keys inside each item
// (the database stores keys in its own order)
function sameStudyhubData(a, b) {
  function sortKeys(value) {
    if (Array.isArray(value)) {
      return value.map(sortKeys);
    }
    if (value && typeof value === "object") {
      const sorted = {};
      Object.keys(value)
        .sort()
        .forEach(function (key) {
          sorted[key] = sortKeys(value[key]);
        });
      return sorted;
    }
    return value;
  }
  return JSON.stringify(sortKeys(a)) === JSON.stringify(sortKeys(b));
}

// Ask the server who is logged in. Answers "online", "login" or "local".
function checkStudyhubSession() {
  return fetch("/api/me", { headers: { Accept: "application/json" } })
    .then(function (response) {
      if (response.status === 401) {
        return { mode: "login" };
      }
      const isJson = (response.headers.get("Content-Type") || "").includes(
        "application/json",
      );
      if (!response.ok || !isJson) {
        return { mode: "local" }; // no backend here (for example Live Server)
      }
      return response.json().then(function (body) {
        return { mode: "online", user: body.user };
      });
    })
    .catch(function () {
      return { mode: "local" }; // offline
    });
}

function showStudyhubUser(user) {
  const userName = document.getElementById("user-name");
  if (userName) {
    userName.textContent = user.name;
  }

  const userInfo = document.querySelector(".user-info");
  if (userInfo && !document.getElementById("auth-logout-btn")) {
    const button = document.createElement("button");
    button.type = "button";
    button.id = "auth-logout-btn";
    button.className = "auth-logout-btn";
    button.title = "Log out";
    button.setAttribute("aria-label", "Log out");
    button.innerHTML =
      '<span aria-hidden="true">⎋</span><span class="auth-logout-text">Log out</span>';
    button.addEventListener("click", logoutStudyhub);
    userInfo.appendChild(button);
  }
}

function logoutStudyhub() {
  uploadAllPendingStudyhubData()
    .then(function () {
      return fetch("/api/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
    })
    .catch(function () {})
    .then(function () {
      clearStudyhubCache();
      window.location.href = "login.html";
    });
}

// Download the student's data. Reload once if another device changed it.
function downloadStudyhubData(user) {
  const cachedUser = readStudyhubKey(STUDYHUB_USER_KEY);
  if (!cachedUser || cachedUser.id !== user.id) {
    // Data in this browser belongs to someone else (or nobody): start clean
    clearStudyhubCache();
    writeStudyhubKey(STUDYHUB_USER_KEY, user);
  }

  return uploadAllPendingStudyhubData()
    .then(function () {
      return fetch("/api/data", { headers: { Accept: "application/json" } });
    })
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Could not download data: " + response.status);
      }
      return response.json();
    })
    .then(function (all) {
      const pending = getStudyhubPending();
      let changed = false;

      STUDYHUB_SYNCED_DATA.forEach(function (name) {
        const fromServer = all[name] || [];
        if (
          !pending.includes(name) &&
          !sameStudyhubData(fromServer, loadData(name))
        ) {
          writeStudyhubKey("studyhub-" + name, fromServer);
          changed = true;
        }
      });

      // Modules already drew the old data, so reload once to show the new data
      let lastReload = 0;
      try {
        lastReload = Number(sessionStorage.getItem(STUDYHUB_RELOADED_KEY)) || 0;
      } catch (error) {
        lastReload = Date.now(); // cannot remember, so do not risk reload loops
      }
      if (changed && Date.now() - lastReload > 10000) {
        try {
          sessionStorage.setItem(STUDYHUB_RELOADED_KEY, String(Date.now()));
        } catch (error) {
          // ignore
        }
        window.location.reload();
      }
    })
    .catch(function (error) {
      console.warn("StudyHub:", error);
    });
}

function startStudyhubSession() {
  if (document.body.dataset.studyhubPage === "login") {
    return; // login.js handles the login page
  }
  checkStudyhubSession().then(function (session) {
    studyhubMode = session.mode;
    if (session.mode === "login") {
      goToStudyhubLogin();
    } else if (session.mode === "online") {
      showStudyhubUser(session.user);
      downloadStudyhubData(session.user);
    }
  });
}

// Back online after being offline: send waiting saves and refresh
window.addEventListener("online", function () {
  if (studyhubMode === "local") {
    startStudyhubSession();
  }
});

startStudyhubSession();
