chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log("Message from content: " + request);
    var messages = {
      'error': 'Error parsing RDF',
      'unlicensed': 'No machine readable licensing',
      'licensed': 'License declared'
    };
    chrome.pageAction.setTitle({
      tabId: sender.tab.id,
      title: messages[request.check]
    });
    var icon = {
      'error': 'red',
      'unlicensed': 'amber',
      'licensed': 'green'
    };
    chrome.pageAction.show(sender.tab.id);
    chrome.pageAction.setIcon({
      tabId: sender.tab.id,
      path: 'pageIcon-' + icon[request.check] + '.png'
    });
    sendResponse({text: "ok"});
  }
);
