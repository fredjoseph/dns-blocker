const refresh_url = 'https://raw.githubusercontent.com/fredjoseph/dns-blocker/master/data.js';
var enabled = false;
var blocked_domains;

const redirector = details => {
	console.log("blocking:", details.url);
	return { cancel: enabled };
}

function activateBlocking() {
	chrome.webRequest.onBeforeRequest.addListener(
		redirector,
		{ urls: blocked_domains },
		["blocking"]
	);
}

function deactivateBlocking() {
	chrome.webRequest.onBeforeRequest.removeListener( redirector );
}

function activate() {
	if (enabled) {
		return;
	}
	enabled = true;
	chrome.browserAction.setIcon({
		path: {
			"16": "assets/shield-green16.png",
			"32": "assets/shield-green32.png"
		}
	});
	chrome.browserAction.setTitle({ title: 'DNS Blocker is currently running' });
	activateBlocking();
	chrome.storage.local.get(['version'], res => {
		checkForUpdate(res.version);
	})
}

function deactivate() {
	enabled = false;
	chrome.browserAction.setIcon({
		path: {
			"16": "assets/shield-red16.png",
			"32": "assets/shield-red32.png"
		}
	});
	chrome.browserAction.setTitle({ title: 'DNS Blocker is turned off' });
	deactivateBlocking();
}

function checkForUpdate(localVersion) {
	let xhr = new XMLHttpRequest();
	xhr.open('GET', refresh_url);
	xhr.setRequestHeader('Content-Type', 'application/json');
	xhr.onload = () => {
		if (xhr.status != 200) {
			return;
		}
		let data = JSON.parse(xhr.responseText);
		if (localVersion != data.version) {
			chrome.storage.local.set({ version: data.version }, () => {});
			deactivateBlocking();
			blocked_domains = data.domains;
			activateBlocking();
		}
	};
	xhr.send();
}

if (chrome.runtime.onSuspend) {
	chrome.runtime.onSuspend.addListener(() => {
		// Clean storage
		chrome.storage.local.remove(['sessionActivationStatus', 'version'], () => {});
	})
}

chrome.storage.local.remove(['sessionActivationStatus'], () => {});

(() => {
	let xhr = new XMLHttpRequest();
	xhr.open('GET', "data.json");
	xhr.setRequestHeader('Content-Type', 'application/json');
	xhr.onload = () => {
		if (xhr.status != 200) {
			chrome.storage.local.set({globalActivationStatus: true});
			return;
		}
		let data = JSON.parse(xhr.responseText);
		chrome.storage.local.set({version: data.version}, () => {})
		blocked_domains = data.domains;

		chrome.storage.local.get(['globalActivationStatus'], res => {
			if (res.globalActivationStatus) {
				activate();
				chrome.storage.local.set({sessionActivationStatus: true}, () => {})
			}
			chrome.storage.onChanged.addListener(changes => {
				if (changes.sessionActivationStatus) {
					changes.sessionActivationStatus.newValue ? activate() : deactivate();
				}
			})
		})
	};
	xhr.send();
})();
