// Load saved notes (api.js gives us loadData and saveData)
let notes = loadData("notes");

// null = adding a new note; a number = editing that note
let editingNoteId = null;
let selectedColor = "default";
let notesFilter = "all";
let notesView = "grid";
let pendingDeleteId = null;
let notesToastTimer = null;

const NOTES_MAX_LENGTH = 2000;

// Elements on the page
const notesEditorHeading = document.getElementById("notes-editor-heading");
const notesEditorBody = document.getElementById("notes-editor-body");
const notesTitleInput = document.getElementById("notes-title");
const notesContentInput = document.getElementById("notes-content");
const notesSaveBtn = document.getElementById("notes-save-btn");
const notesCancelBtn = document.getElementById("notes-cancel-btn");
const notesSearchInput = document.getElementById("notes-search");
const notesSortSelect = document.getElementById("notes-sort");
const notesFiltersBox = document.getElementById("notes-filters");
const notesViewsBox = document.getElementById("notes-views");
const notesColorsBox = document.getElementById("notes-colors");
const notesCharCount = document.getElementById("notes-char-count");
const notesResultCount = document.getElementById("notes-result-count");
const notesStatTotal = document.getElementById("notes-stat-total");
const notesStatPinned = document.getElementById("notes-stat-pinned");
const notesStatWords = document.getElementById("notes-stat-words");
const notesList = document.getElementById("notes-list");
const notesConfirmDialog = document.getElementById("notes-confirm");
const notesConfirmText = document.getElementById("notes-confirm-text");
const notesConfirmCancel = document.getElementById("notes-confirm-cancel");
const notesConfirmOk = document.getElementById("notes-confirm-ok");
const notesToast = document.getElementById("notes-toast");

// Today's date as "YYYY-MM-DD"
function getTodayDate() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return now.getFullYear() + "-" + month + "-" + day;
}

// Save the notes list
function saveNotes() {
  saveData("notes", notes);
}

// Find one note by its id
function findNote(id) {
  return notes.find(function (n) {
    return n.id === id;
  });
}

// Count the words in a piece of text
function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// Small pop-up message at the bottom of the screen
function showNotesToast(message) {
  notesToast.textContent = message;
  notesToast.classList.add("notes-toast-show");
  clearTimeout(notesToastTimer);
  notesToastTimer = setTimeout(function () {
    notesToast.classList.remove("notes-toast-show");
  }, 2000);
}

// Update the three numbers at the top
function updateNotesStats() {
  let words = 0;
  let pinned = 0;
  notes.forEach(function (note) {
    words += countWords(note.title + " " + note.content);
    if (note.pinned) {
      pinned++;
    }
  });
  notesStatTotal.textContent = notes.length;
  notesStatPinned.textContent = pinned;
  notesStatWords.textContent = words;
}

function updateNotesCharCount() {
  notesCharCount.textContent =
    notesContentInput.value.length + " / " + NOTES_MAX_LENGTH;
}

// Highlight the chosen colour and tint the editor with it
function setSelectedColor(color) {
  selectedColor = color;
  notesColorsBox.querySelectorAll(".notes-color-btn").forEach(function (btn) {
    btn.classList.toggle("notes-color-active", btn.dataset.color === color);
  });
  notesEditorBody.className = "notes-editor-body notes-card-" + color;
}

// Clear the editor and go back to "add" mode
function resetNotesEditor() {
  editingNoteId = null;
  notesTitleInput.value = "";
  notesContentInput.value = "";
  notesEditorHeading.textContent = "✨ New note";
  notesSaveBtn.textContent = "Save note";
  notesCancelBtn.hidden = true;
  setSelectedColor("default");
  updateNotesCharCount();
}

// Add a new note, or update the note being edited
function addNote() {
  const title = notesTitleInput.value.trim();
  const content = notesContentInput.value.trim();

  if (title === "" && content === "") {
    showNotesToast("Write something first ✍️");
    return;
  }

  const today = getTodayDate();

  if (editingNoteId !== null) {
    const note = findNote(editingNoteId);
    note.title = title;
    note.content = content;
    note.color = selectedColor;
    note.updatedAt = today;
    showNotesToast("Note updated ✏️");
  } else {
    notes.push({
      id: Date.now(),
      title: title,
      content: content,
      pinned: false,
      createdAt: today,
      updatedAt: today,
      color: selectedColor,
    });
    showNotesToast("Note saved ✅");
  }

  saveNotes();
  resetNotesEditor();
  renderNotes();
}

// Put a note into the editor at the top so it can be changed
function editNote(id) {
  const note = findNote(id);
  notesTitleInput.value = note.title;
  notesContentInput.value = note.content;
  setSelectedColor(note.color || "default");
  updateNotesCharCount();
  editingNoteId = id;
  notesEditorHeading.textContent = "✏️ Editing note";
  notesSaveBtn.textContent = "Update note";
  notesCancelBtn.hidden = false;
  // Scroll the editor to the middle of the screen (not under the sticky header)
  notesEditorBody.scrollIntoView({ behavior: "smooth", block: "center" });
  notesTitleInput.focus({ preventScroll: true });
}

