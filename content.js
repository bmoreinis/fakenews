function sendToServer(obj) {
  //Process object that was sent, for values on fields that take only values. Default is value to allow new "normal" field situations
  console.log(obj);
  for (var property in obj) {
    if (obj.hasOwnProperty(property)) {
		console.log(property);
		console.log(obj[property].value);
        switch (obj[property]) {
			case "whois":
			  console.log('whois broke');
			  break;
			case "allLinks":
			  console.log('allLinks broke');
			  break;
			default:
			  if (obj[property].value) {
			    obj[property] = obj[property].value;
			  }
		}
    }
  }
  console.log(obj);
  //Promise Pattern for 3 requests to Drupal (get session token, get user id from email input, POST node if previous promises fulfilled)
  var promiseToken = new Promise(function(resolve, reject) {
  var getToken = new XMLHttpRequest();
		  var turl = "https://www.fakenewsfitness.org/restws/session/token";
		  getToken.onload = function () {
			  var tStatus = getToken.status;
			  var tData = getToken.responseText;
			    if (tStatus == 200) {
				resolve(tData);
				}
				else {
				reject(Error("This email is not logged into fakenewsfitness.org"));
				}
		  }
		  getToken.open("GET", turl, true);
		  getToken.setRequestHeader("Accept", "application/json");
		  getToken.send(null);
});

promiseToken.then(function(result) {
  var promiseUser = new Promise(function(resolve, reject) {
  var getUser = new XMLHttpRequest();
	  var uurl = "https://www.fakenewsfitness.org/user.json?mail="+obj.username;
	  getUser.onload = function () {
		  var uStatus = getUser.status;
		  var uData = JSON.parse(getUser.response);
		  // Check for an email that isn't a user before confirming promise fulfilled
		  if (uData.list[0] == undefined) {
			  alert("Email not related to valid FakeNewsFitness user");
		  } else {
		    if (uStatus == 200) {
		    resolve(uData.list[0].uid);
			    }
		    else {
            reject(Error("Something went wrong retrieving user information"));
		    }
		  }
	  }
	  getUser.open("GET", uurl, true);
	  getUser.setRequestHeader("Accept", "application/json");
	  sessionToken = result;
	  getUser.setRequestHeader("X-CSRF-Token", sessionToken);
	  getUser.send(null);
  });
  promiseUser.then(function(result) {
	// Double check for a "blank" submission in email before attempting to post node
    if (result == null) {
		alert("There was a problem retrieving your FakeNewsFitness User");
	} else {
//Begin processing form submission object for Drupal
	// Determine which title to submit
	var submitTitle = "";
	if (obj.pageArticle !== "No h1 tags found" && obj.pageArticle !== "") {
		submitTitle = obj.pageArticle;
	} else if (obj.pageTitle !== "No title tags found") {
		submitTitle = obj.pageTitle;
	} else {
		submitTitle = "No Title";
	}
	//Determine which TLD field to submit to
	var tldSelect = ""
	var otherTld = ""
	var selectDomains = ["com","org","gov","net","edu","mil","int"]
	if (selectDomains.indexOf(obj.topLevelDomain) == -1) {
		tldSelect = "Other (ICANN)";
		otherTld = obj.topLevelDomain;
	} else {
		tldSelect = obj.topLevelDomain;
	}
	
    //Prep links
	if (obj.allLinks !== null) {
		childLinks = obj.allLinks.childNodes;
		numLinks = childLinks.length;
		linkArray = [];
		for (var l = 0; l < numLinks; l++) {
			linkArray.push({"url":childLinks[l].innerText});
		}
	}
	//Prep whois
	if (obj.whois !== null) {
		childWhois = obj.whois.childNodes;
		numWhois = childWhois.length;
		if (numWhois > 1) {
			var regName = childWhois[0].innerText;
			var regComp = childWhois[1].innerText;
			var regState = childWhois[2].innerText.substring(0,2);
			var regCountry = childWhois[3].innerText;
			var regPhone = childWhois[4].innerText;
			var regEmail = childWhois[5].innerText;
		} else {
			var regName = "There was a problem with the WHOIS Lookup";
			var regComp = "";
			var regState = "";
			var regCountry = "";
			var regPhone = "";
			var regEmail = "";
		}
	}
	//Prepare question field split on '?'
	var questions = obj.FNquestions.split('?');
	var newQuestions = []
	numQues = questions.length;
	for (var q = 0; q < numQues; q++) {
		newQuestions.push({"value":questions[q]});
	}
	//The URL to POST to
	var url = "https://www.fakenewsfitness.org/node"
	var postData = JSON.stringify({"type":"page_check","title":submitTitle,"title_field":submitTitle,"author":{"id":result},"field_page_url":{"url":obj.url},"field_domain_name":{"url":obj.domainName},"field_top_level_domain":tldSelect,"field_other_tld":otherTld,"field_page_last_modified":obj.modifiedDate,"field_about_us_summary":obj.FNaboutUsSummary,"body":{"value":obj.FNassessment},"field_source_links":linkArray,"field_about_us_link":{"url":obj.aboutLink},"field_registrant_name":regName,"field_registrant_company":regComp,"field_registrant_state":regState,"field_registrant_country":regCountry,"field_registrant_phone":regPhone,"field_registrant_email":regEmail,"field_questions_":newQuestions,"og_group_ref":[{"id": "1"}]});
	console.log(postData);
	var postRequest = new XMLHttpRequest();
	postRequest.onload = function () {
	  var status = postRequest.status;
      var data = postRequest.responseText;
  }
  postRequest.open("POST", url, true);
  postRequest.setRequestHeader("Content-Type", "application/json");
  postRequest.setRequestHeader("X-CSRF-Token", sessionToken);
  postRequest.send(postData);
	
  }}, function(err) {
    alert(err);
    }
  );
  
}, function(err) {
  alert(err);
});
}

