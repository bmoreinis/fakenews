// Listen for messages
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    // If the received message has the expected format...
    if (msg.text === 'report_back') {
		var topLevelDomain = controller.tldparser();
		var allLinks = controller.linkFinder();
		var modifiedDate = controller.dateFinder();
        // Call the specified callback, passing
        // the web-page's DOM content as argument
        sendResponse({
			topLevelDomain : topLevelDomain,
			allLinks : allLinks,
			modifiedDate : modifiedDate
		});
    }
});

//flow controller revealing module - contains various page parsing methods
var controller = (function(){
	
  // extract tld from url of active tab
  function tldparser() {
	var path = window.location.host.split('.');
	if (path.length == 3) {
		var tld = path[2]
	}
	else {
		var tld = path[1]
	};
	return tld;
  };
  
  // search document.body for ABOUT US or similar in menu lists
  function aboutFinder () {
	//insert fxn here
  };
  
  // search document.body for posted date above or below body
  function dateFinder () {
	var modifiedDate = new Date(document.lastModified);
	var today = new Date();
    //Check for dynamically created page
	if (String(modifiedDate) !== String(today)) {
		return modifiedDate;
	}
	//If modifiedDate doesn't work, search page for updated, posted, revised, modified + date
	else {
		var bodyTag = document.getElementsByTagName("body");
		var bodyDates = bodyTag[0].innerText.match(/((((U|u)pdated)|((P|p)osted)|((R|r)evised)|((M|m)odified))( |: )(\d{1,2})(-|\/)(\d{1,2})(-|\/)(\d{4}))/);
		//Check that we found anything
		if (bodyDates) {
		return bodyDates.toString();
		}
		else {
		return 'We could not find anything on the page';
		};
	};
  };
  
  // lists all links within body of page
  function linkFinder () {
	var array = [];
	var links = document.getElementsByTagName("a");
	for(var i=0, max=links.length; i<max; i++) {
		array.push(links[i].href);
	};
	return array;
  };
  
  // does something like http://smallseotools.com/backlink-checker/
  function backlinkCounter () {
	//insert fxn here
  }
  
  //return public methods
  return {
	tldparser : tldparser,
	linkFinder : linkFinder,
	dateFinder : dateFinder
  };
  
})();