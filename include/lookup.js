function is_chinese(word) {
    return (/^[\u4e00-\u9fa5]+$/g).test(word);
}

function is_english(word) {
    return (/^[a-z\sA-Z]+$/g).test(word);
}

function valid_word(word) {
    if (word.length === 0 || word.length > 190) {
        return false;
    }
    if (is_chinese(word)) {
        return "Chinese";
    }
    if (is_english(word)) {
        return "English";
    }
    return "Mixed";
}

var haloword_opened = false;
var haloword_html = '<div id="haloword-lookup" class="ui-widget-content">\
<div id="haloword-title">\
<span id="haloword-word"></span>\
<a herf="#" id="haloword-pron" class="haloword-button" title="发音"></a>\
<audio id="haloword-audio"></audio>\
<div id="haloword-control-container">\
<a herf="#" id="haloword-add" class="haloword-button" title="加入单词表"></a>\
<a herf="#" id="haloword-remove" class="haloword-button" title="移出单词表"></a>\
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
            $("#haloword-remove").hide();
            $("#haloword-add").show();
            haloword_opened = false;
        }
    }
}

var icon_url = chrome.extension.getURL("img/icon.svg");
var style_content = "<style>\
#haloword-pron { background: url(" + icon_url + ") -94px -34px; }\
#haloword-pron:hover { background: url(" + icon_url + ") -111px -34px; }\
#haloword-open { background: url(" + icon_url + ") -94px -17px; }\
#haloword-open:hover { background: url(" + icon_url + ") -111px -17px; }\
#haloword-close { background: url(" + icon_url + ") -94px 0; }\
#haloword-close:hover { background: url(" + icon_url + ") -111px 0; }\
#haloword-add { background: url(" + icon_url + ") -94px -51px; }\
#haloword-add:hover { background: url(" + icon_url + ") -111px -51px; }\
#haloword-remove { background: url(" + icon_url + ") -94px -68px; }\
#haloword-remove:hover { background: url(" + icon_url + ") -111px -68px; }</style>";
if ($("head")[0]) {
    $($("head")[0]).append(style_content);
}
else {
    $($("body")[0]).prepend(style_content);
}

$("#haloword-lookup").draggable({ handle: "#haloword-title" });

$("#haloword-pron").click(function() {
    // HACK: fix Chrome won't play second time
    // Thank @fanzeyi :)
    var audio = $("#haloword-audio")[0],
        src = audio.currentSrc;
    audio.src = "http://www.google.com/404";
    audio.play();
    audio.src = src;
    audio.play();
});

function pron_exist(word, is_upper) {
    /* two URLs:
    http://www.gstatic.com/dictionary/static/sounds/de/0/halo.mp3
    http://www.gstatic.com/dictionary/static/sounds/de/0/!Capella.mp3
    */
    var pron_url = (window.location.protocol === "https:" ? "https://ssl" : "http://www") + ".gstatic.com/dictionary/static/sounds/de/0/" + word + ".mp3";
    if (is_english(word) || is_upper) {
        $.ajax({
            url: pron_url,
            timeout: 3000,
            success: function() {
                var current_word = $("#haloword-word").html().toLowerCase();
                if (word == current_word || word.substring(1).toLowerCase() == current_word) {
                    $("#haloword-audio").attr("src", pron_url);
                    $("#haloword-pron").show();
                }
            },
            error: function(xhr, d, e) {
                if (!is_upper) {
                    pron_exist('!' + word[0].toUpperCase() + word.substring(1), true);
                }
            }
        });
    }
}

function get_selection() {
    var selection = $.trim(window.getSelection());
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
    return selection;
}

$("#haloword-add").click(function() {
    $("#haloword-add").hide();
    $("#haloword-remove").show();
    var selection = get_selection();
    chrome.extension.sendMessage({method: "add", word: selection});
});
$("#haloword-remove").click(function() {
    $("#haloword-remove").hide();
    $("#haloword-add").show();
    var selection = get_selection();
    chrome.extension.sendMessage({method: "remove", word: selection});
});

function event_mouseup(e) {
    // chrome.storage.local.set({'disable_querybox': true})
    chrome.storage.local.get('disable_querybox', function(ret) {
        if (!ret.disable_querybox) {
            if (!e.ctrlKey && !e.metaKey) {
                return;
            }
            var selection = get_selection();
            var lang = valid_word(selection);
            if (!lang) {
                return;
            }

            $("#haloword-word").html(selection);

            var windowWidth = $(window).outerWidth(),
                halowordWidth = $("#haloword-lookup").outerWidth(),
                left = Math.min(windowWidth + scrollX - halowordWidth, e.pageX);
            $("#haloword-lookup").attr("style", "left: " + left + "px;" + "top: " + e.pageY + "px;");
            $("#haloword-open").attr("href", chrome.extension.getURL("main.html#" + selection));
            $("#haloword-close").click(function() {
                $("#haloword-lookup").hide();
                $("#haloword-remove").hide();
                $("#haloword-add").show();
                haloword_opened = false;
                return false;
            });

            $("#haloword-remove").hide();

            chrome.extension.sendMessage({method: "find", word: selection}, function(response) {
                if (response.exist) {
                    $("#haloword-add").hide();
                    $("#haloword-remove").show();
                }
                else {
                    $("#haloword-remove").hide();
                    $("#haloword-add").show();
                }
            });

            $("#haloword-pron").hide();
            $("#haloword-content").html("<p>Loading definitions...</p>");
            $("#haloword-lookup").show();

            $.ajax({
                url: youdao_url + selection,
                dataType: "json",
                success: function(data) {
                    var def = "", i;
                    if (data.errorCode === 0) {
                        if (data.basic) {
                            if (data.basic.phonetic) {
                                def += '<p class="phonetic"><span>' + data.basic.phonetic + '</span></p>';
                            }

                            for (i in data.basic.explains) {
                                def += "<p>" + data.basic.explains[i] + "</p>";
                            }

                            $("#haloword-content").html(def);

                            pron_exist(selection.toLowerCase(), false);
                        }
                        else if (data.translation) {
                            for (i in data.translation) {
                                def += "<p>" + data.translation[i] + "</p>";
                            }
                            $("#haloword-content").html(def);
                        }
                        else {
                            // no definition and translation
                            $("#haloword-content").html("<p>I'm sorry, Dave.</p><p>I'm afraid I can't find that.</p>");
                        }
                    }
                    else {
                        $("#haloword-content").html("<p>I'm sorry, Dave.</p><p>I'm afraid I can't find that.</p>");
                    }
                },
                error: function(data) {
                    $("#extradef").hide();
                }
            });

            // HACK: fix dict window not openable
            setTimeout(function() {
                haloword_opened = true;
            }, 100);
        }
    })
}
