var tabId = false;

function contextMenuOnClick(info, t) {
    var tabParam = {url: "main.html#" + encodeURIComponent(info.selectionText), active: true};
    var createTab = function() {
      chrome.tabs.create(tabParam, function(tab) {
        tabId = tab.id;
      });
    }
    if (tabId === false) {
      createTab();
    }
    else {
      chrome.tabs.get(tabId, function(tab) {
        if (tab) {
          chrome.tabs.update(tabId, tabParam);
        } else {
          createTab();
        }
      });
    }
}

var id = chrome.contextMenus.create({"title": "用 Halo Word 查询", "contexts":["selection"], "onclick": contextMenuOnClick});
