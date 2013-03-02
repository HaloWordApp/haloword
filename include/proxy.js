chrome.extension.onMessage.addListener(
    function(request, sender, sendResponse) {
        init_db();
        console.log(request);
        if (request.method == "add") {
            storage_word(request.word);
        }
        else if (request.method == "remove") {
            remove_word(request.word);
        }
    }
);