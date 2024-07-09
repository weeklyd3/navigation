addEventListener("error", function (e) {
	alert(e.message);
});
var darkMode = false;
lastLocation = {'coords': {}, 'valid': false};
function success(ev) {
	lastLocation = ev;
	lastLocation.valid = true;
	player.updateLastFrame = true;
}
function error() {
	player.geo_err = true;
}
options = {
	enableHighAccuracy: false,
	timeout: 5000,
	maximumAge: Infinity,
};

id = navigator.geolocation.watchPosition(success, error, options);

const AHRS = require("ahrs");
const madgwick = new AHRS({
	/*
	 * The sample interval, in Hz.
	 *
	 * Default: 20
	 */
	sampleInterval: 24,

	/*
	 * Choose from the `Madgwick` or `Mahony` filter.
	 *
	 * Default: 'Madgwick'
	 */
	algorithm: "Madgwick",

	/*
	 * The filter noise value, smaller values have
	 * smoother estimates, but have higher latency.
	 * This only works for the `Madgwick` filter.
	 *
	 * Default: 0.4
	 */
	beta: 0.01,

	/*
	 * The filter noise values for the `Mahony` filter.
	 */
	kp: 0.5, // Default: 0.5
	ki: 0, // Default: 0.0

	/*
	 * When the AHRS algorithm runs for the first time and this value is
	 * set to true, then initialisation is done.
	 *
	 * Default: false
	 */
	doInitialisation: false,
});
const width = 1920 / 2;
const height = 1080 / 2;
var player = {
	lat: 0,
	long: 0,
	hdg: 0,
	speed: 0,
	updateLastFrame: false,
	noSpeed: false,
	previousSpeed: 0,
	pitch: 0,
	roll: 0,
	zoom: 15,
	acceleration: { x: 0, y: 0, z: 0 },
	rotationRate: { x: 0, y: 0, z: 0 },
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
	return;
	// https://stackoverflow.com/a/42799567/15578194
	// those angles are in degrees
	var alpha = event.alpha;
	var beta = event.beta;
	var gamma = event.gamma;

	// JS math works in radians
	var betaR = (beta / 180) * Math.PI;
	var gammaR = (gamma / 180) * Math.PI;
	var spinR = Math.atan2(Math.cos(betaR) * Math.sin(gammaR), Math.sin(betaR));

	// convert back to degrees
	var spin = (spinR * 180) / Math.PI;
	player.pitch = event.beta;
	player.roll = spin;
});
addEventListener("devicemotion", (event) => {
	player.acceleration.x = event.acceleration.x / 9.81;
	player.acceleration.y = event.acceleration.y / 9.81;
	player.acceleration.z = event.acceleration.z / 9.81;
	player.rotationRate.x = event.rotationRate.gamma; // * Math.PI / 180;
	player.rotationRate.y = event.rotationRate.alpha; // * Math.PI / 180;
	player.rotationRate.z = event.rotationRate.beta; // * Math.PI / 180;
	player.interval = event.interval;
});
// https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
function lon2tile(lon, zoom) {
	return ((lon + 180) / 360) * Math.pow(2, zoom);
}
function lat2tile(lat, zoom) {
	return (
		((1 -
			Math.log(
				Math.tan((lat * Math.PI) / 180) +
					1 / Math.cos((lat * Math.PI) / 180),
			) /
				Math.PI) /
			2) *
		Math.pow(2, zoom)
	);
}
var tile_cache = {};
fcount = 0
function nd(display) {
	fcount += 1
	display.clear();
	x_offset = 256 * (lon2tile(player.long, player.zoom) % 1);
	y_offset = 256 * (lat2tile(player.lat, player.zoom) % 1);
	display.push();
	display.fill("black");
	display.stroke("white");
	var tile = [
		Math.floor(lon2tile(player.long, player.zoom)),
		Math.floor(lat2tile(player.lat, player.zoom)),
	];
	
	display.translate(1920 / 8, 500);
	display.rotate(-player.hdg);
	for (var i = -2; i <= 2; i++) {
		for (var j = -3; j <= 2; j++) {
			var image = tile_image(tile[0] + i, tile[1] + j, player.zoom);
			display.image(
				image,
				-x_offset + 256 * i,
				-y_offset + 256 * j,
			);
		}
	}
	display.rotate(player.hdg);
	display.triangle(0, -25, 17, 25, -17, 25);
	display.image(nd_top, -1920 / 8, -500);
	display.strokeWeight(0);
	display.fill('white');
	display.textAlign('center', 'center');
	display.rotate(-player.hdg);
	for (var i = 0; i < 36; i++) {
		displayString = i * 10;
		if (i == 0) displayString = "N";
		if (i == 9) displayString = "E";
		if (i == 18) displayString = "S";
		if (i == 27) displayString = "W";
		display.text(displayString, 0, -435);
		display.rotate(10);
	}
	display.textSize(15);
	display.rotate(player.hdg);
	display.stroke('white');
	display.fill('magenta');
	display.strokeWeight(2);
	display.rect(-25, -445, 50, 20);
	display.stroke('magenta');
	display.line(0, -25, 0, -423);
	display.fill('black');
	display.text(Math.round(player.hdg % 360), 0, -435);
	display.pop();
	display.fill('white');
	display.textAlign('right', 'top');
	display.textSize(12);
	display.text('map (C) OpenStreetMap contributors\nhttps://openstreetmap.org/copyright', 1920 / 4, 0);
	display.textAlign('left', 'top');
	display.text(`GPS:\n${lastLocation.coords.latitude}, ${lastLocation.coords.longitude}\nGS ${(lastLocation.coords.speed == null || lastLocation.coords.speed != lastLocation.coords.speed) ? lastLocation.coords.speed : lastLocation.coords.speed * 3600 / 1852} kts (raw: ${String(lastLocation.coords.speed).slice(0, 7)} m/s)\nHDG ${lastLocation.coords.heading}\n${(lastLocation.coords.altitude == null || lastLocation.coords.altitude != lastLocation.coords.altitude) ? lastLocation.coords.altitude : Math.round(lastLocation.coords.altitude * 100 / 2.54 / 12)} ft amsl (raw: ${String(lastLocation.coords.altitude).slice(0, 7)} m)\nf#${fcount}`, 0, 0)
	if (player.geo_err) {
		display.fill("red");
		display.rect(1920 / 4 - 100, 30, 100, 30);
		display.fill("white");
		display.textAlign("center", "center");
		display.textSize(10);
		display.text("GEOLOCATION ERR", 1920 / 4 - 50, 45);
	}
	if (player.updateLastFrame) {
		player.updateLastFrame = false;
		display.fill('green');
		display.rect(1920 / 4 - 100, 30, 100, 30);
		display.fill('white');
		display.textAlign('center', 'center');
		display.textSize(10);
		display.text('NEW', 1920 / 4 - 50, 45);
	}
}
function tile_image(x, y, zoom) {
	if (x <= 0 || y <= 0) return emptyCanvas;
	if (!tile_cache[zoom]) tile_cache[zoom] = {};
	if (!tile_cache[zoom][x]) tile_cache[zoom][x] = {};
	if (!tile_cache[zoom][x][y]) {
		tile_cache[zoom][x][y] = draw.loadImage(
			`https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`,
		);
		tile_cache[zoom][x][y].inverted = false;
	} else {
		if (tile_cache[zoom][x][y].width > 200 && !tile_cache[zoom][x][y].inverted) {
			if (darkMode) {
				tile_cache[zoom][x][y].loadPixels();
				var pixels = tile_cache[zoom][x][y].pixels;
				for (var p = 0; p < pixels.length; p += 4) {
					rgb_color = nd_canvas.color(pixels[p], pixels[p + 1], pixels[p + 2]);
					color = hsl_canvas.color((draw.hue(rgb_color) + 180) % 360, draw.saturation(rgb_color), draw.lightness(rgb_color));
					tile_cache[zoom][x][y].pixels[p] = 255 - draw.red(color);
					tile_cache[zoom][x][y].pixels[p + 1] = 255 - draw.green(color);
					tile_cache[zoom][x][y].pixels[p + 2] = 255 - draw.blue(color);
				}
				tile_cache[zoom][x][y].updatePixels();
			}
			tile_cache[zoom][x][y].inverted = true;
		}
	}
	var tile_image = tile_cache[zoom][x][y];
	return tile_image;
}
function drawDigit(canvas, x, digit, showZero, transition = 0.2) {
	canvas.textSize(20);
	canvas.push();
	canvas.textAlign('center', 'center');
	var y = 14;
	if ((digit % 1) > (1 - transition / 2)) y += 15 * ((digit % 1) - 1 + transition / 2) / (transition / 2)
	if ((digit % 1) < transition / 2) y -= 15 * (1 - (digit % 1) / (transition / 2))
	canvas.translate(x, y);
	digitToDraw = Math.floor(digit)
	if (showZero || digitToDraw) canvas.text(digitToDraw, 0, 0)
	canvas.text((digitToDraw + 1) % 10, 0, -30);
	if (showZero || ((9 + digitToDraw) % 10)) canvas.text((9 + digitToDraw) % 10, 0, 30);
	canvas.pop();
}
function updateSpeed() {
	speedTape.clear();
	if (player.noSpeed) {
		speedTape.fill('red');
		speedTape.rect(0, 0, 75, 300);
		speedTape.textAlign('center', 'center');
		speedTape.fill('black');
		speedTape.text('SPD', 75 / 2, 150);
		return;
	}
	speedTape.fill('lightgray');
	speedTape.rect(0, 0, 75, 300);
	speedTape.stroke('black');
	speedTape.fill('black');
	speedTape.push();
	speedTape.strokeWeight(3);
	speedTape.textAlign('left', 'center');
	var start = -330 + (player.speed % 10) * 6;
	var startspeed = Math.floor(player.speed / 10) * 10 + 80;
	for (var i = 0; i < 17; i++) {
		if (startspeed < 0) break;
		speedTape.strokeWeight(3);
		speedTape.line(0, start, 45, start)
		speedTape.strokeWeight(0);
		speedTape.text(startspeed, 50, start)
		start += 60
		startspeed -= 10
	}
	speedTape.fill('yellow');
	speedTape.triangle(75, 145, 75, 155, 65, 150)
	speedTape.strokeWeight(3);
	speedTape.stroke('yellow');
	speedTape.line(50, 150, 75, 150)
	speedTape.pop();
	speedIndicator.clear();
	speedIndicator.fill('black');
	speedIndicator.rect(0, 0, 45, 28);
	hundreds = player.speed / 100
	tens = (player.speed / 10) % 10
	ones = player.speed % 10
	speedIndicator.fill('white');
	drawDigit(speedIndicator, 45 / 4, hundreds, false);
	drawDigit(speedIndicator, 90 / 4, tens, player.speed >= 100);
	drawDigit(speedIndicator, 135 / 4, ones, true, 1);
	speedTape.stroke('green');
	speedTape.strokeWeight(5);
	speedTape.line(22.5, 150, 22.5, 150 - (player.speed - player.previousSpeed) * 240 * 6)
	speedTape.strokeWeight(0);
	speedTape.image(speedIndicator, 0, 150 - 14);
	player.previousSpeed = player.speed;
}
function pfd(display) {
	madgwick.update(
		player.rotationRate.x,
		player.rotationRate.y,
		player.rotationRate.z,
		player.acceleration.x,
		player.acceleration.y,
		player.acceleration.z,
		undefined,
		undefined,
		undefined,
		player.interval / 1000,
	);
	euler = madgwick.getEulerAngles();
	player.pitch = euler.pitch * 1000;
	player.roll = euler.roll * 1000;
	const vertical_deviation = (player.pitch * 100) / 10;
	display.clear();
	display.push();
	display.translate(1920 / 8, 1080 / 4);
	display.rotate(player.roll);
	display.fill("brown");
	display.rect(-1920, vertical_deviation, 1920 * 2, 1080);
	display.fill("blue");
	display.rect(-1920, -1080 + vertical_deviation, 1920 * 2, 1080);
	display.fill("white");
	display.strokeWeight(0);
	for (var i = 10; i <= 90; i += 10) {
		display.rect(-100, vertical_deviation + (-i * 100) / 10 - 0.5, 200, 1);
		display.rect(-100, vertical_deviation + (i * 100) / 10 - 0.5, 200, 1);
	}
	display.pop();
	display.push();
	display.fill("black");
	display.stroke("yellow");
	display.translate(1920 / 8, 1080 / 4);
	display.triangle(-5, 0, -80, 20, -55, 20);
	display.triangle(5, 0, 80, 20, 55, 20);
	display.pop();
	updateSpeed();
	display.image(speedTape, 25, 100);
	display.fill("white");
	display.textAlign("left", "top");
	/* display.text(
		`${JSON.stringify(euler, null, 2)}\n${player.acceleration.x}\n${player.acceleration.y}\n${player.acceleration.z}\n${player.rotationRate.x}\n${player.rotationRate.y}\n${player.rotationRate.z}\n\n${(player.pitch * Math.PI) / 180}\n${(player.roll * Math.PI) / 180}`,
		100,
		100,
	); */
}
function update() {
	if (lastLocation.valid) {
		player.lat = lastLocation.coords.latitude;
		player.long = lastLocation.coords.longitude;
		player.geo_err = false;
		player.speed = (lastLocation.coords.speed * 3600 / 1852) ?? 0;
		if (lastLocation.coords.speed === null) player.noSpeed = true;
		else player.noSpeed = false;
		if (lastLocation.coords.heading == lastLocation.coords.heading && (lastLocation.coords.heading || lastLocation.coords.heading === 0)) player.hdg = lastLocation.coords.heading;
	}
	draw.clear();
	draw.fill("black");
	draw.rect(0, 0, width, height);
	draw.fill("lime");
	nd(nd_canvas);
	pfd(pfd_canvas);
	draw.image(pfd_canvas, 1920 / 4, 0, 1920 / 4, 1080 / 2);
	draw.image(nd_canvas, 0, 0, 1920 / 4, 1080 / 2);
}
var s = function (sketch) {
	sketch.setup = async function () {
		draw.angleMode(draw.DEGREES);
		pfd_canvas = draw.createGraphics(1920 / 4, 1080 / 2);
		pfd_canvas.angleMode(draw.DEGREES);
		nd_canvas = draw.createGraphics(1920 / 4, 1080 / 2);
		nd_canvas.angleMode(draw.DEGREES);
		nd_top = draw.createGraphics(480, 300);
		nd_top.fill('black');
		nd_top.rect(0, 0, 480, 300);
		nd_top.erase();
		nd_top.circle(240, 500, 850);
		nd_top.noErase();
		emptyCanvas = draw.createGraphics(256, 256);
		emptyCanvas.background('black');
		emptyCanvas.textSize(35);
		emptyCanvas.fill('white');
		emptyCanvas.textAlign('center', 'center');
		emptyCanvas.text('OUT OF\nBOUNDS', 128, 128);
		speedTape = draw.createGraphics(75, 300);
		speedIndicator = draw.createGraphics(45, 28);
		speedIndicator.background('black');
		hsl_canvas = draw.createGraphics(5, 5);
		hsl_canvas.colorMode(draw.HSL);
		sketch.createCanvas(width, height);
		updateInterval = setInterval(update, 1000 / 24);
	};
};
var draw = new p5(s, "map");
