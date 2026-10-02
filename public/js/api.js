// Sujan – Data bridge (save and load data for every module)
//
// Every module saves and loads its data ONLY through these two functions.
// Do not call localStorage directly in your module.
//
// Phase 2 (now): data is kept in the browser with localStorage.
// Phase 3 (later): Sujan will change these functions to use fetch() calls
// to the backend API ('/api/...'). Your module code will not need to change.

// Load a list by name, for example loadData("tasks").
// Returns an empty array [] if nothing has been saved yet.
function loadData(name) {
  return JSON.parse(localStorage.getItem("studyhub-" + name)) || [];
}

// Save a list by name, for example saveData("tasks", tasks).
function saveData(name, data) {
  localStorage.setItem("studyhub-" + name, JSON.stringify(data));
}
