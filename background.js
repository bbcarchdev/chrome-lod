chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log("Message from content: " + request.method);
    if (request.method == 'setLicense') {
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
    } else if (request.method == 'isRedirect') {
      if (request.url == redirectList[redirectList.length - 1]) {
        sendResponse({redirect: true,
                      fromUrl: redirectList[0]});
      } else {
        sendResponse({redirect: false});
      }
    }
  }
);

redirectId = null;
redirectList = [];

chrome.webRequest.onBeforeRedirect.addListener(
  function(details) {
    if (details.requestId != redirectId) {
      redirectId = details.requestId;
      redirectList = [details.url];
      console.log("redirect start, " + details.url);
    }
    if (details.redirectUrl != null) {
      console.log("redirect to " + details.redirectUrl);
      redirectList.push(details.redirectUrl);
    }
  },
  {urls: ["<all_urls>"]}
);
