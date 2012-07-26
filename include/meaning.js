function process_primary(node) {
    var primary = node;
    var html = "";

    if (primary instanceof Array) {
        html += '<div class="entries">';
        for (var i in primary) {
            html += process_primary(primary[i]);
        }
        html += "</div>";
    }
    else if (typeof(primary) == "object") {
        if (primary.type !== undefined) {
            html += process_labels(primary.labels);

            html += '<div class="'+ primary.type + '">' + process_terms(primary.terms, primary.type);
            if (primary.entries !== undefined) {
                html += process_primary(primary.entries);
            }

            html += "</div>";
        }
    }
    else {}
    return html;
}

function process_labels(labels) {
    var html = "";
    for (var i in labels) {
        var title = "";
        if (labels[i].title) {
            title = labels[i].title;
        }
        html += ' <span class="label" title="' + title + '">' + labels[i].text + "</span>";
    }

    return html;
}

function process_terms(terms, type) {
	var html = "";
	if (terms instanceof Array) {
	    html += '<div class="terms">';
        for (var i in terms) {
            html += process_terms(terms[i], type);
        }
        html += '</div>';
    }
    else if (typeof(terms) == "object") {
        if (terms.type == "sound") {
            html += '<a class="pronounce"><audio src="' + terms.text + '"></audio></a>';
        }
        else if (terms.type !== undefined) {
            var lang_str = "";
            if (terms.language !== undefined) {
                lang_str = ' data-language="' + terms.language + '"';
            }
            html += '<p class="'+ terms.type + '"' + lang_str + '>';
            html += terms.text;
            html += process_labels(terms.labels);
            html += "</p>";
        }
    }
    return html;
}