// Make a copy of a note
function duplicateNote(id) {
  const note = findNote(id);
  const today = getTodayDate();
  notes.push({
    id: Date.now(),
    title: (note.title || "Untitled") + " (copy)",
    content: note.content,
    pinned: false,
    createdAt: today,
    updatedAt: today,
    color: note.color || "default",
  });
  saveNotes();
  renderNotes();
  showNotesToast("Note duplicated 📄");
}

// Copy a note's text to the clipboard
function copyNote(id) {
  const note = findNote(id);
  const text = (note.title ? note.title + "\n\n" : "") + note.content;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(
      function () {
        showNotesToast("Copied to clipboard 📋");
      },
      function () {
        showNotesToast("Could not copy");
      }
    );
  } else {
    showNotesToast("Copy is not supported here");
  }
}

// Ask "are you sure?" before deleting
function askDeleteNote(id) {
  const note = findNote(id);
  pendingDeleteId = id;
  notesConfirmText.textContent =
    'Delete "' + (note.title || "Untitled") + '"? This cannot be undone.';

  if (typeof notesConfirmDialog.showModal === "function") {
    notesConfirmDialog.showModal();
  } else if (confirm("Delete this note?")) {
    deleteNote(id);
  }
}

// Really delete the note (only called after the person confirms)
function deleteNote(id) {
  notes = notes.filter(function (n) {
    return n.id !== id;
  });

  if (editingNoteId === id) {
    resetNotesEditor();
  }

  saveNotes();
  renderNotes();
  showNotesToast("Note deleted 🗑️");
}

// Pin or unpin a note
function togglePinNote(id) {
  const note = findNote(id);
  note.pinned = !note.pinned;
  saveNotes();
  renderNotes();
  showNotesToast(note.pinned ? "Pinned 📌" : "Unpinned");
}

// Notes to show: filtered by search and the Pinned chip, then sorted (pinned first)
function getVisibleNotes() {
  const text = notesSearchInput.value.trim().toLowerCase();

  const filtered = notes.filter(function (note) {
    if (notesFilter === "pinned" && !note.pinned) {
      return false;
    }
    return (
      note.title.toLowerCase().includes(text) ||
      note.content.toLowerCase().includes(text)
    );
  });

  const mode = notesSortSelect.value;

  return filtered.sort(function (a, b) {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }
    if (mode === "oldest") {
      return a.id - b.id;
    }
    if (mode === "updated") {
      if (a.updatedAt !== b.updatedAt) {
        return a.updatedAt < b.updatedAt ? 1 : -1;
      }
      return b.id - a.id;
    }
    if (mode === "az") {
      return (a.title || "").localeCompare(b.title || "");
    }
    return b.id - a.id;
  });
}

// Put text into an element and highlight the part that matches the search
function appendHighlighted(parent, text, query) {
  if (!query) {
    parent.appendChild(document.createTextNode(text));
    return;
  }

  const lower = text.toLowerCase();
  let start = 0;
  let index = lower.indexOf(query, start);

  while (index !== -1) {
    if (index > start) {
      parent.appendChild(document.createTextNode(text.slice(start, index)));
    }
    const mark = document.createElement("mark");
    mark.className = "notes-mark";
    mark.textContent = text.slice(index, index + query.length);
    parent.appendChild(mark);
    start = index + query.length;
    index = lower.indexOf(query, start);
  }

  if (start < text.length) {
    parent.appendChild(document.createTextNode(text.slice(start)));
  }
}

// Make one small icon button for a card
function makeNotesIconButton(className, symbol, label, onClick) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "notes-icon-btn " + className;
  btn.textContent = symbol;
  btn.setAttribute("aria-label", label);
  btn.title = label;
  btn.addEventListener("click", onClick);
  return btn;
}

