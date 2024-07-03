addEventListener("error", function (e) {
	alert(e.message);
});
const width = 1920 / 2;
const height = 1080 / 2;
var player = {
	lat: 0,
	long: 0,
	hdg: 0,
	speed: 0,
	pitch: 0,
	roll: 0,
};
function startOrientation() {
	if (typeof DeviceMotionEvent.requestPermission === "function") {
		DeviceOrientationEvent.requestPermission().then(function (response) {
			alert(response);
			if (response == "granted") {
			}
		});
	} else {
		console.log("not granted");
	}
}
window.addEventListener("deviceorientation", function (event) {
	// https://stackoverflow.com/a/42799567/15578194
	// those angles are in degrees
	var alpha = event.alpha;  
	var beta = event.beta;
	var gamma = event.gamma;

	// JS math works in radians
	var betaR = beta / 180 * Math.PI;
	var gammaR = gamma / 180 * Math.PI;
	var spinR = Math.atan2(Math.cos(betaR) * Math.sin(gammaR), Math.sin(betaR));

	// convert back to degrees
	var spin = spinR * 180 / Math.PI;
	player.pitch = event.beta - 90;
	player.roll = event.gamma;
});
function nd() {
	draw.textAlign("top", "right");
	draw.textSize(20);
	draw.text("GS " + Math.round((player.speed / 1852) * 3600), 10, 30);
}
function pfd(display) {
	const vertical_deviation = player.pitch * 100 / 10;
	display.clear();
	display.push();
	display.translate(1920 / 8, 1080 / 4);
	display.rotate(-player.roll);
	display.fill("brown");
	display.rect(-1920, vertical_deviation, 1920 * 2, 1080);
	display.fill('blue');
	display.rect(-1920, -1080 + vertical_deviation, 1920 * 2, 1080);
	display.fill('white');
	display.strokeWeight(0);
	for (var i = 10; i <= 90; i += 10) {
		display.rect(-100, vertical_deviation + -i * 100 / 10 - 0.5, 200, 1);
	}
	display.pop();
	display.push();
	display.fill('black');
	display.stroke('yellow');
	display.translate(1920 / 8, 1080 / 4);
	display.triangle(-5, 0, -80, 20, -55, 20);
	display.triangle(5, 0, 80, 20, 55, 20)
	display.pop();
}
function update() {
	draw.clear();
	draw.fill("black");
	draw.rect(0, 0, width, height);
	draw.fill("lime");
	nd();
	pfd(pfd_canvas);
	draw.image(pfd_canvas, 1920 / 4, 0, 1920 / 4, 1080 / 2);
}
var s = function (sketch) {
	sketch.setup = async function () {
		draw.angleMode(draw.DEGREES);
		pfd_canvas = draw.createGraphics(1920 / 4, 1080 / 2);
		pfd_canvas.angleMode(draw.DEGREES);
		sketch.createCanvas(width, height);
		updateInterval = setInterval(update, 1000 / 24);
	};
};
var draw = new p5(s, "pad");
