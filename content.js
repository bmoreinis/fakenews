(function(){
// Encapsulated in a function to avoid namimg conflicts.

// Listen for message from background.js to create form and populate values.
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
	const action = msg.text || '';

	//console.log( 'content message', action );

	switch( action ) {

		// User has clicked on the FNF icon. Add the frame to the page.
		case 'add_frame':
			var container = _create( 'div', 'FakeNewsContainer' );
			var iframe = _create( 'iframe', 'FakeNewsFrame', container );
			iframe.src = msg.src;
			iframe.frameBorder = '0';

			var button = _create( 'button', 'FakeNewsFrameToggle', container );
			button.textContent = 'Toggle';
			button.addEventListener( 'click', function(){
				var d = 'data-fnf-closed';
				container.setAttribute( d, container.getAttribute( d )  ? '' : 1 );
			});

			document.body.appendChild( container );
			break;

		case 'gather_values':
			const values = gatherPageValues();
			// @todo: Separate WHOIS response from page values to speed form load time.
			chrome.runtime.sendMessage({ text: 'whois', domain: document.location.hostname }, whois => {
				values.whois = whois;
				sendResponse( values );
			});
			return true;
			break;

		case 'close_frame':
			var el = document.getElementById( 'FakeNewsContainer' );
			if ( el ) {
				var msg = 'This will close the panel and lose any changes.\n\nAre you sure?';
				if ( confirm( msg ) ) {
					el.parentNode.removeChild( el );
				}
			}
			break;

		case 'copypaste':


			break;
	}

});

function _create( type, id, parent ) {
	var el = document.createElement( type );
	if ( id ) {
		el.id = id;
	}

	if ( parent ) {
		parent.appendChild( el );
	}

	return el;
}

function createPopup( contents ) {
	var container = _create( 'div', 'FakeNewsPopupOverlay' );

	var wrap = _create( 'div', 'FakeNewsPopup', container );
	var el = _create( 'div', '', wrap );
	// Close button
	// Copy button

	// Contents

	el.innerHTML = contents;
	document.body.appendChild( container );
}

createPopup( 'text' );


function gatherPageValues() {
	const jsonLd = controller.getJsonLd();
	const author = controller.getAuthorLink(jsonLd);
	const values = {
		url: controller.getURL(),
		pageTitle: controller.getTitle(),
		pageArticle: controller.getArticle(),
		dn: controller.domainFinder(),
		tld: controller.tldParser(),
		modifiedDate: controller.dateFinder(jsonLd),
		articleAuthor: author.name,
		articleAuthorLink: author.link,
		pageType: controller.getJsonLdValue(jsonLd,"@type"),
		allLinks: controller.linkFinder(),
		aboutLinks: controller.aboutFinder(),
		whois: [] // controller.getWhois()
	};

	return values;
}

// ## Controller ##

//flow controller revealing module - contains various page parsing methods

// get domain from active tab
function getURL() {
	var href = window.location.href.split('?');
	return href[0];
}

function domainFinder() {
	return window.location.host.split('.').slice( -2 ).join('.');
}

// extract tld from url of active tab
function tldParser() {
	return window.location.host.split('.').slice( -1 );
}

// extract <title> from HTML
function getTitle () {
	var title = document.getElementsByTagName("title");
	if (title.length == 0) {
		return "No <title> tag found. Not trustworthy.";
	} else {
		return title[0].innerText;
	}
}

// extract json-ld from HTML
function getJsonLd () {
	var returnValue = ''
	const jsonLdString = document.querySelectorAll('script[type="application/ld+json"]');
	if (jsonLdString.length > 0) {
    returnValue = JSON.parse(jsonLdString[0].text);
} else {
		returnValue = {};
}
	return returnValue;
}

function getJsonLdValue(jsonLd, field, subfield = null) {
	if (field in jsonLd) {
		const fieldValue = jsonLd[field];
		if (subfield) {
			if (fieldValue.length) {
				return fieldValue[0][subfield];
			} else {
				return fieldValue[subfield];
			}
		} else {
			return fieldValue;
		}
	} else {
		return '';
	}
}



// extract author link from jsonLd
function getAuthorLink (jsonLd) {
	return {
		name: getJsonLdValue(jsonLd, "author", "name"),
		link: getJsonLdValue(jsonLd, "author", "url")
	};
}

// extract first <h1> from HTML
function getArticle () {
	var article = document.getElementsByTagName("h1")
	if (article.length == 0) {
		return "No <h1> found. Paste Headline here.";
	} else {
		var areturn = article[0].innerText;
		return areturn;
	}
}

