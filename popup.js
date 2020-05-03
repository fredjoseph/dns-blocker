window.onload = function () {
	function init() {
		let versionElement = document.getElementById('version');
		chrome.storage.local.get(['version'], res => {
			versionElement.textContent = res.version || 'N/A';
		})
		chrome.storage.onChanged.addListener(changes => {
			if (changes.version) {
				versionElement.textContent = changes.version.newValue;
			}
		})
		chrome.storage.local.get(['globalActivationStatus', 'sessionActivationStatus'], res => {
			sessionToggle.checked = res.sessionActivationStatus || false;
			globalToggle.checked = res.globalActivationStatus || false;
		})
	}

	let globalToggle = document.getElementById('global');
	let sessionToggle = document.getElementById('session');

	globalToggle.onclick = () => {
		// Sync session status on global status
		sessionToggle.checked = globalToggle.checked;
		chrome.storage.local.set({ globalActivationStatus: globalToggle.checked, sessionActivationStatus: sessionToggle.checked });
	}

	sessionToggle.onclick = () => {
		chrome.storage.local.set({ sessionActivationStatus: sessionToggle.checked });
	}

	init();
}