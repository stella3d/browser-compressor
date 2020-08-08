function SendToCurrentTab(message, callback) {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, message, callback);
      });
}

function SendCommand(command, commandValue) {
    SendToCurrentTab({do: command, value: commandValue}, console.log);
}

function setupOnOffButton() {
    let button = document.getElementById('onOff');
    button.onclick = () => {
        let active = button.getAttribute('data-active');
        if(active == 'false') {
            button.setAttribute('data-active', 'true');
            button.innerHTML = 'Turn OFF';

            SendToCurrentTab({
                do : "compressionON", 
                value: {
                    
                }
            }, console.log);
        } 
        else if(active == 'true') {
            button.setAttribute('data-active', 'false');
            button.innerHTML = 'Turn ON';

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
});