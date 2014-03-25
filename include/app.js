$(document).ready(function() {
    init_db("app");

    window.onhashchange = function() {
        show_def(location.hash.substring(1));
    }
    $(window).load(on_resize);
    $(window).resize(on_resize);

    $("#search_form").submit(function() {
        var word = $("#search_field").val();
        $("#search_field").select();
        query(word);
        return false;
    });

    $("#search").click(function() {
        $("#search_field").focus();
    });

    $("#button_add").click(function() {
        var word = location.hash.substring(1);
        storage_word(word);
        wordlist_add(word);
        $("li.current").removeClass("current");
        $("#wordlist_" + escape4id(word)).addClass("current");
        refresh_wordlist_trigger();
        $("#button_add").hide();
        $("#button_remove").show();
    });

    $("#button_remove").click(function() {
        var word = location.hash.substring(1);
        remove_word(word);
        $("#wordlist_" + escape4id(word)).remove();
        $("#button_remove").hide();
        $("#button_add").show();
    });

    $("#wordlist").sortable({
        helper: 'clone',
        axis: 'y',
        update: update_word_seq
    });

    /* Update notification */
    var cur_version = 14;
    if (!localStorage.prev_version) {
        localStorage.prev_version = cur_version;
    }
    if (cur_version > localStorage.prev_version) {
        $("#bubble").html('Halo Word 0.6 现已发布，采用 Merriam-Webster 提供的 API，修复了英文释义和发音的问题。<p style="margin-top: 4px;">如果您喜欢这个应用，可以通过<a href="https://chrome.google.com/webstore/detail/bhkcehpnnlgncpnefpanachijmhikocj/reviews" target="_blank">打个五星</a>或者<a href="https://me.alipay.com/xhacker" target="_blank">捐赠</a>来支持我。:)<p class="align-right"><button id="button-go-version">查看版本信息</button><button id="button-close-bubble">关闭</button></p>');
        /* <button id="button-go-version">查看版本信息</button><p style="margin-top: 4px;">如果您喜欢这个应用，不妨给我们<a href="https://chrome.google.com/webstore/detail/bhkcehpnnlgncpnefpanachijmhikocj/reviews" target="_blank">打个五星</a>或者<a href="https://me.alipay.com/xhacker" target="_blank">捐赠</a>。</p> */
        $("#bubble").show();
    }
    $("#button-close-bubble").click(function() {
        localStorage.prev_version = cur_version;
        $("#bubble").hide();
    });
    $("#button-go-version").click(function() {
        query("halo:version");
    });

    /* Special fixes for Windows */
    if (get_OS() == "Windows") {
        $('html').addClass('windows');
    }

    show_def(location.hash.substring(1));

    document.onkeydown = function(key) {
        if (document.activeElement.tagName != "TEXTAREA" && document.activeElement.tagName != "INPUT") {
            // keys between a-z while neither ctrlkey nor metakey pressed, v's keyboard code is 86
            if ( (!key.ctrlKey && !key.metaKey && key.which >= 65 && key.which <= 90)
                 || ( (key.ctrlKey || key.metaKey) && key.which == 86) ) {
                var input = $("#search_field");
                input.focus();
            }
        }
    }
});

function get_OS() {
    var ua = navigator.userAgent;
    var os;
    if (typeof process == "object") {
        os = "node-webkit"
    }
    else if (ua.indexOf("Windows") > 0) {
        os = "Windows";
    }
    else if (ua.indexOf("Mac OS X") > 0) {
        os = "Mac OS X";
    }
    return os;
}

function refresh_wordlist_trigger() {
    $("#title").click(function() {
        $("li.current").removeClass("current");
        $(this).addClass("current");
    });
    $("#wordlist li").click(function() {
        var word = $(this).text();
        $("li.current").removeClass("current");
        $(this).addClass("current");
        query(word);
    });
    $("#wordlist .delete").click(function() {
        var word = $(this).parent().text();
        remove_word(word);
        $(this).parent().remove();
        if (word == location.hash.substring(1)) {
            $("#button_remove").hide();
            $("#button_add").show();
        }
        return false;
    });
}

/* VERSION */

var VERSION = get_version();

function get_version() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', chrome.extension.getURL('manifest.json'), false);
    xhr.send(null);
    var manifest = JSON.parse(xhr.responseText);
    return manifest.version;
}

