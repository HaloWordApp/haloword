chrome.extension.onMessage.addListener(
	function(request, sender, sendResponse) {
    console.log(request);
    if (request.greeting == "hello")
    	sendResponse({done: true});
});
