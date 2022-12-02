import ws281x from 'rpi-ws281x-native';

let notiQueue = [];
//Default Lightshows 
let defaultQueue = [
    {
    "id": 1,
    "type": "colorWipe",
    "name": "colorWipe",
    "color": "0x005486"
},
{
    "id": 2,
    "type": "colorWipeReverse",
    "name": "colorWipeReverse",
    "color": "0xFFFFFF"
}
];

//Set's Default Options For LED Strip
const ledCount = 100;
const options = {
	dma: 10,
	freq: 800000,
	invert: false,
	brightness: 200,
	stripType: ws281x.stripType.WS2812,
	gpio: 18
}

//Grabs The LED Strip And Creates A LED Array For All Pixel
const channel = ws281x(ledCount,options)
const colors = channel.array;

async function reset (){
    //Resets all pixels to black.
    return ws281x.reset();
}

function render(){
    //Renders The Colors To Each Pixel.
    return ws281x.render();
}

export {
    ledCount,
    channel,
    colors,
    notiQueue,
    defaultQueue,
    reset,
    render
}