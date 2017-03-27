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
            var req = new XMLHttpRequest();
            function sendFilled() {
                var whois = req.responseText;
				console.log(whois);
                chrome.tabs.sendMessage(tab[0].id, {text:'build_form_filled', whois: whois}, null);
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
            chrome.tabs.sendMessage(tab[0].id, {text: 'build_form_blank'}, null);
	  };
	  //}, false);
	});
  }, false);
}, false);
