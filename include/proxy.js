chrome.extension.onMessage.addListener(
    function(request, sender, sendResponse) {
        init_db();
        if (request.method == "find") {
            is_word_exist(request.word, function(tx, result) {
                sendResponse( {exist: result.rows.item(0).exist} );
            });
            return true;
        }
        else if (request.method == "add") {
            storage_word(request.word);
        }
        else if (request.method == "remove") {
            remove_word(request.word);
        }
    }
);