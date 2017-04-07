/* Fake News Fitness Pseudocode
* https://drive.google.com/open?id=0B54VzDPRtma7dG5mUlBhNW1zX2c 
*/
function httpGet(theUrl)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", theUrl, true );
    xmlHttp.send( null );
    return xmlHttp.responseText;
}
/* 
* load popup to inform user and offer option button (free / prefill)
* listen for checkpage button and call CONTROLLER module 
*/

document.addEventListener('DOMContentLoaded', function() {
  var configFile = chrome.runtime.getURL('/config.json');
  var promiseConfig = new Promise(function(resolve, reject) {
	httpGet(configFile);
  });
  promiseConfig.then(function(result) {
  var config = JSON.parse(result);
  var checkPageButton = document.getElementById('checkPage');
  checkPageButton.addEventListener('click', function() {
	chrome.tabs.query({active : true}, function(tab) {
        //Check if user wants form pre-filled
	  var checkBox = document.getElementById('fillForm');
	  if (checkBox.checked) {
            var req = new XMLHttpRequest();
            function sendFilled() {
                var whois = req.responseText;
                chrome.tabs.sendMessage(tab[0].id, {text:'build_form_filled', whois: whois, config:config}, null);
            };
            var url = new URL(tab[0].url);
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
	  }
	  else {
            //Display blank form
            chrome.tabs.sendMessage(tab[0].id, {text: 'build_form_blank', config:config}, null);
	  };
	  //}, false);
	  });
    }, false);
  }, function(err) {
  console.log(err);
  });
}, false);