// search document.body for ABOUT US or similar in menu lists
function aboutFinder () {
	var aboutItems = document.getElementsByTagName("a");
	var aboutLinks = [];
	var aboutMax = aboutItems.length;
	for (var a = 0; a < aboutMax; a++) {
		var match = aboutItems[a].href.match(/((A|a)bout(.+)(U|u)s)/);
		if (match) {
		  var baseToCheck = aboutItems[a].href.split("/")[2].split(".");
		  if (baseToCheck.length === 3) {
			var domainToCheck = baseToCheck[1]+"."+baseToCheck[2];
		  }
		  else {
			var domainToCheck = baseToCheck[0]+"."+baseToCheck[1];
		  }
		  //check that link is inside of this domain
		  if (controller.domainFinder() == domainToCheck) {
			aboutLinks.push(aboutItems[a].href);
		  }
		}
	}
	if (aboutLinks.length == 0) {
		return "";
	} else {
	//Drupal is set up to handle only one link here.. So we will pick the first one found
		return aboutLinks[0];
	}
}

// search document.body for posted date above or below body
function dateFinder (jsonLd) {
	var theDate = getJsonLdValue(jsonLd, "dateModified") || getJsonLdValue(jsonLd, "datePublished");

	if ( theDate ) {
		return formatDate( new Date(theDate) );
	}

	// What is the real definition of dynamically created?
	var modifiedDate = new Date(document.lastModified);
	var maxAge = 3600 * 24 * 1000; // 1 day in milliseconds
	if ( Math.abs( Date.now() - modifiedDate.getTime() ) > maxAge ) {
		return formatDate( modifiedDate );
	}

	//If modifiedDate doesn't work, search page for updated, posted, revised, modified + date
	var bodyDates = document.body.innerText.match(/((((U|u)pdated)|((P|p)osted)|((R|r)evised)|((M|m)odified))( |: | on )(\d{1,2})(-|\/)(\d{1,2})(-|\/)(\d{4}))|(\d{1,2})(-|\/)(\d{1,2})(-|\/)(\d{4})/);
	//Check that we found anything
	if (bodyDates) {
		return bodyDates.toString();
	} else {
		return 'No dates found.  Enter if you find one.';
	}
}

function formatDate( theDate ) {
	return theDate.toDateString();
}

// lists all links within body of page
function linkFinder () {
	var linkList = [];
	var link;
	var article = '';
	var articleElements = document.getElementsByTagName("article");
	if (articleElements.length != 0) {
		article = articleElements[0];
	} else {
		articleElements = document.getElementsByTagName("div");
		for (var i = 0; i < articleElements.length; i++) {
			if (articleElements[i].getAttribute('id') === 'content') {
				article = articleElements[i];
			}
		}
	}
	if (article) {
		const allLinks = article.getElementsByTagName('a');
		for (var i = 0; i < allLinks.length; i++) {
			link = allLinks[i].getAttribute('href');
			if (link && link.indexOf('http') === 0 &&
				!checkSelfReferralLink(link) &&
				!checkSocialPostLink(link)) {
				linkList.push(link);
			}
		}
	}
	return linkList;
};

function checkSocialPostLink(link) {
	const socialPostUrls = [
		'https://www.facebook.com/dialog/feed',
		'https://api.whatsapp.com/send',
		'https://twitter.com/intent/tweet',
		'https://www.linkedin.com/shareArticle',
		'https://pinterest.com/pin/create'
	];
	for (var i = 0; i < socialPostUrls.length; i++) {
		if (link.indexOf(socialPostUrls[i]) === 0) {
			return true;
		}
	}
	return false;
}

function checkSelfReferralLink(link) {
	var baseToCheck = link.split("/")[2].split(".");
	if (baseToCheck.length === 3) {
		var domainToCheck = baseToCheck[1]+"."+baseToCheck[2];
	}
	else {
		var domainToCheck = baseToCheck[0]+"."+baseToCheck[1];
	}
	//check that link is a source e.g. outside of this domain
	return controller.domainFinder() === domainToCheck;
}

// does something like http://smallseotools.com/backlink-checker/
function backlinkCounter () {
	//insert fxn here
}

//return public methods MBM1
const controller = {
	getURL : getURL,
	domainFinder : domainFinder,
	tldParser : tldParser,
	linkFinder : linkFinder,
	dateFinder : dateFinder,
	getTitle : getTitle,
	getArticle : getArticle,
	getAuthorLink: getAuthorLink,
	getJsonLdValue: getJsonLdValue,
	getJsonLd: getJsonLd,
	aboutFinder : aboutFinder
};

})();