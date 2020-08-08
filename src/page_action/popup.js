function SendToCurrentTab(message, callback) {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, message, callback);
      });
}

function SendCommand(command, commandValue) {
    SendToCurrentTab({do: command, value: commandValue}, console.log);
}

function getState(callback) {
    SendToCurrentTab({do: "getState"}, callback);
}

function getGainReduction(callback) {
    SendToCurrentTab({do: "getGainReduction"}, callback);
}

onToggle = document.getElementById('onOff');
onToggleLabel = document.getElementById('onOffLabel');

sliders = {
    ratio: document.getElementById('ratio'),
    threshold: document.getElementById('threshold'),
    attack: document.getElementById('attack'),
    release: document.getElementById('release'),
    gain: document.getElementById('gain')
}

function setPollGainInterval() {
    console.log("set poll");
    // poll the gain reduction of the compressor at 30fps
    pollGainInterval = setInterval(() => {
        getGainReduction((response) => {
            const val = response['value'];
            currentGainReduction = val;
            reductionElement.innerHTML = `${val.toFixed(3)} Db`;
        });
    }, 33);
}

currentGainReduction = 0;
reductionElement = document.getElementById('reductionValue');
pollGainInterval = null;
function setupOnOffButton() {
    onToggle.onclick = () => {
        if(onToggle.checked) {
            onToggleLabel.innerHTML = "On";
            SendToCurrentTab({ do : "compressorOn" }, console.log);
            setPollGainInterval();
        } 
        else {
            onToggleLabel.innerHTML = "Off";
            SendToCurrentTab({do : "compressorOff"}, console.log);
            clearInterval(pollGainInterval);
        }
    }
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

    // sync popup UI state with the browser page's compressor when opened
    getState((response) => {
        console.log(response);
        if(!response)
            return;
        
        onToggle.checked = response['enabled'];

        const comp = response['comp'];
        if(!comp)
            return;

        sliders.ratio.value = comp['ratio'];
        sliders.threshold.value = comp['threshold'];
        sliders.attack.value = comp['attack'];
        sliders.release.value = comp['release'];
        
        sliders.gain.value = comp['gain'];
    });
});