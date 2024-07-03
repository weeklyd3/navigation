addEventListener('error', function(e) { alert(e.message); });
const width = 1920 / 2;
const height = 1080 / 2;
const player = {
	lat: 0,
	long: 0,
	hdg: 0,
	speed: 0
}
function startOrientation() {
	if (typeof DeviceMotionEvent.requestPermission === 'function') {
	  DeviceOrientationEvent.requestPermission().then(function(response) {
		alert(response)
	    if (response == 'granted') {
	    }
	  });
	} else {
	  console.log('not granted');
	}
      }
function nd() {
	draw.textAlign('top', 'right');
	draw.textSize(20);
	draw.text('GS ' + Math.round(player.speed / 1852 * 3600), 10, 30);
}
function update() {
	draw.clear();
	draw.fill('black');
	draw.rect(0, 0, width, height);
	draw.fill('lime');
	nd();
}
var s = function(sketch) {
	sketch.setup = async function() {
		draw.angleMode(draw.DEGREES);
		sketch.createCanvas(width, height);
		updateInterval = setInterval(update, 1000 / 24);
	}
}
var draw = new p5(s, 'pad');