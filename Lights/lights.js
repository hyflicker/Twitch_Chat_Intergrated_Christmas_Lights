import { defaultQueue, notiQueue,reset} from './lightSettings.js';
import { playLightShow } from '../Utilities/lightShowHelpers.js';

//Resets LEDs Before Starting Lightshow
reset()
do {
	if(notiQueue.length > 0){
		await playLightShow(notiQueue[0])
		notiQueue.shift();		
	}else{
		for (let i = 0; i < defaultQueue.length; i++) {
			await playLightShow(defaultQueue[i])
		}		
	}
} while (true);



































































































































// let change = true;
// let defaultLS = {
// 	id : 1,
// 	type: 'default',
// 	color: '0x00FF00'
// }

// lightShows.push(defaultLS);

// async function solid(color){
// 	console.log('in solid')
// 	for (let i = 0; i < colors.length; i++) {
// 		colors[i] = color;
// 		render();	
// 	}
// 	await timeout(5000)
// }

// async function timeout(ms) {
// 	return new Promise(resolve => {
// 		setTimeout(resolve,ms);
// 	})
// }

// reset();
// do {
// 	console.log(lightShows)
// 	for (let i = 0; i < lightShows.length; i++) {
// 		await runLightShow(lightShows[i].id, lightShows[i].color)
// 		if(!lightShows[i].type == 'default'){
// 			lightShows[i].shift();
// 		}
// 	}
// } while (true);

// async function runLightShow(id, color){
// 	switch (id) {
// 		case 1:
// 			await solid(color)
// 			break;
// 		case 2:
// 			await solid(color)
// 		default:
// 			break;
// 	}
// }

