chrome.extension.onMessage.addListener(
	function(request, sender, sendResponse) {
		init_db();
	    console.log(request);
	    if (request.method == "add") {
			storage_word(request.word);
	    }
		else if (request.method == "remove") {
			
		}
	}
);

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
