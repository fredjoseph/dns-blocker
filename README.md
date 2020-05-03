# dns-blocker
DNS Blocker for Chrome and Firefox (Web Extension)

## Installation

### Chrome
1. Clone this repository
1. Visit `chrome://extensions/`
2. Enable Developer mode.
3. Click on `Load unpacked extension`
4. Select the cloned folder.
(You'll get an "Disable dev mode extensions" popup, if you try restarting Chrome at this stage)
5. Click on `Pack extension` and enter the root directory of the cloned folder (keep `pem file` empty)
6. Uninstall the previously installed extension (as unpacked extension)
7. Install the extension using the `.crx` file generated at step `5` and note its `ID`
8. Add the following registry key 
    - Under `HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Google\Chrome\ExtensionInstallWhitelist` (create it if not exists), create a new string for each extension you want to enable with sequential names (indices), e.g. 1, 2,...
    - Enter the extension ID as string value. For example, there is a string with name `1` and value `nmgnihglilniboicepgjclfiageofdfj`
9. Restart Chrome
10. You can check that the policy is working in Chrome by opening `chrome://policy`

### Firefox
1. Clone this repository
2. Visit `about:debugging`
3. click `This Firefox`
4. click `Load Temporary Add-on` then select the any file inside the extension's directory

## License
[FontAwesome](https://fontawesome.com/) - [CC BY 4.0 License](https://creativecommons.org/licenses/by/4.0/)