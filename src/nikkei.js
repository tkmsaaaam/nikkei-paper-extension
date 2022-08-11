chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.message == 'scroll') {
		window.scroll({
			top: 250,
			behavior: 'smooth',
		});
	}
});
