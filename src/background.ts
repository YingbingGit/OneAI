// Interface defining the URLs for different services
interface UrlMap {
  GEMINI: string;
  OPENAI: string;
  KIMI: string;
  DOUBAO: string;
}
// Counter for tracking popup closures
let popupCloseCount = 0;
// Flag indicating if a popup is closing
let isPopupClosing = false;
// Flag for the first session
let isFirstSession = true;

// Define the URL map
const UrlMap: UrlMap = {
  GEMINI: "https://gemini.google.com/chat",
  OPENAI: "https://chatgpt.com",
  KIMI: "https://kimi.moonshot.cn/chat",
  DOUBAO: "https://www.doubao.com/chat/",
};

const WINDOW_TAG_KEY = "__ONE_AI_WINDOW_TAG_KEY_";

// Function to open or focus a window
async function openOrFocusWindow() {
  console.log("openOrFocusWindow called");

  const popupWidth = 800;

  const currentWindow: chrome.windows.Window = await chrome.windows.getCurrent(
    {}
  );
  if (chrome.runtime.lastError) {
    console.error(
      "Error getting current window:",
      chrome.runtime.lastError.message
    );
    return;
  }

  const windows = await chrome.windows.getAll({ windowTypes: ["popup"] });
  const { source } = await chrome.storage.local.get(["source"]);
  const awin = windows.find(
    (win) =>
      win.tabs && win.tabs[0].url?.includes(UrlMap[source as keyof UrlMap])
  );

  const popupHeight = currentWindow.height;
  const left = currentWindow.width! - popupWidth;
  const top = 0;
  let windowId = (await chrome.storage.local.get([source]))[source];
  if (windowId) {
    console.log("Window ID exists, focusing window");
    const win = await chrome.windows.update(windowId, {
      left,
      top,
      width: popupWidth,
      height: popupHeight,
      focused: true,
    } as chrome.windows.UpdateInfo);
    if (chrome.runtime.lastError) {
      console.log(
        "Error focusing window:",
        (chrome.runtime.lastError as chrome.runtime.LastError).message
      );
    }
  } else {
    console.log("Creating new window");
    await createWindow(source, left, top, popupWidth, popupHeight!);
  }
}

// Function to create a new window
async function createWindow(
  source: keyof UrlMap,
  left: number,
  top: number,
  width: number,
  height: number
) {
  console.log(`Creating window at (${left}, ${top}), ${width}x${height}`);

  const url = UrlMap[source];
  const win = await chrome.windows.create({
    url,
    type: "popup",
    width,
    height,
    left,
    top,
  } as chrome.windows.CreateData);
  if (chrome.runtime.lastError) {
    console.log("Error creating window:", chrome.runtime.lastError.message);
    return;
  }
  await chrome.storage.local.set({ [source]: win.id! });
  console.log("Window created with ID:", win.id);
}
chrome.windows.onRemoved.addListener(async (removedWindowId: number) => {
  const keyToRemove = Object.entries(
    await chrome.storage.local.get(Object.keys(UrlMap))
  ).find(([key, value]) => value === removedWindowId)?.[0];
  if (keyToRemove) {
    console.log("Popup window closed");
    chrome.storage.local.remove(keyToRemove);
  }
});

// Initialization function
async function init() {
  // Listen for the extension installation event
  chrome.runtime.onInstalled.addListener(async () => {
    let { source } = await chrome.storage.local.get(["source"]);
    // Set the default value if it doesn't exist
    source = source || "GEMINI";
    ["GEMINI", "KIMI", "OPENAI", "DOUBAO"].forEach((id) => {
      chrome.contextMenus.create({
        id, // Unique identifier
        title: `${id}${id === source ? "  ✔" : ""}`, // Text displayed in the menu
        contexts: ["action"], // Context where the menu should appear (extension icon)
      });
    });
  });
  let { source } = await chrome.storage.local.get(["source"]);
  // Get "source" from local storage and set its initial value
  if (!source) {
    source = "GEMINI";
    await chrome.storage.local.set({ source });
  }
  // Set the browser action icon
  chrome.action.setIcon({ path: `images/${source.toLowerCase()}_32.png` });

  // Listen for changes in chrome.storage and update context menus and browser icon
  chrome.storage.onChanged.addListener((changes, namespace) => {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
      if (key !== "source") continue;
      // Update the old value's context menu item title
      if (oldValue) {
        chrome.contextMenus.update(oldValue, {
          title: oldValue,
        });
      }
      // Update the new value's context menu item title and add a checkmark
      if (newValue) {
        chrome.contextMenus.update(newValue, {
          title: `${newValue}  ✔`,
        });
      }
      // Update the browser action icon
      chrome.action.setIcon({
        path: `images/${newValue.toLowerCase()}_32.png`,
      });
    }
  });

  // Listen for context menu clicks and update "source" value
  chrome.contextMenus.onClicked.addListener(
    async (
      info: chrome.contextMenus.OnClickData,
      tab: chrome.tabs.Tab | undefined
    ) => {
      await chrome.storage.local.set({ source: info.menuItemId });
      await openOrFocusWindow(); // Open or focus the specific window
    }
  );

  // Listen for browser action clicks and open the window
  chrome.action.onClicked.addListener((tab: chrome.tabs.Tab) => {
    openOrFocusWindow();
  });

  // Listen for command shortcuts and open the window
  chrome.commands.onCommand.addListener((command: string) => {
    if (command === "openWindow") {
      openOrFocusWindow();
    }
  });
}

// Run the initialization function
init();
