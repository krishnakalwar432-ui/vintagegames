/*!
Copyright 2022 ChromeHack Team

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import contents from "./contents.js";
import TestGameDB from "./testgamedb.js";

// default error handler
window.onerror = (message, src, lineno, colno, error) => {
	alert(`Error at "${src}", line ${lineno}:${colno}: \n${error}`, "Error");
};

const location = new URL(window.location.href);
const nsw = window.navigator.serviceWorker;
const embedded = window != window.top;
let proxy = nsw != null && location.hostname != "localhost";

if (proxy) {
	try {
		await nsw.register("/sw.js", {
			scope: "/",
			type: "classic",
			updateViaCache: "none"
		});
		await nsw.ready;
	} catch (err) {
		console.error(err);
		proxy = false;
	}
}

const searchBar = document.getElementById("search-bar");
const contextMenu = document.getElementById("context-menu");

const gameGrid = document.getElementById("game-grid");
const tabs = document.querySelectorAll(".tab");
const sortSelect = document.getElementById("sort-select");

let activeType = "all";
let activeSort = "default";

const allGames = () => [
	...contents.html5Games.map((g) => ({ ...g, type: "html5" })),
	...contents.flashGames.map((g) => ({ ...g, type: "flash" })),
	...contents.dosGames.map((g) => ({ ...g, type: "dos" }))
];

/**
 * @param {{readonly name: string; readonly path?: string; readonly url?: string; readonly preview?: string; readonly type?: string}[]} contents 
 * @param {HTMLElement} grid 
 * @param {boolean | undefined} noPreview 
 */
function updateContents(contents, grid, noPreview) {
	grid.innerHTML = "";

	for (const content of contents) {
		const name = content.name;
		const path = content.path;
		const url = content.url;
		const type = content.type || "";

		const item = document.createElement("div");
		item.className = "game-item";

		const preview = document.createElement("div");
		preview.className = "game-preview";
		if (!noPreview) {
			preview.setAttribute("style", `background-image: url("./preview/${encodeURIComponent(name)}.jpg");`);
		}
		item.appendChild(preview);

		const badge = document.createElement("div");
		badge.className = "game-badge";
		badge.textContent = type.toUpperCase();
		item.appendChild(badge);

		const label = document.createElement("div");
		label.className = "game-label";
		label.textContent = name;
		item.appendChild(label);

		item.onclick = () => {
			window.location.href = path != null ? path : proxyUrl(url);
		};

		item.oncontextmenu = (e) => {
			e.preventDefault();
			e.stopPropagation();
			window.location.href = path != null ? path : proxyUrl(url);
		};

		grid.appendChild(item);
	}
}

/**
 * @param {string} url 
 */
function proxyUrl(url) {
	return proxy ? "uv.xht?o=" + encodeURIComponent(url) : url;
}

/**
 * @param {string | undefined} path 
 * @param {string | undefined} url 
 */

function sortGames(list) {
	if (activeSort === "name-asc") {
		return [...list].sort((a, b) => a.name.localeCompare(b.name));
	}
	if (activeSort === "name-desc") {
		return [...list].sort((a, b) => b.name.localeCompare(a.name));
	}
	return list;
}

function renderGames() {
	const searchValue = searchBar.value.toLowerCase();
	let games = allGames();

	if (activeType !== "all") {
		games = games.filter((g) => g.type === activeType);
	}

	if (searchValue.length > 0) {
		games = games.filter((g) => g.name.toLowerCase().includes(searchValue));
	}

	games = sortGames(games);
	updateContents(games, gameGrid);
}

for (const tab of tabs) {
	tab.onclick = () => {
		for (const t of tabs) t.classList.remove("active");
		tab.classList.add("active");
		activeType = tab.dataset.type || "all";
		renderGames();
	};
}

sortSelect.onchange = () => {
	activeSort = sortSelect.value;
	renderGames();
};

searchBar.oninput = () => renderGames();

document.body.oncontextmenu = (e) => {
	e.preventDefault();
	contextMenu.style.top = e.clientY + "px";
	contextMenu.style.left = e.clientX + "px";
	contextMenu.style.display = "block";
};
document.body.onclick = () => {
	contextMenu.style.display = "none";
};
document.getElementById("clear-site-data").onclick = async () => {
	window.sessionStorage.clear();
	window.localStorage.clear();
	let databases = await indexedDB.databases();
	for (let i = 0; i < databases.length; i++)
		indexedDB.deleteDatabase(databases[i].name);
};
document.getElementById("clear-cache").onclick = async () => {
	let keys = await caches.keys();
	for (let i = 0; i < keys.length; i++)
		await caches.delete(keys[i]);
};

export const status=[!1];export const locker={lock:()=>true};locker.lock()&&(renderGames(),document.getElementById("loading").style.display="none",document.getElementById("main").style.display="block",status[0]=!0);
