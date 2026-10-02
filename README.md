# StudyHub

StudyHub is a simple web app that helps students stay organised. In one place, a student can:

- ✅ Add and manage daily tasks
- ⏱️ Use a focus timer to study better
- 📝 Write and save notes
- 🔥 Track daily habits and streaks
- 📅 Plan their week on a calendar
- 📊 See their progress

Everything lives on one page, works in light and dark mode, and works on phone, tablet and desktop.

## Tech stack

| Part        | Technology                                    | Owner   |
| ----------- | --------------------------------------------- | ------- |
| Frontend    | HTML, CSS, JavaScript (Chart.js for charts)   | Juniors |
| Data bridge | `api.js` (localStorage first, then backend)   | Sujan   |
| Backend     | Node.js + Express (Netlify Functions)         | Sujan   |
| Database    | PostgreSQL                                    | Sujan   |
| Hosting     | Netlify (auto-deploy from `main`)             | Sujan   |

## Team and modules

| #   | Name       | Module                                         | Branch                         | Your files                                           |
| --- | ---------- | ---------------------------------------------- | ------------------------------ | ---------------------------------------------------- |
| –   | Sujan      | Advisor; backend, database, hosting, Daily Quote, `api.js` | `feature/api`, `feature/quote` | `js/api.js`, `js/modules/quote.js`, `server/`, `netlify/` |
| 1   | Sai Priyan | Dashboard layout and navigation                | `feature/layout`               | `index.html`, `css/layout.css`, `js/main.js`         |
| 2   | Adil       | To-Do List                                     | `feature/todo`                 | `css/modules/todo.css`, `js/modules/todo.js`         |
| 3   | Ethan      | Focus Timer (Pomodoro)                         | `feature/timer`                | `css/modules/timer.css`, `js/modules/timer.js`       |
| 4   | Ashmitha   | Project Lead; Notes                            | `feature/notes`                | `css/modules/notes.css`, `js/modules/notes.js`       |
| 5   | Vignesh    | Habit Tracker with streaks                     | `feature/habits`               | `css/modules/habits.css`, `js/modules/habits.js`     |
| 6   | Nithya     | Dark / Light theme                             | `feature/theme`                | `css/base.css`, `js/theme.js`                        |
| 7   | Jaden      | Calendar and Planner                           | `feature/calendar`             | `css/modules/calendar.css`, `js/modules/calendar.js` |
| 8   | Biswa      | Project Lead; Animations and hover effects     | `feature/animations`           | `css/animations.css`                                 |
| 9   | Anmol      | Progress and Stats                             | `feature/stats`                | `css/modules/stats.css`, `js/modules/stats.js`       |
| 10  | Atham      | Responsive design                              | `feature/responsive`           | `css/responsive.css`                                 |

**Project leads:** Biswa and Ashmitha review and merge Pull Requests. A lead never approves their own Pull Request; the other lead reviews it.

## Folder structure

Juniors work only inside `public/`.

```
StudyHub/
├── public/
│   ├── index.html          ← Sai Priyan (one page for the whole app)
│   ├── css/
│   │   ├── base.css        ← Nithya (colour variables, theme)
│   │   ├── layout.css      ← Sai Priyan
│   │   ├── animations.css  ← Biswa
│   │   ├── responsive.css  ← Atham
│   │   └── modules/        ← todo, timer, notes, habits, calendar, stats
│   ├── js/
│   │   ├── api.js          ← Sujan (save and load data)
│   │   ├── theme.js        ← Nithya
│   │   ├── main.js         ← Sai Priyan (navigation)
│   │   └── modules/        ← todo, timer, notes, habits, calendar, stats, quote
│   └── assets/             ← logo, icons, sounds
├── server/                 ← Sujan only
├── netlify/                ← Sujan only
└── README.md
```

## Rules for files

- Edit only your own files. In `index.html`, edit only inside your own `<section id="...">`.
- Only `base.css` styles `:root` and `body`. Module CSS styles only its own section.
- Start every class name with your module name: `.todo-item`, `.notes-card`, `.habits-card`.
- Use clear function names: `renderTasks()`, `saveNotes()`, not `render()` or `save()`.
- Never type a colour like `#ffffff` or `blue` in module CSS. Use the colour variables: `--bg`, `--card-bg`, `--text`, `--text-muted`, `--border`, `--primary`, `--success`, `--danger`.

## Saving data: always use `api.js`

Do not call `localStorage` directly in your module. Use these two functions:

```js
let tasks = loadData("tasks"); // load (returns [] if nothing saved yet)
saveData("tasks", tasks);      // save
```

Later, Sujan changes only `api.js` to talk to the backend, and your module keeps working.

## How to run the app

1. Install [VS Code](https://code.visualstudio.com) and [Git](https://git-scm.com).
2. In VS Code, install the extensions **Live Server** (Ritwick Dey) and **Prettier – Code formatter**.
3. Turn on **Format On Save** (Settings → search "Format On Save" → tick it).
4. Clone the repo (see Step 1 below) and open the `StudyHub` folder in VS Code.
5. Right-click `public/index.html` and choose **Open with Live Server**.

## Git workflow

Type these in the VS Code terminal (`` Ctrl + ` ``). Replace the words in `< >` with your own details.

### Step 1: One-time setup (first day only)

```bash
git config --global user.name "<Your Name>"
git config --global user.email "<you@example.com>"

cd Desktop
git clone https://github.com/SujanTheMagician/StudyHub.git
cd StudyHub
code .
```

### Step 2: Create your own branch (first day only)

```bash
git checkout main
git pull origin main
git checkout -b feature/<your-module>
# Example: git checkout -b feature/todo
```

### Step 3: Every time you start working

```bash
git checkout main
git pull origin main           # get everyone's latest merged work
git checkout feature/<your-module>
git merge main                 # bring that work into your branch
```

### Step 4: Save and upload your work

```bash
git status                     # see which files changed
git add .                      # select all changed files
git commit -m "<module>: <what you did>"
# Example: git commit -m "todo: add delete button"

git push -u origin feature/<your-module>   # first push only
git push                                   # every push after that
```

### Step 5: Open a Pull Request

1. Go to [github.com/SujanTheMagician/StudyHub](https://github.com/SujanTheMagician/StudyHub).
2. Click the yellow **Compare & pull request** button.
3. Check that it says **base: main ← compare: feature/your-module**.
4. Title: what you built, for example "To-Do List: add and delete tasks".
5. Description: what you did, plus a screenshot of your module.
6. Under **Reviewers**, add Biswa or Ashmitha. Click **Create pull request**.
7. If they ask for changes, fix them, then `git add .`, `git commit` and `git push` again. The Pull Request updates by itself.

### Step 6: After your Pull Request is merged

```bash
git checkout main
git pull origin main
git checkout feature/<your-module>
git merge main                 # keep working on the same branch
```

### If something goes wrong

| Problem                      | What to do                                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `git push` is rejected       | Run Step 3, then push again                                                                                  |
| Merge conflict message       | Open the file; VS Code shows both versions. Click **Accept Current** or **Accept Incoming**, save, then `git add .` and `git commit` |
| Committed to `main` by mistake | Stop and message Biswa or Ashmitha before pushing                                                          |
| Not sure what happened       | Run `git status` and share a screenshot in the group                                                         |

### Golden rules

- Never push to `main`.
- Pull before you start.
- Commit small and often.
- Write clear commit messages.
