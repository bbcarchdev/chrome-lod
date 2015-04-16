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
  // TODO: use a different library so we can parse different RDF formats.
  var doc = parser.parseFromString(data, 'text/xml');
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
  var onFail = $.noop;
  if (typeof failFunc == 'function') {
    onFail = failFunc;
  }
  $.ajax(rdfUrl, {
    headers: {
      Accept: acceptFormats.join(', '),
      'Cache-Control': 'no-cache'
    },
    dataType: 'text',
    error: function(req, textStatus, errorThrown) {
      onFail();
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
        for (var dodgyFormat in dodgyFormats) {
          if (ct.slice(0, dodgyFormat.length) == dodgyFormat) {
            format = dodgyFormats[dodgyFormat];
            console.log("Dodgy content type: " + dodgyFormat);
            break;
          }
        }
        if (format != null) {
          peelBackRdf(data, format);
          console.log("baseURI: " + data.baseURI);
          chrome.runtime.sendMessage({
            method: 'setLicense',
            type: format,
	    check: checkRdfXmlLicense(data, format)
          }, function(response) {
	    console.log(response.text);
          });
        } else {
          onFail();
        }
      } else {
        onFail();
      }
    }
  });
}

function checkRdfa(failFunc) {
  var onFail = $.noop;
  if (typeof failFunc == 'function') {
    onFail = failFunc;
  }
  var localdata = $(document.body).rdf();
  if (localdata.databank.size() > 0) {
    // Serialize it out as RDF/XML
    var format = "application/rdf+xml";
    var dom = localdata.databank.dump({format: format});
    var serializer = new XMLSerializer();
    var data = vkbeautify.xml(serializer.serializeToString(dom));
    peelBackRdf(data, format);
    chrome.runtime.sendMessage({
      method: 'setLicense',
      type: format,
      check: checkRdfXmlLicense(data, format)
    }, function(response) {
      console.log(response.text);
    });
  } else {
    onFail();
  }
}

var res = document.evaluate("//link[(@rel = 'alternate') or (@rel = 'meta')]", document.head, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)

var rdfUrl = null;
var rdfFormat = null;
var acceptFormats = ['application/rdf+xml', 'text/turtle', 'text/n3'];
var dodgyFormats = {'text/rdf+n3': 'text/n3'};

for (var i=0; i < res.snapshotLength; i++) {
  if (acceptFormats.indexOf(res.snapshotItem(i).type) > -1) {
    rdfFormat = res.snapshotItem(i).type;
    rdfUrl = res.snapshotItem(i).href; // relative
    break;
  }
}

if (rdfUrl != null) {
  // Got a <link> to some RDF, so fetch it
  fetchRdf(rdfUrl);
} else {
  // No link URL.
  // Check to see whether we've been redirected here
  chrome.runtime.sendMessage({
    method: 'isRedirect',
    url: document.URL
  }, function(response) {
    if (response.redirect) {
      // Redirected here, so try fetch RDF from previous URL to see if it was a
      // content negotiation redirect.
      fetchRdf(response.fromUrl, function() { // failed, so fallback to trying current page
        fetchRdf(document.URL, checkRdfa); // and if that failed, look for RDFa
      });
    } else { // if no redirect, try fetching current page as RDF
      fetchRdf(document.URL, checkRdfa); // and if that failed, look for RDFa
    }
  });
}
