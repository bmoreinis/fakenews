// Listen for messages
chrome.runtime.onMessage.addListener(function (msg, sendResponse) {
    // If the received message has the expected format...
    if (msg.text === 'build_form_filled') {
		
		var topLevelDomain = controller.tldparser();
		var allLinks = controller.linkFinder();
		var modifiedDate = controller.dateFinder();
		var formFields = [
			["username","Email Address as User Name",""],
			["tld","Top Level Domain", topLevelDomain],
			["modifiedDate","Modified Date(s)", modifiedDate],
			["allLinks","Page Links", allLinks]
			];
		//Build the form
		makeForm(formFields);
        // Call the specified callback, passing
        // the web-page's DOM content as argument
        sendResponse({
			topLevelDomain : topLevelDomain,
			allLinks : allLinks,
			modifiedDate : modifiedDate
		});
    }
	else if (msg.text === 'build_form_blank') {
		var formFields = [
			["username","Email Address as User Name",""],
			["tld","Top Level Domain", ""],
			["modifiedDate","Modified Date(s)", ""],
			["allLinks","Page Links", ""]
			];
		//Build the form
		makeForm(formFields);
	}
});

//flow controller revealing module - contains various page parsing methods
var controller = (function(){
	
  // extract tld from url of active tab
  function tldparser() {
	var myPath = window.location.host.split('.');
	if (myPath.length === 3) {
		return myPath[2]
	}
	else {
		return myPath[1]
	};
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
		var bodyDates = bodyTag[0].innerText.match(/((((U|u)pdated)|((P|p)osted)|((R|r)evised)|((M|m)odified))( |: | on )(\d{1,2})(-|\/)(\d{1,2})(-|\/)(\d{4}))|(\d{1,2})(-|\/)(\d{1,2})(-|\/)(\d{4})/);
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
	var paragraphs = document.getElementsByTagName("p");
	for(var i=0, max=paragraphs.length; i<max; i++) {
		for(var x=0, max=paragraphs[i].children.length; x<max; x++) {
			if (paragraphs[i].children[x].tagName == "A") {
				array.push(paragraphs[i].children[x].href);
			}
		}
	}
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

function makeForm(fields) {
    // Create Form Object
	var formDiv = document.createElement("div");
	formDiv.setAttribute('id', "FakeNewsForm");
    var formName = document.createElement("form");
    formName.setAttribute('method',"post");
    formName.setAttribute('action',"submit.php"); 
        for(var i = 0; i < fields.length; i++){
            var labelElement = document.createElement("label");
            labelElement.setAttribute("for", fields[i][0]);
            var labelText = document.createTextNode(fields[i][1]+": ");
            labelElement.appendChild(labelText);
            formName.appendChild(labelElement);
            var inputElement = document.createElement("input"); //input element, text
            inputElement.setAttribute('type',"text");
            inputElement.setAttribute("id",fields[i][0]);
			inputElement.value = fields[i][2];
            formName.appendChild(inputElement);
        }
    var submitElement = document.createElement("input"); //input element, Submit button
    submitElement.setAttribute('type',"button");
    submitElement.setAttribute('value',"Submit Data");
	submitElement.setAttribute('id','Submit');
    formName.appendChild(submitElement);
	formDiv.appendChild(formName);
	if (document.getElementById('FakeNewsForm')) {
		document.getElementById('FakeNewsForm').replaceWith(formDiv);
	}
	else {
    document.getElementsByTagName('body')[0].appendChild(formDiv);
	};
};