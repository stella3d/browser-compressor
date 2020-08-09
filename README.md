# Audio Dynamics Compressor
A chrome extension for doing audio compression with web media.

# Usage
To use, click the extension's icon when you're on a page with media you want to adjust the volume range of.

You should see a small popup with multiple sliders on the bottom, and one large toggle switch on the top.
Click that toggle switch, and if media is found on the page that we can work with, the popup UI will turn on along with the effect.

Sliders control the parameters of the effect.

### Latency

There is a very small (less than 10ms) amount of latency inherent to WebAudio, but i have not noticed it when watching video - this is less than a frame.

# Supported Sites

For this first release, a handful of sites are explicitly supported, instead of working across everything. The reasons for this are multiple:
This only works with HTML "audio" & "video" tags.
Some sites (such as SoundCloud) use a custom setup that does not use these tags.

Some sites (like Steam or Crunchyroll) keep their actual media content on another domain (such as a static cdn) Cross-Origin Resource Sharing (CORS) restrictions prevent this extension from accessing their audio.

Chrome's permission model for extensions makes doing content script injection on-demand for arbitrary sites tricky, and i haven't figured it out yet.

I don't have access to an account to test most paywalled streaming services
Wider site support is a top priority for future development.

The list of currently supported sites is:
* Twitch
* Twitter/Periscope
* Facebook
* Amazon video
* CBS All Access
* Vimeo
* Mixcloud

Direct links to files are also supported, for
* mp3/4
* webm
* ogg


Apologies for the inconvenience if your favorite isn't supported yet - it may not be possible, and this extension is very new.



# Information on Compression

This extension allows you to apply dynamic range compression to audio on the web.

Compression reduces the amount that volume varies , which can be more comfortable for media with a lot of variation.

This section of the wiki entry explains the common terms used in the controls, such as:
'threshold', 'ratio', 'attack', 'release'
