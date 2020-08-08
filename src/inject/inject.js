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
		compressor: {},
		gain: {}
	},
	// TODO - allow defaults to be set in options page
	
	initialized: false,

	createCompressorNode(audioCtx) {
		var compressor = audioCtx.createDynamicsCompressor();
		compressor.threshold.setValueAtTime(defaults.threshold, audioCtx.currentTime);
		compressor.ratio.setValueAtTime(defaults.ratio, audioCtx.currentTime);
		compressor.attack.setValueAtTime(defaults.attack, audioCtx.currentTime);
		compressor.release.setValueAtTime(defaults.release, audioCtx.currentTime);
		compressor.knee.setValueAtTime(defaults.knee, audioCtx.currentTime);
		this.nodes.compressor = compressor;
		return compressor;
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
	},

	getVideoElement() {
		const videoElements = [].slice.call(document.querySelectorAll('video'));
		return videoElements.length > 0 ? videoElements[0] : null;
	},

	turnOff() {
		try {
			this.mediaSource.disconnect(this.nodes.compressor);
			this.nodes.compressor.disconnect(this.nodes.gain);
			this.nodes.gain.disconnect(this.audioContext.destination);
			this.mediaSource.connect(this.audioContext.destination);
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
			this.mediaSource.connect(this.nodes.compressor);
			this.nodes.compressor.connect(this.nodes.gain);
			this.nodes.gain.connect(this.audioContext.destination);
		} 
		catch(error) {
			console.error(error);
		}
	},

	setRatio(ratio) {
		this.nodes.compressor.ratio.setValueAtTime(ratio, this.audioContext.currentTime);
	},

	setThreshold(threshold) {
		this.nodes.compressor.threshold.setValueAtTime(threshold, this.audioContext.currentTime);
	},

	setAttack(attack) {
		this.nodes.compressor.attack.setValueAtTime(attack, this.audioContext.currentTime);
	},

	setRelease(release) {
		this.nodes.compressor.release.setValueAtTime(release, this.audioContext.currentTime);
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
			console.log("should have turned ON dynamic range compression");
			sendResponse({result: "compressed af"});
			break;
		case "compressionOFF":
			compressor.turnOff();
			console.log("should have turned OFF dynamic range compression");
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
	