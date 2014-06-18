function peelBackRdf(data, format) {
  $('body').prepend('<div id="target"><textarea id="code"></textarea></div>');
  $('#code').text(data);
  var cm = CodeMirror.fromTextArea($('#code')[0], {
    mode: format,
    readOnly: "nocursor",
    viewportMargin: Infinity
  });
  $('#target').fold({
    directory: "chrome-extension://" + chrome.runtime.id,
    autoCurl: true
  });
  $('#turn_wrapper').click(
    function() {
      $('#turn_fold').hide();
      $('#turn_wrapper').width('100%').height('100%').off();
      $('#turn_object').width('100%').height('100%').off();
      $('#turn_hideme').width('100%').height('100%').off();
    }
  );
}

function checkRdf(data, format) {
  var parser = new DOMParser();
  doc = parser.parseFromString(data, 'text/xml');
  try {
    var rdf = $.rdf().load(doc);
    var licenses = rdf
      .prefix('cc', 'http://creativecommons.org/ns#')
      .where('?doc cc:license ?license');
    licenses = licenses.add(
      rdf
        .prefix('dct', 'http://purl.org/dc/terms/')
        .where('?doc dct:license ?license')
    );
    if (licenses.select().length > 0) {
      return 'licensed';
    } else {
      return 'unlicensed';
    }
  } catch (e) {
    console.log(e);
    return 'error';
  }
}

var res = document.evaluate("//link[(@rel = 'alternate') or (@rel = 'meta')]", document.head, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)

var rdfUrl = null;
var rdfFormat = null;
var acceptFormats = ['application/rdf+xml', 'text/turtle'];

for (var i=0; i < res.snapshotLength; i++) {
  if (acceptFormats.indexOf(res.snapshotItem(i).type) > -1) {
    rdfFormat = res.snapshotItem(i).type;
    rdfUrl = res.snapshotItem(i).href; // relative
    break;
  }
}

if (rdfUrl == null) { // Try fetching current page as RDF
  $.ajax(document.URL, {
    headers: {
      Accept: acceptFormats.join(', ')
    },
    dataType: 'text',
    success: function(data, textStatus, res) {
      var ct = res.getResponseHeader('Content-Type');
      if (ct != null) {
        var format = null;
        for (var i = 0; i < acceptFormats.length; i++) {
          if (ct.slice(0, acceptFormats[i].length) == acceptFormats[i]) {
            format = acceptFormats[i];
            break;
          }
        }
        if (format != null) {
          peelBackRdf(data, format);
          chrome.runtime.sendMessage({
            type: format,
	    check: checkRdf(data, format)
          }, function(response) {
	    console.log(response.text);
          });
        }
      }
    }
  });
} else {
  $.ajax(rdfUrl, {
    accepts: { text: rdfFormat },
    dataType: 'text',
    success: function(data, textStatus, res) {
      peelBackRdf(data, rdfFormat);
      chrome.runtime.sendMessage({
        type: format,
        check: checkRdf(data, rdfFormat)
      }, function(response) {
        console.log(response.text);
      });
    }
  });
}
