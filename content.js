var fieldNameLookupObject = {};
function sendToServer(obj) {
	//build the document
	var documentObject = {};
	documentObject.title = '';
	documentObject.body = {};
	documentObject.body.content = [];
	var studentName = '';

	for(var i = 0; i < obj.fieldValue.length; i++){
		fieldValueItem = obj.fieldValue[i];
		documentObject = addDocumentItem(documentObject, fieldValueItem['field'], fieldValueItem['fieldName'], fieldValueItem['value']);
		if (fieldValueItem['field'] === 'field_student_name') {
			studentName = fieldValueItem['value'];
		}
	}

	//Check mode (download or post) and do it.
	if (obj.mode == 'download') {
		chrome.runtime.sendMessage({text:'download', downloadData: JSON.stringify(documentObject)}, null);
	}
	else {
		const htmlToPost = convertObjectToHtml(documentObject);
		const documentTitleWithArticleTitle = googleDriveDocumentTitle + controller.getTitle();
		var documentTitle = studentName ? documentTitleWithArticleTitle + ' by ' + studentName : documentTitleWithArticleTitle;
		const today = new Date();
		documentTitle += " (" + (today.getMonth() + 1) + "/" + today.getDate() + "/" + today.getFullYear() + ")";
		createDriveFile(htmlToPost, documentTitle )
			.then(data => {
				if (data.error) {
					errorMessage = data.error.message ? "There was an error submitting your data: " + data.error.message : "There was an unknown error submitting your data.";
					alert(errorMessage)
				} else {
					alert("Thank you for submitting your data. Please visit your Google Drive and view the document " + documentTitle + ".")
				}
			});
	}
}

// Listen for messages
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
	
	// Process URL here so we only run controller function once
	var thisURL = controller.getURL();

	const jsonLd = controller.getJsonLd();

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
				msg.config.filled_form_page_1[i][2] = controller.dateFinder(jsonLd);
				break;
			case "articleAuthor":
				msg.config.filled_form_page_1[i][2] = controller.getJsonLdValue(jsonLd,"author", "name");
				break;
			case "articleAuthorLink":
				msg.config.filled_form_page_1[i][2] = controller.getAuthorLink(jsonLd);
				break;
			case "pageType":
				msg.config.filled_form_page_1[i][2] = controller.getJsonLdValue(jsonLd,"@type");
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
				msg.config.filled_form_page_2[i][2] = msg.whois;
				break;
			default:
				msg.config.filled_form_page_2[i][2] = ""
		}
	}

	//Build the form
	makeForm(msg.config.filled_form_page_1, msg.config.filled_form_page_2, msg.config.typeAndOG);
	googleDriveDocumentTitle = msg.config.documentTitle;
	googleDriveAPIToken = msg.googleDriveAPIToken
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

// extract json-ld from HTML
  function getJsonLd () {
  	var returnValue = ''
  	const jsonLdString = document.querySelectorAll('script[type="application/ld+json"]');
  	if (jsonLdString.length > 0) {
	    returnValue = JSON.parse(jsonLdString[0].text);
    } else {
  		returnValue = {};
    }
  	return returnValue;
}

function getJsonLdValue(jsonLd, field, subfield = null) {
	if (field in jsonLd) {
		const fieldValue = jsonLd[field];
		if (subfield) {
			if (fieldValue.length) {
				return fieldValue[0][subfield];
			} else {
				return fieldValue[subfield];
			}
		} else {
			return fieldValue;
		}
	} else {
		return '';
	}
}



