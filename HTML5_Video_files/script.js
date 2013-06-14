var media_events = new Array();

// was extracted from the spec in January 2013
media_events["loadstart"] = 0;
media_events["progress"] = 0;
media_events["suspend"] = 0;
media_events["abort"] = 0;
media_events["error"] = 0;
media_events["emptied"] = 0;
media_events["stalled"] = 0;
media_events["loadedmetadata"] = 0;
media_events["loadeddata"] = 0;
media_events["canplay"] = 0;
media_events["canplaythrough"] = 0;
media_events["playing"] = 0;
media_events["waiting"] = 0;
media_events["seeking"] = 0;
media_events["seeked"] = 0;
media_events["ended"] = 0;
media_events["durationchange"] = 0;
media_events["timeupdate"] = 0;
media_events["play"] = 0;
media_events["pause"] = 0;
media_events["ratechange"] = 0;
media_events["volumechange"] = 0;

var media_controller_events = new Array();

// was extracted from the spec in January 2013
media_controller_events["emptied"] = 0;
media_controller_events["loadedmetadata"] = 0;
media_controller_events["loadeddata"] = 0;
media_controller_events["canplay"] = 0;
media_controller_events["canplaythrough"] = 0;
media_controller_events["playing"] = 0;
media_controller_events["ended"] = 0;
media_controller_events["waiting"] = 0;
media_controller_events["ended"] = 0;
media_controller_events["durationchange"] = 0;
media_controller_events["timeupdate"] = 0;
media_controller_events["play"] = 0;
media_controller_events["pause"] = 0;
media_controller_events["ratechange"] = 0;
media_controller_events["volumechange"] = 0;

// was extracted from the spec in January 2013
var media_properties = [ "error", "src", "currentSrc", "crossOrigin", "networkState", "preload", "buffered", "readyState", "seeking", "currentTime", "duration", "startDate", "paused", "defaultPlaybackRate", "playbackRate", "played", "seekable", "ended", "autoplay", "loop", "mediaGroup", "controller", "controls", "volume", "muted", "defaultMuted", "audioTracks", "videoTracks", "textTracks", "width", "height", "videoWidth", "videoHeight", "poster" ];

var readyNames = ['HAVE_NOTHING', 'HAVE_METADATA', 'HAVE_CURRENT_DATA', 'HAVE_FUTURE_DATA', 'HAVE_ENOUGH_DATA'];
var networkNames = ['NETWORK_EMPTY', 'NETWORK_IDLE', 'NETWORK_LOADING', 'NETWORK_LOADED', 'NETWORK_NO_SOURCE'];

var media_properties_elts = null;

var webm = null;

// Statistics
var decodedFrames = 0;
var decodedPerSec = 0;
var audioBytesDecoded = 0;
var audioBytesDecodedPerSec = 0;
var videoBytesDecoded = 0;
var videoBytesDecodedPerSec = 0;
var droppedFrames = 0;
var droppedFramesPerSec = 0;

function Mean() {
  this.count = 0;
  this.sum = 0;
  
  this.record = function(val) {
    this.count++;
    this.sum += val;
  };
  
  this.mean = function() {
    return this.count ? (this.sum / this.count).toFixed(3) : 0;
  };
}

var decodedMean = new Mean();
var audioMean = new Mean();
var videoMean = new Mean();
var dropMean = new Mean();

function recalcRates() {
  var v = document.getElementById("video");

  if (v.readyState <= HTMLMediaElement.HAVE_CURRENT_DATA || v.paused) {
    return;
  }

  decodedPerSec = (v.webkitDecodedFrameCount - decodedFrames);
  decodedFrames = v.webkitDecodedFrameCount;

  audioBytesDecodedPerSec = v.webkitAudioDecodedByteCount - audioBytesDecoded;
  audioBytesDecoded = v.webkitAudioDecodedByteCount;

  videoBytesDecodedPerSec = v.webkitVideoDecodedByteCount - videoBytesDecoded;
  videoBytesDecoded = v.webkitVideoDecodedByteCount;

  droppedFramesPerSec = v.webkitDroppedFrameCount - droppedFrames;
  droppedFrames = v.webkitDroppedFrameCount;

  decodedMean.record(decodedPerSec);
  audioMean.record(audioBytesDecodedPerSec);
  videoMean.record(videoBytesDecodedPerSec);
  dropMean.record(droppedFramesPerSec);
  
  var d = document.getElementById("log");
  d.innerHTML =
        "Audio bytes decoded: " + v.webkitAudioDecodedByteCount + " average p/s: " + audioMean.mean() + "<br>" +
        "Video bytes decoded: " + v.webkitVideoDecodedByteCount + " average p/s: " + videoMean.mean() + "<br>" +
        "Decoded frames: " + v.webkitDecodedFrameCount + " average p/s: " + decodedMean.mean() + "<br>" +
        "Dropped frames: " + v.webkitDroppedFrameCount + " average p/s: " + dropMean.mean() + "<br>";
}