// Build one note card
function buildNoteCard(note, query) {
  const card = document.createElement("article");
  card.className = "notes-card notes-card-" + (note.color || "default");
  if (note.pinned) {
    card.classList.add("notes-card-pinned");
    const badge = document.createElement("span");
    badge.className = "notes-pinned-badge";
    badge.textContent = "📌 Pinned";
    card.appendChild(badge);
  }

  const top = document.createElement("div");
  top.className = "notes-card-top";

  const title = document.createElement("h3");
  title.className = "notes-card-title";
  if (note.title) {
    appendHighlighted(title, note.title, query);
  } else {
    title.textContent = "Untitled";
    title.classList.add("notes-card-untitled");
  }

  const actions = document.createElement("div");
  actions.className = "notes-actions";
  actions.appendChild(
    makeNotesIconButton(
      "notes-pin-btn",
      "📌",
      note.pinned ? "Unpin note" : "Pin note",
      function () {
        togglePinNote(note.id);
      }
    )
  );
  actions.appendChild(
    makeNotesIconButton("notes-copy-btn", "📋", "Copy text", function () {
      copyNote(note.id);
    })
  );
  actions.appendChild(
    makeNotesIconButton("notes-duplicate-btn", "📄", "Duplicate note", function () {
      duplicateNote(note.id);
    })
  );
  actions.appendChild(
    makeNotesIconButton("notes-edit-btn", "✏️", "Edit note", function () {
      editNote(note.id);
    })
  );
  actions.appendChild(
    makeNotesIconButton("notes-delete-btn", "🗑️", "Delete note", function () {
      askDeleteNote(note.id);
    })
  );

  top.appendChild(title);
  top.appendChild(actions);

  const content = document.createElement("p");
  content.className = "notes-card-content";
  appendHighlighted(content, note.content, query);

  const footer = document.createElement("div");
  footer.className = "notes-card-footer";

  const dates = document.createElement("span");
  let dateText = "Created " + note.createdAt;
  if (note.updatedAt && note.updatedAt !== note.createdAt) {
    dateText += " · Updated " + note.updatedAt;
  }
  dates.textContent = dateText;

  const words = document.createElement("span");
  words.className = "notes-card-words";
  const wordCount = countWords(note.content);
  words.textContent = wordCount + (wordCount === 1 ? " word" : " words");

  footer.appendChild(dates);
  footer.appendChild(words);

  card.appendChild(top);
  card.appendChild(content);
  card.appendChild(footer);
  return card;
}

// A friendly message in the middle of the page
function showNotesMessage(icon, text) {
  const box = document.createElement("div");
  box.className = "notes-empty";

  const big = document.createElement("div");
  big.className = "notes-empty-icon";
  big.textContent = icon;

  const message = document.createElement("p");
  message.className = "notes-empty-text";
  message.textContent = text;

  box.appendChild(big);
  box.appendChild(message);
  notesList.appendChild(box);
}

// Show the notes on the page
function renderNotes() {
  notesList.textContent = "";
  notesList.classList.toggle("notes-list-view", notesView === "list");
  updateNotesStats();

  if (notes.length === 0) {
    notesResultCount.textContent = "";
    showNotesMessage("📝", "No notes yet. Write your first one!");
    return;
  }

  const visibleNotes = getVisibleNotes();
  notesResultCount.textContent =
    "Showing " + visibleNotes.length + " of " + notes.length + " notes";

  if (visibleNotes.length === 0) {
    if (notesFilter === "pinned" && notesSearchInput.value.trim() === "") {
      showNotesMessage("📌", "No pinned notes yet. Click 📌 on a note to pin it.");
    } else {
      showNotesMessage("🔍", "No notes match your search.");
    }
    return;
  }

  const query = notesSearchInput.value.trim().toLowerCase();
  visibleNotes.forEach(function (note) {
    notesList.appendChild(buildNoteCard(note, query));
  });
}

// ===== Events =====
notesSaveBtn.addEventListener("click", addNote);
notesCancelBtn.addEventListener("click", resetNotesEditor);
notesContentInput.addEventListener("input", updateNotesCharCount);

// Ctrl + Enter saves, Esc cancels
document.getElementById("notes-editor-body").addEventListener("keydown", function (event) {
  if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
    addNote();
  } else if (event.key === "Escape") {
    resetNotesEditor();
  }
});

notesColorsBox.addEventListener("click", function (event) {
  const btn = event.target.closest(".notes-color-btn");
  if (btn) {
    setSelectedColor(btn.dataset.color);
  }
});

notesFiltersBox.addEventListener("click", function (event) {
  const btn = event.target.closest(".notes-filter-btn");
  if (!btn) {
    return;
  }
  notesFilter = btn.dataset.filter;
  notesFiltersBox.querySelectorAll(".notes-filter-btn").forEach(function (b) {
    b.classList.toggle("notes-filter-active", b === btn);
  });
  renderNotes();
});

notesViewsBox.addEventListener("click", function (event) {
  const btn = event.target.closest(".notes-view-btn");
  if (!btn) {
    return;
  }
  notesView = btn.dataset.view;
  notesViewsBox.querySelectorAll(".notes-view-btn").forEach(function (b) {
    b.classList.toggle("notes-view-active", b === btn);
  });
  renderNotes();
});

notesSearchInput.addEventListener("input", renderNotes);
notesSortSelect.addEventListener("change", renderNotes);

// Delete pop-up buttons
notesConfirmCancel.addEventListener("click", function () {
  notesConfirmDialog.close();
});

notesConfirmOk.addEventListener("click", function () {
  const id = pendingDeleteId;
  notesConfirmDialog.close();
  if (id !== null) {
    deleteNote(id);
  }
});

notesConfirmDialog.addEventListener("close", function () {
  pendingDeleteId = null;
});

// Show notes when the page opens
updateNotesCharCount();
renderNotes();