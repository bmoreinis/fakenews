function sendToServer(obj) {
    console.log(obj);

    fetch('http://test.fakenewsfitness.org', {
        method: 'POST',
        body: JSON.stringify(obj)
    })
    .then(function(res) {
        if (!res.ok) {
            console.log("request failed: " + res.status + " " + res.statusText);
        }
    })
    .catch(function(err) {
        console.log(err);
    })
}

// Listen for messages
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
	
    // If the received message has the expected format...
    if (msg.text === 'build_form_filled') {
        var thisURL = controller.getURL();
        var formFields = [
        //f = fixed rows; v = variable rows
            ["username","Email Address as User Name","","f"],
            ["url","Page URL", thisURL, "f"]
            ];
        //Build the form
        makeForm(formFields);
        // Call the specified callback, passing
        // the web-page's DOM content as argument
    }

    else if (msg.text === 'build_form_blank') {
        var formFields = [
            ["username","Email Address as User Name","","f"],
            ["url","Page URL","","f"]
            ];
        //Build the form
        makeForm(formFields);
    }
});

//flow controller revealing module - contains various page parsing methods
var controller = (function(){

  // get domain from active tab
   function getURL() {
     var href = window.location.href.split('?');
     return href[0];	 
   }; 

  //return public methods
  return {
	getURL : getURL
  };
})();

//cancel button - now that we have multiple pages could/should be made generic

function makeForm(fields) {
    // Move Body Down
	document.getElementsByTagName("BODY")[0].style.marginTop="420px";

    // Create Form Object Page 1
	var formDiv = document.createElement("div");
	formDiv.setAttribute('id', "FakeNewsForm");
    var formName = document.createElement("form");

    // Create Input Elements	
	for(var i = 0; i < fields.length; i++){
		// Create Label
		var labelElement = document.createElement("label");
		labelElement.setAttribute("for", fields[i][0]);
		var labelText = document.createTextNode(fields[i][1]+": ");
		labelElement.appendChild(labelText);
		formName.appendChild(labelElement);
		// Create Input
		var inputElement = document.createElement("input"); //input element, text
		inputElement.setAttribute('type',"text");
		inputElement.setAttribute("id",fields[i][0]);
		inputElement.value = fields[i][2];
		formName.appendChild(inputElement);
    }
	
     // Create Submit Element	
	var submitElement = document.createElement("input"); //input element, Submit button
	submitElement.setAttribute('type',"button");
	submitElement.setAttribute('value',"Submit Data");
	submitElement.setAttribute('id',"submit");
	submitElement.addEventListener("click", function() {
		sendToServer({
		/* use Jquery with a form serialization library */
		username: document.getElementById("username").value
		})
		}, false)
	formName.appendChild(submitElement);
	formDiv.appendChild(formName);
	
	if (document.getElementById('FakeNewsForm')) {
		document.getElementById('FakeNewsForm').replaceWith(formDiv);
		}
		else {
		document.getElementsByTagName('body')[0].appendChild(formDiv);
	};
};
