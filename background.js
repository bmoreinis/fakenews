chrome.runtime.onMessage.addListener(function (msg, sender, response) {
  // First, validate the message's structure
  if (msg.text == 'download') {
	  console.log('received message');
	  let doc = URL.createObjectURL( new Blob([msg.downloadData], {type: 'application/json'}) );
	  let filename = 'FNdata.json';
	  console.log(doc);
	  chrome.downloads.download({ url: doc, filename: filename, conflictAction: 'overwrite', saveAs: true });
  }
});

// Now users updated function signature as of 25 Feb 2019
// See: https://developer.chrome.com/extensions/browserAction#event-onClicked
chrome.action.onClicked.addListener(function(tab) {
	getGoogleDriveToken().then(
	  fetch('/config.json').then(response => {
		  return response.json();
	  }).then(function(config) {
	  	return whoisLookup( tab.url, config );
	  }).then( data => {
			var msg = {
				text:'build_form_filled',
				whois: formatWhois( data.whois ),
				config: data.config,
				googleDriveAPIToken: googleDriveAPIToken
			};

			chrome.tabs.sendMessage(tab.id, msg, null);
		})
	);
});

async function getGoogleDriveToken() {
	chrome.identity.getAuthToken({interactive: true}, function(token) {
		googleDriveAPIToken = token;
		console.log('got the token', googleDriveAPIToken);
	})
}

function whoisLookup( tab_url, config ) {
	var url = new URL(tab_url);
	var esc_domain = encodeURIComponent( url.hostname );
	var lookup_url = 'https://fnf.deltafactory.net/?q=' + esc_domain;

	return fetch( lookup_url ).then( response => {
		return response.json();
	}).then( response => {
		return { whois: response, config };
	}).catch( err => {
		console.log("There was an error with the whois fetch: " + err);
	});
}

function formatWhois( data ) {
	var output = [];
	var val = '';
	var fields = {
		'registrant': 'Registrant Contact',
		'registration_date': 'Registration Date',
		'nameservers': 'Domain Name Servers'
	};

	Object.keys( fields ).forEach( function(f ) {
		if ( data[f] ) {
			if (f === 'registration_date') {
				val = formatDate(data[f]);
			} else {
				val = Array.isArray( data[f] ) ? data[f].join(", ") : data[f];
			}

			output.push( fields[f] + ': ' + val );
		}
	});

	return output;
}

function formatDate (dateString) {
	var dateArray = dateString.split("-");
	return dateArray[1]+ "/" +dateArray[2]+ "/" +dateArray[0];
}