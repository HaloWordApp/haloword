chrome.extension.onMessage.addListener(
    function(request, sender, sendResponse) {
        init_db();
        if (request.method == "find") {
            console.log("find");
            sendResponse( {exist: is_word_exist(request.word)} );
        }
        else if (request.method == "add") {
            storage_word(request.word);
        }
        else if (request.method == "remove") {
            remove_word(request.word);
        }
    }
);