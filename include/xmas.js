$(document).ready(function() {
    var today = new Date();
    /* getMonth() returns 0-11 */
    var month = today.getMonth() + 1;
    var date = today.getDate();
    var year = today.getFullYear();

    //console.log(month + "." + date);

    if (month == 12 &&
    date in {'23':true, '24':true, '25':true, '26':true} ) {
        /* Happy Xmas :) */
        $("li#title").html("Happy Xmas");
        if (date == 24 || date == 25) {
            snowStorm.start();
        }
    }
    
    if (month == 12 &&
        date in {'30':true, '31':true} ) {
        /* Bye :) */
        $("li#title").html("Bye " + year);
    }

    if (month == 1 &&
        date in {'1':true, '2':true, '3':true} ) {
        /* Hello :) */
        $("li#title").html("Hello " + year);
    }
});