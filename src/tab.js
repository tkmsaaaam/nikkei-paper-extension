document.addEventListener('click', (e)  => {
	e.preventDefault();
	rawHref = e.target.href;
	host = 'https://www.nikkei.com/';
	path = rawHref.substr(rawHref.indexOf('/paper/article/'));
	chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
		chrome.tabs.update(tabs[0].id, { url: host + path });
	});
});
