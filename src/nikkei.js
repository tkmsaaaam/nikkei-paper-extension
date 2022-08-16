const createArticlesList = doc => {
	const articleList = [];
	const articles = doc.getElementsByClassName('cmn-article_title');
	for (let l = 0; l < articles.length; l++) {
		const articleElement = articles[l];
		const rawArticle = articleElement
			.getElementsByTagName('span')[0]
			.getElementsByTagName('a')[0];
		if (!rawArticle) continue;
		let article = {};
		article.href = rawArticle.href;
		article.id = new URLSearchParams(rawArticle.href).get('ng');
		article.title = rawArticle
			.getElementsByTagName('span')[0]
			.getElementsByTagName('span')[0].textContent;
		if (!article.href || !article.id || !article.title) continue;
		articleList.push(article);
	}
	return articleList;
};

const getArticles = async param => {
	const url = 'https://www.nikkei.com/paper/' + param;
	const res = await fetch(url).then(response => response.text());
	const parser = new DOMParser();
	const doc = parser.parseFromString(res, 'text/html');
	return doc;
};

(() => {
	chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
		if (request.message === 'scroll') {
			window.scroll({
				top: 250,
				behavior: 'smooth',
			});
		} else if (request.message === 'getArticles') {
			if (request.options === 'current') {
				sendResponse(createArticlesList(document));
			} else {
				(async () => {
					const articles = await getArticles(request.options);
					sendResponse(createArticlesList(articles));
				})();
				return true;
			}
		}
	});
})();
