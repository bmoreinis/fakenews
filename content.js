function sendToServer(obj) {
    console.log(obj);

    fetch('http://app.fakenewsfitness.org', {
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
        var whoIsObj = JSON.parse(msg.whois).formatted_data;
		if (whoIsObj.RegistrantName == undefined) {
			var whoIsArr = ['There was a problem with the WHOIS lookup'];
		} else {
			var whoIsArr = [whoIsObj.RegistrantName, whoIsObj.RegistrantOrganization, whoIsObj["RegistrantState/Province"], whoIsObj.RegistrantCountry, whoIsObj.RegistrantPhone, whoIsObj.RegistrantEmail];
		};
        var myDomain = controller.domainFinder();
        var topLevelDomain = controller.tldParser();
        var allLinks = controller.linkFinder();
        var modifiedDate = controller.dateFinder();
		var thisURL = controller.getURL();
		var title = controller.getTitle();
		var article = controller.getArticle();
        var formFields = [
        /*f = fixed rows; v = variable rows, parameters to create FN form
		* array[0] => field id
		* array[1] => field label
		* array[2] => field value
		* array[3] => field generation type (f, v, vl, a)
		* array[4] => boolean required
		*/
            ["username","Email Address as User Name","","f",1],
			["url","Page URL", thisURL[0], "f",0],
			["pageTitle","Page Title (First <title>)", title, "f",0],
			["pageArticle","Article Title (First <H1>)", article, "f",0],
            ["dn","Domain Name",myDomain,"f",1],
            ["tld","Top Level Domain", topLevelDomain, "f",0],
			["params","URL Parameters", thisURL[1], "f",0],
            ["modifiedDate","Modified Date(s)", modifiedDate,"f",0],
            ["allLinks","Page Links", allLinks,"vl",0],
            ["whois", "WHOIS Lookup", whoIsArr, "v",0]
            ];
		var critThinksFields = [
			["Critical Question #1 ID", "Critical Question #1 Label"],
			["Critical Question #2 ID", "Critical Question #2 Label"],
			["Critical Question #3 ID", "Critical Question #3 Label"]
		];
        //Build the form
        makeForm(formFields, critThinksFields);

    }
    else if (msg.text === 'build_form_blank') {
        var formFields = [
            ["username","Email Address as User Name","","f",1],
			["url","Page URL","","f",0],
			["pageTitle","Page Title (First <title>)", "", "f",0],
			["pageArticle","Article Title (First <H1>)", "", "f",0],
            ["dn","Domain Name", "","f",1],
            ["tld","Top Level Domain", "","f",0],
            ["modifiedDate","Modified Date(s)", "","f",0],
            ["allLinks","Page Links", "","a",0]
            ];
		var critThinksFields = [
			["Critical Question #1 ID", "Critical Question #1 Label"],
			["Critical Question #2 ID", "Critical Question #2 Label"],
			["Critical Question #3 ID", "Critical Question #3 Label"]
		];
        //Build the form
        makeForm(formFields, critThinksFields);
    }
});

