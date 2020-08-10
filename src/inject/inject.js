// Links a media element's audio to a dynamic range compressor, in a WebAudio context
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
	
	turnOn(settings = null) {
		if(this.enabled) return true;
		try {
			// ok if this throws because it wasn't connected
			try{ this.mediaSource.disconnect(); } catch(e) {}
			this.mediaSource.connect(this.nodes.comp);
			this.nodes.comp.connect(this.nodes.gain);
			this.nodes.gain.connect(this.audioContext.destination);
			// new signal path:  src -> comp -> gain -> dest
			this.enabled = true;
			// no settings means use previous ones
			if(settings)
				this.applySettings(settings);
		} 
		catch(error) { console.error(error); }
		return this.enabled;
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
		catch(error) { console.error(error); }
	}

	applySettings(settings) {
		this.setThreshold(settings.threshold);
		this.setRatio(settings.ratio);
		this.setAttack(settings.attack);
		this.setRelease(settings.release);
		this.setKnee(settings.knee);
		this.setPostCompressionGain(settings.gain);
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
	setKnee(knee) {
		this.nodes.comp.knee.setValueAtTime(knee, this.audioContext.currentTime);
	}
	setPostCompressionGain(gain) {
		this.nodes.gain.gain.setValueAtTime(gain, this.audioContext.currentTime);
	}

	getRatio() { return this.nodes.comp.ratio.value; }
	getThreshold() { return this.nodes.comp.threshold.value; }
	getAttack() { return this.nodes.comp.attack.value; }
	getRelease() { return this.nodes.comp.release.value; }
	getKnee() { return this.nodes.comp.knee.value; }

	getPostCompressionGain() { return this.nodes.gain.gain; }
	getCompressionGainReduction() { return this.nodes.comp.reduction; }
}

// helpers to find media elements
function isMediaElementPlaying(element) {
	return (element.currentTime > 0 && !element.paused && !element.ended && element.readyState > 2);
}

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
			element = videoElements.find(isMediaElementPlaying);
		if(!element && audioElements.length > 0) 
			element = audioElements.find(isMediaElementPlaying);

		// nothing playing? default to the first, video then audio
		if(!element && videoElements.length > 0)
			element = videoElements[0];
		if(!element && audioElements.length > 0)
			element = audioElements[0];

		return element;
	}
}

function sendOnResponse(onState) { sendResponse({ enabled: onState }); }
function sendValueResponse(val) { sendResponse({ value: val }); }

compressor = null;			// lazy-instantiated MediaCompressor instance 
const browserRef = chrome ? chrome : browser;		// for cross-compat with FF

// handle messages coming from the popup controls
browserRef.runtime.onMessage.addListener(
	(request, sender, sendResponse) => {
	  const command = request['do'];
	  if(!command) 
	  	return;

	  const cmdValue = request['value'];
	  switch(command) {
		case 'turnOn':
			if(compressor) {
				sendOnResponse(compressor.turnOn(cmdValue));
			} else {
				const element = tryFindSingleMediaSource();
				if(!element) {
					sendOnResponse(false);
					return;
				}

				console.log('this element is the audio source being compressed', element);
				compressor = new MediaCompressor(element, cmdValue);
				sendOnResponse(compressor.turnOn());
			}
			break;
		case 'turnOff':
			compressor?.turnOff(); break;
		case 'setRatio':
			compressor?.setRatio(cmdValue); break;
		case 'setThreshold':
			compressor?.setThreshold(cmdValue); break;
		case 'setAttack':
			compressor?.setAttack(cmdValue); break;
		case 'setRelease':
			compressor?.setRelease(cmdValue); break;
		case 'setKnee':
			compressor?.setKnee(cmdValue); break;
		case 'setGain':
			compressor?.setPostCompressionGain(cmdValue); break;
		case 'getGainReduction':
			sendValueResponse(compressor ? compressor.getCompressionGainReduction() : 0); 
			break;
		case 'getState':
			sendResponse(compressor ?  {
				enabled: compressor.enabled,
				gain: compressor.getPostCompressionGain(),
				comp: { 
					threshold: compressor.getThreshold(),
					ratio: compressor.getRatio(),
					attack: compressor.getAttack(),
					release: compressor.getRelease(),
					knee: compressor.getKnee()
				}
			} : { enabled: false });
			break;
	  }
	});

// this is one of the things that makes the popup appear ??
browserRef.extension.sendMessage({});