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
//Send message for callback to our content script getting DOM content
		chrome.tabs.sendMessage(tab[0].id, {text: 'build_form_filled'}, null);
	  }
	  else {
//Display blank form
		chrome.tabs.sendMessage(tab[0].id, {text: 'build_form_blank'}, null);
	  };
	  //}, false);
	});
  }, false);
}, false);
