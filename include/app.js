$(document).ready(function() {
    init_db();

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
    var cur_version = 10;
    if (!localStorage.prev_version) {
        localStorage.prev_version = cur_version;
    }
    if (!localStorage.prev_version || cur_version > localStorage.prev_version) {
        $("#bubble").html('<p>Halo Word 开始支持<strong>整句翻译</strong>啦！现在就输入「people mountain people sea」试试吧，也可以在网页上划取整句进行翻译。</p><p style="margin-top: 4px;">如果您喜欢这个应用，不妨给我们<a href="https://chrome.google.com/webstore/detail/bhkcehpnnlgncpnefpanachijmhikocj/reviews" target="_blank">打个五星</a>或者<a href="https://me.alipay.com/xhacker" target="_blank">捐赠</a>。</p><p class="align-right"><button  id="button-go-version">查看版本信息</button><button id="button-close-bubble">关闭</button></p>');
        $("#bubble").show();
    }
    $("#button-close-bubble").click(function() {
        localStorage.prev_version = cur_version;
        $("#bubble").hide();
    });
    $("#button-go-version").click(function() {
        query("halo:version");
    });

    /* Special fixes */
    if (get_OS() == "Windows") {
        /* Special fixes for Windows */
        $("#search_field").css("-webkit-appearance", "none");
    }

    show_def(location.hash.substring(1));
});

function get_OS() {
    var ua = navigator.userAgent;
    var os;
    if (ua.indexOf("Windows") > 0) {
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
    if (get_OS() == "Mac OS X") {
        $("#wordlist").height($(window).height() - 146);
    }
    else {
        $("#wordlist").height($(window).height() - 156);
    }
}

$(window).load(on_resize);
$(window).resize(on_resize);

/* STORAGE */

/* word list: newest on top */
var default_words = ["喵", "miaow", "caesium", "love", "dysprosium", "turf", "Iridium", "daisy", "Chrome", "Capella"];

var db;
function init_db() {
    db = openDatabase("HaloWord", "0.1", "Database for Halo Word", 200000);
    db.transaction(function (tx) {
        tx.executeSql("SELECT COUNT(*) FROM `Word`", [],
        /* success */
        function(result) {
            update_db();
            init_wordlist();
        },
        /* no table, create them */
        function(tx, error) {
            tx.executeSql("CREATE TABLE `Word` (`id` REAL UNIQUE, `word` TEXT, `timestamp` REAL, `sequence` REAL, `status` REAL)", [],
            function() {
                localStorage.db_version = 2;
                storage_words(default_words);
                init_wordlist();
            },
            null);
        });
    });
}

function update_db() {
    if (!localStorage.db_version) {
        localStorage.db_version = 1;
    }
    console.log("Checking db version...");
    console.log("Current db version: " + localStorage.db_version + ".");
    if (localStorage.db_version < 2) {
        /* DB v2: table `word` - add column `sequence` */
        /*        table `word` - add column `status`   */
        console.log("Updating db to version 2...");
        db.transaction(function(tx) {
            tx.executeSql("ALTER TABLE `Word` ADD COLUMN `sequence` REAL", [], null, null);
            tx.executeSql("ALTER TABLE `Word` ADD COLUMN `status` REAL", [], null, null);
        });
        localStorage.db_version = 2;
    }
}

function storage_words(words) {
    var time = new Date().getTime();
    db.transaction(function(tx) {
        for (var w in words) {
            tx.executeSql("DELETE FROM `Word` WHERE `word` = ?",
            [words[w]],
            null, null);
            tx.executeSql("INSERT INTO `Word` (`word`, `timestamp`) values(?, ?)",
            [words[w], time],
            null, null);
        }
    });
}

function storage_word(word) {
    db.transaction(function(tx) {
        tx.executeSql("DELETE FROM `Word` WHERE `word` = ?",
        [word],
        null, null);
        tx.executeSql("INSERT INTO `Word` (`word`, `timestamp`) values(?, ?)",
        [word, new Date().getTime()],
        null, null);
    });
}

function update_word_seq() {
    db.transaction(function(tx) {
        $("#wordlist li").each(function(id, obj) {
            tx.executeSql("UPDATE `Word` SET `sequence` = ? WHERE `word` = ?",
            [id, $(obj).text()],
            null, null);
        });
    });
}

function remove_all_word() {
    db.transaction(function(tx) {
        tx.executeSql("DELETE FROM `Word`",
        null, null, null);
    });
}

function remove_word(word) {
    db.transaction(function(tx) {
        tx.executeSql("DELETE FROM `Word` WHERE `word` = ?",
        [word],
        null, null);
    });
}

function get_wordlist(process_func) {
    db.transaction(function(tx) {
        tx.executeSql("SELECT * FROM `Word` ORDER BY `sequence` DESC, `timestamp` ASC", [],
        function(tx, result) {
            process_func(result);
        }, null);
    });
}

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

window.onhashchange = function() {
    show_def(location.hash.substring(1));
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

function process_json(data) {
    if (!data.primaries) {
        show_builtin("notfound");
        return;
    }

    var meaning = process_primary(data.primaries);
    if (meaning) {
        $("#worddef").html(meaning);
        $(".pronounce").click(function() {
            $("audio", this)[0].play();
        });
    }
    else {
        show_builtin("notfound");
        return;
    }

    $("#worddef").append('<p class="credits">Content provided by <a href="http://www.google.com/" target="_blank">Google Dictionary</a></p>');
}
