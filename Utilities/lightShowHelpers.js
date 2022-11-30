import { notiQueue } from '../Lights/lightSettings.js';
import lights from '../Lights/lightshows.js'

function wheel(pos){
    //Calculates RGB based the position.
    let r,g,b;
    if(pos < 85){
        r = pos * 3;
        g = 255-pos * 3;
        b = 0
        return rgbToHex(r,g,b)
    }else if(pos < 170){
        pos -=85
        b = pos * 3;
        r = 255-pos * 3;
        g = 0;
        return rgbToHex(r,g,b)
    }else{
        pos -=170
        g = pos * 3;
        b = 255-pos * 3;
        r = 0;
        return rgbToHex(r,g,b)
    }
}
    function componentToHex(c) {
        //Turns each portion of RGB into it's hex form
        let hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
      
    function rgbToHex(r, g, b) {
        //Returns the hex value when RGB is passed. 
        return componentToHex(g) + componentToHex(r) + componentToHex(b);
    }

    async function pause(ms){
        //Pauses the execution but cancels execution if alert is sent.
        for (let i = 0; i < (ms / 1000) * 4; i++) {
            if(notiQueue.length > 0){
                return
            }
            await timeout(1000/4)
        }
    }
    
    async function timeout(ms) {
        //async timeout function.
        return new Promise(resolve => {
            setTimeout(resolve,ms);
        })
    }

    async function playLightShow(data){
        //Switch that controls what show to execute.
        let {id,color,color2} = data;
        switch (id) {
            case 1:
            //Color Wipe Lightshow
                await lights.colorWipe(color)
                break;
            case 2:
            //Reverse Color Wipe Lightshow
                await lights.colorWipeReverse(color)
                break;
            case 3:
            //Rainbow Lightshow
                await lights.rainbow()
                break;
            case 4:
            //Rainbow Cycle Lightshow
                await lights.rainbowCycle()
                break;
            case 5:
            //Solid Color Lightshow
                await lights.solid(color);
                break;
            case 6:
            //Color Flash Lightshow
                await lights.colorFlash(color,12,1);
                break;
            case 7:
            //Rainbow Flash Lightshow
                await lights.rainbowFlash(1)
                break;
            case 16:
            // Color Twinkle Lightshow
                await lights.colorTwinkle(color,color2)
                break;
            case 8:
                console.log('follower alert')
            //Follower Alert
                await lights.follow(color)
                break;
            case 9:
            //Bits Alert
                await lights.bits(data)
                break;
            case 10:
            //Sub Alert
                await lights.sub(data);
                break;
            case 11:
            //Re-Sub Alert
                await lights.resub(data);
                break;
            case 12:
            //Gift Sub Alert
                await lights.giftSub(data);
                break;
            case 13:
            //Community Gift Sub Alert
                await lights.communityGiftSub(data);
                break;
            case 14:
            //Raid
                await lights.raid(data);
                break;
            default:
            //Logs that the show doesn't exist and to continue. 
                console.log('No Show Available')
                break;
        }
        return
    }

    export {
        wheel,
        pause,
        timeout,
        playLightShow
    }