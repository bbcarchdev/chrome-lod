Chrome LOD extension
====================

An extension for Chrome that looks for the presence of Linked Open
Data behind the pages you browse and if available, reveals the
underlying data.

Debugging/Building
------------------

In Chrome, open the tools/extensions page, ensure that developer mode
is selected, and click to 'load unpacked extension...'.  Select the
directory you checked out the chrome-lod source to.  This should
enable the extension directly.

In order to package the extension for deployment, use the 'pack
extension' button, which will result in a chrome-lod.crx file and
associated keyfile.

Rationale
---------

The extension runs once on each page you visit looking for any RDF
data it can find in the following order:

1) Any <link> tags in the page with relationship 'meta' or 'alternate'
pointing to a URI with media-type application/rdf+xml, text/turtle or
text/n3.

2) If the page you're visiting is the result of a redirect, then try
to GET the previous page using content negotiation asking for an
application/rdf+xml, text/turtle or text/n3 representation, following
any further redirects.

3) Just use content negotiation on the current URI, again asking for
RDF and following any redirects.

If an RDF representation is available, it will be rendered behind the
current page and a peel-back animation will reveal the background RDF
data as the mouse hovers over the top left corner of the page.

A limited check will be done to find out whether there is any machine
readable license about the published RDF document.

Finally, a traffic light is rendered in the right of the omnibox to
give an indication of conformance of the underlying linked (open)
data.

Examples to try
---------------

http://sws.geonames.org/3020251/

http://data.nytimes.com/48675831753778135041

http://collection.britishmuseum.org/id/object/EOC3130

http://data.ordnancesurvey.co.uk/datasets/os-linked-data

http://id.loc.gov/vocabulary/organizations/ukmajru.html

http://beta.acropolis.org.uk/79a5f7dd9c284e1193e94797fbf2f90f

http://live.dbpedia.org/page/William_Shakespeare

http://data.europeana.eu/item/92056/BD9D5C6C6B02248F187238E9D7CC09EAF17BEA59


Todo
----

Parsing Turtle to look for licensing statements.

Checking that the license applies to the document URI of the RDF document.

Checking what license is being applied and that it is usable.