//flow controller revealing module - contains various page parsing methods
var controller = (function(){

  // get domain from active tab
   function getURL() {
     var href = window.location.href.split('?');
	 if (href[1] == undefined) {
		 href[1] = 'No parameters';
	 }
     return href;
   };
   
   function domainFinder() {
	var myPath = window.location.host.split('.');
	if (myPath.length === 3) {
		return myPath[1]+"."+myPath[2]
	}
	else {
		return myPath[0]+"."+myPath[1]
	};
  };

  // extract tld from url of active tab
  function tldParser() {
	var myPath = window.location.host.split('.');
	if (myPath.length === 3) {
		return myPath[2]
	}
	else {
		return myPath[1]
	};
  };

  function getTitle () {
	  var title = document.getElementsByTagName("title")[0].innerText;
	  return title;
  }
  
  function getArticle () {
	  var article = document.getElementsByTagName("h1")[0].innerText;
	  return article;
  }
  
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
			for(var x=0, Xmax=paragraphs[i].children.length; x<Xmax; x++) {
				if (paragraphs[i].children[x].tagName == "A") {
					array.push(paragraphs[i].children[x].href)
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
	getURL : getURL,
	domainFinder : domainFinder,
    tldParser : tldParser,
	linkFinder : linkFinder,
	dateFinder : dateFinder,
	getTitle : getTitle,
	getArticle : getArticle
  };

})();

//cancel button - now that we have multiple pages could/should be made generic
function cancelForm() {
	var formElement = document.getElementById("FakeNewsForm");
	formElement.parentNode.removeChild(formElement);
	document.getElementsByTagName("BODY")[0].style.marginTop="0px";
};

function addLink() {
	var divElement = document.getElementById('blankLinks');
	var newElement = document.createElement('input');
        newElement.setAttribute('class','emptyField');
	newElement.setAttribute('type','text');
	newElement.value = "[Begin with http://]";
	divElement.appendChild(newElement);
};

function checkRequired () {
	var FNrequired = document.getElementsByClassName("FNrequired");
		var reqmax = FNrequired.length;
		for (var r = 0; r<reqmax; r++) {
			if (FNrequired[r].value == "") {
				return false;
			} else {
				return true;
			}
		}
};

function makeForm(fields, critFields) {
	// Move Body Down
    document.getElementsByTagName("BODY")[0].style.marginTop="420px";
    // Create Form Object Page 1
	var formDiv = document.createElement("div");
	formDiv.setAttribute('id', "FakeNewsForm");
    var formName = document.createElement("form");
    for(var i = 0; i < fields.length; i++){
        var labelElement = document.createElement("label");
        labelElement.setAttribute("for", fields[i][0]);
		if (fields[i][4] == 0) {
			var labelText = document.createTextNode(fields[i][1]+": ");
		} else {
			var labelText = document.createTextNode(fields[i][1]+"* : ");
		}
        labelElement.appendChild(labelText);
        formName.appendChild(labelElement);
        switch(fields[i][3]) {
        	case "a":
                    var divElement = document.createElement("div");
                        divElement.setAttribute('id','blankLinks');
                    var newLink = document.createElement("input");
                        newLink.setAttribute('type',"button");
                        newLink.setAttribute('value',"Add New URL");
                        newLink.setAttribute('class','newField');
                        newLink.addEventListener('click', addLink, false);
                        divElement.appendChild(newLink);
                        formName.appendChild(divElement);
                    var inputElement = document.createElement("input"); //input element, text
                        inputElement.setAttribute('type',"text");
                        inputElement.setAttribute("id",fields[i][0]);
                        inputElement.setAttribute('class','emptyField');
                        inputElement.value = "[Begin with http://]";
						if (fields[i][4] == 1) {
							inputElement.setAttribute("required","");
							inputElement.setAttribute("class", "FNrequired")
						}
                        divElement.appendChild(inputElement);
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
				if (fields[i][4] == 1) {
					inputElement.setAttribute("required","");
					inputElement.setAttribute("class", "FNrequired")
				}
		        formName.appendChild(inputElement);
		    	break;
		}
    }
	//could maybe should be made generic for multiple pages
	var pagerElement = document.createElement("input"); //input element, pager
    pagerElement.setAttribute('type',"button");
    pagerElement.setAttribute('value',"Go to Page 2");
	pagerElement.setAttribute('id',"submit");
    pagerElement.addEventListener("click", function() {
		var check = checkRequired();
		console.log(check);
		if (check == true) {
			formName.style.display = 'hidden';
			ctForm.style.display = 'block';
		} else {
			alert ('Please fill out required fields');
		};
	}, false);
    formName.appendChild(pagerElement);
	
    var submitElement = document.createElement("input"); //input element, Submit button
    submitElement.setAttribute('type',"button");
    submitElement.setAttribute('value',"Submit Data");
	submitElement.setAttribute('id',"submit");
    submitElement.addEventListener("click", function() {
		var check = checkRequired();
		if (check == true) {
        sendToServer({
            /* use Jquery with a form serialization library */
            username: document.getElementById("username").value
        })
		} else {
			alert ('Please fill out required fields');
		}
    }, false)
    formName.appendChild(submitElement);

	var cancelElement = document.createElement("input"); //input element, cancel
	cancelElement.setAttribute('type',"button");
	cancelElement.setAttribute('value',"Cancel (You will lose your work)");
	cancelElement.setAttribute('id','cancel');
	cancelElement.addEventListener('click', cancelForm, false);
    formName.appendChild(cancelElement);
	formDiv.appendChild(formName);
	
	//Create Page 2 Critical Thinking, and hide it
    var ctForm = document.createElement("form");
	ctForm.setAttribute('id', "FakeNewsPageTwo")
	ctForm.setAttribute('style','display:none');
	for(var c = 0; c < critFields.length; c++){
		var labelElement = document.createElement("label");
		labelElement.setAttribute("for", critFields[c][0]);
		var labelText = document.createTextNode(critFields[c][1]+": ");
		labelElement.appendChild(labelText);
		ctForm.appendChild(labelElement);
		var inputElement = document.createElement("textarea"); //input element, textarea
		inputElement.setAttribute('rows', 4);
		inputElement.setAttribute('cols', 50);
		inputElement.setAttribute("id", critFields[c][0]);
		ctForm.appendChild(inputElement);
	}
	var pageBackElement = document.createElement("input"); //input element, page back to 1
    pageBackElement.setAttribute('type',"button");
    pageBackElement.setAttribute('value',"Go to Page 1");
	pageBackElement.setAttribute('id',"pageOne");
    pageBackElement.addEventListener("click", function() {
		ctForm.style.display = 'none';
		formName.style.display = 'block';
	}, false);
    ctForm.appendChild(pageBackElement);
	var submitAllElement = document.createElement("input"); //input element, Submit All button
    submitAllElement.setAttribute('type',"button");
    submitAllElement.setAttribute('value',"Submit All Data");
	submitAllElement.setAttribute('id',"submitAll");
    submitAllElement.addEventListener("click", function() {
        sendToServer({
            /* use Jquery with a form serialization library */
            username: document.getElementById("username").value
        })
    }, false)
    ctForm.appendChild(submitAllElement);
	var cancelAllElement = document.createElement("input"); //input element, cancel
	cancelAllElement.setAttribute('type',"button");
	cancelAllElement.setAttribute('value',"Cancel (You will lose your work)");
	cancelAllElement.setAttribute('id','cancelAll');
	cancelAllElement.addEventListener('click', cancelForm, false);
    ctForm.appendChild(cancelAllElement);
	formDiv.appendChild(ctForm);
	
	if (document.getElementById('FakeNewsForm')) {
		document.getElementById('FakeNewsForm').replaceWith(formDiv);
	}
	else {
    document.getElementsByTagName('body')[0].appendChild(formDiv);
	};
};
