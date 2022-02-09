(function(){
	// Encapsulated in a function to avoid namimg conflicts.

	const controller = FNF_Controller;

	// Listen for message from background.js to create form and populate values.
	chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
		const action = msg.text || '';

		console.log( 'content message', action );

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


			/*
			case 'build_form':
				console.log( msg );
				config = msg.config;
				var builder = new FNF_Form();
				builder.render( config );
				break;
			*/

			case 'gather_values':
				const values = gatherPageValues();
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


function FNF_Report( obj ) {
	this.studentName = '';
	this.documentObject = {};

	if ( obj ) {
		this.createDocumentObject( obj );
	}
}

FNF_Report.prototype = {
	createDocumentObject: function(obj) {
		var documentObject = this.documentObject = {};
		var fieldValueItem;

		documentObject.title = '';
		documentObject.body = {};
		documentObject.body.content = [];

		for(var i = 0; i < obj.fieldValue.length; i++){
			fieldValueItem = obj.fieldValue[i];
			addDocumentItem(documentObject, fieldValueItem['field'], fieldValueItem['fieldName'], fieldValueItem['value']);
			if (fieldValueItem['field'] === 'field_student_name') {
				this.studentName = fieldValueItem['value'];
			}
		}
	},

	objectToHTML: function( dataObject ) {
		var htmlString = '<html><body>';
		for (const [key, value] of Object.entries(dataObject.body.content)) {
			htmlString += '<h3 sectionId="' + replaceHtmlTags(value.tag) + '">' + replaceHtmlTags(value.header) + '</h3>';
			htmlString += '<p sectionId="' + replaceHtmlTags(value.tag) + '">' + replaceHtmlTags(value.text) + '</p>';
		}
		htmlString += '</body></html>';
		return htmlString;
	},

	createReportHtml: function() {
		return this.objectToHTML(this.documentObject);
	},

	createReportText: function() {
		const obj = this.documentObject;
		var txt = '# ' + this.reportTitle() + "\n\n";

		for (const [key, value] of Object.entries(obj.body.content)) {
			txt += '## ' + value.header + "\n";
			txt += value.text + "\n\n";
		}

		return txt;

	},

	reportTitle: function() {
		var title = googleDriveDocumentTitle + controller.getTitle();
		const today = new Date();

		if ( this.studentName ) {
			title += ' by ' + this.studentName;
		}

		title += " (" + (today.getMonth() + 1) + "-" + today.getDate() + "-" + today.getFullYear() + ")";

		return title;
	},

	createDriveFile: function() {
		const htmlToPost = this.createReportHtml();
		const documentTitle = this.reportTitle();

		const msg = {
			text: 'create_doc',
			data: htmlToPost,
			filename: documentTitle
		}

		chrome.runtime.sendMessage( msg, data => {
			if ( data.error ) {
				const errorMessage = data.error.message ? "There was an error submitting your data: " + data.error.message : "There was an unknown error submitting your data.";
				alert(errorMessage);
			}
		});
	},

	// @todo: Not used, does not work.
	download: function() {
	  const url = URL.createObjectURL( new Blob([this.createReportHtml()], {type: 'text/html'}) );
	  //const url = URL.createObjectURL( new Blob([this.documentObject()], {type: 'application/json'}) );
	  const filename = this.sanitizeFilename( this.reportTitle() ) + '.html';
	  chrome.runtime.sendMessage( { text: 'download', url, filename } );
	},

	// Based on https://gist.github.com/barbietunnie/7bc6d48a424446c44ff4
	sanitizeFilename: function( input, replacement ) {
		if ( typeof replacement === 'undefined' ) {
			replacement = '_';
		}

		const maxlength = 255;
		const illegalRe = /[\/\?<>\\:\*\|":]/g;
		const controlRe = /[\x00-\x1f\x80-\x9f]/g;
		const reservedRe = /^\.+$/;
		const windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;

	  var sanitized = input
	    .replace(illegalRe, replacement)
	    .replace(controlRe, replacement)
	    .replace(reservedRe, replacement)
	    .replace(windowsReservedRe, replacement);

		return sanitized.split("").splice(0, maxlength).join("");
	}
}

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


})();