(function(){

function _create( type, id, parent ) {
	const el = document.createElement( type );
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
	this.pageTitle = '';
	this.documentObject = {};

	if ( obj ) {
		if ( obj.studentName ) {
			this.studentName = obj.studentName.value;
		}

		if ( obj.pageTitle ) {
			this.pageTitle = obj.pageTitle.value;
		}

		this.documentObject = obj;
		//this.createDocumentObject( obj );
	}
}

FNF_Report.prototype = {

	reportTitlePrefix: 'FNF - ',

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

	objectToHTML: function( dataObject, title ) {
		var htmlString = '<html><body>';

		var dom = _create( 'div' );

		if ( title ) {
			const titleEl = _create( 'h1', '', dom );
			titleEl.textContent = title;
		}

		for (const [key, data] of Object.entries( dataObject )) {
			var header = _create( 'h3', data.field.id, dom );
			header.textContent = data.field.config.label;

			if ( Array.isArray( data.value ) ) {
				var container = _create( 'div', '', dom );
				var content = _create( 'ul', '', container );
				data.value.forEach( v => {
					var item = _create( 'li', '', content );
					item.textContent = v;					
				});
			} else {
				var content = _create( 'p', '', dom );
				content.textContent = data.value;
			}

		}

		htmlString += dom.innerHTML;
		htmlString += '</body></html>';
		return htmlString;
	},

	createReportHtml: function( withTitle ) {
		var title = withTitle ? this.reportTitle() : '';
		return this.objectToHTML(this.documentObject, title );
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
		var title = this.reportTitlePrefix + ( this.pageTitle || '(Unknown page title)' );
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

	createCopyPopup: function() {
		const html = this.createReportHtml( true );
		return this.createPopup( html );
	},

	ui: {},

	createPopup: function ( contents ) {

		// Create and reuse elements.
		if ( ! this.ui.popup ) {

			var popup = _create( 'div', 'FakeNewsPopup' );

			// Close button
			var close = _create( 'button', 'FakeNewsPopupCloseButton', popup );
			close.innerHTML = '&times;';

			var header = _create( 'div', 'FakeNewsPopupHeader', popup );

			// Copy button
			var copy = _create( 'button', 'FakeNewsPopupCopyButton', header );
			copy.textContent = 'Copy report to clipboard';

			// Contents
			var content = _create( 'div', 'FakeNewsPopupContent', popup );

			close.addEventListener( 'click', e => {
				e.preventDefault();
				popup.parentNode.removeChild( popup );
				content.innerHTML = '';
			});

			copy.addEventListener( 'click', e => {

				if ( navigator.clipboard ) {
					// Clipboard API on secure pages
					const type = 'text/html';
					const blob = new Blob( [content.innerHTML], { type });
					const data = [ new ClipboardItem({ [type]: blob }) ];

					var tooltip = new FNF_Tooltip( copy );
					navigator.clipboard.write( data ).then(
						e => {
							tooltip
								.setMessage( 'Success! You may now paste into a Document.' )
								.animate( true );
						},
						e => {
							console.log( e );
							tooltip.setMessage( 'Oops! Something went wrong.' )
								.animate( true );
						}
					);

				} else {
					// OG Copy command API
					var sel = window.getSelection();
					range = document.createRange();
					range.selectNodeContents( content );
					sel.removeAllRanges();
					sel.addRange( range );

					// HTML support, from https://stackoverflow.com/questions/23934656/javascript-copy-rich-text-contents-to-clipboard
					function copyListener(e) {
						e.clipboardData.setData( 'text/html', content.innerHTML );
						e.preventDefault();
					}

					document.addEventListener( 'copy', copyListener );
					document.execCommand( 'copy' );
					document.removeEventListener( 'copy', copyListener );
				}
			});

			this.ui.popup = popup;
			this.ui.popupcontent = content;
		}

		this.ui.popupcontent.innerHTML = contents;
		return this.ui.popup;
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

window.FNF_Report = FNF_Report;

})();