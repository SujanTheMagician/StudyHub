// Anmol – Progress and Stats

const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
const focusTime = JSON.parse(localStorage.getItem("focusTime")) || [];
const habits = JSON.parse(localStorage.getItem("habits")) || [false, false, false, false];

// 1. Tasks completed
const completedTasks = tasks.filter(task => task.completed).length;
document.getElementById("tasksCompleted").textContent = completedTasks;

// 2. Total focus hours (focusTime stores minutes)
const totalMinutes = focusTime.reduce((sum, minutes) => sum + minutes, 0);
document.getElementById("focusHours").textContent =
    (totalMinutes / 60).toFixed(1) + "h";

// 3. Study streak (number of consecutive study days)
let streak = 0;
let day = new Date();

const studyDates = JSON.parse(localStorage.getItem("studyDates")) || [];

while (studyDates.includes(day.toLocaleDateString("en-CA"))) {
    streak++;
    day.setDate(day.getDate() - 1);
}

document.getElementById("studyStreak").textContent = streak + " days";

// 4. Weekly focus chart
const weeklyHours = focusTime.slice(-7).map(minutes => minutes / 60);

new Chart(document.getElementById("focusChart"), {
    type: "bar",
    data: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [{
            label: "Focus hours",
            data: weeklyHours,
            backgroundColor: "#6366f1"
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: { beginAtZero: true }
        }
    }
});

// 5. Daily habit tracker
const habitList = document.getElementById("habitList");

habits.forEach((done, index) => {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = done;

    checkbox.addEventListener("change", () => {
        habits[index] = checkbox.checked;
        localStorage.setItem("habits", JSON.stringify(habits));
    });

    const label = document.createElement("label");
    label.append(checkbox, " Habit " + (index + 1));
    habitList.appendChild(label);
});


