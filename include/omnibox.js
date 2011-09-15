chrome.omnibox.onInputEntered.addListener(function(text) {
    chrome.tabs.create({url: "main.html#" + text})
});
