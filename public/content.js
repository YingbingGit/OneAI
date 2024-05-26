chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getScreenSize") {
    sendResponse({
      width: window.screen.width,
      height: window.screen.height,
    });
  }
});
