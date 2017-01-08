var tabId = false;

function contextMenuOnClick(info, t) {
    if (tabId === false) {
      chrome.tabs.create({url: "main.html#" + info.selectionText}, function(tab) {
        tabId = tab.id;
      });
    }
    else {
      chrome.tabs.update(tabId, {url: "main.html#" + info.selectionText, active: true});
    }
}

var id = chrome.contextMenus.create({"title": "用 Halo Word 查询", "contexts":["selection"], "onclick": contextMenuOnClick});
