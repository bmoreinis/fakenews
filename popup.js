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
//Check if user wants form pre-filled
	  var checkBox = document.getElementById('fillForm');
	  if (checkBox.checked) {
//Only query for DOM content once and only if the user wants pre-filled form, to do operations on it 
		function doStuffWithDom(domContent) {
			document.getElementById('tld').value = domContent.topLevelDomain;
		};
//Send message for callback to our content script getting DOM content
		chrome.tabs.sendMessage(tab[0].id, {text: 'report_back'}, doStuffWithDom);
//Display filled-in form
		document.getElementById('myForm').style.display = 'block';
	  }
	  else {
//Display blank form
		document.getElementById('myForm').style.display = 'block'; 
	  };
	  var submitButton = document.getElementById('submit');
	  submitButton.addEventListener('click', function() {
		  alert("authenticating and submitting data to the server...");
	  }, false);
	});
  }, false);
}, false);
