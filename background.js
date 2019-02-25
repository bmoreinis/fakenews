chrome.runtime.onMessage.addListener(function (msg, sender, response) {
  // First, validate the message's structure
  if (msg.text == 'download') {
	  console.log('recieved message');
	  let doc = URL.createObjectURL( new Blob([msg.downloadData], {type: 'application/json'}) );
	  let filename = 'FNdata.json';
	  console.log(doc);
	  chrome.downloads.download({ url: doc, filename: filename, conflictAction: 'overwrite', saveAs: true });
  }
});

// Now users updated function signature as of 25 Feb 2019
// See: https://developer.chrome.com/extensions/browserAction#event-onClicked
chrome.browserAction.onClicked.addListener(function(tab) {
  var configFile = chrome.runtime.getURL('/config.json');
  var promiseConfig = new Promise(function(resolve, reject) {
	var xmlHttp = new XMLHttpRequest();
	xmlHttp.onload = function () {
			  var configStatus = xmlHttp.status;
			  var configData = xmlHttp.responseText;
			    if (configStatus == 200) {
				resolve(configData);
				}
				else {
				reject(Error("Could not get config data"));
				alert("Could not locate config.json")
				}
		  }
    xmlHttp.open( "GET", configFile, true );
    xmlHttp.send( null );
  });
  promiseConfig.then(function(result) {
    var config = JSON.parse(result);
    var req = new XMLHttpRequest();
        function sendFilled() {
		  var reqStatus = req.status;
		  if (reqStatus == 200) {
            var whois = req.responseText;
            chrome.tabs.sendMessage(tab.id, {text:'build_form_filled', whois: whois, config:config}, null);
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
        req.open("GET","http://api.bulkwhoisapi.com/whoisAPI.php?domain="+domain+"&token=usemeforfree");
        req.onload = sendFilled;
        req.send(null);
  });
});
