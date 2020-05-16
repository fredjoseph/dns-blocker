const refresh_url = 'https://raw.githubusercontent.com/fredjoseph/dns-blocker/master/web-extension/data.json';
var enabled = false;
var blocked_domains;

async function removeStorageData(dataKeys) {
	return new Promise((resolve, _reject) => {
		chrome.storage.local.remove(dataKeys, () => resolve());
	});
}

async function getStorageData(dataKeys) {
	return new Promise((resolve, _reject) => {
		chrome.storage.local.get(dataKeys, res => resolve(res));
	});
}

async function setStorageData(obj) {
	return new Promise((resolve, _reject) => {
		chrome.storage.local.set(obj, () => resolve());
	});
}

const redirector = details => {
	console.log("blocking:", details.url);
	return { cancel: enabled };
}

function activate() {
	if (enabled) {
		return;
	}
	enabled = true;
	chrome.webRequest.onBeforeRequest.addListener(
		redirector,
		{ urls: blocked_domains },
		["blocking"]
	);

	chrome.browserAction.setBadgeText({ text: '✓' });
	chrome.browserAction.setBadgeBackgroundColor({ color: '#008800' });
	chrome.browserAction.setTitle({ title: 'DNS Blocker is currently running' });
}

function deactivate() {
	enabled = false;
	chrome.webRequest.onBeforeRequest.removeListener(redirector);

	chrome.browserAction.setBadgeText({ text: '✗' });
	chrome.browserAction.setBadgeBackgroundColor({ color: '#CC0000' });
	chrome.browserAction.setTitle({ title: 'DNS Blocker is turned off' });
}

async function checkForUpdate() {
	return new Promise(async (resolve, reject) => {
		const { lastCheckDate: lastCheckDateISO, updateInterval = 1, version } = await getStorageData(['lastCheckDate', 'updateInterval', 'version']);
		const currentDateISO = new Date().toISOString().split('T')[0];
		const currentDate = new Date(currentDateISO);
		const lastCheckDate = new Date(lastCheckDateISO);

		const diffDays = (currentDate.getTime() - lastCheckDate.getTime()) / (1000 * 3600 * 24);
		if (updateInterval === 0 || diffDays < updateInterval) {
			return resolve(false);	// already check recently
		}
		let xhr = new XMLHttpRequest();
		xhr.open('GET', refresh_url);
		xhr.setRequestHeader('Content-Type', 'application/json');
		xhr.onload = async () => {
			if (xhr.status != 200) {
				return reject();
			}
			let data = JSON.parse(xhr.responseText);
			if (version != data.version) {
				await setStorageData({ ...data });
			}
			setStorageData({ lastCheckDate: currentDateISO });

			return resolve(version != data.version);
		};
		xhr.send();
	})
}

function fetchDefaultData() {
	return new Promise((resolve, _reject) => {
		let xhr = new XMLHttpRequest();
		xhr.open('GET', "data.json");
		xhr.setRequestHeader('Content-Type', 'application/json');
		xhr.onload = () => {
			resolve(JSON.parse(xhr.responseText));
		}

		xhr.send();
	})
}

function fetchStorageData() {
	return new Promise((resolve, _reject) => {
		getStorageData(['version', 'domains']).then(res => {
			resolve({ version: res.version, domains: res.domains });
		})
	})
}

function loadData() {
	return new Promise((resolve, _reject) => {
		Promise.all([fetchDefaultData(), fetchStorageData()])
			.then(([defaultData, storageData]) => {
				const storageDataAvailable = storageData.version && storageData.domains;
				const data = storageDataAvailable ? storageData : defaultData;
				if (!storageDataAvailable) {
					// No data in storage (first launch) or corrupted data => store default data
					setStorageData({ version: data.version, domains: data.domains });
				}
				blocked_domains = data.domains;
				return resolve();
			})
	});
}

async function changeActivationStatusTo(active) {
	if (!active) {
		return deactivate();
	}

	activate();
	checkForUpdate().then(async updated => {
		if (updated) {
			await loadData();
			deactivate();
			activate();
		}
	});
}

(async () => {
	await removeStorageData(['sessionActivationStatus']);

	await loadData();
	chrome.commands.onCommand.addListener(function (command) {
		if (command === 'toggle-session-activation-status') {
			getStorageData(['sessionActivationStatus']).then(res => {
				setStorageData({ sessionActivationStatus: !res.sessionActivationStatus })
				chrome.notifications.create('', { title: 'DNS Blocker', message: !res.sessionActivationStatus ? 'Activation : On' : 'Activation : Off', iconUrl: 'assets/shield128.png', type: 'basic' })
			})
		}
	});

	chrome.storage.onChanged.addListener(changes => {
		if (changes.sessionActivationStatus) {
			changeActivationStatusTo(changes.sessionActivationStatus.newValue);
		}
	})

	getStorageData(['globalActivationStatus']).then(res => {
		const newStatus = res.globalActivationStatus === undefined ? true : res.globalActivationStatus;
		setStorageData({ globalActivationStatus: newStatus, sessionActivationStatus: newStatus })
	})
})();