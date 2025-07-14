const supportedPlatforms = ["linkedin.com", "reddit.com"];

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

// Saves model (radio button) immediately on change
const handleModelChange = (e) => {
  const selectedModel = e.target.value;
  chrome.storage.sync.set({ selectedModel }, () => {
    showStatus(`Model preference saved: ${selectedModel}`);
  });
};

const initializeOptions = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = tabs[0].url || "";

    let matchedPlatform = null;

    supportedPlatforms.forEach((platform) => {
      if (url.includes(platform)) {
        matchedPlatform = platform.split(".")[0]; // "linkedin.com" -> "linkedin"
      }
    });

    // Show only the matching platform section
    document.querySelectorAll(".platform-settings").forEach((section) => {
      if (section.dataset.platform === matchedPlatform) {
        section.style.display = "block";
      } else {
        section.style.display = "none";
      }
    });

    // Show/hide API key section
    const apiKeySection = document.getElementById("api-key-section");
    if (matchedPlatform) {
      apiKeySection.style.display = "block";
      chrome.storage.sync.get({ apiKey: "", selectedModel: "openai" }, (items) => {
        updateUI(!!items.apiKey);

        // Set radio selection from storage
        const radios = document.querySelectorAll('input[name="model"]');
        radios.forEach((radio) => {
          radio.checked = radio.value === items.selectedModel;
        });
      });
    } else {
      apiKeySection.style.display = "none";
      document.getElementById("status").textContent =
        "This extension only supports supported platforms.";
    }
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
document.addEventListener("DOMContentLoaded", () => {
  initializeOptions();

  // Register immediate save for model radio buttons
  document.querySelectorAll('input[name="model"]').forEach((radio) => {
    radio.addEventListener("change", handleModelChange);
  });

  document.getElementById("save").addEventListener("click", saveOptions);
  document.getElementById("remove").addEventListener("click", removeOptions);
});