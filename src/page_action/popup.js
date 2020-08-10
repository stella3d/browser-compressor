onToggle = document.getElementById('onOff');
onToggleLabel = document.getElementById('onOffLabel');
tooltips = document.querySelectorAll('.tooltip');
gainReductionLabel = document.getElementById('gainReductionLabel');

sliders = {
    ratio: document.getElementById('ratio'),
    threshold: document.getElementById('threshold'),
    attack: document.getElementById('attack'),
    release: document.getElementById('release'),
    gain: document.getElementById('gain')
}

const browserRef = chrome ? chrome : browser;   // for cross-compat with FF

function getActiveTab(callback) {
    browserRef.tabs.query({active: true, currentWindow: true}, callback);
}

function SendToPage(message, callback) {
    getActiveTab((tabs) => {
        browserRef.tabs.sendMessage(tabs[0].id, message, callback);
    });
}

function executeContentScript(sciptFilename, callback) {
    getActiveTab((tabs) => {
        browserRef.tabs.executeScript(tabs[0].id, {file: sciptFilename}, callback);
    });
}

function SendCommand(command, data, callback = null) {   
    SendToPage({do: command, value: data}, callback);
}

function getState(callback) {
    SendToPage({do: "getState"}, callback);
}

function getGainReduction(callback) {
    SendToPage({do: "getGainReduction"}, callback);
}

function getSettingsFromUI() { 
    return {
        ratio: sliders.ratio.value,
        threshold: sliders.threshold.value,
        attack: sliders.attack.value,
        release: sliders.release.value,
        knee: 30,                           // TODO - put knee in advanced settings option ?
        gain: sliders.gain.value
    }
}

function requestCompressorOn() {
    SendCommand("compressorOn", getSettingsFromUI(), (response) => {
        if(!response || !response['success']) 
            setInactiveUI();
        else
            setActiveUI();
    });
}

hasInjected = false;
function setupCompressionToggle() {
    onToggle.onclick = () => {
        if(onToggle.checked) {
            if(!hasInjected) {
                // need to finish injecting before requesting compression on can succeed
                executeContentScript('src/inject/inject.js', (results) => {
                    hasInjected = true;
                    requestCompressorOn();
                });
            }
            requestCompressorOn();
        } 
        else {
            SendToPage({do : "compressorOff"});
            setInactiveUI();
        }
    }
}

function setupSliderUpdates() {
    sliders.ratio.oninput = () => SendCommand("setRatio", sliders.ratio.value);
    sliders.threshold.oninput = () => SendCommand("setThreshold", sliders.threshold.value);
    sliders.attack.oninput = () => SendCommand("setAttack", sliders.attack.value);
    sliders.release.oninput = () => SendCommand("setRelease", sliders.release.value);
    sliders.gain.oninput = () => SendCommand("setGain", sliders.gain.value);
}

pollGainInterval = null;
function setPollGainInterval() {
    // poll the gain reduction of the compressor at 20fps
    const pollGainMilliseconds = 50;
    pollGainInterval = setInterval(() => {
        getGainReduction((response) => {
            if(!response) return;
            const val = response['value'];
            if(!val) return;

            gainReductionLabel.innerHTML = `${val.toFixed(2)} Decibels`;
        });
    }, pollGainMilliseconds);
}

function setActiveUI() {
    onToggle.checked = true;    
    onToggleLabel.innerHTML = 'On';
    tooltips.forEach((elem => elem?.classList.remove('inactive')));
    setPollGainInterval();
}

function setInactiveUI() {
    clearInterval(pollGainInterval);
    const offLabel = '........ Off';        // dots are a spacing hack
    onToggleLabel.innerHTML = offLabel;
    tooltips.forEach((elem => elem?.classList.add('inactive')));
    onToggle.checked = false;    
    gainReductionLabel.innerHTML = '-0.00 Decibels';
}

document.addEventListener('DOMContentLoaded', () => {
    setupCompressionToggle();
    setupSliderUpdates();

    // sync popup UI state with the browser page's compressor when opened
    getState((response) => {
        if(!response || !response['enabled']) {
            setInactiveUI();
            return;
        }
        
        setActiveUI();
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
