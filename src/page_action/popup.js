function SendToCurrentTab(message, callback) {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, message, callback);
      });
}

function SendCommand(command, commandValue) {
    SendToCurrentTab({do: command, value: commandValue});
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

sliderLabels = [
    document.querySelector('#ratio + div'),
    document.querySelector('#threshold + div'),
    document.querySelector('#attack + div'),
    document.querySelector('#release + div'),
    document.querySelector('#gain + div')
]

function grayLabelsOut() {
    document.querySelectorAll('.tooltip').forEach((elem => {
        if(elem && elem.classList)
            elem.classList.add('inactive');
    }));
}

function unGrayLabels() {
    document.querySelectorAll('.tooltip').forEach((elem => {
        if(elem && elem.classList)
            elem.classList.remove('inactive');
    }));
}

currentGainReduction = 0;
reductionElement = document.getElementById('reductionValue');
pollGainInterval = null;

function setPollGainInterval() {
    // poll the gain reduction of the compressor at ~25fps
    const pollGainMilliseconds = 40;
    return setInterval(() => {
        getGainReduction((response) => {
            if(!response) return;
            const val = response['value'];
            if(!val) return;
            
            currentGainReduction = val;
            reductionElement.innerHTML = `${val.toFixed(2)} Decibels`;
        });
    }, pollGainMilliseconds);
}

function setupOnOffButton() {
    const offLabel = '........ Off';
    onToggle.innerHTML = onToggle.checked ? 'On' : offLabel;

    onToggle.onclick = () => {
        if(onToggle.checked) {
            unGrayLabels();
            onToggleLabel.innerHTML = 'On';

            SendToCurrentTab({ do : "compressorOn" }, (response) => {
                if(!response) 
                    return;
                const success = response['success'];
                if(success) {
                    pollGainInterval = setPollGainInterval();
                }
                else {
                    onToggle.checked = false;    
                    onToggleLabel.innerHTML = offLabel;
                    grayLabelsOut();
                }
            });
        } 
        else {
            grayLabelsOut();
            onToggleLabel.innerHTML = offLabel;
            reductionElement.innerHTML = '-0.00 Decibels';
            SendToCurrentTab({do : "compressorOff"});
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