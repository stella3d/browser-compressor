class MediaCompressor {
	constructor(mediaElement, settings) {
		this.enabled = false;
		this.audioContext = new AudioContext();
		this.mediaElement = mediaElement;
		this.mediaSource = this.audioContext.createMediaElementSource(mediaElement);
		this.nodes = {
			comp : this.audioContext.createDynamicsCompressor(),
			gain : this.audioContext.createGain()
		}
		this.applySettings(settings);
	}

	applySettings(settings) {
		const currentTime = this.audioContext.currentTime;
		const comp = this.nodes.comp;
		comp.threshold.setValueAtTime(settings.threshold, currentTime);
		comp.ratio.setValueAtTime(settings.ratio, currentTime);
		comp.attack.setValueAtTime(settings.attack, currentTime);
		comp.release.setValueAtTime(settings.release, currentTime);
		comp.knee.setValueAtTime(settings.knee, currentTime);
		this.nodes.gain.gain.setValueAtTime(settings.gain, currentTime);
	}

	isMediaElementPlaying(element) {
		return (element.currentTime > 0 && !element.paused && !element.ended && element.readyState > 2);
	}

	turnOff() {
		if(!this.enabled) return;
		try {
			this.mediaSource.disconnect(this.nodes.comp);
			this.nodes.comp.disconnect(this.nodes.gain);
			this.nodes.gain.disconnect(this.audioContext.destination);
			this.mediaSource.connect(this.audioContext.destination);
			// new signal path:  src -> dest
			this.enabled = false;
		} 
		catch(error) {console.error(error);}
	}

	turnOn(settings) {
		if(this.enabled) return true;
		try {
			// ok if this throws because it wasn't connected
			try{ this.mediaSource.disconnect(); } catch(e) {}
			this.mediaSource.connect(this.nodes.comp);
			this.nodes.comp.connect(this.nodes.gain);
			this.nodes.gain.connect(this.audioContext.destination);
			// new signal path:  src -> comp -> gain -> dest
			this.applySettings(settings);
			this.enabled = true;
		} 
		catch(error) { console.error(error); }
		return this.enabled;
	}

	setRatio(ratio) {
		this.nodes.comp.ratio.setValueAtTime(ratio, this.audioContext.currentTime);
	}
	setThreshold(threshold) {
		this.nodes.comp.threshold.setValueAtTime(threshold, this.audioContext.currentTime);
	}
	setAttack(attack) {
		this.nodes.comp.attack.setValueAtTime(attack, this.audioContext.currentTime);
	}
	setRelease(release) {
		this.nodes.comp.release.setValueAtTime(release, this.audioContext.currentTime);
	}
	setGain(gain) {
		this.nodes.gain.gain.setValueAtTime(gain, this.audioContext.currentTime);
	}
	
	getState() {
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
	}

	getGainReduction() { 
		return this.nodes.comp.reduction; 
	}
}

// helper to  find media elements
function tryFindSingleMediaSource() {
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
}


compressor = null;			// lazy-instantiated 
// handle messages coming from the popup controls
chrome.runtime.onMessage.addListener(
	(request, sender, sendResponse) => {
	  const command = request['do'];
	  if(!command) 
	  	return;

	  const cmdValue = request['value'];
	  switch(command) {
		case 'compressorOn':
			if(compressor) {
				sendResponse({ success: compressor.turnOn(cmdValue) });
			} else {
				const element = tryFindSingleMediaSource();
				if(!element) {
					sendResponse({ success: false });
					return;
				}

				console.log("this element is the audio source being compressed", element);
				compressor = new MediaCompressor(element, cmdValue);
				sendResponse({ success: compressor.turnOn(cmdValue) });
			}
			break;
		case 'compressorOff':
			compressor?.turnOff(); break;
		case 'setRatio':
			compressor?.setRatio(cmdValue); break;
		case 'setThreshold':
			compressor?.setThreshold(cmdValue); break;
		case 'setAttack':
			compressor?.setAttack(cmdValue); break;
		case 'setRelease':
			compressor?.setRelease(cmdValue); break;
		case 'setGain':
			compressor?.setGain(cmdValue); break;
		case 'getState':
			sendResponse(compressor ? compressor?.getState() : { enabled: false });
			break;
		case 'getGainReduction':
			sendResponse({value: compressor ? compressor?.getGainReduction() : 0 }); 
			break;
	  }
	});

// this is one of the things that makes the popup appear ??
chrome.extension.sendMessage({}, (response) => {});