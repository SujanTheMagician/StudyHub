// Sujan – Data bridge (save and load data for every module)
//
// Every module saves and loads its data ONLY through these two functions.
// Do not call localStorage directly in your module.
//
// Phase 2 (now): data is kept in the browser with localStorage.
// Phase 3 (later): Sujan will change these functions to use fetch() calls
// to the backend API ('/api/...'). Your module code will not need to change.

// Load a list by name, for example loadData("tasks").
// Returns an empty array [] if nothing has been saved yet, or if the saved
// data is broken or the browser blocks storage (private mode).
function loadData(name) {
  try {
    const saved = JSON.parse(localStorage.getItem("studyhub-" + name));
    return saved === null ? [] : saved;
  } catch (error) {
    console.warn("StudyHub: could not load " + name, error);
    return [];
  }
}

// Save a list by name, for example saveData("tasks", tasks).
// Returns true if it saved, false if the browser refused (storage full or blocked).
function saveData(name, data) {
  try {
    localStorage.setItem("studyhub-" + name, JSON.stringify(data));
    return true;
  } catch (error) {
    console.warn("StudyHub: could not save " + name, error);
    return false;
  }
}