// Listen for messages
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {

    // If the received message has the expected format...
    if (msg.text === 'build_form_filled') {
		//Process WHOIS from message data
        var whoIsObj = JSON.parse(msg.whois).formatted_data;
		if (whoIsObj.RegistrantName == undefined) {
			var whoIsArr = ['There was a problem with the WHOIS lookup'];
		} else {
			var whoIsArr = [whoIsObj.RegistrantName, whoIsObj.RegistrantOrganization, whoIsObj["RegistrantState/Province"], whoIsObj.RegistrantCountry, whoIsObj.RegistrantPhone, whoIsObj.RegistrantEmail];
		};
        // Process URL here so we only run controller function once
		var thisURL = controller.getURL();
		// Add vars to form array from config, for auto-fill. Default is "". This way we can configure new fields that don't autofill in any order
		var configMax = msg.config.filled_form.length;
		for (var i = 1; i < configMax; i++) {
			switch (msg.config.filled_form[i][0]) {
				case "url":
				  msg.config.filled_form[i][2] = thisURL[0];
				  break;
				case "pageTitle":
				  msg.config.filled_form[i][2] = controller.getTitle();
				  break;
				case "pageArticle":
				  msg.config.filled_form[i][2] = controller.getArticle();
				  break;
				case "dn":
				  msg.config.filled_form[i][2] = controller.domainFinder();
				  break;
				case "tld":
				  msg.config.filled_form[i][2] = controller.tldParser();
				  break;
				case "params":
				  msg.config.filled_form[i][2] = thisURL[1];
				  break;
				case "modifiedDate":
				  msg.config.filled_form[i][2] = controller.dateFinder();
				  break;
				case "allLinks":
				  msg.config.filled_form[i][2] = controller.linkFinder();
				  break;
				case "aboutLinks":
				  msg.config.filled_form[i][2] = controller.aboutFinder();
				  break;
				case "whois":
				  msg.config.filled_form[i][2] = whoIsArr;
				  break;
				default:
				  msg.config.filled_form[i][2] = ""
			}
		}

        //Build the form
        makeForm(msg.config.filled_form, msg.config.critical_thinking);

    }
    else if (msg.text === 'build_form_blank') {
        //Build the form
        makeForm(msg.config.blank_form, msg.config.critical_thinking);
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
	  var title = document.getElementsByTagName("title");
	  if (title.length == 0) {
		  return "No title tags found";
	  } else {
		  var treturn = title[0].innerText;
		  return treturn;
	  }
  }

  function getArticle () {
	  var article = document.getElementsByTagName("h1")
	  if (article.length == 0) {
		  return "No h1 tags found";
	  } else {
		  var areturn = article[0].innerText;
		  return areturn;
	  }
  }

  // search document.body for ABOUT US or similar in menu lists
  function aboutFinder () {
	var aboutItems = document.getElementsByTagName("li");
	var aboutLinks = [];
	var aboutMax = aboutItems.length;
	for (var a = 0; a < aboutMax; a++) {
		var match = aboutItems[a].innerText.match(/((A|a)bout)/);
		if (match) {
			var childNodes = aboutItems[a].childNodes;
			for (var n = 0; n < childNodes.length; n++) {
				if (childNodes[n].nodeName == "A") {
					aboutLinks.push(childNodes[n].href);
				}
			}
		}
	}
	if (aboutLinks == []) {
		return "We could not find any about links";
	} else {
    //Drupal is set up to handle only one link here.. So we will pick the first one found
		return aboutLinks[0];
	}
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
	getArticle : getArticle,
	aboutFinder : aboutFinder
  };

})();

