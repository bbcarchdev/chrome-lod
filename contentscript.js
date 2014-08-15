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
      if ($('#turn_fold').is(':visible')) {
        $('#turn_fold').hide();
        $('#turn_wrapper').width('100%').height('100%').off();
        $('#turn_object').width('100%').height('100%').off();
        $('#turn_hideme').width('100%').height('100%').off();
      }/* else {
        $('#turn_fold').show();
        $('#turn_wrapper').width('80px').height('80px');
        $('#turn_object').width('80px').height('80px');
        $('#turn_hideme').width('85px').height('85px');
      } */
    }
  );
}

$.typedValue.types['http://www.w3.org/2001/XMLSchema#positiveInteger'] = {
    regex: /^[1-9][0-9]*$/,
    strip: true,
    /** @ignore */
    value: function (v) {
      return parseInt(v, 10);
    }
  };

$.typedValue.types['http://www.w3.org/2001/XMLSchema#nonNegativeInteger'] = {
    regex: /^(-0)|(\+?[0-9]+)$/,
    strip: true,
    /** @ignore */
    value: function (v) {
      return parseInt(v, 10);
    }
  };


function checkRdfXmlLicense(data, format) {
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

function fetchRdf(rdfUrl, failfunc) {
  $.ajax(rdfUrl, {
    headers: {
      Accept: acceptFormats.join(', '),
      'Cache-Control': 'no-cache'
    },
    dataType: 'text',
    error: function(req, textStatus, errorThrown) {
      failfunc();
    },
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
            method: 'setLicense',
            type: format,
	    check: checkRdfXmlLicense(data, format)
          }, function(response) {
	    console.log(response.text);
          });
        } else {
          failfunc();
        }
      } else {
        failfunc();
      }
    }
  });
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

if (rdfUrl == null) {
  // check to see whether we've been redirected here
  chrome.runtime.sendMessage({
    method: 'isRedirect',
    url: document.URL
  }, function(response) {
    if (response.redirect) {
      fetchRdf(response.fromUrl, function() {
        fetchRdf(document.URL, function() {}); // if failed to fetch prior page as RDF
      });
    } else { // if no redirect, try fetching current page as RDF
      fetchRdf(document.URL, function() {});
    }
  });
} else {
  fetchRdf(rdfUrl, function() {});
}
