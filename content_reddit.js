const USE_GEMINI = true;

const loadApiKey = async () => {
  return new Promise((resolve) => {
    chrome.storage.sync.get("apiKey", (data) => {
      if (!data.apiKey) {
        alert("Please set your OpenAI API key in the extension options.");
      }
      resolve(data.apiKey);
    });
  });
};

const fetchSummary = async (prompt) => {
  if (USE_GEMINI) {
    return await fetchSummaryGemini(prompt);
  } else {
    return await fetchSummaryOpenAI(prompt);
  }
};

const fetchSummaryOpenAI = async (prompt) => {
  const apiKey = await loadApiKey();
  if (!apiKey) return "";

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that summarizes Reddit posts or subreddits.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    const json = await response.json();
    return json.choices?.[0]?.message?.content?.trim() || "⚠️ No summary received.";
  } catch (err) {
    console.error("OpenAI error:", err);
    return "⚠️ Failed to fetch from OpenAI.";
  }
};

const fetchSummaryGemini = async (prompt) => {
  const apiKey = await loadApiKey(); // Same chrome.storage API key reuse
  if (!apiKey) return "";

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        }),
      }
    );

    const json = await response.json();
    return json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "⚠️ No summary received.";
  } catch (err) {
    console.error("Gemini error:", err);
    return "⚠️ Failed to fetch from Gemini.";
  }
};

const summarizePost = async (postEl) => {
  if (postEl.getAttribute("data-summarized") === "true") return;

  const subreddit = window.location.pathname.split("/")[2]; // 'r/javascript'
  const title = postEl.querySelector("h3")?.innerText || "";
  const body = postEl.innerText || "";

  const prompt = `Summarize the following Reddit post from r/${subreddit} in 2–3 sentences:\n\nTitle: ${title}\n\nContent: ${body}`;

  const summary = await fetchSummary(prompt);

  const summaryBox = document.createElement("div");
  summaryBox.style.marginTop = "12px";
  summaryBox.style.padding = "10px";
  summaryBox.style.border = "1px solid #ccc";
  summaryBox.style.borderRadius = "6px";
  summaryBox.style.background = "#f6f7f8";
  summaryBox.style.fontSize = "14px";
  summaryBox.innerText = summary;

  postEl.appendChild(summaryBox);
  postEl.setAttribute("data-summarized", "true");
};

const addSummaryButton = (postEl) => {
  if (postEl.querySelector(".quipin-summary-btn")) return;

  const titleEl = postEl.querySelector("h1[id^='post-title']");
  if (!titleEl || !titleEl.parentNode) return;

  const button = document.createElement("button");
  button.innerText = "🌟 QuipIn - Summarize Post";
  button.className = "quipin-summary-btn";
  button.style.cursor = "pointer";
  button.style.padding = "0 6px";
  button.style.border = "1px solid #ccc";
  button.style.borderRadius = "6px";
  button.style.background = "#dcea19ff";
  button.style.fontSize = "13px";

  button.onclick = async () => {
    button.disabled = true;
    const originalText = button.innerText;
    button.innerText = "⏳ Summarizing...";

    await summarizePost(postEl);

    button.disabled = false;
    button.innerText = "✅ Done";
    setTimeout(() => {
      button.innerText = originalText;
    }, 1500);
  };

  // ✅ Create a wrapper to insert below the title
  const wrapper = document.createElement("div");
  wrapper.style.marginTop = "8px";
  wrapper.appendChild(button);

  // ✅ Insert the wrapper just after the <h1> inside the same parent
  titleEl.parentNode.insertBefore(wrapper, titleEl.nextSibling);
};

const observer = new MutationObserver(() => {
  const postElements = document.querySelectorAll("shreddit-post");

  postElements.forEach((postEl) => {
    addSummaryButton(postEl);
  });
});

observer.observe(document.body, { childList: true, subtree: true });
