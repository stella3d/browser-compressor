compressor = {
	audioContext: {},
	mediaSource: {},
	nodes: {					// web audio nodes
		comp: {}, gain: {}
	},
	ready: false,
	enabled: false,

	createCompressorNode(audioCtx, settings) {
		let comp = audioCtx.createDynamicsCompressor();
		comp.threshold.setValueAtTime(settings.threshold, audioCtx.currentTime);
		comp.ratio.setValueAtTime(settings.ratio, audioCtx.currentTime);
		comp.attack.setValueAtTime(settings.attack, audioCtx.currentTime);
		comp.release.setValueAtTime(settings.release, audioCtx.currentTime);
		comp.knee.setValueAtTime(settings.knee, audioCtx.currentTime);
		return comp;
	},

	createGainNode(audioCtx, settings) {
		this.nodes.gain = audioCtx.createGain();
		this.nodes.gain.gain.setValueAtTime(settings.gain, audioCtx.currentTime);
		return this.nodes.gain;
	},

	initialize(mediaElement, settings) {
		this.audioContext = new AudioContext();
		this.mediaSource = this.audioContext.createMediaElementSource(mediaElement);
		this.nodes.comp = this.createCompressorNode(this.audioContext, settings);
		this.nodes.gain = this.createGainNode(this.audioContext, settings);
	},

	isMediaElementPlaying(element) {
		return (element.currentTime > 0 && !element.paused && !element.ended && element.readyState > 2);
	},

	tryFindSingleMediaSource() {
		const videoElements = [].slice.call(document.querySelectorAll('video'));
		const audioElements = [].slice.call(document.querySelectorAll('audio'));

		if(videoElements.length == 1) 
			return videoElements[0];
		else if(audioElements.length == 1 && videoElements.length == 0) 
			return audioElements[0];
		else {
			let element = null;
			// more than one choice?, default to what's playing, video then audio
			if(videoElements.length > 0) 
				element = videoElements.find(this.isMediaElementPlaying);
			if(audioElements.length > 0) 
				element = audioElements.find(this.isMediaElementPlaying);

			// nothing playing? default to the first, video then audio
			if(!element && videoElements.length > 0)
				element = videoElements[0];
			if(!element && audioElements.length > 0)
				element = audioElements[0];

			return element;
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
			// new signal path:  src -> dest
			this.enabled = false;
		} 
		catch(error) {
			console.error(error);
		}
	},

	turnOn(settings) {
		if(this.enabled) 
			return true;
		if(!this.ready) {
			const element = this.tryFindSingleMediaSource();
			if(element != null) {
				console.log("this element is the audio source being compressed", element);
				this.initialize(element, settings);	
				this.ready = true;
			} else 
				return false; 
		}

		try {
			// it's ok if this throws because it wasn't connected
			try{ this.mediaSource.disconnect(); } catch(e) {}
			this.mediaSource.connect(this.nodes.comp);
			this.nodes.comp.connect(this.nodes.gain);
			this.nodes.gain.connect(this.audioContext.destination);
			// new signal path:  src -> comp -> gain -> dest
			this.enabled = true;
		} 
		catch(error) { console.error(error); }
		return true;
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
	  //console.log(`command: ${command}, value: ${cmdValue ? cmdValue : 'none'}`);

	  switch(command) {
		case 'compressorOn':
			const on = compressor.turnOn(cmdValue);
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
	