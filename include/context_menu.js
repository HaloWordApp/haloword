function contextMenuOnClick(info, t) {
    chrome.tabs.create({url: "main.html#" + info.selectionText});
}

var id = chrome.contextMenus.create({"title": "用 Halo Word 查询", "contexts":["selection"], "onclick": contextMenuOnClick});
