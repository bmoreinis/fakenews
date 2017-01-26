/* Fake News Fitness Pseudocode
* https://drive.google.com/open?id=0B54VzDPRtma7dG5mUlBhNW1zX2c 
*/

/* 
* load popup to inform user and offer option button (free / prefill)
* listen for checkpage button and call CONTROLLER module 
*/

document.addEventListener('DOMContentLoaded', function() {
  var checkPageButton = document.getElementById('checkPage');
  checkPageButton.addEventListener('click', function() {
	chrome.tabs.query({active : true}, function(tab) {
	  var tld = controller.tldparser(tab);
	  console.log(tld);
	});
  }, false);
}, false);

//flow controller revealing module - contains various page parsing methods
var controller = (function(){
	
  // extract tld from url of active tab
  function tldparser(tab) {
	var cutTrail = tab[0].url.split( '/' );
	var items = cutTrail[2].split( '.' );
	if (items.length === 3) {
		var topLevelDomain = items[2];
	}
	else {
		var topLevelDomain = items[1];
	};
	return topLevelDomain;
  };
  
  // search document.body for ABOUT US or similar in menu lists
  function aboutFinder (tab) {
	//insert fxn here
  };
  
  // search document.body for posted date above or below body
  function dateFinder (tab) {
	//insert fxn here
  };
  
  // lists all links within body of page
  function linkFinder (tab) {
	//insert fxn here
  };
  
  // does something like http://smallseotools.com/backlink-checker/
  function backlinkCounter () {
	//insert fxn here
  }
  
  //return public methods
  return {
	tldparser : tldparser
  };
  
})();