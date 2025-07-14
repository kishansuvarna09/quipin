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

const fetchSuggestion = async (prompt) => {
  const { apiKey, selectedModel } = await loadPreferences();

  if (!apiKey) return "";

  try {
    if (selectedModel === "gemini") {
      return await fetchSuggestionGemini(prompt, apiKey);
    } else {
      return await fetchSuggestionOpenAI(prompt, apiKey);
    }
  } catch (err) {
    console.error(`${selectedModel.toUpperCase()} error:`, err);
    alert(`Failed to fetch from ${selectedModel.toUpperCase()}. Check API key or network.`);
    showErrorOnAllButtons();
    return "";
  }
};

const fetchSuggestionOpenAI = async (prompt, apiKey) => {
  if (!apiKey) {
        alert("Please set your OpenAI API key in the extension options.");
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
              content:
                "You are an assistant that writes replies to LinkedIn posts. Use a human tone, same language, be concise and original. No hashtags. Add relevant value or thoughts. You may greet the author if it's a natural person.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 256,
          temperature: 1,
          top_p: 0.7,
          frequency_penalty: 2,
          presence_penalty: 2,
        }),
      });

      if (response.status === 401) {
          showErrorOnAllButtons("❌ Unauthorized: Invalid OpenAI API key");
          return "⚠️ Unauthorized (401): Check your OpenAI API key.";
      }

      const json = await response.json();
      return json.choices?.[0]?.message?.content?.trim() || "⚠️ No reply received.";
    } catch (err) {
        console.error("OpenAI error:", err);
        return "⚠️ Failed to fetch from OpenAI.";
    }
};

const fetchSuggestionGemini = async (prompt, apiKey) => {
  if (!apiKey) {
      alert("Please set your Gemini API key in the extension options.");
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text:
                    "You are an assistant, that writes replies to LinkedIn posts to other persons. Use the same language as of the text of the post you are recieving in the user's prompt. Please sound like a human being. Don't use hashtags, use emojis occasionally, don't repeat too many of the exact words, but simply create a brief and positive reply.  Maybe add something to the discussion. Be creative! You may mention the name of the author, if it's the name of a natural person. Don't mention the name if it's the name of a company or a LinkedIn group. Reply to the following:\n\n" +
                    prompt,
                },
              ],
            },
          ],
        }),
      }
    );

    if (response.status === 401) {
        showErrorOnAllButtons("❌ Unauthorized: Invalid Gemini API key");
        return "⚠️ Unauthorized (401): Check your Gemini API key.";
    }

    const json = await response.json();
    return json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "⚠️ No reply received.";
  } catch (err) {
      console.error("Gemini error:", err);
      return "⚠️ Failed to fetch from Gemini.";
  }
};

const showErrorOnAllButtons = () => {
  const buttons = document.querySelectorAll("button[title='Get QuipIn suggestion']");

  buttons.forEach((btn) => {
    btn.style.borderColor = "#f44336";
    btn.style.color = "#f44336";
    btn.title = "Error: Check your API key or network connection";

    // revert style after 3 seconds
    setTimeout(() => {
      btn.style.borderColor = "";
      btn.style.color = "";
      btn.title = "Get QuipIn suggestion";
    }, 3000);
  });
};

const addSuggestionButton = (commentBox) => {
  const button = document.createElement("button");
  button.classList.add(
    "artdeco-button",
    "artdeco-button--muted",
    "artdeco-button--tertiary",
    "artdeco-button--circle"
  );
  button.type = "button";
  const originalTitle = "Get QuipIn suggestion";
  button.title = originalTitle;

  const bulbIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-lightbulb-fill" viewBox="0 0 16 16">
      <path d="M2 6a6 6 0 1 1 10.174 4.31c-.203.196-.359.4-.453.619l-.762 1.769A.5.5 0 0 1 10.5 13h-5a.5.5 0 0 1-.46-.302l-.761-1.77a2 2 0 0 0-.453-.618A5.98 5.98 0 0 1 2 6m3 8.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1l-.224.447a1 1 0 0 1-.894.553H6.618a1 1 0 0 1-.894-.553L5.5 15a.5.5 0 0 1-.5-.5"/>
    </svg>`;
  const spinnerIcon = `
    <svg class="quipin-spinner" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path fill="currentColor" d="M8 3a.5.5 0 0 1 .5-.5h.832a.5.5 0 0 1 .48.364 5.5 5.5 0 1 1-6.577 6.577.5.5 0 0 1 .364-.48V8.5a.5.5 0 0 1 .5-.5H8Z">
        <animateTransform attributeName="transform" type="rotate" from="0 8 8" to="360 8 8" dur="0.75s" repeatCount="indefinite"/>
      </path>
    </svg>`;

  button.innerHTML = bulbIcon;

  button.addEventListener("click", async () => {
    button.disabled = true;
    button.innerHTML = spinnerIcon;
    button.title = "Generating QuipIn suggestion...";

    const suggestion = await fetchSuggestion(createPrompt(commentBox));

    button.disabled = false;
    button.innerHTML = bulbIcon;
    button.title = originalTitle;

    if (suggestion) {
      commentBox.querySelector(".ql-editor").innerHTML = `<p>${suggestion}</p>`;
    }
  });

  const editorDiv = commentBox.querySelector(".comments-comment-box-comment__text-editor");
  if (
    editorDiv &&
    editorDiv.nextElementSibling &&
    editorDiv.nextElementSibling.firstElementChild
  ) {
    const firstChildDiv = editorDiv.nextElementSibling.firstElementChild;
    firstChildDiv.insertBefore(button, firstChildDiv.firstChild);
  }
};

const createPrompt = (commentBox) => {
  const post =
    commentBox.closest(".feed-shared-update-v2") ||
    commentBox.closest(".reusable-search__result-container");

  const author = post.querySelector(
    ".update-components-actor__name .visually-hidden"
  )?.innerText;
  const text = post.querySelector(
    ".feed-shared-inline-show-more-text"
  )?.innerText;

  let prompt = `${author}" wrote: ${text}`;

  const commentElement = commentBox.closest(".comments-comment-item");
  const commentAuthor = commentElement?.querySelector(
    ".comments-post-meta__name-text .visually-hidden"
  )?.innerText;
  const commentText = commentElement?.querySelector(
    ".comments-comment-item__main-content"
  )?.innerText;

  if (commentElement) {
    prompt += `\n${commentAuthor} replied: ${commentText}\nPlease write a reply to the reply with a maximum of 20 words.`;
  } else {
    prompt += `\nPlease write a reply to this post with a maximum of 40 words.`;
  }

  return prompt;
};

const observer = new MutationObserver(() => {
  Array.from(document.getElementsByClassName("comments-comment-texteditor"))
    .filter((commentBox) => !commentBox.hasAttribute("data-mutated"))
    .forEach((commentBox) => {
      commentBox.setAttribute("data-mutated", "true");
      addSuggestionButton(commentBox);
    });
});

observer.observe(document.body, { childList: true, subtree: true });