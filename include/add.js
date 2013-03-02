chrome.extension.onMessage.addListener(
	function(request, sender, sendResponse) {
    console.log(request);
    if (request.method == "add") {
	    
    }
	else if (request.method == "remove") {
		
	}
});