//cancel button - now that we have multiple pages could/should be made generic
function cancelForm() {
	var formElement = document.getElementById("FakeNewsForm");
	formElement.parentNode.removeChild(formElement);
	document.getElementsByTagName("BODY")[0].style.marginTop="0px";
};

//add another link input (could be generalized)
function addLink() {
	var divElement = document.getElementById('blankLinks');
	var newElement = document.createElement('input');
        newElement.setAttribute('class','emptyField');
	newElement.setAttribute('type','text');
	newElement.value = "[Begin with http://]";
	divElement.appendChild(newElement);
};

//make sure required fields are filled before submitting
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

//build object to send to server, then send to server
function buildObject(fields, critFields) {
	obj = {};
	fieldsMax = fields.length;
	critMax = critFields.length;
	for (var f = 0; f < fieldsMax; f++) {
		obj[fields[f][0]] = document.getElementById(fields[f][0]);	
	}
	for (var c = 0; c <critMax; c++) {
		obj[critFields[c][0]] = document.getElementById(critFields[c][0]);
	}
	return obj;
}

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
		console.log(fields);
		var check = checkRequired();
		if (check == true) {
        sendToServer(buildObject(fields, critFields)/*{
             use Jquery with a form serialization library 
            username: document.getElementById("username").value,
			url: document.getElementById("url").value,
			pageArticle: document.getElementById("pageArticle").value,
			pageTitle: document.getElementById("pageTitle").value,
			modifiedDate: document.getElementById("modifiedDate").value,
			domainName: document.getElementById("dn").value,
			topLevelDomain: document.getElementById("tld").value,
			allLinks: document.getElementById("allLinks"),
			aboutLink: document.getElementById("aboutLinks").value,
			whois: document.getElementById("whois"),
			
			aboutUsSummary: document.getElementById("FNaboutUsSummary").value,
			assessment: document.getElementById("FNassessment").value,
			questions: document.getElementById("FNquestions").value
        }*/)
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
        sendToServer(buildObject(fields, critFields)/*{
            use Jquery with a form serialization library 
            username: document.getElementById("username").value,
			url: document.getElementById("url").value,
			pageArticle: document.getElementById("pageArticle").value,
			pageTitle: document.getElementById("pageTitle").value,
			modifiedDate: document.getElementById("modifiedDate").value,
			domainName: document.getElementById("dn").value,
			topLevelDomain: document.getElementById("tld").value,
			allLinks: document.getElementById("allLinks"),
			aboutLink: document.getElementById("aboutLinks").value,
			whois: document.getElementById("whois"),
			
			aboutUsSummary: document.getElementById("FNaboutUsSummary").value,
			assessment: document.getElementById("FNassessment").value,
			questions: document.getElementById("FNquestions").value
        }*/)
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
