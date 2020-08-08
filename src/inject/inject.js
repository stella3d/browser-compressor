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
	ready: false,
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
		this.ready = true;
		this.enabled = true;
	},

	getVideoElements() {
		return [].slice.call(document.querySelectorAll('video'));
	},

	getVideoElement() {
		const videoElements = this.getVideoElements();;
		return videoElements.length > 0 ? videoElements[0] : null;
	},

	getAudioElements() {
		return [].slice.call(document.querySelectorAll('audio'));
	},

	// some common sites have more than one element, & can work with a bit of searching
	tryGetSourceFromCommonVideoSites(videoElements) {
		const href = window.location.href;
		if(href.includes('dailymotion.com/video') && videoElements.length == 2)
			return videoElements[0];
		else
			return null;
	},

	// we can skip asking the user for input if there is only one choice, or it's obvious
	tryFindSingleMediaSource() {
		const videoElements = this.getVideoElements();
		const audioElements = this.getAudioElements();

		if(videoElements.length == 1 && audioElements.length == 0)
		{
			console.log('chose single video element');
			return videoElements[0];
		}
		else if(audioElements.length == 1 && videoElements.length == 0)
		{
			console.log('chose single audio element');
			return audioElements[0];
		}
		else
		{
			return this.tryGetSourceFromCommonVideoSites(videoElements);
		}
	},

	turnOff() {
		if(!this.enabled)
			return;

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
		if(this.enabled)
			return;

		if(!this.ready) {
			// TODO - genericise the ability to find the media element so it works across many sites
			const element = this.tryFindSingleMediaSource();
			console.log("media element audio source", element);
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
		if(this.ready)
			this.nodes.comp.ratio.setValueAtTime(ratio, this.audioContext.currentTime);
	},

	setThreshold(threshold) {
		if(this.ready)
			this.nodes.comp.threshold.setValueAtTime(threshold, this.audioContext.currentTime);
	},

	setAttack(attack) {
		if(this.ready)
			this.nodes.comp.attack.setValueAtTime(attack, this.audioContext.currentTime);
	},

	setRelease(release) {
		if(this.ready)
			this.nodes.comp.release.setValueAtTime(release, this.audioContext.currentTime);
	},

	setGain(gain) {
		if(this.ready)
			this.nodes.gain.gain.setValueAtTime(gain, this.audioContext.currentTime);
	},
	
	getState() {
		if(!this.ready)
			return { enabled: false };
		
		const comp = this.nodes.comp;
		return {
			enabled: this.enabled,
			comp: { 
				threshold: comp.threshold.value,
				ratio: comp.ratio.value,
				attack: comp.attack.value,
				release: comp.release.value,
				knee: comp.knee.value
			},
			gain: this.nodes.gain.gain.value
		}
	},

	getGainReduction() {
		return this.nodes.comp.reduction;
	}
}

// handle messages coming from the popup controls
chrome.runtime.onMessage.addListener(
	(request, sender, sendResponse) => {
	  const command = request['do'];
	  if(!command) 
		return;

	  const cmdValue = request['value'];
	  console.log(`command: ${command}, value: ${cmdValue ? cmdValue : 'none'}`);
		
	  switch(command) {
		case 'compressorOn':
			compressor.turnOn();
			break;
		case 'compressorOff':
			compressor.turnOff();
			break;
		case 'setRatio':
			compressor.setRatio(cmdValue);
			break;
		case 'setThreshold':
			compressor.setThreshold(cmdValue);
			break;
		case 'setAttack':
			compressor.setAttack(cmdValue);
			break;
		case 'setRelease':
			compressor.setRelease(cmdValue);
			break;
		case 'setGain':
			compressor.setGain(cmdValue);
			break;
		case 'getState':
			sendResponse(compressor.getState());
			break;
		case 'getGainReduction':
			sendResponse({value: compressor.getGainReduction()});
			break;
	  }
	});

chrome.extension.sendMessage({}, (response) => {
	var readyStateCheckInterval = setInterval(() => {
		switch(document.readyState) {
			case 'interactive':
					console.log('readyState is interactive');
				break;
			case 'complete': {
					console.log('readyState is complete');
					clearInterval(readyStateCheckInterval);
				}
				break;
		}
	}, 10);
});
	