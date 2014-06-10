chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log("Message from content: " + request);
    chrome.pageAction.show(sender.tab.id);
    sendResponse({text: "ok"});
  }
);
