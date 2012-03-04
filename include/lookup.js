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
    if (word.length === 0 || word.length > 20) {
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
haloword_html = '<div id="haloword-lookup" class="ui-widget-content">\
<div id="haloword-title">\
<span id="haloword-word"></span>\
<a herf="#" id="haloword-pron" class="haloword-button" title="发音"></a>\
<audio id="haloword-audio"></audio>\
<div id="haloword-control-container">\
<a href="#" id="haloword-open" class="haloword-button" title="查看单词详细释义" target="_blank"></a>\
<a herf="#" id="haloword-close" class="haloword-button" title="关闭查询窗"></a>\
</div>\
<br style="clear: both;" />\
</div><div id="haloword-content"></div></div>';
$("body").append(haloword_html);

// deal with Clearly
document.addEventListener("DOMNodeInserted", function(event) {
    var element = event.target;
    if ($(element).attr("id") == "readable_iframe") {
        // HACK: wait for iframe ready
        setTimeout(function() {
            $("body", element.contentDocument).mouseup(event_mouseup);
            $("body", element.contentDocument).click(event_click);
            if ($(element).css('z-index') >= 2147483647) {
                var style = $(element).attr('style') + ' z-index: 2147483646 !important';
                $(element).attr('style', style);
            }
        }, 1000);
    }
});

$("body").mouseup(event_mouseup);
$("body").click(event_click);

function event_click(event) {
    if (haloword_opened) {
        var target = $(event.target);
        if (target.attr("id") != "haloword-lookup" && !target.parents("#haloword-lookup")[0]) {
            $("#haloword-lookup").hide();
            haloword_opened = false;
        }
    }
}

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

function event_mouseup(e) {
    if (!e.ctrlKey && !e.metaKey) {
        return;
    }
    selection = $.trim(window.getSelection());
    if (!selection) {
        $("iframe").each(function() {
            if (this.contentDocument) {
                selection = $.trim(this.contentDocument.getSelection());
            }    
            if (selection) {
                return false;
            }
        });
    }
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

    $("#haloword-pron").hide();
    $("#haloword-content").html("<p>Loading definitions...</p>");
    $("#haloword-lookup").show();

    $.ajax({
        url: "http://dict.cn/ws.php?utf8=true&q=" + selection,
        dataType: "xml",
        success: function(data) {
            $(data).find("dict").each(function(i) { 
                var def = $(this).children("def").text();
                if (!def) {
                    $("#haloword-content").html("<p>I'm sorry, Dave.</p><p>I'm afraid I can't find that.</p>");
                }
                else {
                    def = def.replace(/\n/g, '</p><p>');
                    def = '<p>' + def + '</p>';
                    $("#haloword-content").html(def);
                    var audio_url = $(this).children("audio").text();
                    if (audio_url) {
                        $("#haloword-audio").attr("src", audio_url);
                        $("#haloword-pron").show();
                        $("#haloword-pron").click(function() {
                            $("#haloword-audio")[0].play();
                        })
                    }
                }
            });
        }
    });

    // HACK: fix dict window not openable
    setTimeout(function() {
        haloword_opened = true;
    }, 100);
}
