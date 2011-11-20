chrome_getJSON = function(url, args, callback) {
  chrome.extension.sendRequest({action: 'getJSON', url: url, args: args }, callback);
}

function is_chinese(word) {
    return /^[\u4e00-\u9fa5]+$/g.test(word); 
}

function is_english(word) {
    return /^[a-z\sA-Z]+$/g.test(word); 
}

function valid_word(word) {
    if (word.length == 0 || word.length > 20) {
        return false;
    }
    if (is_chinese(word)) {
        return "Chinese";
    }
    else if (is_english(word)) {
        return "English";
    }
    return false;
}

haloword_opened = false;
$("body").append('<div id="haloword-lookup" class="ui-widget-content">\
<div id="haloword-title">\
<span id="haloword-word"></span>\
<div id="haloword-control-container">\
<a href="#" id="haloword-open" class="haloword-button" title="查看单词详细释义" target="_blank"></a>\
<a herf="#" id="haloword-close" class="haloword-button" title="关闭查询窗"></a>\
</div>\
<br style="clear: both;" />\
</div><div id="haloword-content"></div></div>');
$("html").click(function(event) {
    if (haloword_opened) {
        var target = $(event.target);
        if (target.attr("id") != "haloword-lookup" && !target.parents("#haloword-lookup")[0]) {
            $("#haloword-lookup").hide();
            haloword_opened = false;
        }
    }
});

icon_url = chrome.extension.getURL("img/icon.svg");
style_content = "<style>\
#haloword-pron { background: url(" + icon_url + ") -94px -32px; }\
#haloword-pron:hover { background: url(" + icon_url + ") -110px -32px; }\
#haloword-open { background: url(" + icon_url + ") -94px -16px; }\
#haloword-open:hover { background: url(" + icon_url + ") -110px -16px; }\
#haloword-close { background: url(" + icon_url + ") -94px 0; }\
#haloword-close:hover { background: url(" + icon_url + ") -110px 0; }</style>";
if ($("head")[0]) {
    $($("head")[0]).append(style_content);
}
else {
    $($("body")[0]).prepend(style_content);
}

$("#haloword-lookup").draggable({ handle: "#haloword-title" });

$("body").mouseup(function(e) {
    if (!e.ctrlKey && !e.metaKey) {
        return;
    }
    selection = $.trim(window.getSelection());
    lang = valid_word(selection);
    if (!lang) {
        return;
    }
    $("#haloword-word").html(selection);
    $("#haloword-lookup").attr("style", "left: " + e.pageX + "px;" + "top: " + e.pageY + "px;");
    $("#haloword-open").attr("href", chrome.extension.getURL("main.html#" + selection));
    $("#haloword-close").click(function() {
        $("#haloword-lookup").hide();
        haloword_opened = false;
        return false;
    });

    $("#haloword-content").html("<p class=\"loading\">Loading definitions...</p>");
    $("#haloword-lookup").show();

    chrome_getJSON("http://www.google.com/dictionary/json?callback=?", {
        q: selection,
        sl: "en",
        tl: "zh-cn"
    },
    function(data) {
        if (!data.primaries) {
            $("#haloword-content").html("<p class=\"notfound\">I'm sorry, Dave.<br />I'm afraid I can't find that.</p>");
            return;
        }
        meaning = process_primary(data.primaries);
        if (meaning) {
            $("#haloword-content").hide();
            $("#haloword-content").html(meaning);
            format_content();
            $("#haloword-content").show();
        }
        else {
            $("#haloword-content").html("<p class=\"notfound\">I'm sorry, Dave.<br />I'm afraid I can't find that.</p>");
        }
    });

    setTimeout(function() { haloword_opened = true; }, 100); // HACK: fix dict window not openable
});

function format_content() {
    
}
