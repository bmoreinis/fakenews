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
  	    function sendFilled(fetchedObject) {
  		  var reqStatus = fetchedObject.status;
		  if (reqStatus == 200) {
            var whois = fetchedObject.responseText;
            chrome.tabs.sendMessage(tab.id, {text:'build_form_filled', whois: whois, config:config, googleDriveAPIToken: googleDriveAPIToken}, null);
		  } else if (reqStatus == 508) {
			alert("BulkWhoIsAPI is at it's rate limit. Please wait a few seconds and try again");
		  } else {
			alert("Unknown error from BulkWhoIsAPI, please contact extension administrator");
		  };
        };
        var url = new URL(tab.url);
		var domain = ""
        var raw = url.hostname.split(".");
		if (raw.length == 3) {
		  domain = raw[1]+"."+raw[2];
		} else {
		  domain = raw[0]+"."+raw[1];
		}
	  fetch("http://api.bulkwhoisapi.com/whoisAPI.php?domain="+domain+"&token=usemeforfree").then(response => {
		//This fetch needs to be updated to point to an active service.
		// The request returns a 200, so there is no breaking issue and this is a placeholder.
	  	return response;
	  }).then(data => {
		  sendFilled(data);
	  }).catch(err => {
		  console.log("There was an error with the whois fetch: " + err)
	  });
  }));
});

async function getGoogleDriveToken() {
	chrome.identity.getAuthToken({interactive: true}, function(token) {
		googleDriveAPIToken = token;
		console.log('got the token', googleDriveAPIToken);
	})
}
