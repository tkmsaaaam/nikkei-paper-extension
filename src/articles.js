const createMark = () => {
	chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
		const params = new URLSearchParams(tabs[0].url);
		insertMark(params.get('ng'));
		scrollIntoTargetedHtml(params.get('ng'));
	});
};

const checkLatest = () => {
	const now = new Date();
	if ((now.getHours() > 14 || now.getHours() < 2) && now.getDay() != 0)
		return 'evening';
	return 'morning';
};

const disableButton = param => {
	const buttons = document.getElementsByTagName('button');
	for (let i = 0; i < buttons.length; i++) {
		buttons[i].disabled = false;
	}
	if (param !== '') {
		document.getElementsByClassName(param)[0].disabled = true;
		if (param == checkLatest()) buttons[0].disabled = true;
	} else {
		buttons[0].disabled = true;
		document.getElementsByClassName(checkLatest())[0].disabled = true;
	}
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
		article.id = new URLSearchParams(rawArticle.href).get('ng');
		article.title = articleTitle;
		if (article.href == null || article.id == null || article.title == null)
			continue;
		articleList.push(article);
	}
	return articleList;
};

const getArticles = async param => {
	const url = `https://www.nikkei.com/paper/` + param;
	const res = await fetch(url).then(response => response.text());
	const parser = new DOMParser();
	const doc = parser.parseFromString(res, 'text/html');
	disableButton(param);
	return createArticlesList(doc);
};

const createHtml = articleList => {
	let html = '';
	for (let i = 0; i < articleList.length; i++) {
		const article = articleList[i];
		html += `<a id="${article.id}" href=${article.href}>${article.title.substr(
			0,
			16
		)}</a><br>`;
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
		const ng = articleHtml.id;
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
		chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
			if (changeInfo.status === 'complete') {
				chrome.scripting.executeScript({
					target: { tabId },
					func: () => {
						window.scroll({
							top: 300,
							behavior: 'smooth',
						});
					},
				});
			}
		});
	});
};

const scrollIntoTargetedHtml = id => {
	const height = document.getElementById(id).offsetTop - 85;
	window.scroll({ top: height, behavior: 'smooth' });
};

const transitUrl = target => {
	const rawHref = target.href;
	if (!rawHref) return;
	const host = 'https://www.nikkei.com';
	const path = rawHref.substr(rawHref.indexOf('/paper/article/'));
	const url = host + path;
	removeMark();
	transition(url);
	insertMark(target.id);
	scrollIntoTargetedHtml(target.id);
};

const removeArtilces = () => {
	const artilcesHtml = document.getElementById('articles');
	if (artilcesHtml.innerHTML == '') return;
	artilcesHtml.insertAdjacentHTML(
		'afterend',
		'<div id="articles" class="articles"></div>'
	);
	artilcesHtml.remove();
};

const renderArticles = async param => {
	if (!(param == 'morning' || param == 'evening' || param == '')) return;
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
