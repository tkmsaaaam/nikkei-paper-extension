const createMark = () => {
	chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
		const params = new URLSearchParams(tabs[0].url);
		insertMark(params.get('ng'));
	});
};

const createArticlesList = doc => {
	const articleList = [];
	const articles = doc.getElementsByClassName('cmn-article_title');
	for (let l = 0; l < articles.length; l++) {
		const articlesElement = articles[l];
		const rawArticle = articlesElement
			.getElementsByTagName('span')[0]
			.getElementsByTagName('a')[0];
		if (!rawArticle) continue;
		const articleTitle = rawArticle
			.getElementsByTagName('span')[0]
			.getElementsByTagName('span')[0].textContent;
		if (!articleTitle) continue;
		let article = {};
		article.href = rawArticle.href;
		article.title = articleTitle.substr(0, 16);
		articleList.push(article);
	}
	return articleList;
};

const getArticles = async param => {
	const url = `https://www.nikkei.com/paper/` + param;
	const res = await fetch(url).then(response => response.text());
	const parser = new DOMParser();
	const doc = parser.parseFromString(res, 'text/html');
	return createArticlesList(doc);
};

const createHtml = articleList => {
	let html = '';
	for (let i = 0; i < articleList.length; i++) {
		const article = articleList[i];
		html += `<a href=${article.href}>${article.title.substr(0, 16)}</a><br>`;
	}
	return html;
};

const insertHtml = html => {
	document.getElementById('articles').insertAdjacentHTML('afterbegin', html);
};

const insertMark = id => {
	const articlesHtml = document
		.getElementById('articles')
		.getElementsByTagName('a');
	for (let i = 0; i < articlesHtml.length; i++) {
		const articleHtml = articlesHtml[i];
		const href = new URLSearchParams(articleHtml.href);
		const ng = href.get('ng');
		if (ng === id) {
			return articleHtml.insertAdjacentHTML(
				'beforebegin',
				'<a id="marked">=></a>'
			);
		}
	}
};

const removeMark = () => {
	const mark = document.getElementById('marked');
	if (mark) mark.remove();
};

const transition = url => {
	chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
		chrome.tabs.update(tabs[0].id, { url: url });
	});
};

const transitUrl = target => {
	const rawHref = target.href;
	if (!rawHref) return;
	const host = 'https://www.nikkei.com';
	const path = rawHref.substr(rawHref.indexOf('/paper/article/'));
	const url = host + path;
	removeMark();
	transition(url);
	const params = new URLSearchParams(url);
	id = params.get('ng');
	insertMark(id);
};

const removeArtilces = () => {
	const artilcesHtml = document.getElementById('articles');
	artilcesHtml.insertAdjacentHTML('afterend', '<div id="articles"></div>');
	artilcesHtml.remove();
};

const renderArticles = async param => {
	const articleList = await getArticles(param);
	const html = createHtml(articleList);
	insertHtml(html);
	createMark();
};

const transitNextArticle = () => {
	const currentArticle = document.getElementById('marked');
	if (!currentArticle) renderArticles('');
	const nextArticle =
		currentArticle.nextElementSibling.nextElementSibling.nextElementSibling;
	transitUrl(nextArticle);
};

const manageClick = () => {
	document.addEventListener('click', e => {
		e.preventDefault();
		if (e.target.id === 'getArticles') {
			let param = '';
			if (e.target.className) param = e.target.className;
			removeArtilces();
			renderArticles(param);
		} else if (e.target.id === 'nextArticle') {
			transitNextArticle();
		} else {
			transitUrl(e.target);
		}
	});
};

const checkCurrentPage = () => {
	chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
		const articlesUrl = 'https://www.nikkei.com/paper/';
		const url = tabs[0].url;
		if (!url.startsWith(articlesUrl)) {
			return;
		} else {
			const param = url.replace(articlesUrl, '').substr(0, 7);
			renderArticles(param);
		}
	});
};

(() => {
	try {
		manageClick();
		checkCurrentPage();
		return;
	} catch (e) {
		console.log(e);
		alert(e);
	}
})();
