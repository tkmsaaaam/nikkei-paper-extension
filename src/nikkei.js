chrome.runtime.onMessage.addListener(request => {
	if (request.message === 'scroll') {
		window.scroll({
			top: 250,
			behavior: 'smooth',
		});
	}
});
