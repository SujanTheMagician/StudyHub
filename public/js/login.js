// Sujan – Log in and sign up page

let authMode = "login";

const authForm = document.getElementById("auth-form");
const authHeading = document.getElementById("auth-heading");
const authSubheading = document.getElementById("auth-subheading");
const authNameField = document.getElementById("auth-name-field");
const authNameInput = document.getElementById("auth-name");
const authEmailInput = document.getElementById("auth-email");
const authPasswordInput = document.getElementById("auth-password");
const authMessage = document.getElementById("auth-message");
const authSubmit = document.getElementById("auth-submit");
const authLocalNote = document.getElementById("auth-local-note");
const authTabs = document.querySelectorAll(".auth-tab");

function showAuthMessage(text) {
  authMessage.textContent = text;
  if (text) {
    authForm.classList.remove("anim-shake");
    void authForm.offsetWidth; // restart the shake animation
    authForm.classList.add("anim-shake");
  }
}

function setAuthMode(mode) {
  authMode = mode;
  const isSignup = mode === "signup";

  authTabs.forEach(function (tab) {
    const active = tab.dataset.mode === mode;
    tab.classList.toggle("auth-tab-active", active);
    tab.setAttribute("aria-selected", String(active));
  });

  authNameField.hidden = !isSignup;
  authHeading.textContent = isSignup
    ? "Create your account ✨"
    : "Welcome back 👋";
  authSubheading.textContent = isSignup
    ? "Your tasks, notes and habits will be saved to your account."
    : "Log in to see your tasks, notes and progress on any device.";
  authSubmit.textContent = isSignup ? "Create account" : "Log in";
  authPasswordInput.autocomplete = isSignup
    ? "new-password"
    : "current-password";
  showAuthMessage("");
}

function postAuthJson(url, data) {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(function (response) {
    return response
      .json()
      .catch(function () {
        return {};
      })
      .then(function (body) {
        if (!response.ok) {
          throw new Error(
            body.error || "Something went wrong. Please try again.",
          );
        }
        return body;
      });
  });
}

// A brand-new account takes over what this browser saved before Phase 3
function uploadBrowserDataToNewAccount() {
  if (readStudyhubKey("studyhub-user")) {
    return Promise.resolve(); // this browser's data belongs to another account
  }
  return Promise.all(
    STUDYHUB_SYNCED_DATA.filter(function (name) {
      return loadData(name).length > 0;
    }).map(function (name) {
      return fetch("/api/data/" + name, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loadData(name)),
      });
    }),
  );
}

// Put the student's saved data into this browser, then open the dashboard
function openDashboardFor(user) {
  return fetch("/api/data", { headers: { Accept: "application/json" } })
    .then(function (response) {
      if (!response.ok) {
        throw new Error(
          "Logged in, but your data could not be loaded. Please try again.",
        );
      }
      return response.json();
    })
    .then(function (all) {
      clearStudyhubCache();
      STUDYHUB_SYNCED_DATA.forEach(function (name) {
        writeStudyhubKey("studyhub-" + name, all[name] || []);
      });
      writeStudyhubKey("studyhub-user", user);
      window.location.href = "./";
    });
}

authTabs.forEach(function (tab) {
  tab.addEventListener("click", function () {
    setAuthMode(tab.dataset.mode);
  });
});

authForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const name = authNameInput.value.trim();
  const email = authEmailInput.value.trim();
  const password = authPasswordInput.value;

  if (authMode === "signup" && name === "") {
    showAuthMessage("Please enter your name.");
    authNameInput.focus();
    return;
  }
  if (!authEmailInput.checkValidity()) {
    showAuthMessage("Please enter a valid email address.");
    authEmailInput.focus();
    return;
  }
  if (password.length < 8) {
    showAuthMessage("Password must be at least 8 characters.");
    authPasswordInput.focus();
    return;
  }

  authSubmit.disabled = true;
  authSubmit.textContent =
    authMode === "signup" ? "Creating account…" : "Logging in…";
  showAuthMessage("");

  const request =
    authMode === "signup"
      ? postAuthJson("/api/signup", {
          name: name,
          email: email,
          password: password,
        }).then(function (body) {
          return uploadBrowserDataToNewAccount().then(function () {
            return body;
          });
        })
      : postAuthJson("/api/login", { email: email, password: password });

  request
    .then(function (body) {
      return openDashboardFor(body.user);
    })
    .catch(function (error) {
      showAuthMessage(error.message);
      authSubmit.disabled = false;
      authSubmit.textContent =
        authMode === "signup" ? "Create account" : "Log in";
    });
});

// Already logged in? Go straight to the dashboard.
// No backend (Live Server)? Explain that login only works online.
checkStudyhubSession().then(function (session) {
  if (session.mode === "online") {
    openDashboardFor(session.user).catch(function () {});
  } else if (session.mode === "local") {
    authLocalNote.hidden = false;
    authSubmit.disabled = true;
  }
});
