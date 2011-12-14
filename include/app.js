$(document).ready(function() {
    init_db();

    $("#search_form").submit(function() {
        word = $("#search_field").val();
        $("#search_field").select();
        query(word);
        return false;
    });

    $("#search").click(function() {
        $("#search_field").focus();
    });

    $("#button_add").click(function() {
        word = location.hash.substring(1);
        storage_word(word);
        wordlist_add(word);
        $("li.current").removeClass("current");
        $("#wordlist_" + escape4id(word)).addClass("current");
        refresh_wordlist_trigger();
        $("#button_add").hide();
        $("#button_remove").show();
    });

    $("#button_remove").click(function() {
        word = location.hash.substring(1);
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
    cur_version = 5;
    if (!localStorage['prev_version']) {
        localStorage['prev_version'] = 0;
    }
    if (cur_version > localStorage['prev_version']) {
        $("#bubble").html('<p>恭喜！您的 Halo Word 已更新至最新版本。由于 Google 字典不再提供中文释义，我们添加了来自<a target="blank" href="http://dict.cn"><strong>Dict.cn</strong></a>的中文释义。</p><p style="margin-top: 4px;">如果您喜欢这个应用，不妨考虑<a href="https://chrome.google.com/webstore/detail/bhkcehpnnlgncpnefpanachijmhikocj" target="_blank">打个五星</a>或者<a href="https://me.alipay.com/xhacker" target="_blank">捐赠</a>。</p><p class="align-right"><button  id="button-go-version">查看版本信息</button><button id="button-close-bubble">关闭</button></p>');
        $("#bubble").show();
    }
    $("#button-close-bubble").click(function() {
        localStorage['prev_version'] = cur_version;
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
    if (ua.indexOf("Windows") > 0) {
        return "Windows";
    }
    else if (ua.indexOf("Mac OS X") > 0) {
        return "Mac OS X";
    }
    else {
        return "miaow~";
    }
}

function refresh_wordlist_trigger() {
    $("#title").click(function() {
        $("li.current").removeClass("current");
        $(this).addClass("current");
    });
    $("#wordlist li").click(function() {
        word = $(this).text();
        $("li.current").removeClass("current");
        $(this).addClass("current");
        query(word);
    });
    $("#wordlist .delete").click(function() {
        word = $(this).parent().text();
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

VERSION = get_version();

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
                localStorage['db_version'] = 2;
                storage_words(default_words);
                init_wordlist();
            },
            null);
        });
    });
}

function update_db() {
    if (!localStorage['db_version']) {
        localStorage['db_version'] = 1;
    }
    console.log("Checking db version...");
    console.log("Current db version: " + localStorage['db_version'] + ".");
    if (localStorage['db_version'] < 2) {
        /* DB v2: table `word` - add column `sequence` */
        /*        table `word` - add column `status`   */
        console.log("Updating db to version 2...");
        db.transaction(function(tx) {
            tx.executeSql("ALTER TABLE `Word` ADD COLUMN `sequence` REAL", [], null, null);
            tx.executeSql("ALTER TABLE `Word` ADD COLUMN `status` REAL", [], null, null);
        });
        localStorage['db_version'] = 2;
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
        wordlist_add(result.rows.item(i)['word']);
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

$(window).hashchange(function() {
    show_def(location.hash.substring(1));
});

function show_def(word) {
    if (!word) { word = "halo:welcome" };

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
    document.title = word + " ‹ Halo Word";
    $("#wordtitle").html(word);

    db.transaction(function (tx) {
        tx.executeSql("SELECT COUNT(*) AS `exist` FROM `Word` WHERE `word` = ?", [word],
        function(tx, result) {
            if (result.rows.item(0)['exist']) {
                $("#button_remove").show();
            }
            else {
                $("#button_add").show();
            }
        }, null);
    });

    $.ajax({
        url: "http://www.google.com/dictionary/json?callback=process_json&q=" + word + "&sl=en&tl=zh-cn",
        dataType: "script"
    });

    $("#extradef .content").html("loading...");
    $.ajax({
        url: "http://dict.cn/ws.php?utf8=true&q=" + word,
        dataType: "xml",
        success: function(data) {
            $(data).find("dict").each(function(i) { 
                var def = $(this).children("def").text();
                if (!def) {
                    $("#extradef").hide();
                }
                def = def.replace(/\n/g, '<br />');
                $("#extradef .content").html(def);
                var phonetic = $(this).children("pron").text();
                if (phonetic) {
                    phonetic = "[" + phonetic + "]";
                    $("#extradef .phonetic").html(phonetic);
                    $("#extradef .phonetic").show();
                }
                else {
                    $("#extradef .phonetic").hide();
                }
            });
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

        title = $("#builtin-title").html();
        if (title) {
            $("#extradef").hide();
            $("#wordtitle").html(title);
            if (title != "Halo Word") {
                title = title + " ‹ Halo Word";
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

    meaning = process_primary(data.primaries);
    if (meaning) {
        $("#worddef").html(meaning);
    }
    else {
        show_builtin("notfound");
        return;
    }

    $("#worddef").append('<p class="credits">Content provided by <a href="http://www.google.com/dictionary" target="_blank">Google Dictionary</a></p>');
}
