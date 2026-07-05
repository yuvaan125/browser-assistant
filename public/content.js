chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_PAGE_INFO") {
    const text = document.body.innerText;

    const words = text
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    sendResponse({
      title: document.title,
      url: window.location.href,
      selectedText: window.getSelection()?.toString() || "",
      wordCount: words.length,
      characterCount: text.length,
      readingTime: Math.max(1, Math.ceil(words.length / 200)),
    });
  }

  return true;
});