function init() {
    document._video = document.getElementById("video");

    webm = document.getElementById("webm");

    init_events();
    init_properties();
    init_mediatypes();

    // properties are updated even if no event was triggered
    setInterval(update_properties, 500);

    setInterval(recalcRates, 1000);
}
document.addEventListener("DOMContentLoaded", init, false);

function init_events() {

    for (key in media_events) {	
	document._video.addEventListener(key, capture, false);
    }

    var tbody = document.getElementById("events");
    var i = 1;
    var tr = null;
    for (key in media_events) {	
	if (tr == null) tr    = document.createElement("tr");
	var th = document.createElement("th");
	th.textContent = key;
	var td = document.createElement("td");
	td.setAttribute("id", "e_" + key);
	td.innerHTML = "0";
	td.className = "false";
	tr.appendChild(th);
	tr.appendChild(td);

	if ((i++ % 5) == 0) {
	    tbody.appendChild(tr);
	    tr = null;
	}


    }
    if (tr != null) tbody.appendChild(tr);
}
function init_properties() {
    var tbody = document.getElementById("properties");
    var i = 0;
    var tr = null;
    media_properties_elts = new Array(media_properties.length);
    do {
	if (tr == null) tr    = document.createElement("tr");
	var th = document.createElement("th");
	th.textContent = media_properties[i];
	var td = document.createElement("td");
	td.setAttribute("id", "p_" + media_properties[i]);
	var r = eval("document._video." + media_properties[i]);

	if (td.getAttribute("id") == "p_readyState") {
		td.innerHTML = readyNames[r];
	} else if (td.getAttribute("id") == "p_networkState") {
		td.innerHTML = networkNames[r];
	} else {
		td.innerHTML = r;
	}

	if (typeof(r) != "undefined") {
	    td.className = "true";
	} else {
	    td.className = "false";
	}
	tr.appendChild(th);
	tr.appendChild(td);
	media_properties_elts[i] = td;
	if ((++i % 3) == 0) {
	    tbody.appendChild(tr);
	    tr = null;
	}
    } while (i < media_properties.length);
    if (tr != null) tbody.appendChild(tr);
}

function init_mediatypes() {
    var tbody = document.getElementById("m_video");
    var i = 0;
    var tr = document.createElement("tr");
    var videoTypes = [ "video/ogg",
                       "video/mp4",
                       "video/webm",
                       "application/vnd.apple.mpegURL",
                       "irisplayer/dvbt", "irisplayer/dvbt2",
                       "irisplayer/dvbc", "irisplayer/dvbc2",
                       "irisplayer/dvbs", "irisplayer/dvbs2"
                      ];
    i = 0;
    tr = document.createElement("tr");    
    do {
	var td = document.createElement("th");
	td.innerHTML = videoTypes[i];
	tr.appendChild(td);
    } while (++i < videoTypes.length);
    tbody.appendChild(tr);

    i = 0;
    tr = document.createElement("tr");

    if (!!document._video.canPlayType) {
      do {
	var td = document.createElement("td");
	var support = document._video.canPlayType(videoTypes[i]);	
	td.innerHTML = '"' + support + '"';
	if (support === "maybe") {
	    td.className = "true";
	} else if (support === "") {
	    td.className = "false";
	}
	tr.appendChild(td);
      } while (++i < videoTypes.length);
      tbody.appendChild(tr);
    }

}


function capture(event) {
    media_events[event.type] = media_events[event.type] + 1;
    for (key in media_events) {	
	var e = document.getElementById("e_" + key);
	if (e) {
	    e.innerHTML = media_events[key];
	    if (media_events[key] > 0) e.className = "true";
	}
    }
    update_properties();
}

