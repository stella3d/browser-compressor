# Audio Dynamics Compressor
A chrome extension for doing audio compression with web media.

# Usage
To use, click the extension's icon when you're on a page with media you want to adjust the volume range of.

You should see a small popup with multiple sliders on the bottom, and one large toggle switch on the top.
Click that toggle switch, and if media is found on the page that we can work with, the popup UI will turn on along with the effect.

Sliders control the parameters of the effect.

[This section of the wikipedia entry](https://en.wikipedia.org/wiki/Dynamic_range_compression#Controls_and_features) explains the common terms used in the controls, such as: `threshold`, `ratio`, `attack`, & `release`.

#### Latency

There is a very small (less than 10ms) amount of latency inherent to WebAudio, but i have not noticed it when watching video - this is less than a frame.

## Limitations

* Only works with HTML `<audio>` & `<video>` tags. 
  
  Some sites (such as SoundCloud) use a custom setup that does not use these tags, or uses them in an `<iframe>` which makes it trickier / maybe impossible for the extension to access their media content.

* Some sites (like Steam or Crunchyroll) keep their actual media content on another domain, such as a static CDN.  
This means that [Cross-Origin Resource Sharing](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing) (CORS) restrictions prevent this extension from accessing their audio.

## Media Support

### Websites
For this first release, a handful of sites have been tested, though it should work across many more. 

Sites tested as working include:
_Youtube_, _Twitch_, _Twitter_, _Periscope_, _Amazon video_, _CBS all access_, _Vimeo_, _Mixcloud_

Apologies for the inconvenience if your favorite site doesn't work. 
It may not be possible due to technical reasons, I don't have accounts to test popular paywalled streaming services, and this extension is very new. 

### Files

Direct links to files over HTTP/S are supported.  This is URLs like `https://example.org/nice.mp4`.
##### Supported types
* .mp3
* .mp4
* .webm
* .ogg

However, `file://` links will not work - you'll have to use a local HTTP server + `localhost://` link for those.  
Alternately, if you're trying to apply compression to local files, the excellent [VLC](https://www.videolan.org/vlc/index.html) can do this on all platforms, at least as well as WebAudio can.


## Issues / Requests

Keeping in mind the above limitations on what websites will work (I can't promise to make it work on _x_ website), please feel free to submit a GitHub issue if you notice an obvious bug.  


You can also submit user experience feedback or small feature requests as an issue.
