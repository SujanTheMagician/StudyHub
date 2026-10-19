// Anmol – Progress and Stats

(function renderStats() {
  const statsTasks = loadData("tasks") || [];
  const statsFocus = loadData("focus") || [];
  const statsHabits = loadData("habits") || [];

  const statsTaskCount = statsTasks.filter(
    (task) => task.completed === true,
  ).length;

  const statsTotalMinutes = statsFocus.reduce(
    (total, session) => total + (Number(session.minutes) || 0),
    0,
  );

  document.getElementById("stats-tasks").textContent = statsTaskCount;
  document.getElementById("stats-focus").textContent =
    `${(statsTotalMinutes / 60).toFixed(1)}h`;

  function statsDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  const statsStudyDates = new Set([
    ...statsFocus
      .filter((session) => Number(session.minutes) > 0)
      .map((session) => session.date),

    ...statsHabits
      .filter((habit) => habit.completed === true)
      .map((habit) => habit.date),
  ].filter(Boolean));

  const statsToday = new Date();
  statsToday.setHours(12, 0, 0, 0);

  let statsStreak = 0;

  while (statsStudyDates.has(statsDate(statsToday))) {
    statsStreak++;
    statsToday.setDate(statsToday.getDate() - 1);
  }

  document.getElementById("stats-streak").textContent =
    `${statsStreak} days`;

  const statsLabels = [];
  const statsHours = [];

  for (let offset = 6; offset >= 0; offset--) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - offset);

    const dateKey = statsDate(date);

    statsLabels.push(
      date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      }),
    );

    const minutes = statsFocus
      .filter((session) => session.date === dateKey)
      .reduce(
        (total, session) => total + (Number(session.minutes) || 0),
        0,
      );

    statsHours.push(minutes / 60);
  }

  const statsHasFocus = statsFocus.some(
    (session) => Number(session.minutes) > 0,
  );
  const statsChartWrapper = document.querySelector(
    "#stats .stats-chart-wrapper",
  );

  document.getElementById("stats-empty").hidden = statsHasFocus;
  document.getElementById("stats-chart").hidden = !statsHasFocus;
  statsChartWrapper.classList.toggle(
    "stats-chart-wrapper--empty",
    !statsHasFocus,
  );

  if (!statsHasFocus) return;

  function statsCreateChart() {
    const statsElement = document.getElementById("stats");
    const statsStyles = getComputedStyle(statsElement);

    const statsPrimary =
      statsStyles.getPropertyValue("--primary").trim() || "Highlight";
    const statsText =
      statsStyles.getPropertyValue("--text").trim() || "CanvasText";

    new Chart(document.getElementById("stats-chart"), {
      type: "bar",
      data: {
        labels: statsLabels,
        datasets: [
          {
            label: "Focus hours",
            data: statsHours,
            backgroundColor: statsPrimary,
            borderRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          x: {
            ticks: {
              color: statsText,
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Hours",
              color: statsText,
            },
            ticks: {
              color: statsText,
            },
          },
        },
      },
    });
  }

  if (window.Chart) {
    statsCreateChart();
  } else {
    const statsScript = document.createElement("script");
    statsScript.src =
      "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js";

    statsScript.onload = statsCreateChart;
    statsScript.onerror = () => {
      document.getElementById("stats-empty").hidden = false;
      document.getElementById("stats-empty").textContent =
        "Chart could not load. Check your internet connection.";
      statsChartWrapper.classList.add("stats-chart-wrapper--empty");
    };

    document.head.appendChild(statsScript);
  }
})();
