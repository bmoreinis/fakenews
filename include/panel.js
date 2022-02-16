var formdata;

// This executes once the frame page has loaded. The background script is notified and in turn notifies the content.js
// to parse the page and send the field config and values back to here to the form builder class.
chrome.runtime.sendMessage( { text: 'frame_loaded' }, response => {
	formdata = response;
	var builder = new FNF_Form( document.getElementById( 'content' ) );
	builder.render( formdata.config, formdata.values );

	// Send separate message to gather WHOIS data after form rendered:
	chrome.runtime.sendMessage( { text: 'whois', domain: formdata.values.dn }, response => {
		builder.setFieldValue( 'whois', response );
	});

});

