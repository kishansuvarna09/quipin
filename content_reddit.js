const loadPreferences = async () => {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["apiKey", "selectedModel"], (data) => {
      if (!data.apiKey) {
        alert("Please set your API key in the extension options.");
      }
      resolve(data);
    });
  });
};

const fetchSummary = async (prompt) => {
    const { apiKey, selectedModel } = await loadPreferences();

    if (!apiKey) return "⚠️ Please set your API key in the extension options.";

    try {
    if (selectedModel === "gemini") {
      return await fetchSummaryGemini(prompt, apiKey );
    } else {
      return await fetchSummaryOpenAI(prompt, apiKey);
    }
  } catch (err) {
    console.error(`${selectedModel.toUpperCase()} error:`, err);
    alert(`Failed to fetch from ${selectedModel.toUpperCase()}. Check API key or network.`);
    showErrorOnAllButtons();
    return "";
  }
};

const fetchSummaryOpenAI = async (prompt, apiKey) => {
    if (!apiKey) {
        return "⚠️ Please set your OpenAPI API key in the extension options.";
    }

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

        console.log('response', response);
        

        if (response.status === 401) {
            showErrorOnAllButtons("❌ Unauthorized: Invalid OpenAI API key");
            return "⚠️ Unauthorized (401): Check your OpenAI API key.";
        }

        const json = await response.json();
        return json.choices?.[0]?.message?.content?.trim() || "⚠️ No summary received.";
    } catch (err) {
        console.error("OpenAI error:", err);
        return "⚠️ Failed to fetch from OpenAI.";
    }
};

const fetchSummaryGemini = async (prompt, apiKey) => {
    if (!apiKey) {
        return "⚠️ Please set your Gemini API key in the extension options.";
    }

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

        if (response.status === 401) {
            showErrorOnAllButtons("❌ Unauthorized: Invalid Gemini API key");
            return "⚠️ Unauthorized (401): Check your Gemini API key.";
        }

        const json = await response.json();
        return json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "⚠️ No summary received.";
    } catch (err) {
        console.error("Gemini error:", err);
        return "⚠️ Failed to fetch from Gemini.";
    }
};

const showErrorOnAllButtons = () => {
  const buttons = document.querySelectorAll(".quipin-summary-btn");

  buttons.forEach((btn) => {
    btn.style.borderColor = "#f44336";
    btn.style.color = "#f44336";
    btn.title = "Error: Check your API key or network connection";

    // revert style after 3 seconds
    setTimeout(() => {
      btn.style.borderColor = "#ccc";
      btn.style.color = "";
      btn.title = "🌟 QuipIn - Summarize Post";
    }, 3000);
  });
};

const summarizePost = async (postEl) => {
    const existingSummary = postEl.querySelector(".quipin-summary-box");
    if (existingSummary) {
        existingSummary.remove();
    }

    const summaryBox = document.createElement("div");
    summaryBox.className = "quipin-summary-box";
    summaryBox.style.marginTop = "12px";
    summaryBox.style.padding = "10px";
    summaryBox.style.border = "1px solid #ccc";
    summaryBox.style.borderRadius = "6px";
    summaryBox.style.background = "#f6f7f8";
    summaryBox.style.fontSize = "14px";

    if (postEl.getAttribute("data-summarized") === "true") {
        summaryBox.innerText = "⚠️ This post has already been summarized.";
    } else {
        const subreddit = window.location.pathname.split("/")[2]; // 'r/javascript'
        const title = postEl.querySelector("h3")?.innerText || "";
        const body = postEl.innerText || "";

        const prompt = `Summarize the following Reddit post from r/${subreddit} in 2–3 sentences:\n\nTitle: ${title}\n\nContent: ${body}`;

        const summary = await fetchSummary(prompt);

        summaryBox.innerText = summary;
    }

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