/* UI */

function on_resize() {
    var OS = get_OS();
    if (OS == "Mac OS X") {
        $("#wordlist").height($(window).height() - 146);
    }
    else if (OS == "node-webkit") {
        $("#wordlist").height($(window).height() - 102);
    }
    else {
        $("#wordlist").height($(window).height() - 156);
    }
}

/* STORAGE */

function init_wordlist() {
    get_wordlist(process_wordlist);
}

function process_wordlist(result) {
    $("#wordlist").html("");
    for (var i = 0; i < result.rows.length; i++) {
        wordlist_add(result.rows.item(i).word);
    }
    refresh_wordlist_trigger();
}

function escape4id(word) {
    return word.replace(/\s/g, "__");
}

function wordlist_add(word) {
    $("#wordlist").prepend('<li id="wordlist_' + escape4id(word) + '"><div class="delete" title="Remove from word list"></div>' + word + "</li>");
}

function wordlist_append(word) {
    $("#wordlist").append('<li id="wordlist_' + escape4id(word) + '"><div class="delete" title="Remove from word list"></div>' + word + "</li>");
}

/* QUERY */

function query(word) {
    location.hash = word;
}

function show_def(word) {
    if (!word) { word = "halo:welcome" }

    /* fixing a refresh issue. */
    window.word = word;

    $(".button").hide();
    $("#toolbar").hide();

    if (is_builtin(word)) {
        show_builtin(is_builtin(word));
        return;
    }

    show_builtin("loading");

    $("#extradef").show();
    document.title = word + " \u2039 Halo Word";
    $("#wordtitle").html(word);

    db.transaction(function (tx) {
        tx.executeSql("SELECT COUNT(*) AS `exist` FROM `Word` WHERE `word` = ?", [word],
        function(tx, result) {
            if (result.rows.item(0).exist) {
                $("#button_remove").show();
            }
            else {
                $("#button_add").show();
            }
        }, null);
    });

/* Google Dictionary API no longer works
    $.ajax({
        url: "http://www.google.com/dictionary/json?callback=fake&q=" + word + "&sl=en&tl=zh-cn",
        dataType: "text",
        success: function(data) {
            var start = data.indexOf('{');
            var end = 0;
            for (var i = data.length - 1; i >= 0; i--){
                if (data[i] == '}') {
                    end = i + 1;
                    break;
                }
            }
            data = data.substring(start, end);
            // convert \xNN to \u00NN
            data = data.replace(/\\x/g, "\\u00");

            var obj = JSON.parse(data);
            process_json(obj);
        }
    });
*/

    $.ajax({
        url: "http://halo.xhacker.im/webster/query/" + word,
        dataType: "xml",
        success: function(data) {
            var entry_list = $(data).find("entry_list")
            var entries = entry_list.find("entry")

            if (entries.length === 0) {
                show_builtin("notfound")
                return
            }

            var html = ""

            entries.each(function() {
                var def_list = []
                var sub_list = []
                var in_sub_list = false
                $($(this).children("def")[0]).children().each(function() {
                    if ($(this).is("sn")) {
                        var sn = $(this).text()
                        if (/^[a-zA-Z]+$/.test(sn)) {
                            // a
                            in_sub_list = true
                        }
                        else if (!isNaN(sn)) {
                            // 1
                            in_sub_list = false
                            if (sub_list.length > 0) {
                                def_list[def_list.length-1]["sub"] = sub_list
                                sub_list = []
                            }
                        }
                        else {
                            var segments = sn.split(" ")
                            if (segments.length > 1 && !isNaN(segments[0]) && /^[a-zA-Z]+$/.test(segments[1])) {
                                // 1 a
                                if (sub_list.length > 0) {
                                    def_list[def_list.length-1]["sub"] = sub_list
                                    sub_list = []
                                }

                                def_list.push({})
                                in_sub_list = true
                            }
                        }
                    }
                    else if ($(this).is("dt")) {
                        function xml_to_html(xml) {
                            var html = ""

                            var tagName = $(xml).prop("tagName")
                            if (tagName) {
                                html += '<span class="mw-' + tagName + '">'
                            }

                            if ($(xml).contents().length == 0) {
                                html += $(xml).text()
                            }
                            else {
                                $(xml).contents().each(function() {
                                    html += xml_to_html(this)
                                })
                            }

                            if (tagName) {
                                html += '</span>'
                            }

                            return html
                        }

                        var content = xml_to_html(this)
                        content = $(content).html().trim()
                        content = content.replace(/^:/, "")

                        if (in_sub_list) {
                            sub_list.push({"content": content})
                        }
                        else {
                            def_list.push({"content": content})
                        }
                    }
                })
                if (sub_list.length > 0) {
                    def_list[def_list.length-1]["sub"] = sub_list
                }

                var sound_html = ""
                var sound = $(this).children("sound")[0]
                if (sound) {
                    $(sound).children('wav').each(function() {
                        var filename = $(this).text()
                        sound_html += '<a class="pronounce"><audio src="http://media.merriam-webster.com/soundc11/' + filename[0] + '/' + filename + '"></audio></a>'
                    })
                    var wav = $(sound).children('wav').text()

                }

                var view = {
                    "hw": $(this).children("hw").text().replace(/\*/g, "·"),
                    "hwindex": $(this).children("hw").attr("hindex"),
                    "pr": $(this).children("pr").text().trim(),
                    "sound": sound_html,
                    "fl": $(this).children("fl").text(),
                    "def": def_list
                }
                html += Mustache.render('<div class="mw-item">\
                    <div class="mw-meta">\
                        <span class="mw-headword">\
                        {{#hwindex}}<sup>{{hwindex}}</sup>{{/hwindex}}{{hw}}\
                        </span>\
                        <span class="mw-part-of-speech">{{fl}}</span>\
                        {{#pr}}<span class="mw-pr">\\{{pr}}\\</span>{{/pr}}{{{sound}}}\
                    </div>\
                    <ol>{{#def}}\
                        <li>{{{content}}}\
                        {{#sub.length}}\
                            <ol>{{#sub}}<li>{{{content}}}</li>{{/sub}}</ol>\
                        {{/sub.length}}\
                        </li>\
                    {{/def}}</ol>\
                    </div>', view)
            })

            $("#worddef").html(html)

            $(".pronounce").click(function() {
                $("audio", this)[0].play()
            })

            $("#worddef").append('<p class="credits">Content provided by <a href="http://www.merriam-webster.com" target="_blank">Merriam-Webster</a></p>')
        }
    })

    $("#extradef .phonetic").html("<span>ˈləʊdɪŋ</span>");
    $("#extradef .content").html("<p>loading...</p>");

    $.ajax({
        url: youdao_url + word,
        dataType: "json",
        success: function(data) {
            var def = "", i;
            if (data.errorCode === 0) {
                $("#extradef .from").html("Youdao");
                $("#extradef .from").attr("href", "http://dict.youdao.com/");
                if (data.basic) {
                    if (data.basic.phonetic) {
                        $("#extradef .phonetic").html("<span>" + data.basic.phonetic + "</span>");
                        $("#extradef .phonetic").show();
                    }
                    else {
                        $("#extradef .phonetic").hide();
                    }

                    for (i in data.basic.explains) {
                        def += "<p>" + data.basic.explains[i] + "</p>";
                    }
                    $("#extradef .content").html(def);
                }
                else if (data.translation) {
                    for (i in data.translation) {
                        def += "<p>" + data.translation[i] + "</p>";
                    }
                    $("#extradef .phonetic").hide();
                    $("#extradef .content").html(def);
                }
                else {
                    // no definition and translation
                    $("#extradef").hide();
                }
            }
            else {
                $("#extradef").hide();
            }
        },
        error: function(data) {
            $("#extradef").hide();
        }
    });
}

function is_builtin(word) {
    if (word.substring(0, 5) == "halo:")
        return word.substring(5);
    else
        return false;
}

function show_builtin(builtin) {
    $.get("builtin/" + builtin + ".html", function(data) {
        $("#worddef").html(process_builtin(data));

        $(".pronounce").click(function() {
            $("audio", this)[0].play()
        })

        var title = $("#builtin-title").html();
        if (title) {
            $("#extradef").hide();
            $("#wordtitle").html(title);
            if (title != "Halo Word") {
                title = title + " \u2039 Halo Word";
            }
            document.title = title;
        }

        if (builtin == "welcome") {
            $("#toolbar").show();
        }
    });
}

function process_builtin(data) {
    data = data.replace(/__VERSION__/g, '<a href="#halo:version">' + VERSION + '</a>');
    return data;
}
