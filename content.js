function sendToServer(obj) {
//Process object that was sent, for values on fields that take only values. Default is value to allow new "normal" field situations
//rawData will be used to build the JSON to post to Drupal
var rawData = {}
for (var property in obj) {
	if (obj.hasOwnProperty(property)) {
	//Change properties to values and generate rawData objects from it, cases for specialized fields, default for generic text fields (to be added / subtracted).
		switch (property) {
			case "url":
				rawData.url = {"field_page_url":{"url":obj.url.value}};
			break;
			case "dn":
				rawData.dn = {"field_domain_name":{"url":obj.dn.value}};
			break;
			case "tld":
				//Determine which TLD field to submit to
				var tldSelect = ""
				var otherTld = ""
				var selectDomains = ["com","org","gov","net","edu","mil","int"]
				if (selectDomains.indexOf(obj.tld.value) == -1) {
					tldSelect = "Other (ICANN)";
					otherTld = obj.tld.value;
				} else {
					tldSelect = obj.tld.value;
				}
				rawData.tld = {"field_top_level_domain":tldSelect}
				rawData.otherTld = {"field_other_tld":otherTld}
			break;
			case "pageArticle":
				// Determine which title to submit
				var submitTitle = "";
				if (obj.pageArticle.value !== "No <h1> found. Paste Headline here." && obj.pageArticle.value !== "") {
					submitTitle = obj.pageArticle.value;
				} else if (obj.pageTitle.value !== "No <title> tag found. Not trustworthy.") {
					submitTitle = obj.pageTitle.value;
				} else {
					submitTitle = "No Title";
				}
				rawData.title = {"title":submitTitle};
				rawData.titlefield = {"title_field":submitTitle};
			break;
			case "pageTitle":
			break;
			case "adContent":
				var items = obj.adContent.childNodes;
				var itemsLength = items.length;
				for (var i = 0; i < itemsLength; i++) {
					if (items[i].childNodes[1].checked == true) {
						rawData.adContent = {"field_ad_content":parseInt(items[i].childNodes[1].value)};
						break;
					}
				}
			break;
			case "clickbaitRank":
				var items = obj.adContent.childNodes;
				var itemsLength = items.length;
				for (var i = 0; i < itemsLength; i++) {
					if (items[i].childNodes[1].checked == true) {
						rawData.adContent = {"field_clickbait_rank":parseInt(items[i].childNodes[1].value)};
						break;
					}
				}
			break;
			case "allLinks":
				//Prep links
				var linkArray = [];
				try {
					var childLinks = obj.allLinks.childNodes;
					var numLinks = childLinks.length;
					for (var l = 0; l < numLinks; l++) {
					if (childLinks[l].innerText == "No items were found") {
						linkArray.push({"url":""});
					}
					else {
						linkArray.push({"url":childLinks[l].innerText});
					}
					}
				}
				catch(err) {
					linkArray.push({"url":""});
				}
				rawData.allLinks = {"field_source_links":linkArray};
			break;
			case "biasLevel":
				var items = obj.adContent.childNodes;
				var itemsLength = items.length;
				for (var i = 0; i < itemsLength; i++) {
					if (items[i].childNodes[1].checked == true) {
						rawData.adContent = {"field_bias_level":parseInt(items[i].childNodes[1].value)};
						break;
					}
				}
			break;
			case "myBias":
				var items = obj.adContent.childNodes;
				var itemsLength = items.length;
				for (var i = 0; i < itemsLength; i++) {
					if (items[i].childNodes[1].checked == true) {
						rawData.adContent = {"field_my_bias":parseInt(items[i].childNodes[1].value)};
						break;
					}
				}
			break;
			case "aboutLinks":
				//Check about link for proper URL
				if (obj.aboutLinks.value == undefined) {
					obj.aboutLinks.value = "No About Links Found";
				}
				rawData.aboutLinks = {"field_about_us_link":{"url":obj.aboutLinks.value}};
			break;
			case "whois":
				//Prep whois
				try {
					var childWhois = obj.whois.childNodes;
					if(childWhois[0].tagName == "P") {
						rawData.regName = {"field_registrant_name":childWhois[1].value};
						break;
					}
					rawData.regName = {"field_registrant_name":childWhois[0].innerText};
					rawData.regComp = {"field_registrant_company":childWhois[1].innerText};
					rawData.regState = {"field_registrant_state":childWhois[2].innerText.substring(0,2)};
					rawData.regCountry = {"field_registrant_country":childWhois[3].innerText};
					rawData.regPhone = {"field_registrant_phone":childWhois[4].innerText};
					rawData.regEmail = {"field_registrant_email":childWhois[5].innerText};
				}
				catch(err) {
					break;
				}
			break;
			case "trustRank":
				var items = obj.trustRank.childNodes;
				var itemsLength = items.length;
				for (var i = 0; i < itemsLength; i++) {
					if (items[i].childNodes[1].checked == true) {
						rawData.trustRank = {"field_trust_rank":parseInt(items[i].childNodes[1].value)};
						break;
					}
				}
			break;
			case "FNassessment":
				rawData.FNassessment = {"body":{"value":obj.FNassessment.value}};
			break;
				case "FNquestions":
				//Prepare question field split on '?'
				var questions = obj.FNquestions.value.split('?');
				var newQuestions = []
				numQues = questions.length;
				for (var q = 0; q < numQues; q++) {
					newQuestions.push({"value":questions[q]});
				}
				rawData.FNquestions = {"field_questions_":newQuestions};
			break;
			case "type":
				rawData.type = {"type":obj.type};
			break;
			case "OG":
				rawData.OG = {"og_group_ref":{"id": obj.OG}};
			break;
			case "mode":
			break;
			default:
				var objectProperty = obj[property];
				var objpropfield = obj[property].field;
				var objpropvalue = objectProperty.value;
				//check that we set a field to map to in Drupal, we can use this as a config process to not submit a field
				if (objpropfield !== "") {
					rawData[property] = { [objpropfield] : objpropvalue };
				}
		}
	}
}

//Check mode (download or post) and do it.
if (obj.mode == 'download') {
	var downloadData = [];
	for (var data in rawData) {
		if (rawData.hasOwnProperty(data)) {
			var subData = rawData[data];
			for (var d in subData) {
				if (subData.hasOwnProperty(d)) {
					downloadData.push(JSON.stringify(subData).slice(1,-1));
				}
			}
		}
	}
	downloadData = '[{'+downloadData+'}]';
	chrome.runtime.sendMessage({text:'download', downloadData: downloadData}, null);
}
else {
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
				alert("This email is not logged into fakenewsfitness.org");
				}
		}
		getToken.open("GET", turl, true);
		getToken.setRequestHeader("Accept", "application/json");
		getToken.send(null);
});

