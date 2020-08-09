defaults = {
	ratio: 8,
	threshold: -40,
	attack: 0,
	release: 0.1,
	knee: 30,
	gain: 1
};

compressor = {
	audioContext: {},
	mediaSource: {},
	nodes: {				// web audio nodes
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

	isMediaElementPlaying(element) {
		return (element.currentTime > 0 && !element.paused && !element.ended && element.readyState > 2);
	},

	// we can skip asking the user for input if there is only one choice, or it's obvious
	tryFindSingleMediaSource() {
		const videoElements = this.getVideoElements();
		const audioElements = this.getAudioElements();

		if(videoElements.length == 1 && audioElements.length == 0)
		{
			return videoElements[0];
		}
		else if(audioElements.length == 1 && videoElements.length == 0)
		{
			return audioElements[0];
		}
		else
		{
			let element = null;
			// default to the video that is playing
			if(videoElements.length > 2) 
				element = videoElements.find(this.isMediaElementPlaying);
			if(audioElements.length > 2) 
				element = audioElements.find(this.isMediaElementPlaying);

			// if nothing is playing, default to the first of video or audio
			if(!element && videoElements.length > 0)
				element = videoElements[0];
			if(!element && audioElements.length > 0)
				element = audioElements[0];

				return element;
		}
	},

	getPlayingMediaElement(elements) {
		elements.find(isMediaElementPlaying);
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

	// TODO - this needs to take settings instead of keeping the defaults in inject script
	turnOn() {
		if(this.enabled)
			return true;

		if(!this.ready) {
			const element = this.tryFindSingleMediaSource();
			console.log("media element audio source", element);
			if(element != null)
				this.initialize(element);		
			return this.ready;
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
		return this.ready;
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
			const on = compressor.turnOn();
			sendResponse({success: on});
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
	//console.log('hello from inject.js message response');
	var readyStateCheckInterval = setInterval(() => {
		loggedInteractive = false;
		switch(document.readyState) {
			case 'complete': {
					console.log('readyState is complete');
					clearInterval(readyStateCheckInterval);
				}
				break;
		}
	}, 10);
});
	