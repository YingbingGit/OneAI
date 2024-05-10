console.log("Content script loaded");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Received message in content script:", message);
    if (message.action === "getScreenSize") {
        sendResponse({
            width: window.screen.width,
            height: window.screen.height
        });
    }
});
