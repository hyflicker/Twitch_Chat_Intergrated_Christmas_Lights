import { ledCount, colors,notiQueue,reset,render} from './lightSettings.js';
import { pause, timeout, wheel } from '../Utilities/lightShowHelpers.js'

async function colorWipe(color,alert=0){
    //Controller function for Color Wipe Lightshow 
    for (let i = 0; i < colors.length; i++) {
        if((notiQueue.length > 0) && (alert == 0)){
            reset()
            .then(()=>{
                return
            })
            break;
        }
        colors[i] = color;
        await timeout(35)
        render();	
    }
}

async function colorWipeReverse(color,alert=0){
    //Controller function for Color Wipe Reverse Lightshow 
    for (let i = colors.length; i >= 0; i--) {
        if((notiQueue.length > 0) && (alert == 0)){
            reset();
            console.log("returned")
            return;
        }
        colors[i] = color;
        await timeout(35)
        render();	
    }
}
    
async function rainbow(alert=0){
    //Controller function for Rainbow Lightshow 
    for (let j = 0; j < 256*2; j++) {
        for (let i = 0; i < ledCount;i++){
            if((notiQueue.length > 0) && (alert == 0)){
                return
            }
            colors[i] = `0x${wheel((i+j) & 255)}`;
        }	
        render();
        await timeout(20)	
    }
}

async function rainbowCycle(alert=0){
    //Controller function for Rainbow Cycle Lightshow 
    for (let j = 0; j < 256; j++) {
        for (let i = 0; i < ledCount; i++) {
            if((notiQueue.length > 0) && (alert == 0)){
                return
            }
            colors[i] = `0x${wheel((i * 256 / ledCount)+ j & 255)}`;
        }
        render();
        await timeout(10)
    }
    
}

async function colorFlash(color,interations=10,alert=0){
    //Controller function for Color Flash Lightshow 
    console.log(color)
    for (let j = 0; j < interations; j++) {
        for (let q = 0; q < 3; q++) {
            for (let i = 0; i < ledCount; i += 3) {
                if((notiQueue.length > 0) && (alert == 0)){
                    return
                } 
                colors[i+q] = color;
            }
            render();
            await timeout(200)
            for (let i = 0; i < ledCount; i += 3) {
                colors[i+q] = '0x000000';
            }
            render()
        }
   }
}

async function rainbowFlash(alert=0){
    //Controller function for Rainbow Flash Lightshow 
    for (let j = 0; j < 256; j++) {
        for (let q = 0; q < 3; q++) {
            for (let i = 0; i < ledCount; i += 3) {
                if((notiQueue.length > 0) && (alert == 0)){
                    return
                } 
                colors[i+q] = `0x${wheel((i+j) % 255)}`;
            }
            render();
            await timeout(100)
            for (let i = 0; i < ledCount; i += 3) {
                colors[i+q] = '0x000000';
            }
            render()
        }
   }
}

async function colorTwinkle(color,color2,iterations=5,alert = 0){
    //Controller function for Color Twinkle Lightshow 
    for (let j = 0; j < iterations; j++) {
        for (let i = 0; i < ledCount; i++) {
            if((notiQueue.length > 0) && (alert === 0)){
                return
            } 
            if(i % 2 == 0){
                colors[i] = color;
            }else{
                colors[i] = '0x00000'
            }
            render()
        }
        await timeout(125)
        for (let i = 0; i < ledCount; i++) {
            if((notiQueue.length > 0) && (alert == 0)){
                return
            } 
            if(i % 2 == 0){
                colors[i] = '0x000000';
            }else{
                colors[i] = color2
            }
            render()
        }
        await timeout(125)    
    }
    reset();
}

async function solid(color, alert=0){
    //Controller function for Solid Lightshow 
    for (let i = 0; i < colors.length; i++){
        if((notiQueue.length > 0) && (alert == 0)){
            return
        } 
        colors[i] = color
    }
    render();
    await pause(5000)
}

async function follow(color){
    //Controller function for Follow Alert
    reset()
    await colorWipeReverse(color,1);
    await pause(1000)
    await colorFlash(color,10,1)
    reset();
}

async function bits(data){
    //Controller function for Bits Alert
    reset();
    await colorWipeReverse(data.color,1);
    await pause(1000)
    await colorTwinkle(data.color,data.color2,5,1);
    await colorFlash(data.color,10,1);
    reset();
}

async function sub(data){
    //Controller function for Sub Alert
    reset();
    await colorWipeReverse(data.color,1);
    await pause(1000);
    await colorTwinkle(data.color,data.color2,5,1);
    await colorFlash(data.color,10,1);
    reset();
}

async function resub(data){
    //Controller function for Resub Alert
    reset();
    await colorWipeReverse(data.color,1);
    await pause(1000);
    await colorTwinkle(data.color,data.color2,5,1);
    await colorFlash(data.color,10,1);
    reset();
}

async function giftSub(data){
    //Controller function for Gift Sub Alert
    reset();
    await colorWipeReverse(data.color,1);
    await pause(1000);
    await colorTwinkle(data.color,data.color2,5,1);
    await colorFlash(data.color,10,1);
    reset();
}

async function communityGiftSub(data){
    //Controller function for Community Gift Sub Alert
    reset();
    await colorWipeReverse(data.color,1);
    await pause(1000);
    await colorTwinkle(data.color,data.color2,5,1);
    await colorFlash(data.color,10,1);
    reset();
}

async function raid(data){
    //Controller function for Raid Alert
    reset();
    await colorWipeReverse(data.color,1);
    await pause(1000);
    await colorTwinkle(data.color,data.color2,5,1);
    await colorFlash(data.color,10,1);
    reset();
}



export default {
    colorWipe,
    colorWipeReverse,
    rainbow,
    solid,
    rainbowCycle,
    colorFlash,
    rainbowFlash,
    colorTwinkle,
    follow,
    bits,
    sub,
    resub,
    giftSub,
    communityGiftSub,
    raid
}