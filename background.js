const defaultConfigUrl = 'https://config.fakenewsfitness.org/config.json';
var config = null;

function getConfig() {
	var url;
	if ( !config ) {
	  return getConfigUrl()
	  	.then( configUrl => {
	  		url = configUrl;
	  		console.log( 'Attempting config fetch', url );
	  		return fetch( configUrl );
	  	})
	  	.then( response => response.json() )
		.catch( err => {
	  		if ( url != defaultConfigUrl ) {
	  			return setConfigUrl( defaultConfigUrl )
	  				.then( () => getConfig() );
	  		}
	  	})
	  	.then( cfg => {
	  		// Store in global
	  		config = cfg;
	  		return config;
	  	});

	 } else {
	 	return new Promise( resolve => resolve( config ) );
	 }
}

function getConfigUrl() {
	return chrome.storage.sync.get( ['configurl'] )
		.then( items => {
			return items.configurl || defaultConfigUrl;
		});
}

function setConfigUrl( url ) {
	resetConfig();
	return chrome.storage.sync.set( { configurl: url } );
}

function resetConfig() {
	config = null;
}

// Now users updated function signature as of 25 Feb 2019
// See: https://developer.chrome.com/extensions/browserAction#event-onClicked
chrome.action.onClicked.addListener(function(tab) {
	openFrame( tab.id );
});

function openFrame( tabid ) {
	chrome.tabs.sendMessage( tabid, {
		text: 'open_frame',
		src: chrome.runtime.getURL( '/panel.html' )
	});
}

chrome.runtime.onMessage.addListener(function (msg, sender, response) {
	var action = msg.text || '';

	switch (action) {

		case 'create_doc':
			const drive = new GoogleDrive();
			drive.getToken( true )
				.then( () => drive.createFile( msg.data, msg.filename ) )
				.then( data => drive.getFileById( data.id ) )
				.then( data => {
					// Create new tab. Additional info sent to callback via response() below.
					if ( data.webViewLink ) {
						chrome.tabs.create({ url: data.webViewLink });
					}
					response( data );
				});

			return true; // Enables response callback when used asynchronously.
			break;

		case 'set_config':
			setConfigUrl( msg.url ).then( () => response( msg.url ) );
			return true;
			break;
		case 'open_frame':
			openFrame( sender.tab.id );
			break;

		case 'frame_loaded':
			getConfig().then( config => {
				chrome.tabs.sendMessage( sender.tab.id, { text: 'gather_values' }, values => response( { config, values } ) );
			});
			return true;
			break;

		// Relay close_frame request from iFrame to content script.
		case 'close_frame':
			chrome.tabs.sendMessage( sender.tab.id, msg, closed => {
				if ( msg.reopen ) {
					openFrame( sender.tab.id );
				}
			} );
			return true;
			break;

		case 'whois':
			// Config needed for WHOIS API
			getConfig().then( () => {
				whoisLookup( msg.domain ).then( data => response(data) );
			});
			return true;
			break;
  }
});

function whoisLookup( hostname ) {
	var esc_domain = encodeURIComponent( hostname );
	var lookup_url = config.whois_base_url + esc_domain;

	return fetch( lookup_url )
		.then( response => response.json() )
		.then( data => formatWhois( data ) )
		.catch( err => {
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


// Object/Constructor
function GoogleDrive() {}

GoogleDrive.prototype = {
	// MIME boundary
	boundary: '981273423198471923847',

	getToken: async function( interactive ) {
		return new Promise( ( resolve, reject ) => {
			chrome.identity.getAuthToken( { interactive }, ( token, scopes ) => {
				if ( token ) {
					this.token = token;
					resolve( { token, scopes } );
				} else {
					reject();
				}
			});
		});
	},

	request: async function( method, url, body, headers ) {
		const { token } = await this.getToken();

		if ( !token ) {
			throw 'Missing token';
			return false;
		}

		headers = headers || {};
		Object.assign( headers, {
			'Content-Type': 'multipart/related; boundary=' + this.boundary,
			'Accept': 'text/html',
			'Authorization': 'Bearer ' + token
		});

		const params = {
			method,
			headers,
			mode: 'cors', // no-cors, *cors, same-origin
			cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
			credentials: 'same-origin', // include, *same-origin, omit
			redirect: 'follow',
			referrerPolicy: 'no-referrer'
		};

		if ( body ) {
			params.body = body;
			headers['Content-Length'] = body.length;
		}

		return fetch( url, params );
	},

	createMultipart: function( sections ) {
		let body = '--' + this.boundary + '\n';
		sections.forEach( sec => {
			body += sec.join("\n\n");
			body += "\n--" + this.boundary + "\n";
		});

		body += '--';
		return body;
	},

	createFile: async function( fileData, fileName ) {
		const metaData = {'name': fileName};
		const bodyparts = [
			[ 'Content-Type: application/json', JSON.stringify(metaData) ],
			[ 'Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document', fileData ],
		];
		const body = this.createMultipart( bodyparts );
		const url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";
		const response = await this.request( 'POST', url, body );
		return response.json();
	},

	getFileById: async function( fileId, fields ) {
		fields = fields || 'webViewLink';

		const url = "https://www.googleapis.com/drive/v3/files/" + fileId + '?fields=' + encodeURIComponent( fields );
		const response = await this.request( 'GET', url );

		return response.json();
	}
}
