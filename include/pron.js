function pronounce_exist(word) {
    exist(word.toLowerCase(), false);
}

function exist(word, is_upper) {
    pron_url = "http://www.gstatic.com/dictionary/static/sounds/de/0/" + word + ".mp3";
    wait = $.ajax({
        url: pron_url,
        timeout: 3000,
        success: exist_action,
        error: function (xhr, d, e) {
            if (!is_upper) {
                exist('!' + word[0].toUpperCase() + word.substring(1), true);
            }
        }
    });
}
