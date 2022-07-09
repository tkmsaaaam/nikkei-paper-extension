const createMark = () => {
	chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
		const params = new URLSearchParams(tabs[0].url);
		insertMark(params.get('ng'));
	});
};

const getArticles = async param => {
	const url = `https://www.nikkei.com/paper/` + param;
	const res = await fetch(url).then(response => response.text());
	const articleList = [];
	const parser = new DOMParser();
	const doc = parser.parseFromString(res, 'text/html');
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

const transitUrl = e => {
	const rawHref = e.target.href;
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

const renderArticles = async (target) => {
	let param = '';
	if (target.className) param = target.className;
	const articleList = await getArticles(param);
	const html = createHtml(articleList);
	insertHtml(html);
	createMark();
};

const manageClick = () => {
	document.addEventListener('click', e => {
		e.preventDefault();
		if (e.target.id === 'getArticles') {
			renderArticles(e.target);
		} else {
			transitUrl(e);
		}
	});
};

(() => {
	try {
		manageClick();
		return;
	} catch (e) {
		console.log(e);
		alert(e);
	}
})();
