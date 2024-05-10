const windowIdMap = new Map();
let popupCloseCount = 0;
let isPopupClosing = false;
let isFirstSession = true;

const UrlMap = {
  GEMINI: "https://gemini.google.com/chat",
  OPENAI: "https://chatgpt.com",
  KIMI: "https://kimi.moonshot.cn/chat",
  DOUBAO: "https://www.doubao.com/chat/",
};

// Updated openOrFocusWindow function with maximum height for the popup
async function openOrFocusWindow() {
  console.log("openOrFocusWindow called");

  const popupWidth = 800;

  const currentWindow = await chrome.windows.getCurrent({});
  if (chrome.runtime.lastError) {
    console.error(
      "Error getting current window:",
      chrome.runtime.lastError.message
    );
    return;
  }

  // Use the current window's height for the popup
  const popupHeight = currentWindow.height;

  // Calculate the position of the popup
  const left = currentWindow.width - popupWidth;
  const top = 0;
  const { source } = await chrome.storage.local.get(["source"]);
  let windowId = windowIdMap.get(source);
  if (windowId) {
    console.log("Window ID exists, focusing window");
    const win = await chrome.windows.update(windowId, {
      left: left,
      top: top,
      width: popupWidth,
      height: popupHeight,
      focused: true,
    });
    if (chrome.runtime.lastError) {
      console.log("Error focusing window:", chrome.runtime.lastError.message);
    }
  } else {
    console.log("Creating new window");
    await createWindow(source, left, top, popupWidth, popupHeight);
  }
}

async function createWindow(source, left, top, width, height) {
  console.log(`Creating window at (${left}, ${top}), ${width}x${height}`);

  const url = UrlMap[source || "KIMI"];
  const win = await chrome.windows.create({
    url: url,
    type: "popup",
    width: width,
    height: height,
    left: left,
    top: top,
  });
  if (chrome.runtime.lastError) {
    console.log("Error creating window:", chrome.runtime.lastError.message);
    return;
  }
  windowIdMap.set(source, win.id);
  console.log("Window created with ID:", win.id);
}

// Listener for popup window closure
chrome.windows.onRemoved.addListener((removedWindowId) => {
  const keyToRemove = [...windowIdMap.entries()].find(
    ([key, value]) => value === removedWindowId 
  )?.[0];

  if (keyToRemove) {
    console.log("Popup window closed");
    windowIdMap.delete(keyToRemove);
  }
});

chrome.action.onClicked.addListener((tab) => {
  openOrFocusWindow();
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "openWindow") {
    openOrFocusWindow();
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  const { source } = await chrome.storage.local.get(["source"]);
  ["GEMINI", "KIMI", "OPENAI", "DOUBAO"].forEach((id) => {
    chrome.contextMenus.create({
      id, // Unique identifier
      title: `${id}${id === source ? "  ✔" : ""}`, // Text displayed in the menu
      contexts: ["action"], // Where the menu should appear (action = extension icon)
    });
  });
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    if (key !== "source") return;
    chrome.contextMenus.update(oldValue, {
      title: oldValue,
    });
    chrome.contextMenus.update(newValue, {
      title: `${newValue}  ✔`,
    });
    chrome.action.setIcon({ path: `images/${newValue.toLowerCase()}_32.png` });
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  await chrome.storage.local.set({ source: info.menuItemId });
  await openOrFocusWindow();
});

async function init() {
  let { source } = await chrome.storage.local.get(["source"]);
  // Set the initial value.
  if (!source) {
    source = "GEMINI";
    await chrome.storage.local.set({ source });
  }
  chrome.action.setIcon({ path: `images/${source.toLowerCase()}_32.png` });
}

init();
