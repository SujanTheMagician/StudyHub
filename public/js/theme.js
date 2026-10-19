// Nithiya – Dark / Light theme toggle

(function () {
  const THEME_KEY = "studyhub-theme";

  function applyTheme(theme) {
    document.body.classList.toggle("dark-mode", theme === "dark");

    const button = document.getElementById("theme-toggle");

    if (button) {
      button.textContent =
        theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode";

      button.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
      );
    }
  }

  function createThemeButton() {
    const button = document.createElement("button");

    button.id = "theme-toggle";
    button.type = "button";
    button.textContent = "🌙 Dark Mode";

    button.style.cssText = [
      "position: fixed",
      "top: 16px",
      "right: 16px",
      "z-index: 1000",
      "padding: 10px 16px",
      "border: 1px solid var(--border)",
      "border-radius: 10px",
      "background: var(--card-bg)",
      "color: var(--text)",
      "cursor: pointer",
      "font-size: 14px"
    ].join(";");

    button.addEventListener("click", function () {
      const isDark = document.body.classList.contains("dark-mode");
      const nextTheme = isDark ? "light" : "dark";

      try {
        localStorage.setItem(THEME_KEY, nextTheme);
      } catch (error) {
        // The toggle still works if browser storage is unavailable.
      }

      applyTheme(nextTheme);
    });

    document.body.appendChild(button);
  }

  function initTheme() {
    let savedTheme = "light";

    try {
      savedTheme = localStorage.getItem(THEME_KEY) || "light";
    } catch (error) {
      // Use light mode if browser storage is unavailable.
    }

    applyTheme(savedTheme === "dark" ? "dark" : "light");
    createThemeButton();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTheme);
  } else {
    initTheme();
  }
})();
