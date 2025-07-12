// Saves API key to chrome.storage
const saveOptions = () => {
  const apiKey = document.getElementById("apiKey").value.trim();

  chrome.storage.sync.set({ apiKey }, () => {
    showStatus("API key saved successfully.");
  });
};

// Removes API key from chrome.storage
const removeOptions = () => {
  chrome.storage.sync.remove("apiKey", () => {
    document.getElementById("apiKey").value = "";
    showStatus("API key removed.");
  });
};

// Restores API key from chrome.storage
const restoreOptions = () => {
  chrome.storage.sync.get({ apiKey: "" }, (items) => {
    document.getElementById("apiKey").value = items.apiKey || "";
  });
};

// Utility to show status
const showStatus = (message) => {
  const status = document.getElementById("status");
  status.textContent = message;
  setTimeout(() => {
    status.textContent = "";
  }, 1500);
};

// Event bindings
document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("save").addEventListener("click", saveOptions);
document.getElementById("remove").addEventListener("click", removeOptions);