function update_properties() {
    var i = 0;
    for (key in media_properties) {
	var val = eval("document._video." + media_properties[key]);
/*
	if (typeof val === "TimesRanges") {
	    val = val.length + " TimeRanges";
	}
*/
	if (media_properties_elts[i].getAttribute("id") == "p_readyState") {
		media_properties_elts[i++].innerHTML = readyNames[val];
	} else if (media_properties_elts[i].getAttribute("id") == "p_networkState") {
		media_properties_elts[i++].innerHTML = networkNames[val];
	} else {
		media_properties_elts[i++].innerHTML = val;
	}
    }
    if (!!document._video.audioTracks) {
	var td = document.getElementById("m_audiotracks");
	td.innerHTML = document._video.audioTracks.length;
	td.className = "true";
    }
    if (!!document._video.videoTracks) {
	var td = document.getElementById("m_videotracks");
	td.innerHTML = document._video.videoTracks.length;
	td.className = "true";
    }
    if (!!document._video.textTracks) {
	var td = document.getElementById("m_texttracks");
	td.innerHTML = document._video.textTracks.length;
	td.className = "true";
    }
}

var videos = new Array();

videos[0] = [
	     "http://media.w3.org/2010/05/sintel/poster.png",
	     "http://media.w3.org/2010/05/sintel/trailer.mp4",
	     "http://media.w3.org/2010/05/sintel/trailer.ogv",
	     "http://media.w3.org/2010/05/sintel/trailer.webm"
	     ];
videos[1] = [
	     "http://media.w3.org/2010/05/bunny/poster.png",
	     "http://media.w3.org/2010/05/bunny/trailer.mp4",
	     "http://media.w3.org/2010/05/bunny/trailer.ogv"
	     ];
videos[2] = [
	     "http://media.w3.org/2010/05/bunny/poster.png",
	     "http://media.w3.org/2010/05/bunny/movie.mp4",
	     "http://media.w3.org/2010/05/bunny/movie.ogv"
	     ];
videos[3] = [
	     "http://media.w3.org/2010/05/video/poster.png",
	     "http://media.w3.org/2010/05/video/movie_300.mp4",
	     "http://media.w3.org/2010/05/video/movie_300.ogv",
	     "http://media.w3.org/2010/05/video/movie_300.webm"
	     ];
/*
videos[4] = [
	     "http://content.bitsontherun.com/thumbs/nfSyO85Q-320.jpg",
	     "http://content.bitsontherun.com/videos/nfSyO85Q-52qL9xLP.mp4",
	     "",
	     "http://content.bitsontherun.com/videos/nfSyO85Q-27m5HpIu.webm",
	     "http://devimages.apple.com/iphone/samples/bipbop/bipbopall.m3u8"
	     ];
*/
videos[4] = [
	     "http://content.bitsontherun.com/thumbs/nfSyO85Q-320.jpg",
	     "http://devimages.apple.com/iphone/samples/bipbop/bipbopall.m3u8"
	     ];
videos[5] = [
	     "",
	     "dvbt://706000/8/1101" 
	     ];
videos[6] = [
	     "",
             "dvbt://706000/8/1102"
             ];
videos[7] = [
             "",
             "dvbt://706000/8/1103"
             ];
videos[8] = [
             "",
             "dvbt://706000/8/1104"
             ];
videos[9] = [
             "",
             "dvbt://706000/8/1105"
             ];
videos[10] = [
             "",
             "dvbt://706000/8/1106"
             ];
videos[11] = [
             "",
             "dvbt://706000/8/1107"
             ];


function switchVideo(n) {
    if (n >= videos.length) n = 0;

    var mp4 = document.getElementById("mp4");
    var ogv = document.getElementById("ogv");

    var m3u8 = document.getElementById("m3u8");

    var dvb1 = document.getElementById("dvb1");
    var dvb2 = document.getElementById("dvb2");
    var dvb3 = document.getElementById("dvb3");
    var dvb4 = document.getElementById("dvb4");
    var dvb5 = document.getElementById("dvb5");
    var dvb6 = document.getElementById("dvb6");
    var dvb7 = document.getElementById("dvb7");
    var parent = ogv.parentNode;

    document._video.setAttribute("poster", videos[n][0]);

    mp4.setAttribute("src", videos[n][1]);
    ogv.setAttribute("src", videos[n][2]);

    m3u8.setAttribute("src", videos[n][1]);

    dvb1.setAttribute("src", videos[n][1]);
    dvb2.setAttribute("src", videos[n][1]);
    dvb3.setAttribute("src", videos[n][1]);
    dvb4.setAttribute("src", videos[n][1]);
    dvb5.setAttribute("src", videos[n][1]);
    dvb6.setAttribute("src", videos[n][1]);
    dvb7.setAttribute("src", videos[n][1]);


    if (videos[n][3]) {
	if (webm.parentNode == null) {
	    parent.insertBefore(webm, ogv);
	}
	webm.setAttribute("src", videos[n][3]);
    } else {
	if (webm.parentNode != null) {
	    parent.removeChild(webm);
	}
    }
    document._video.load();
}
