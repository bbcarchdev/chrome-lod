chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log("Message from content: " + request);
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
      if (request.url == redirectToUrl) {
        sendResponse({redirect: true,
                      fromUrl: redirectFromUrl});
      } else {
        sendResponse({redirect: false});
      }
    }
  }
);

redirectToUrl = null;
redirectFromUrl = null;

chrome.webRequest.onBeforeRedirect.addListener(
  function(details) {
    if (details.statusCode == 303) {
      console.log(details.url + " is being redirected to " + details.redirectUrl);
      redirectToUrl = details.redirectUrl;
      redirectFromUrl = details.url;
    }
    console.log("redirect");
  },
  {urls: ["<all_urls>"]}
);