// extract author link from jsonLd
	function getAuthorLink (jsonLd) {
		const authorName = getJsonLdValue(jsonLd, "author", "name");
		const authorUrl = getJsonLdValue(jsonLd, "author", "url");
  	   if (authorName && authorUrl) {
			var itemLink = document.createElement('a')
			var linkText = document.createTextNode(authorName);// Create a text node
			itemLink.appendChild(linkText);
			itemLink.href = authorUrl;
			itemLink.setAttribute('target', '_blank');
			//TODO - fix issue where link is not clickable
			return itemLink;
		} else {
			return ['n/a'];
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
		  var baseToCheck = aboutItems[a].href.split("/")[2].split(".");
		  if (baseToCheck.length === 3) {
			var domainToCheck = baseToCheck[1]+"."+baseToCheck[2];
		  }
		  else {
			var domainToCheck = baseToCheck[0]+"."+baseToCheck[1];
		  }
		  //check that link is inside of this domain
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
function dateFinder (jsonLd) {
	const dateModified = getJsonLdValue(jsonLd, "dateModified")
	const datePublished = getJsonLdValue(jsonLd, "datePublished")
	if (dateModified) {
		return formatDate(dateModified);
	} else if (datePublished) {
		return formatDate(datePublished);
	} else {
		var modifiedDate = new Date(document.lastModified);
		var today = new Date();
		//Check for dynamically created page
		if (String(modifiedDate) !== String(today)) {
			var splitDate = String(modifiedDate).split(' ');
			var returnDate = splitDate[0] + ' ' + splitDate[1] + ' ' + splitDate[2] + ' ' + splitDate[3];
			return returnDate;
		}
		//If modifiedDate doesn't work, search page for updated, posted, revised, modified + date
		else {
			var bodyTag = document.getElementsByTagName("body");
			var bodyDates = bodyTag[0].innerText.match(/((((U|u)pdated)|((P|p)osted)|((R|r)evised)|((M|m)odified))( |: | on )(\d{1,2})(-|\/)(\d{1,2})(-|\/)(\d{4}))|(\d{1,2})(-|\/)(\d{1,2})(-|\/)(\d{4})/);
			//Check that we found anything
			if (bodyDates) {
				return bodyDates.toString();
			} else {
				return 'No dates found.  Enter if you find one.';
			}
			;
		}
		;
	};
};

// lists all links within body of page
	function linkFinder () {
		var linkList = [];
		var link;
		var article = '';
		var articleElements = document.getElementsByTagName("article");
		if (articleElements.length != 0) {
			article = articleElements[0];
		} else {
			articleElements = document.getElementsByTagName("div");
			for (var i = 0; i < articleElements.length; i++) {
				if (articleElements[i].getAttribute('id') === 'content') {
					article = articleElements[i];
				}
			}
		}
		if (article) {
			const allLinks = article.getElementsByTagName('a');
			for (var i = 0; i < allLinks.length; i++) {
				link = allLinks[i].getAttribute('href');
				if (link && link.indexOf('http') === 0 &&
					!checkSelfReferralLink(link) &&
					!checkSocialPostLink(link)) {
					linkList.push(link);
				}
			}
		}
		return linkList;
	};


function checkSocialPostLink(link) {
	const socialPostUrls = [
		'https://www.facebook.com/dialog/feed',
		'https://api.whatsapp.com/send',
		'https://twitter.com/intent/tweet',
		'https://www.linkedin.com/shareArticle',
		'https://pinterest.com/pin/create'
	];
	for (var i = 0; i < socialPostUrls.length; i++) {
		if (link.indexOf(socialPostUrls[i]) === 0) {
			return true;
		}
	}
	return false;
}

function checkSelfReferralLink(link) {
	var baseToCheck = link.split("/")[2].split(".");
	if (baseToCheck.length === 3) {
		var domainToCheck = baseToCheck[1]+"."+baseToCheck[2];
	}
	else {
		var domainToCheck = baseToCheck[0]+"."+baseToCheck[1];
	}
	//check that link is a source e.g. outside of this domain
	return controller.domainFinder() === domainToCheck;
}

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
	getAuthorLink: getAuthorLink,
	getJsonLdValue: getJsonLdValue,
	getJsonLd: getJsonLd,
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
		if (reqmax === 0) {
			return true;
		}
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
	if (parentItem == "allLinks") {
	  var itemLink = document.createElement('a')
	} else {
	  var itemLink = document.createElement('li')
	}
	var linkText = document.createTextNode(item);
	itemLink.appendChild(linkText);
	if (parentItem == "allLinks") {
	  itemLink.href = item;
	  itemLink.setAttribute('target', '_blank');
	}
	listItem.appendChild(itemLink);
	parentItem.appendChild(listItem);
	var resetValue = document.getElementById("FNaddtext")
	if (parentItem == "allLinks") {
	  resetValue.value = "[Begin with http://]";
	} else {
	  resetValue.value = "";
	}
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
	fieldValueObject = [];
	obj = {};
	for (var f = 0; f < fields.length; f++) {
		obj[fields[f][0]] = document.getElementById(fields[f][0]);
		fieldName = fieldNameLookupObject[fields[f][0]];
		fieldValueObject.push({"field": fields[f][5], "value": getFieldValue(fields[f]), "fieldName": fieldName});
	}
	for (var c = 0; c <fieldsP2.length; c++) {
		obj[fieldsP2[c][0]] = document.getElementById(fieldsP2[c][0]);
		fieldName = fieldNameLookupObject[fieldsP2[c][0]];
		fieldValueObject.push({"field": fieldsP2[c][5], "value": getFieldValue(fieldsP2[c]), "fieldName": fieldName});
	}
	obj.type = config[0].type;
	obj.mode = mode;
	if (obj.OG && obj.OG.value == "") {
		obj.OG = config[1].groupID;
	} else {
		obj.OG = {};
		obj.OG.value = '';
	}
	obj.fieldValue = fieldValueObject;
	return obj;
}

function getFieldValue(fieldData) {
	fieldValue = document.getElementById(fieldData[0]).value;
	if (fieldData[3][0] === 's') {
		fieldValue = getLikertValue(obj[fieldData[0]]);
	} else if (fieldData[3] === 'b') {
		fieldValue = getCheckboxValue(obj[fieldData[0]]);
	} else if (fieldData[3] === 'vl') {
		fieldValue = getListValue(obj[fieldData[0]]);
	} else if (fieldData[3] === 'v') {
		fieldValue = getArrayValue(obj[fieldData[0]]);
	}
	return fieldValue ? fieldValue : '';
}

function getLikertValue(fieldData) {
	value = '';
	var items = fieldData.childNodes;
	for (var i = 0; i < items.length; i++) {
		if (items[i].childNodes[1].checked === true) {
			value = parseInt(items[i].childNodes[1].value);
			return value;
		}
	}
}

function getCheckboxValue(fieldData) {
	return fieldData.checked ? 'yes' : 'no';
}

function getListValue(fieldData) {
	var value = '';
	try {
		for (var i = 0; i < fieldData.childNodes.length; i++) {
			if (fieldData.childNodes[i].innerText) {
				value += fieldData.childNodes[i].innerText + "\n"
			}
		}
	}
	catch(err) {
		value = '';
	}
	return value;
}

function getArrayValue(fieldData) {
	value = '';
	var items = fieldData.childNodes;
	for (var i = 0; i < items.length; i++) {
		value += items[i].childNodes[0].textContent + "\n";
	}
	//remove the last line break
	return value.length > 0 ? value.substring(0, value.length - 1) : "";
}
// create form on page one
function makeForm(fields, fieldsP2, config) {
	// Move Body Down
	// Create Form Object Page 1
	var formDiv = document.createElement("div");
	formDiv.setAttribute('id', "FakeNewsForm");
	// Build Page 1 Elements
	var formName = document.createElement("form");
	for(var i = 0; i < fields.length; i++){
		fieldNameLookupObject[fields[i][0]] = fields[i][1];
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
				var addDiv = document.createElement("DIV");
				var addText = document.createElement("INPUT");
				var add = document.createElement("INPUT");
				add.setAttribute("id","FNadd");
				add.setAttribute("type","button");
				add.setAttribute("value","Add another");
				addText.setAttribute("id","FNaddtext");
				addText.setAttribute("type","text");
				if (fields[i][0] == "allLinks") {
				addText.setAttribute("value","[Start with http://]");
				}
				add.addEventListener("click", function() {
					var addItem = document.getElementById("FNaddtext").value;
					var parentItem = document.getElementById(fields[i][0]);
					addLinkItem(addItem, parentItem);
				}, false);
				addDiv.appendChild(add);
				addDiv.appendChild(addText);
				formName.appendChild(addDiv);
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
						listItem.appendChild(inputElement);
						listItem.appendChild(labelElement);
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
						listItem.appendChild(inputElement);
						listItem.appendChild(labelElement);
						listNode.appendChild(listItem);
					}
				formName.appendChild(listNode);
			break;
		}
		// MBM1
		if (fields[i][6] != "") {
			var	helpHref="https://"+fields[i][6];
			var helpLink = document.createElement("a");
			helpLink.href = helpHref;
			helpLink.className +=" help-link";
			helpLink.setAttribute('target', '_blank');
			var helpImg = document.createElement("img");
			helpImg.src = chrome.runtime.getURL("/help.png");
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
		fieldNameLookupObject[fieldsP2[i][0]] = fieldsP2[i][1];
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
				var addDiv = document.createElement("DIV");
				var addText = document.createElement("INPUT");
				var add = document.createElement("INPUT");
				add.setAttribute("id","FNadd");
				add.setAttribute("type","button");
				if (fieldsP2[i][0] == "allLinks") {
				  add.setAttribute("value","Add Link");
				} else {
				  add.setAttribute("value","Add Resource");
				}
				addText.setAttribute("id","FNaddtext");
				addText.setAttribute("type","text");
				if (fieldsP2[i][0] == "allLinks") {
				addText.setAttribute("value","[Start with http://]");
				}
				add.addEventListener("click", function() {
					var addItem = this.parentNode.childNodes[1].value;
					var parentItem = this.parentNode;
					addLinkItem(addItem, parentItem);
				}, false);
				addDiv.appendChild(add);
				addDiv.appendChild(addText);
				listNode.appendChild(addDiv);
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
						listItem.appendChild(inputElement);
						listItem.appendChild(labelElement);
						listNode.appendChild(listItem);
					}
				p2Form.appendChild(listNode);
				break;
		/* ELI - Can we vary the values but use the same code for the slider? */
			case "s31": // https://codepen.io/Buttonpresser/pen/qiuIx
				var currentLikert = 0;
				var values31 = ['1 = Low Bias', '2 = Some Bias','3 = High Bias']
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
						listItem.appendChild(inputElement);
						listItem.appendChild(labelElement);
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
						listItem.appendChild(inputElement);
						listItem.appendChild(labelElement);
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

async function createDriveFile(fileData = '', fileName = '') {
	sectionBoundary = '981273423198471923847';
	metaData = {'name': fileName};
	dataToSend = '--' + sectionBoundary + '\n' +
		'Content-Type: application/json\n' +
		'\n' +
		JSON.stringify(metaData) +
		'\n' +
		'--' + sectionBoundary + '\n' +
		'Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document\n' +
		'\n' +
		fileData +
		'\n' +
		'--' + sectionBoundary + '--';
	url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";
		const response = await fetch(url, {
			method: 'POST', // *GET, POST, PUT, DELETE, etc.
			mode: 'cors', // no-cors, *cors, same-origin
			cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
			credentials: 'same-origin', // include, *same-origin, omit
			headers: {
				'Content-Type': 'multipart/related; boundary=' + sectionBoundary,
				'Accept': 'text/html',
				'Content-Length': dataToSend.length,
				'Authorization': 'Bearer ' + googleDriveAPIToken
				// 'Content-Type': 'application/x-www-form-urlencoded',
			},
			redirect: 'follow', // manual, *follow, error
			referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
			body: dataToSend // body data type must match "Content-Type" header
		});
	responseJson = response.json();
	return responseJson;
}

//create the document as an object so it can be manipulated, if needed
function addDocumentItem(documentObject, tag, header, text) {
	item = {};
	item.tag = tag;
	item.header = header;
	item.text = text;
	documentObject.body.content.push(item);
	return documentObject;
}

function convertObjectToHtml(dataObject) {
	htmlString = '<html><body>';
	for (const [key, value] of Object.entries(dataObject.body.content)) {
		htmlString += '<h3 sectionId="' + replaceHtmlTags(value.tag) + '">' + replaceHtmlTags(value.header) + '</h3>';
		htmlString += '<p sectionId="' + replaceHtmlTags(value.tag) + '">' + replaceHtmlTags(value.text) + '</p>';
	}
	htmlString += '</body></html>';
	return htmlString;
}

function replaceHtmlTags(value) {
	try {
		value = value.toString().replaceAll('<', "{");
		value = value.toString().replaceAll('>', "}");
		value = value.toString().replaceAll('\n', "<br />");
	} catch(err) {
		console.log(err);
		console.log(value);
	}

	return value;
}

//TODO - make a js file for this and other shared functions
function formatDate (dateString) {
	var dateArray = dateString.split("-");
	return dateArray[1]+ "/" +dateArray[2].substr(0,2)+ "/" +dateArray[0];
}