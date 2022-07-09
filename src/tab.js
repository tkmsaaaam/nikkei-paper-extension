(() => {
	document.addEventListener('click', e => {
		e.preventDefault();
		const rawHref = e.target.href;
		transition(rawHref);
	});
})();

const transition = rawHref => {
	const host = 'https://www.nikkei.com/';
	const path = rawHref.substr(rawHref.indexOf('/paper/article/'));
	chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
		chrome.tabs.update(tabs[0].id, { url: host + path });
	});
};
