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
alert("clicked extension");

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
    console.log("in progress")
    setTimeout(function() {
    	console.log("sending message", tab.id)
    	chrome.tabs.sendMessage(tab.id, {text:'build_form_filled', config:config}, null);
	}, 1000);
  });
});
