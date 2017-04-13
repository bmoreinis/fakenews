chrome.runtime.onMessage.addListener(function (msg, sender, response) {
  // First, validate the message's structure
  if (msg.text == 'download') {
	  console.log('recieved message');
	  let doc = URL.createObjectURL( new Blob([msg.downloadData], {type: 'text/csv'}) );
	  let filename = 'FNdata.csv';
	  console.log(doc);
	  chrome.downloads.download({ url: doc, filename: filename, conflictAction: 'overwrite', saveAs: true });
  }
});