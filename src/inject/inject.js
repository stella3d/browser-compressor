defaults = {
	ratio: 8,
	threshold: -40,
	attack: 0,
	release: 0.2,
	knee: 30,
	gain: 1
};

compressor = {
	audioContext: {},
	mediaSource: {},
	nodes: {
		comp: {},
		gain: {}
	},
	initialized: false,
	enabled: false,

	createCompressorNode(audioCtx) {
		let comp = audioCtx.createDynamicsCompressor();
		comp.threshold.setValueAtTime(defaults.threshold, audioCtx.currentTime);
		comp.ratio.setValueAtTime(defaults.ratio, audioCtx.currentTime);
		comp.attack.setValueAtTime(defaults.attack, audioCtx.currentTime);
		comp.release.setValueAtTime(defaults.release, audioCtx.currentTime);
		comp.knee.setValueAtTime(defaults.knee, audioCtx.currentTime);
		this.nodes.comp = comp;
		return comp;
	},

	createGainNode(audioCtx) {
		this.nodes.gain = audioCtx.createGain();
		this.nodes.gain.gain.setValueAtTime(defaults.gain, audioCtx.currentTime);
		return this.nodes.gain;
	},

	initialize(mediaElement) {
		let aContext = new AudioContext();
		this.mediaSource = aContext.createMediaElementSource(mediaElement);
		this.mediaSource.disconnect();

		const compressor = this.createCompressorNode(aContext);
		const gain = this.createGainNode(aContext);
		this.mediaSource.connect(compressor);
		compressor.connect(gain);
		gain.connect(aContext.destination);

		this.audioContext = aContext;
		this.initialized = true;
		this.enabled = true;
	},

	getVideoElement() {
		const videoElements = [].slice.call(document.querySelectorAll('video'));
		return videoElements.length > 0 ? videoElements[0] : null;
	},

	turnOff() {
		try {
			this.mediaSource.disconnect(this.nodes.comp);
			this.nodes.comp.disconnect(this.nodes.gain);
			this.nodes.gain.disconnect(this.audioContext.destination);
			this.mediaSource.connect(this.audioContext.destination);
			this.enabled = false;
		} 
		catch(error) {
			console.error(error);
		}
	},

	turnOn() {
		if(!this.initialized) {
			// TODO - genericise the ability to find the media element so it works across many sites
			const element = this.getVideoElement();
			if(element != null)
				this.initialize(element);		
			return;
		}

		try {
			this.mediaSource.disconnect(this.audioContext.destination);
			this.mediaSource.connect(this.nodes.comp);
			this.nodes.comp.connect(this.nodes.gain);
			this.nodes.gain.connect(this.audioContext.destination);
			this.enabled = true;
		} 
		catch(error) {
			console.error(error);
		}
	},

	setRatio(ratio) {
		this.nodes.comp.ratio.setValueAtTime(ratio, this.audioContext.currentTime);
	},

	setThreshold(threshold) {
		this.nodes.comp.threshold.setValueAtTime(threshold, this.audioContext.currentTime);
	},

	setAttack(attack) {
		this.nodes.comp.attack.setValueAtTime(attack, this.audioContext.currentTime);
	},

	setRelease(release) {
		this.nodes.comp.release.setValueAtTime(release, this.audioContext.currentTime);
	},

	setGain(gain) {
		this.nodes.gain.gain.setValueAtTime(gain, this.audioContext.currentTime);
	}
}

// handle messages coming from the popup controls
chrome.runtime.onMessage.addListener(
	(request, sender, sendResponse) => {
	  const command = request["do"];
	  if(!command) 
		return;

	  const cmdValue = request["value"];
	  if(cmdValue)
		console.log(`command: ${command}, value: ${cmdValue}`);
	  else
	  	console.log(`command: ${command}`);
		
	  switch(command) {
		case "compressionON":
			compressor.turnOn();
			console.log("turned ON compression");
			sendResponse({result: "compressed af"});
			break;
		case "compressionOFF":
			compressor.turnOff();
			console.log("turned OFF compression");
			sendResponse({result: "69 & uncompressed"});
			break;
		case "setRatio":
			if(compressor.initialized && cmdValue) {
				compressor.setRatio(cmdValue);
				sendResponse({ success : true });
			}
			break;
		case "setThreshold":
			if(compressor.initialized && cmdValue) {
				compressor.setThreshold(cmdValue);
				sendResponse({ success : true });
			}
			break;
		case "setAttack":
			if(compressor.initialized && cmdValue) {
				compressor.setAttack(cmdValue);
				sendResponse({ success : true });
			}
			break;
		case "setRelease":
			if(compressor.initialized && cmdValue) {
				compressor.setRelease(cmdValue);
				sendResponse({ success : true });
			}
			break;
		case "setGain":
			if(compressor.initialized && cmdValue) {
				compressor.setGain(cmdValue);
				sendResponse({ success : true });
			}
			break;
		case "getEnabled":
			const on = compressor.initialized && compressor.nodes.comp.numberOfInputs > 0;
			sendResponse({ enabled : on });
			break;
		case "getState":
			if(!compressor.initialized)
			{
				sendResponse({ enabled : false });
				break;
			}

			console.log(compressor);
			const compState = compressor.nodes.comp;
			sendResponse({
				enabled: compressor.enabled,
				comp: { 
					threshold: compState.threshold.value,
					ratio: compState.ratio.value,
					attack: compState.attack.value,
					release: compState.release.value,
					knee: compState.knee.value
				},
				gain: compressor.nodes.gain.gain.value
			});
			break;
	  }
	});


chrome.extension.sendMessage({}, function(response) {
	var readyStateCheckInterval = setInterval(function() {
	if (document.readyState === "complete") {
		clearInterval(readyStateCheckInterval);
		// ----------------------------------------------------------
		// This part of the script triggers when page is done loading
		console.log("Hi! This is from scripts/inject.js, done loading");
		// ----------------------------------------------------------
	}
	}, 10);
});
	