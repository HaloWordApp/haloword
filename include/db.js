/* word list: newest on top */
var default_words = ["喵", "miaow", "caesium", "love", "dysprosium", "turf", "Iridium", "daisy", "Chrome", "Capella"];

var db;
function init_db(caller) {
    db = openDatabase("HaloWord", "0.1", "Database for Halo Word", 200000);
    db.transaction(function (tx) {
        tx.executeSql("SELECT COUNT(*) FROM `Word`", [],
        /* success */
        function(result) {
            update_db();
            if (caller == "app") {
                init_wordlist();
            }
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

function is_word_exist(word, func) {
    db.transaction(function(tx) {
        tx.executeSql("SELECT COUNT(*) AS `exist` FROM `Word` WHERE `word` = ?", [word],
        func, null);
    });
}