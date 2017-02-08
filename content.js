// Listen for messages
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
	// playing with how to add a script to the page so it can be called from a form button
    var s = document.createElement('script');
    s.type = 'text/javascript';
    var code = 'alert("hello world!");';
    try {
      s.appendChild(document.createTextNode(code));
      document.body.appendChild(s);
    } catch (e) {
      s.text = code;
      document.body.appendChild(s);
    }
    // If the received message has the expected format...
    if (msg.text === 'build_form_filled') {
		var topLevelDomain = controller.tldparser();
		var allLinks = controller.linkFinder();
		var modifiedDate = controller.dateFinder();
		var formFields = [
        //f = fixed rows; v = variable rows
			["username","Email Address as User Name","","f"],
			["tld","Top Level Domain", topLevelDomain, "f"],
			["modifiedDate","Modified Date(s)", modifiedDate,"f"],
			["allLinks","Page Links", allLinks,"vl"]
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
			["username","Email Address as User Name","","f"],
			["tld","Top Level Domain", "","f"],
			["modifiedDate","Modified Date(s)", "","f"],
			["allLinks","Page Links", "","a"]
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
		var splitDate = String(modifiedDate).split(' ');
		var returnDate = splitDate[0]+' '+splitDate[1]+' '+splitDate[2]+' '+splitDate[3];
		return returnDate;
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

function cancelForm() {
	var element = document.getElementById("FakeNewsForm");
	element.parentNode.removeChild(element);
};

function makeForm(fields) {
	// Move Body Down
	var script = document.createElement("script");
    document.getElementsByTagName("BODY")[0].style.marginTop="420px";
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
        switch(fields[i][3]) {
        	case "a":
				var inputElement = document.createElement("input"); //input element, text
		        inputElement.setAttribute('type',"text");
		        inputElement.setAttribute("id",fields[i][0]);
		        inputElement.value = "[Begin with http://]";
		        formName.appendChild(inputElement);
		        var newLink = document.createElement("input");
				newLink.setAttribute('type',"button");
				newLink.setAttribute('value',"Add New URL");
				newLink.setAttribute('id','newlink');
				newLink.addEventListener('click', newLink, false);
    			formName.appendChild(newLink);
				break;
        	case "v":
				if (fields[i][2].length > 0) {
					var listNode = document.createElement("OL");
					listNode.setAttribute("id", fields[i][0]);
					var itemsArray = fields[i][2];
					for(var x = 0; x < itemsArray.length; x++){
						var listItem = document.createElement("LI"); // Create a <li> node
						var listText = document.createTextNode(itemsArray[x]);// Create a text node
						listItem.appendChild(listText);
						listNode.appendChild(listItem);
					}
					formName.appendChild(listNode);
				}
				else {
					var listNode = document.createElement("UL");
					listNode.setAttribute("id", fields[i][0]);
					var listItem = document.createElement("LI");
					var listText = document.createTextNode('No items were found');
					listItem.appendChild(listText);
					listNode.appendChild(listItem);
					formName.appendChild(listNode);
				}
				break;
			case "vl":
				if (fields[i][2].length > 0) {
					var listNode = document.createElement("OL");
					listNode.setAttribute("id", fields[i][0]);
					var itemsArray = fields[i][2];
					for(var x = 0; x < itemsArray.length; x++){
						var listItem = document.createElement("LI"); // Create a <li> node
						var itemLink = document.createElement('a')
						var linkText = document.createTextNode(itemsArray[x]);// Create a text node
						itemLink.appendChild(linkText);
						itemLink.href = itemsArray[x];
						itemLink.setAttribute('target', '_blank');
						listItem.appendChild(itemLink);
						listNode.appendChild(listItem);
					}
					formName.appendChild(listNode);
				}
				else {
					var listNode = document.createElement("UL");
					listNode.setAttribute("id", fields[i][0]);
					var listItem = document.createElement("LI");
					var listText = document.createTextNode('No items were found');
					listItem.appendChild(listText);
					listNode.appendChild(listItem);
					formName.appendChild(listNode);
				}
				break;
        	case "f":
		        var inputElement = document.createElement("input"); //input element, text
		        inputElement.setAttribute('type',"text");
		        inputElement.setAttribute("id",fields[i][0]);
		        inputElement.value = fields[i][2];
		        formName.appendChild(inputElement);
		    	break;
		}
    }
    var submitElement = document.createElement("input"); //input element, Submit button
    submitElement.setAttribute('type',"button");
    submitElement.setAttribute('value',"Submit Data");
	submitElement.setAttribute('id',"submit");
    formName.appendChild(submitElement);
	
	var cancelElement = document.createElement("input");
	cancelElement.setAttribute('type',"button");
	cancelElement.setAttribute('value',"Cancel");
	cancelElement.setAttribute('id','cancel');
	cancelElement.addEventListener('click', cancelForm, false);
    formName.appendChild(cancelElement);
	
	formDiv.appendChild(formName);
	if (document.getElementById('FakeNewsForm')) {
		document.getElementById('FakeNewsForm').replaceWith(formDiv);
	}
	else {
    document.getElementsByTagName('body')[0].appendChild(formDiv);
	};
};