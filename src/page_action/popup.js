function SendToCurrentTab(message, callback) {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, message, callback);
      });
}

function SendCommand(command, commandValue) {
    SendToCurrentTab({do: command, value: commandValue}, console.log);
}

onToggle = document.getElementById('onOff');

function setupOnOffButton() {
    onToggle.onclick = () => {
        let active = onToggle.checked;
        if(active) {
            //onToggle.setAttribute('data-active', 'true');
            SendToCurrentTab({ do : "compressionON" }, console.log);
        } 
        else {
            //onToggle.setAttribute('data-active', 'false');
            SendToCurrentTab({do : "compressionOFF"}, console.log);
        }
    }
}

sliders = {
    ratio: document.getElementById('ratio'),
    threshold: document.getElementById('threshold'),
    attack: document.getElementById('attack'),
    release: document.getElementById('release'),
    gain: document.getElementById('gain')
}

function getEnabledState(callback) {
    SendToCurrentTab({do: "getEnabled"}, callback);
}

function getState(callback) {
    SendToCurrentTab({do: "getState"}, callback);
}

function setupRangeElement(rangeElement, callback) {
    rangeElement.oninput = () => callback(rangeElement.value);
}

function setupSliderUpdates() {
    setupRangeElement(sliders.ratio, (ratio) => SendCommand("setRatio", ratio));
    setupRangeElement(sliders.threshold, (threshold) => SendCommand("setThreshold", threshold));
    setupRangeElement(sliders.attack, (attack) => SendCommand("setAttack", attack));
    setupRangeElement(sliders.release, (release) => SendCommand("setRelease", release));
    setupRangeElement(sliders.gain, (gain) => SendCommand("setGain", gain));
}

document.addEventListener('DOMContentLoaded', () => {
    setupOnOffButton();
    setupSliderUpdates();

    console.log('try to get state');
    // sync UI state with the page
    getState((response) => {
        console.log('getState response');
        console.log(response);

        onToggle.checked = response['enabled'];

        const compState = response['comp'];
        if(!compState)
            return;

        sliders.ratio.value = compState['ratio'];
        sliders.threshold.value = compState['threshold'];
        sliders.attack.value = compState['attack'];
        sliders.release.value = compState['release'];
        
        sliders.gain.value = compState['gain'];
    });
});