promiseToken.then(function(result) {
	var promiseUser = new Promise(function(resolve, reject) {
	var getUser = new XMLHttpRequest();
	var uurl = "https://www.fakenewsfitness.org/user.json?field_extension_id="+obj.extensionId.value;
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
			alert("Could not retrieve user data from fakenewsfitness.org");
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
	rawData.author = {"author":{"id":result}};
	// Double check for a "blank" submission in email before attempting to post node
	if (result == null) {
		alert("There was a problem retrieving your FakeNewsFitness User");
	} else {
	//The URL to POST to
	var url = "https://www.fakenewsfitness.org/node"
	var postString = "";
	for (var prop in rawData) {
	if (rawData.hasOwnProperty(prop)) {
		var stringProp = JSON.stringify(rawData[prop])
		postString = postString+stringProp.slice(1,-1)+',';
	}
	}
	var postData = '{'+postString.slice(0,-1)+'}';
	var postRequest = new XMLHttpRequest();
	postRequest.onload = function () {
	var postStatus = postRequest.status;
	var data = postRequest.responseText;
	if (postStatus == 201) {
		alert("Submit successful.");
	} else {
		alert("There was a problem with your submission, response was: "+data);
	}
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
}

// Listen for messages
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
	// If the received message has the expected format...
	//Process WHOIS from message data
	var whoIsObj = JSON.parse(msg.whois).formatted_data;
	if (whoIsObj.RegistrantName == undefined) {
		var whoIsArr = ['https://whois.icann.org/en/lookup?name='+controller.domainFinder()];
	} else {
		var whoIsArr = [whoIsObj.RegistrantName, whoIsObj.RegistrantOrganization, whoIsObj["RegistrantState/Province"], whoIsObj.RegistrantCountry, whoIsObj.RegistrantPhone, whoIsObj.RegistrantEmail];
	};
	// Process URL here so we only run controller function once
	var thisURL = controller.getURL();

	// Add vars to twoform arrays from config, for auto-fill. Default is "".
	// This way we can configure new fields that don't autofill in any order
	// Build first page array
	var configMax1 = msg.config.filled_form_page_1.length;
	for (var i = 0; i < configMax1; i++) {
		switch (msg.config.filled_form_page_1[i][0]) {
			case "url":
			msg.config.filled_form_page_1[i][2] = thisURL[0];
			break;
			case "pageTitle":
			msg.config.filled_form_page_1[i][2] = controller.getTitle();
			break;
			case "pageArticle":
			msg.config.filled_form_page_1[i][2] = controller.getArticle();
			break;
			case "dn":
			msg.config.filled_form_page_1[i][2] = controller.domainFinder();
			break;
			case "tld":
			msg.config.filled_form_page_1[i][2] = controller.tldParser();
			break;
			case "modifiedDate":
			msg.config.filled_form_page_1[i][2] = controller.dateFinder();
			break;
			default:
			msg.config.filled_form_page_1[i][2] = ""
		}
	}
	// Add vars to form array p2 from config, for auto-fill.
	// Default is "". This way we can configure new fields that don't autofill in any order
	// Build second page array
	var configMax2 = msg.config.filled_form_page_2.length;
	for (var i = 0; i < configMax2; i++) {
		switch (msg.config.filled_form_page_2[i][0]) {
			case "allLinks":
			msg.config.filled_form_page_2[i][2] = controller.linkFinder();
			break;
			case "aboutLinks":
			msg.config.filled_form_page_2[i][2] = controller.aboutFinder();
			break;
			case "whois":
			msg.config.filled_form_page_2[i][2] = whoIsArr;
			break;
			default:
			msg.config.filled_form_page_2[i][2] = ""
		}
	}

	//Build the form
	makeForm(msg.config.filled_form_page_1, msg.config.filled_form_page_2, msg.config.typeAndOG);
	});


//flow controller revealing module - contains various page parsing methods
var controller = (function(){

// get domain from active tab
  function getURL() {
	 var href = window.location.href.split('?');
	 if (href[1] == undefined) {
		 href[1] = 'No parameters. No click-tracking here!';
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

// extract <title> from HTML
  function getTitle () {
	var title = document.getElementsByTagName("title");
	if (title.length == 0) {
		return "No <title> tag found. Not trustworthy.";
	} else {
		var treturn = title[0].innerText;
		return treturn;
	}
}

// extract first <h1> from HTML
  function getArticle () {
	var article = document.getElementsByTagName("h1")
	if (article.length == 0) {
		return "No <h1> found. Paste Headline here.";
	} else {
		var areturn = article[0].innerText;
		return areturn;
	}
}

// search document.body for ABOUT US or similar in menu lists
  function aboutFinder () {
	var aboutItems = document.getElementsByTagName("a");
	var aboutLinks = [];
	var aboutMax = aboutItems.length;
	for (var a = 0; a < aboutMax; a++) {
		var match = aboutItems[a].href.match(/((A|a)bout(.+)(U|u)s)/);
		if (match) {
		  console.log(aboutItems[a].href);
		  var baseToCheck = aboutItems[a].href.split("/")[2].split(".");
		  if (baseToCheck.length === 3) {
			var domainToCheck = baseToCheck[1]+"."+baseToCheck[2];
		  }
		  else {
			var domainToCheck = baseToCheck[0]+"."+baseToCheck[1];
		  }
		  //check that link is inside of this domain
		  console.log(controller.domainFinder());
		  console.log(domainToCheck);
		  if (controller.domainFinder() == domainToCheck) {
			aboutLinks.push(aboutItems[a].href);
		  }
		}
	}
	if (aboutLinks.length == 0) {
		return "";
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
		return 'No dates found.  Enter if you find one.';
		};
	};
};

// lists all links within body of page
function linkFinder () {
	var array = [];
	var paragraphs = document.getElementsByTagName("p");
	// set maximum number of links to pre-fill
	var maxLinks = 5;
		for(var i=0, max = paragraphs.length; i<max; i++) {
			for(var x=0, Xmax = paragraphs[i].children.length; x < Xmax; x++) {
				if (paragraphs[i].children[x].tagName == "A") {
				  var url = paragraphs[i].children[x].href
				  //check that it's not an internal link
				  if (url.indexOf("http") == 0 ) {
					var baseToCheck = url.split("/")[2].split(".");
					if (baseToCheck.length === 3) {
					  var domainToCheck = baseToCheck[1]+"."+baseToCheck[2];
					}
					else {
					  var domainToCheck = baseToCheck[0]+"."+baseToCheck[1];
					}
					//check that link is a source e.g. outside of this domain
					if (controller.domainFinder() !== domainToCheck) {
				    //enforce max links setting
				      if (array.length < maxLinks) {
					    array.push(paragraphs[i].children[x].href)
				      }
					}
				  }
				}
			}
		}
	return array;
};

// does something like http://smallseotools.com/backlink-checker/
function backlinkCounter () {
	//insert fxn here
}

//return public methods MBM1
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

// remove source URL
function removeItem(id) {
	var idNumber = id.replace( /^\D+/g, '');
	var itemId = "FNlink"+idNumber;
	var item = document.getElementById(itemId);
	item.parentNode.removeChild(item);
	var removeButton = document.getElementById(id);
	removeButton.parentNode.removeChild(removeButton);
};

// add source URL
function addLinkItem(item, parentItem) {
	var listItem = document.createElement("LI");
	var rand = Math.floor((Math.random() * 100) + 100);
	listItem.setAttribute("id","FNlink"+rand);
	var itemLink = document.createElement('a')
	var linkText = document.createTextNode(item);
	itemLink.appendChild(linkText);
	itemLink.href = item;
	itemLink.setAttribute('target', '_blank');
	listItem.appendChild(itemLink);
	parentItem.appendChild(listItem);
	var resetValue = document.getElementById("FNaddtext")
	resetValue.value = "[Begin with http://]";
	var remove = document.createElement("INPUT");
	remove.setAttribute("id","FNremove"+rand);
	remove.setAttribute("type","button");
	remove.setAttribute("class","remove");
	remove.setAttribute("value","Remove");
	var removeID = remove.id
	remove.addEventListener("click", function() {
		var removeID = this.id;
		removeItem(removeID);
	}, false);
	parentItem.appendChild(remove);
};

//build object to send to server, then send to server
function buildObject(fields, fieldsP2, config, mode) {
	obj = {};
	p1Max = fields.length;
	for (var f = 0; f < p1Max; f++) {
		obj[fields[f][0]] = document.getElementById(fields[f][0]);
		obj[fields[f][0]].field = fields[f][6];
	}
	p2Max = fieldsP2.length;
	for (var c = 0; c <p2Max; c++) {
		obj[fieldsP2[c][0]] = document.getElementById(fieldsP2[c][0]);
		obj[fieldsP2[c][0]].field = fieldsP2[c][6];
	}
	obj.type = config[0].type;
	obj.mode = mode;
	if (obj.OG.value == "") {
		obj.OG = config[1].groupID;
	} else {
		obj.OG = obj.OG.value;
	}
	return obj;
}
// create form on page one
function makeForm(fields, fieldsP2, config) {
	// Move Body Down
	document.getElementsByTagName("BODY")[0].style.marginTop="420px";
	// Create Form Object Page 1
	var formDiv = document.createElement("div");
	formDiv.setAttribute('id', "FakeNewsForm");
	// Build Page 1 Elements
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
						if (fields[i][2].length > 1) {
								var listNode = document.createElement("OL");
								listNode.setAttribute("id", fields[i][0]);
								listNode.setAttribute("style","list-style:none;");
								var itemsArray = fields[i][2];
								var itemsLength = itemsArray.length;
								for(var x = 0; x < itemsLength; x++){
										var listItem = document.createElement("LI"); // Create a <li> node
										var listText = document.createTextNode(itemsArray[x]);// Create a text node
										listItem.appendChild(listText);
										listNode.appendChild(listItem);
								}
								formName.appendChild(listNode);
						}
						else {
								var listNode = document.createElement("DIV");
								listNode.setAttribute("id", fields[i][0]);
								var listItem = document.createElement("P");
								var listText = document.createTextNode(fields[i][2]);
								listItem.appendChild(listText);
								listNode.appendChild(listItem);
								if (listNode.id == "whois") {
									var manualEntry = document.createElement("INPUT");
									manualEntry.setAttribute("id","whoisManual");
									manualEntry.setAttribute("type","text");
									manualEntry.setAttribute("value","[If you know who owns this site, enter them here]");
									listNode.appendChild(manualEntry);
								}
								formName.appendChild(listNode);
						}
						break;
			case "vl":
				if (fields[i][2].length > 0) {
						var listNode = document.createElement("OL");
						listNode.setAttribute("id", fields[i][0]);
						var itemsArray = fields[i][2];
						var itemsLength = itemsArray.length;
						for(var x = 0; x < itemsLength; x++){
								var listItem = document.createElement("LI");
								listItem.setAttribute("id","FNlink"+x);
								var itemLink = document.createElement('a')
								var linkText = document.createTextNode(itemsArray[x]);// Create a text node
								itemLink.appendChild(linkText);
								itemLink.href = itemsArray[x];
								itemLink.setAttribute('target', '_blank');
								listItem.appendChild(itemLink);
								listNode.appendChild(listItem);
								var remove = document.createElement("INPUT");
								remove.setAttribute("id","FNremove"+x);
								remove.setAttribute("type","button");
								remove.setAttribute("value","Remove");
									remove.setAttribute("class","remove");
								var removeID = remove.id
								remove.addEventListener("click", function() {
									var removeID = this.id;
									removeItem(removeID);
								}, false);
								listNode.appendChild(remove);
						}
						formName.appendChild(listNode);
					}
				else {
							var listNode = document.createElement("UL");
							listNode.setAttribute("id", fields[i][0]);
							formName.appendChild(listNode);
					}
				if (fields[i][0] == "allLinks") {
				var addDiv = document.createElement("DIV");
				var addText = document.createElement("INPUT");
				var add = document.createElement("INPUT");
				add.setAttribute("id","FNadd");
				add.setAttribute("type","button");
				add.setAttribute("value","Add another Link");
				addText.setAttribute("id","FNaddtext");
				addText.setAttribute("type","text");
				addText.setAttribute("value","[Start with http://]");
				add.addEventListener("click", function() {
					var addItem = document.getElementById("FNaddtext").value;
					var parentItem = document.getElementById("allLinks");
					addLinkItem(addItem, parentItem);
				}, false);
				addDiv.appendChild(add);
				addDiv.appendChild(addText);
				formName.appendChild(addDiv);
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
			case "e": // an empty field
				var inputElement = document.createElement("input"); //input element, text
				inputElement.setAttribute('type',"text");
				inputElement.setAttribute("id",fields[i][0]);
				inputElement.value = "";
				if (fields[i][4] == 1) {
					inputElement.setAttribute("required","");
					inputElement.setAttribute("class", "FNrequired")
				}
				formName.appendChild(inputElement);
				break;
			case "lt": // an empty paragraph text field
				var inputElement = document.createElement("textarea"); //input element, textarea
				inputElement.setAttribute('type',"text");
				inputElement.setAttribute('rows',"5");
				inputElement.setAttribute('cols',"150");
				inputElement.setAttribute("id",fields[i][0]);
				inputElement.value = "";
				if (fields[i][4] == 1) {
					inputElement.setAttribute("required","");
					inputElement.setAttribute("class", "FNrequired")
				}
				formName.appendChild(inputElement);
				break;
			case "b": // a boolean checkbox
				var inputElement = document.createElement("input"); //input element, text
				inputElement.setAttribute('type',"checkbox");
				inputElement.setAttribute("id",fields[i][0]);
				inputElement.value = "";
				if (fields[i][4] == 1) {
					inputElement.setAttribute("required","");
					inputElement.setAttribute("class", "FNrequired")
				}
				formName.appendChild(inputElement);
				break;
		/* ELI - Can we vary the values but use the same code for the slider? */
		 case "s3": // https://codepen.io/Buttonpresser/pen/qiuIx
				var currentLikert = 0;
				var values3 = ['1 = Not Clickbait', '2 = Some Bait Markers','3 = Definitely Clickbait']
				var listNode = document.createElement("UL");
					listNode.setAttribute("id", fields[i][0]);
					listNode.setAttribute("class", "likert");
					for(var x = 0; x < 3; x++){
						var listItem = document.createElement("LI");
						var inputElement = document.createElement("input"); //input element, text
						inputElement.setAttribute('type',"radio");
						inputElement.setAttribute('name',"likerts3");
						inputElement.setAttribute('value',x+1);
						var labelElement = document.createElement("label");
						var labelText = document.createTextNode(values3[x]);
						labelElement.appendChild(labelText);
						listItem.appendChild(labelElement);
						listItem.appendChild(inputElement);
						listNode.appendChild(listItem);
					}
				formName.appendChild(listNode);
				break;
			case "s51": // https://codepen.io/Buttonpresser/pen/qiuIx
				var currentLikert = 0;
				var values5 = ['1 = No Ads', '1-2 Ads','3 = Some Ads','4 = Many Ads','5 = Too Many Ads']
				var listNode = document.createElement("UL");
					listNode.setAttribute("id", fields[i][0]);
					listNode.setAttribute("class", "likert");
					for(var x = 0; x < 5; x++){
						var listItem = document.createElement("LI");
						var inputElement = document.createElement("input"); //input element, text
						inputElement.setAttribute('type',"radio");
						inputElement.setAttribute('name',"likerts51");
						inputElement.setAttribute('value',x+1);
						var labelElement = document.createElement("label");
						var labelText = document.createTextNode(values5[x]);
						labelElement.appendChild(labelText);
						listItem.appendChild(labelElement);
						listItem.appendChild(inputElement);
						listNode.appendChild(listItem);
					}
				formName.appendChild(listNode);
			break;
		}
		// MBM1
		console.log(fields[i][0]);
		console.log(fields[i][6]);
		if (fields[i][6] != "") {
			var	helpHref="https://"+fields[i][6];	
			var helpLink = document.createElement("a");
			helpLink.href = helpHref;
			helpLink.className +=" help-link";
			helpLink.setAttribute('target', '_blank');
			var helpImg = document.createElement("img");
			var helpIcon = chrome.extension.getURL("/help.png");
			helpImg.src = helpIcon;
			helpLink.appendChild(helpImg);
			formName.appendChild(helpLink);
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
			p2Form.style.display = 'block';
			p2Form.appendChild(downloadElement);
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
		var mode = "post";
		sendToServer(buildObject(fields, fieldsP2, config, mode))
		} else {
			alert ('Please fill out required fields');
		}
	}, false)
	formName.appendChild(submitElement);

	var downloadElement = document.createElement("input");
	downloadElement.setAttribute('type','button');
	downloadElement.setAttribute('value',"Download Input");
	downloadElement.setAttribute('id','FNdownload');
	downloadElement.addEventListener('click', function() {
		var mode = "download";
		sendToServer(buildObject(fields, fieldsP2, config, mode))
	}, false)
	formName.appendChild(downloadElement);

	var cancelElement = document.createElement("input"); //input element, cancel
	cancelElement.setAttribute('type',"button");
	cancelElement.setAttribute('value',"Cancel (You will lose your work)");
	cancelElement.setAttribute('id','cancel');
	cancelElement.addEventListener('click', cancelForm, false);
	formName.appendChild(cancelElement);
	formDiv.appendChild(formName);

	// Build Page 2 Elements (and hide)
	var p2Form = document.createElement("form");
	p2Form.setAttribute('id', "FakeNewsPageTwo")
	p2Form.setAttribute('style','display:none');

	// Create form on page 2
	for(var i = 0; i < fieldsP2.length; i++){
		var labelElement = document.createElement("label");
		labelElement.setAttribute("for", fieldsP2[i][0]);
		if (fieldsP2[i][4] == 0) {
			var labelText = document.createTextNode(fieldsP2[i][1]+": ");
		} else {
			var labelText = document.createTextNode(fieldsP2[i][1]+"* : ");
		}
		labelElement.appendChild(labelText);
		p2Form.appendChild(labelElement);
		switch(fieldsP2[i][3]) {
			case "lt": // an empty paragraph text field
				var inputElement = document.createElement("textarea"); //input element, textarea
				inputElement.setAttribute('type',"text");
				inputElement.setAttribute('rows',"5");
				inputElement.setAttribute('cols',"150");
				inputElement.setAttribute("id",fieldsP2[i][0]);
				inputElement.value = "";
				if (fieldsP2[i][4] == 1) {
					inputElement.setAttribute("required","");
					inputElement.setAttribute("class", "FNrequired")
				}
				p2Form.appendChild(inputElement);
				break;
			case "a":
					var divElement = document.createElement("div");
						divElement.setAttribute('id','blankLinks');
					var newLink = document.createElement("input");
						newLink.setAttribute('type',"button");
						newLink.setAttribute('value',"Add New URL");
						newLink.setAttribute('class','newField');
						newLink.addEventListener('click', addLink, false);
						divElement.appendChild(newLink);
						p2Form.appendChild(divElement);
					var inputElement = document.createElement("input"); //input element, text
						inputElement.setAttribute('type',"text");
						inputElement.setAttribute("id",fieldsP2[i][0]);
						inputElement.setAttribute('class','emptyField');
						inputElement.value = "[Begin with http://]";
						if (fieldsP2[i][4] == 1) {
							inputElement.setAttribute("required","");
							inputElement.setAttribute("class", "FNrequired")
						}
						divElement.appendChild(inputElement);
					break;
			case "v":
						if (fieldsP2[i][2].length > 1) {
								var listNode = document.createElement("OL");
								listNode.setAttribute("id", fieldsP2[i][0]);
								listNode.setAttribute("style","list-style:none;");
								var itemsArray = fieldsP2[i][2];
								var itemsLength = itemsArray.length;
								for(var x = 0; x < itemsLength; x++){
										var listItem = document.createElement("LI"); // Create a <li> node
										var listText = document.createTextNode(itemsArray[x]);// Create a text node
										listItem.appendChild(listText);
										listNode.appendChild(listItem);
								}
								p2Form.appendChild(listNode);
						}
						else {
								var listNode = document.createElement("DIV");
								listNode.setAttribute("id", fieldsP2[i][0]);
								var listItem = document.createElement("A");
								listItem.href = fieldsP2[i][2];
								listItem.setAttribute('target', '_blank');
								var listText = document.createTextNode('No Data. Click Here to look up on ICANN WHOIS');
								listItem.appendChild(listText);
								listNode.appendChild(listItem);
								if (listNode.id == "whois") {
									var manualEntry = document.createElement("INPUT");
									manualEntry.setAttribute("id","whoisManual");
									manualEntry.setAttribute("type","text");
									manualEntry.setAttribute("value","[If you know who owns this site, enter them here]");
									listNode.appendChild(manualEntry);
								}
								p2Form.appendChild(listNode);
						}


						break;
			case "vl":
				if (fieldsP2[i][2].length > 0) {
						var listNode = document.createElement("OL");
						listNode.setAttribute("id", fieldsP2[i][0]);
						var itemsArray = fieldsP2[i][2];
						var itemsLength = itemsArray.length;
						for(var x = 0; x < itemsLength; x++){
								var listItem = document.createElement("LI");
								listItem.setAttribute("id","FNlink"+x);
								var itemLink = document.createElement('a')
								var linkText = document.createTextNode(itemsArray[x]);// Create a text node
								itemLink.appendChild(linkText);
								itemLink.href = itemsArray[x];
								itemLink.setAttribute('target', '_blank');
								listItem.appendChild(itemLink);
								listNode.appendChild(listItem);
								var remove = document.createElement("INPUT");
								remove.setAttribute("id","FNremove"+x);
								remove.setAttribute("type","button");
								remove.setAttribute("value","Remove");
									remove.setAttribute("class","remove");
								var removeID = remove.id
								remove.addEventListener("click", function() {
									var removeID = this.id;
									removeItem(removeID);
								}, false);
								listNode.appendChild(remove);
						}
						p2Form.appendChild(listNode);
				}
				else {
						var listNode = document.createElement("UL");
						listNode.setAttribute("id", fieldsP2[i][0]);
						p2Form.appendChild(listNode);
				}
				if (fieldsP2[i][0] == "allLinks") {
					var addDiv = document.createElement("DIV");
					var addText = document.createElement("INPUT");
					var add = document.createElement("INPUT");
					add.setAttribute("id","FNadd");
					add.setAttribute("type","button");
					add.setAttribute("value","Add another Link");
					addText.setAttribute("id","FNaddtext");
					addText.setAttribute("type","text");
					addText.setAttribute("value","[Start with http://]");
					add.addEventListener("click", function() {
						var addItem = document.getElementById("FNaddtext").value;
						var parentItem = document.getElementById("allLinks");
						addLinkItem(addItem, parentItem);
					}, false);
					addDiv.appendChild(add);
					addDiv.appendChild(addText);
					p2Form.appendChild(addDiv);
						}
				break;
			case "f":
				var inputElement = document.createElement("input"); //input element, text
				inputElement.setAttribute('type',"text");
				inputElement.setAttribute("id",fieldsP2[i][0]);
				inputElement.value = fieldsP2[i][2];
				if (fields[i][4] == 1) {
					inputElement.setAttribute("required","");
					inputElement.setAttribute("class", "FNrequired")
				}
				p2Form.appendChild(inputElement);
				break;
			case "e": // an empty field
				var inputElement = document.createElement("input"); //input element, text
				inputElement.setAttribute('type',"text");
				inputElement.setAttribute("id",fieldsP2[i][0]);
				inputElement.value = "";
				if (fieldsP2[i][4] == 1) {
					inputElement.setAttribute("required","");
					inputElement.setAttribute("class", "FNrequired")
				}
				p2Form.appendChild(inputElement);
				break;
			case "b": // a boolean checkbox
				var inputElement = document.createElement("input"); //input element, text
				inputElement.setAttribute('type',"checkbox");
				inputElement.setAttribute("id",fieldsP2[i][0]);
				inputElement.value = "";
				if (fieldsP2[i][4] == 1) {
					inputElement.setAttribute("required","");
					inputElement.setAttribute("class", "FNrequired")
				}
				p2Form.appendChild(inputElement);
				break;
			case "s5": // https://codepen.io/Buttonpresser/pen/qiuIx
				var currentLikert = 0;
				var values5 = ['1 = Full Mistrust', '2 = Some Mistrust','3 = Cannot Tell','4 = Some Trust','5 = Full Trust']
				var listNode = document.createElement("UL");
					listNode.setAttribute("id", fieldsP2[i][0]);
					listNode.setAttribute("class", "likert");
					for(var x = 0; x < 5; x++){
						var listItem = document.createElement("LI");
						var inputElement = document.createElement("input"); //input element, text
						inputElement.setAttribute('type',"radio");
						inputElement.setAttribute('name',"likerts5");
						inputElement.setAttribute('value',x+1);
						var labelElement = document.createElement("label");
						var labelText = document.createTextNode(values5[x]);
						labelElement.appendChild(labelText);
						listItem.appendChild(labelElement);
						listItem.appendChild(inputElement);
						listNode.appendChild(listItem);
					}
				p2Form.appendChild(listNode);
				break;
		/* ELI - Can we vary the values but use the same code for the slider? */
			case "s31": // https://codepen.io/Buttonpresser/pen/qiuIx
				var currentLikert = 0;
				var values31 = ['1 = No Bias', '2 = Some Bias','3 = High Bias']
				var listNode = document.createElement("UL");
					listNode.setAttribute("id", fieldsP2[i][0]);
					listNode.setAttribute("class", "likert");
					for(var x = 0; x < 3; x++){
						var listItem = document.createElement("LI");
						var inputElement = document.createElement("input"); //input element, text
						inputElement.setAttribute('type',"radio");
						inputElement.setAttribute('name',"likerts31");
						inputElement.setAttribute('value',x+1);
						var labelElement = document.createElement("label");
						var labelText = document.createTextNode(values31[x]);
						labelElement.appendChild(labelText);
						listItem.appendChild(labelElement);
						listItem.appendChild(inputElement);
						listNode.appendChild(listItem);
					}
				p2Form.appendChild(listNode);
				break;
			case "s52": // https://codepen.io/Buttonpresser/pen/qiuIx
				var currentLikert = 0;
				var values52 = ['1 = Very Anti', '2 = Some Anti','3 = Neutral / Open','4 = Some Pro','5 = Very Pro']
				var listNode = document.createElement("UL");
					listNode.setAttribute("id", fieldsP2[i][0]);
					listNode.setAttribute("class", "likert");
					for(var x = 0; x < 5; x++){
						var listItem = document.createElement("LI");
						var inputElement = document.createElement("input"); //input element, text
						inputElement.setAttribute('type',"radio");
						inputElement.setAttribute('name',"likerts52");
						inputElement.setAttribute('value',x+1);
						var labelElement = document.createElement("label");
						var labelText = document.createTextNode(values52[x]);
						labelElement.appendChild(labelText);
						listItem.appendChild(labelElement);
						listItem.appendChild(inputElement);
						listNode.appendChild(listItem);
					}
				p2Form.appendChild(listNode);
				break;
		}
	}


	var pageBackElement = document.createElement("input"); //input element, page back to 1
	pageBackElement.setAttribute('type',"button");
	pageBackElement.setAttribute('value',"Go to Page 1");
	pageBackElement.setAttribute('id',"pageOne");
	pageBackElement.addEventListener("click", function() {
		p2Form.style.display = 'none';
		formName.style.display = 'block';
		formName.appendChild(downloadElement);
	}, false);
	p2Form.appendChild(pageBackElement);
	var submitAllElement = document.createElement("input"); //input element, Submit All button
	submitAllElement.setAttribute('type',"button");
	submitAllElement.setAttribute('value',"Submit All Data");
	submitAllElement.setAttribute('id',"submitAll");
	submitAllElement.addEventListener("click", function() {
		var mode = "post";
		sendToServer(buildObject(fields, fieldsP2, config, mode))
	}, false)
	p2Form.appendChild(submitAllElement);
	var cancelAllElement = document.createElement("input"); //input element, cancel
	cancelAllElement.setAttribute('type',"button");
	cancelAllElement.setAttribute('value',"Cancel (You will lose your work)");
	cancelAllElement.setAttribute('id','cancelAll');
	cancelAllElement.addEventListener('click', cancelForm, false);
	p2Form.appendChild(cancelAllElement);
	formDiv.appendChild(p2Form);

	if (document.getElementById('FakeNewsForm')) {
		document.getElementById('FakeNewsForm').replaceWith(formDiv);
	}
	else {
	document.getElementsByTagName('body')[0].appendChild(formDiv);
	};
};
