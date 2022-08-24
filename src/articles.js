const HOST = 'https://www.nikkei.com';
const MORNING = 'morning';
const EVENING = 'evening';
const buttons = document.getElementsByTagName('button');

const createMark = () => {
	chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
		const param = new URLSearchParams(tabs[0].url).get('ng');
		if (param) {
			try {
				insertMark(param);
				scrollIntoTargetedHtml(param);
			} catch (e) {
				window.scroll({ top: 0, behavior: 'smooth' });
				console.log(e);
			}
		}
	});
};

const getLatest = () => {
	const now = new Date();
	if ((now.getHours() > 14 || now.getHours() < 2) && now.getDay() !== 0)
		return EVENING;
	return MORNING;
};

const disableButton = param => {
	for (let i = 0; i < buttons.length; i++) {
		buttons[i].disabled = false;
	}
	if (param !== '') {
		document.getElementsByClassName(param)[0].disabled = true;
		if (param === getLatest()) buttons[0].disabled = true;
	} else {
		buttons[0].disabled = true;
		document.getElementsByClassName(getLatest())[0].disabled = true;
	}
};

const createHtml = articleList => {
	let html = '';
	for (let i = 0; i < articleList.length; i++) {
		const article = articleList[i];
		html += `<a id="${article.id}" href=${
			article.href
		}>${article.title.substring(0, 16)}</a><br>`;
	}
	return html;
};

const insertMark = id => {
	document
		.getElementById(id)
		.insertAdjacentHTML('beforebegin', '<strong id="marked">=></strong>');
};

const removeMark = () => {
	const mark = document.getElementById('marked');
	if (mark) mark.remove();
};

const transition = url => {
	chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
		chrome.tabs.update(tabs[0].id, { url: url }, () => {});
		chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
			if (changeInfo.status === 'complete') {
				chrome.tabs.sendMessage(tabId, { message: 'scroll' });
			}
		});
	});
};

const scrollIntoTargetedHtml = id => {
	const articleHtml = document.getElementById(id);
	let height = 0;
	const headerHeight = 85;
	if (articleHtml) {
		height = articleHtml.offsetTop - headerHeight;
	}
	window.scroll({ top: height, behavior: 'smooth' });
};

const transitUrl = target => {
	const rawHref = target.href;
	if (!rawHref) return;
	const path = rawHref.substring(rawHref.indexOf('/paper/article/'));
	const url = HOST + path;
	removeMark();
	transition(url);
	insertMark(target.id);
	scrollIntoTargetedHtml(target.id);
};

const removeArticles = () => {
	const articlesHtml = document.getElementById('articles');
	if (articlesHtml.innerHTML === '') return;
	articlesHtml.insertAdjacentHTML(
		'afterend',
		'<div id="articles" class="articles"></div>'
	);
	articlesHtml.remove();
};

const renderArticles = param => {
	if (!(param === MORNING || param === EVENING || param === '')) return;
	chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
		chrome.tabs.sendMessage(
			tabs[0].id,
			{ message: 'getArticles', options: param },
			response => {
				const html = createHtml(response);
				document.getElementById('nextArticle').disabled = false;
				disableButton(param);
				document
					.getElementById('articles')
					.insertAdjacentHTML('afterbegin', html);
				createMark();
			}
		);
	});
};

const transitNextArticle = () => {
	const currentArticle = document.getElementById('marked');
	let nextArticle;
	if (currentArticle) {
		nextArticle =
			currentArticle.nextElementSibling.nextElementSibling.nextElementSibling;
	} else {
		nextArticle = document
			.getElementById('articles')
			.getElementsByTagName('a')[0];
	}
	transitUrl(nextArticle);
};

const manageClick = () => {
	document.addEventListener('click', async e => {
		e.preventDefault();
		if (e.target.id === 'getArticles') {
			let param = '';
			if (e.target.className) param = e.target.className;
			removeArticles();
			await renderArticles(param);
		} else if (e.target.id === 'nextArticle') {
			transitNextArticle();
		} else {
			transitUrl(e.target);
		}
	});
};

const checkCurrentPage = () => {
	chrome.tabs.query({ active: true, lastFocusedWindow: true }, async tabs => {
		const currentUrl = tabs[0].url;
		const articlesUrl = HOST + '/paper/';
		if (
			currentUrl === articlesUrl ||
			currentUrl === articlesUrl + MORNING ||
			currentUrl === articlesUrl + EVENING
		) {
			chrome.tabs.sendMessage(
				tabs[0].id,
				{ message: 'getArticles', options: 'current' },
				response => {
					const html = createHtml(response);
					document.getElementById('nextArticle').disabled = false;
					disableButton(tabs[0].url.replace(articlesUrl, '').substring(0, 7));
					document
						.getElementById('articles')
						.insertAdjacentHTML('afterbegin', html);
				}
			);
		} else if (!currentUrl.startsWith(HOST)) {
			window.close();
		}
	});
};

(() => {
	try {
		manageClick();
		checkCurrentPage();
	} catch (e) {
		console.log(`Error occurred(nikkei-paper-extension): ${e}`);
	}
})();
