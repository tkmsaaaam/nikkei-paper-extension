const HOST = 'https://www.nikkei.com';
const MORNING = 'morning';
const EVENING = 'evening';
const buttons = document.getElementsByTagName('button');

type Article = {
	href: string;
	id: string;
	title: string;
};

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

const disableButton = (param: string) => {
	for (let i = 0; i < buttons.length; i++) {
		buttons[i].disabled = false;
	}
	if (param !== '') {
		(document.getElementById(param) as HTMLButtonElement).disabled = true;
		if (param === getLatest()) buttons[0].disabled = true;
	} else {
		buttons[0].disabled = true;
		(document.getElementById(getLatest()) as HTMLButtonElement).disabled = true;
	}
};

const createHtml = (articleList: Article[]) => {
	let html = '';
	for (let i = 0; i < articleList.length; i++) {
		const article = articleList[i];
		html += `<a id="${article.id}" href=${
			article.href
		}>${article.title.substring(0, 16)}</a><br>`;
	}
	return html;
};

const insertMark = (id: string) => {
	(document.getElementById(id) as HTMLDivElement).insertAdjacentHTML(
		'beforebegin',
		'<strong id="marked">=></strong>'
	);
};

const transition = (url: string) => {
	chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
		chrome.tabs.update(tabs[0].id as number, { url: url }, () => {});
		chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
			if (changeInfo.status === 'complete') {
				chrome.tabs.sendMessage(tabId, { message: 'scroll' }).then();
			}
		});
	});
};

const scrollIntoTargetedHtml = (id: string) => {
	const articleHtml = document.getElementById(id);
	let height = 0;
	const headerHeight = 85;
	if (articleHtml) {
		height = articleHtml.offsetTop - headerHeight;
	}
	window.scroll({ top: height, behavior: 'smooth' });
};

const transitUrl = (target: HTMLAnchorElement) => {
	const rawHref = target.href;
	if (!rawHref) return;
	const path = rawHref.substring(rawHref.indexOf('/paper/article/'));
	const url = HOST + path;
	const mark = document.getElementById('marked');
	if (mark) mark.remove();
	transition(url);
	insertMark(target.id);
	scrollIntoTargetedHtml(target.id);
};

const removeArticles = () => {
	const articlesHtml = document.getElementById('articles');
	if (!articlesHtml || articlesHtml.innerHTML === '') return;
	articlesHtml.insertAdjacentHTML(
		'afterend',
		'<div id="articles" class="articles"></div>'
	);
	articlesHtml.remove();
};

const renderArticles = (param: string) => {
	if (!(param === MORNING || param === EVENING || param === '')) return;
	chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
		chrome.tabs.sendMessage(
			tabs[0].id as number,
			{ message: 'getArticles', options: param },
			response => {
				const html = createHtml(response);
				(
					document.getElementsByClassName('nextArticle')[0] as HTMLButtonElement
				).disabled = false;
				disableButton(param);
				(
					document.getElementById('articles') as HTMLDivElement
				).insertAdjacentHTML('afterbegin', html);
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
			currentArticle.nextElementSibling?.nextElementSibling?.nextElementSibling;
	} else {
		nextArticle = (
			document.getElementById('articles') as HTMLDivElement
		).getElementsByTagName('a')[0];
	}
	transitUrl(nextArticle as HTMLAnchorElement);
};

const manageClick = () => {
	document.addEventListener('click', async (e: MouseEvent) => {
		e.preventDefault();
		if ((e.target as HTMLAnchorElement).className === 'getArticles') {
			let param = '';
			if ((e.target as HTMLAnchorElement).id)
				param = (e.target as HTMLAnchorElement).id;
			removeArticles();
			await renderArticles(param);
		} else if ((e.target as HTMLAnchorElement).className === 'nextArticle') {
			transitNextArticle();
		} else {
			transitUrl(e.target as HTMLAnchorElement);
		}
	});
};

const checkCurrentPage = () => {
	chrome.tabs.query({ active: true, lastFocusedWindow: true }, async tabs => {
		const currentUrl = tabs[0].url as string;
		const articlesUrl = HOST + '/paper/';
		if (
			currentUrl === articlesUrl ||
			currentUrl === articlesUrl + MORNING ||
			currentUrl === articlesUrl + EVENING
		) {
			chrome.tabs.sendMessage(
				tabs[0].id as number,
				{ message: 'getArticles', options: 'current' },
				response => {
					const html = createHtml(response);
					(
						document.getElementsByClassName(
							'nextArticle'
						)[0] as HTMLButtonElement
					).disabled = false;
					disableButton(
						(tabs[0].url as string).replace(articlesUrl, '').substring(0, 7)
					);
					(
						document.getElementById('articles') as HTMLDivElement
					).insertAdjacentHTML('afterbegin', html);
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
