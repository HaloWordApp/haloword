function get_meaning(node, simplify, lang) {
    var meaning = '';
    if (node.type == "meaning") {
        /* fetch a meaning */
        var meaning_text = '';
        $.each(node.terms, function(i, text_item) {
            if (simplify) {
                if (lang == "English") {
                    if (text_item.language != "en") {
                        meaning_text += '<p>' + text_item.text + '</p>';
                    }
                }
                else {
                    meaning_text += '<p>' + text_item.text + '</p>';
                }
            }
            else {
                meaning_text += '<p>' + text_item.text + '</p>';
            }
        });
        if (!simplify && node.entries) {
            /* fetch examples */
            var example = '';
            $.each(node.entries, function(i, entry_item) {
                if (entry_item.type == "example" && entry_item.terms) {
                    example += '<li><p>';
                    $.each(entry_item.terms, function(i, example_item) {
                        if (i > 0) {
                            example += '</p><p>';
                        }
                        example += example_item.text;
                    });
                    example += '</p></li>';
                }
            });
            if (example) {
                meaning_text += '<ul class="example">' + example + '</ul>';
            }
        }
        if (meaning_text)
            meaning += '<li>' + meaning_text + '</li>';
    }
    else if (!simplify && node.type == "related" && node.labels && node.labels[0].text == "See also:") {
        meaning += '<li>See also: <a href="#' + node.terms[0].text + '">' + node.terms[0].text + '</a></li>';
    }
    else if (node.entries) {
        if (node.type == "container" && node.labels[0].title == "Part-of-Speech") {
            meaning += '</ol><p class="part-of-speech">';
            $.each(node.labels, function(i, label_item) {
                if (label_item.title == "Part-of-Speech") {
                    meaning += '<span>' + label_item.text + '</span>';
                }
            });
            meaning += '</p><ol>';
        }

        var meaning_count = 0;
        $.each(node.entries, function(i, entry_item) {
            var meaning_item = get_meaning(entry_item, simplify, lang);
            if (meaning_item) {
                meaning += meaning_item;
                meaning_count += 1;
            }
            if (simplify && meaning_count >= 2) {
                return false;
            }
        });
    }
    return meaning;
}
