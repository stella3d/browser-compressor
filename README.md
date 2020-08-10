# Audio Dynamics Compressor
A chrome extension for doing audio compression with web media.

# Usage
To use, click the extension's icon when you're on a page with media you want to adjust the volume range of.

You should see a small popup with multiple sliders on the bottom, and one large toggle switch on the top.
Click that toggle switch, and if media is found on the page that we can work with, the popup UI will turn on along with the effect.

Sliders control the parameters of the effect.

[This section of the wikipedia entry](https://en.wikipedia.org/wiki/Dynamic_range_compression#Controls_and_features) explains the common terms used in the controls, such as: `threshold`, `ratio`, `attack`, & `release`.

### Latency

There is a very small (less than 10ms) amount of latency inherent to WebAudio, but i have not noticed it when watching video - this is less than a frame.

# Website Support

For this first release, a handful of sites have been tested, though it should work across many more. 

Some limitationss this has:
* Only works with HTML "audio" & "video" tags. Some sites (such as SoundCloud) use a custom setup that does not use these tags.

* Some sites (like Steam or Crunchyroll) keep their actual media content on another domain (such as a static cdn) Cross-Origin Resource Sharing (CORS) restrictions prevent this extension from accessing their audio.

* Chrome's permission model for extensions makes doing content script injection on-demand for arbitrary sites tricky, and i haven't figured it out yet.

### Currently Tested
* Youtube
* Twitch
* Twitter/Periscope
* Facebook
* Amazon video
* CBS All Access
* Vimeo
* Mixcloud

Direct links to files are supported, for
* mp3/4
* webm
* ogg

Apologies for the inconvenience if your favorite doesn't work - it may not be possible, and this extension is very new.
