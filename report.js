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

	objectToHTML: function( dataObject ) {
		var htmlString = '<html><body>';

		var dom = _create( 'div' );

		for (const [key, data] of Object.entries( dataObject )) {
			var header = _create( 'h3', data.field.id, dom );
			header.textContent = data.field.config.label;

			var content = _create( 'p', '', dom );
			content.textContent = data.value;

		}

		htmlString += dom.innerHTML;
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