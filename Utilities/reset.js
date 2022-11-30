import ws281x from 'rpi-ws281x-native';

const ledCount = 70;
const options = {
	dma: 10,
	freq: 800000,
	invert: false,
	brightness: 255,
	stripType: ws281x.stripType.WS2811_RGB,
	gpio: 18
}

const channel = ws281x(ledCount,options)

ws281x.reset();

