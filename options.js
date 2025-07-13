// Saves API key to chrome.storage
const saveOptions = () => {
  const apiKey = document.getElementById("apiKey").value.trim();

  if (!apiKey) return;

  chrome.storage.sync.set({ apiKey }, () => {
    showStatus("API key saved successfully.");
    updateUI(true);
  });
};

// Removes API key from chrome.storage
const removeOptions = () => {
  chrome.storage.sync.remove("apiKey", () => {
    showStatus("API key removed.");
    updateUI(false);
  });
};

// Restores API key from chrome.storage
const restoreOptions = () => {
  chrome.storage.sync.get({ apiKey: "" }, (items) => {
    const hasKey = !!items.apiKey;
    updateUI(hasKey);
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

// Update UI depending on whether an API key exists
const updateUI = (hasKey) => {
  const saveBtn = document.getElementById("save");
  const removeBtn = document.getElementById("remove");
  const input = document.getElementById("apiKey");

  if (hasKey) {
    input.value = "************************************************";
    input.disabled = true;
    saveBtn.style.display = "none";
    removeBtn.style.display = "inline-block";
  } else {
    input.value = "";
    input.disabled = false;
    saveBtn.style.display = "inline-block";
    removeBtn.style.display = "none";
  }
};

// Event bindings
document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("save").addEventListener("click", saveOptions);
document.getElementById("remove").addEventListener("click", removeOptions);
