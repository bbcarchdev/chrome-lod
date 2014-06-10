function peelBackRdf(data) {
  $('body').prepend('<div id="target"><textarea id="code"></textarea></div>');
  $('#code').text(data);
  var cm = CodeMirror.fromTextArea($('#code')[0], {
    mode: "xml",
    readOnly: "nocursor"      
  });
  $('#target').fold({
    directory: "chrome-extension://" + chrome.runtime.id
  });
}

var res = document.evaluate("//link[(@rel = 'alternate') or (@rel = 'meta')]", document.head, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)

var rdfUrl = null;

for (var i=0; i < res.snapshotLength; i++) {
  if (res.snapshotItem(i).type == "application/rdf+xml") {
    console.log("Found link rel=(alternate|meta) type=application/rdf+xml");
    rdfUrl = res.snapshotItem(i).href; // relative
    chrome.runtime.sendMessage({type: 'rdf+xml'}, function(response) {
      console.log(response.text);
    });
    break;
  }
}

if (rdfUrl == null) { // Try fetching current page as RDF
  $.ajax(document.URL, {
    accepts: { text: 'application/rdf+xml' },
    dataType: 'text',
    success: function(data, textStatus, res) {
      var ct = res.getResponseHeader('Content-Type');
      if ((ct != null) && (ct.slice(0, 'application/rdf+xml'.length) == 'application/rdf+xml')) {
        chrome.runtime.sendMessage({type: 'rdf+xml'}, function(response) {
          console.log(response.text);
        });
        peelBackRdf(data);
      }
    }
  });
} else {
  $.ajax(rdfUrl, {
    accepts: { text: 'application/rdf+xml' },
    dataType: 'text',
    success: function(data, textStatus, res) {
      peelBackRdf(data);
    }
  });
}
