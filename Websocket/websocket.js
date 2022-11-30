import { notiQueue, defaultQueue} from '../Lights/lightSettings.js';
import WebSocketClient from 'websocket/lib/WebSocketClient.js';
import { defaultColors } from '../Lights/defaultColors.js';
import 'dotenv/config'

//Global Variables
let wsConnected = false;
let wsStartInt = null;

function wsStart(){
    console.log('attempting to start ws')
    wsClient.connect(process.env.MJRURL);
}

function nonce(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

const wsClient = new WebSocketClient({
    keepalive: true,
    keepaliveInterval: 30000
})
wsClient.on('connectFailed', (error) => {
    console.error('CONNECT FAILED: ' + error.toString());
})

wsClient.on('connect', (connection) => {
    console.log('Connection Successful to MJRBot');
    wsConnected = true;

    //Connection Error Handler
    connection.on('error', (error) => {
        console.error('CONNECTION ERROR: ' + error.toString());
    })

    //Pong messages
    connection.on('pong',() => {
        // console.log('PONG')
    })

    //Connection Closed Handler
    connection.on('close', (reasonCode, message) => {
        console.log("Connection Closed, Reason Code: " + reasonCode  + " Message: " + message);
        wsConnected = false;
        let wsStartCounter = 0;
        let intTime = 30000;
        let wsStartFunc = function () {
            if(wsConnected === false)
                if(wsStartCounter <= 10){
                    wsStartCounter++
                    wsStart();
                }else if(wsStartCounter >10 && wsStartCounter <=25){
                    wsStartCounter++
                    intTime = 60000;
                    wsStart();
                }else{
                    clearInterval(wsStartInt);
                    setTimeout(function(){
                        wsStart();
                        1800000
                    },1800000)
                }

        }
        wsStartInt = setInterval(wsStartFunc,intTime);
    })

    //Incoming Message Handler
    connection.on('message', async(message) => {
        if(message.type === 'utf8'){
            let newDefault = [];
            let json = JSON.parse(message.utf8Data);
            
            async function checkDefaultColors (input){
                if(defaultColors.filter(color => color.name === input).length > 0){
                    return {
                        color : defaultColors.filter(color => color.name === input)[0].color,
                        defaultStatus: true
                    }
                }else{
                    if(input.length !== 7){
                        return {
                            color : null,
                            defaultStatus: false
                        }
                    }
                    return {
                        color : input.slice(3,5)+input.slice(1,3)+input.slice(5,7),
                        defaultStatus: false
                    }
                }
            }


            async function parseInput(input,type){
                //Parses the input from the user.
                const args = input.split(' ');
                switch (type) {
                    case 1:
                        for (let i = 0; i < args.length; i++) {
                            //Runs Solid Lightshow when only arg is HEX
                            if(((args[i][0] === "#") && (args[i].length === 7)) || ((await checkDefaultColors(args[i])).defaultStatus)){
                                newDefault.push({
                                    "id": 5,
                                    "type": "solid",
                                    "name": "solid",
                                    "color": `0x${(await checkDefaultColors(args[i])).color}`,
                                    "color2": null
                                })
                            }else{
                                //Runs each Lightshow based on input from chatter
                                switch (args[i].toLowerCase()) {
                                    case 'solid':
                                        if(!((args[i+1][0] === "#") && (args[i+1].length === 7) || checkDefaultColors(args[i+1]))){
                                            return;
                                        }
                                        newDefault.push({
                                            "id": 5,
                                            "type": "solid",
                                            "name": "solid",
                                            "color": `0x${(await checkDefaultColors(args[i+1])).color}`,
                                            "color2": null
                                        })
                                        i += 1;
                                        break;
                                    case 'colorwipe':
                                        if(!(args[i+1][0] === "#") && (args[i+1].length === 7)){
                                            return;
                                        }
                                        newDefault.push({
                                            "id": 1,
                                            "type": "color-wipe",
                                            "name": "color wipe",
                                            "color": `0x${(await checkDefaultColors(args[i+1])).color}`,
                                            "color2": null
                                        })
                                        i += 1;
                                        break;
                                    case 'colorwipereverse':
                                        if(!(args[i+1][0] === "#") && (args[i+1].length === 7)){
                                            return;
                                        }
                                        newDefault.push({
                                            "id": 2,
                                            "type": "color-wipe-reverse",
                                            "name": "color wipe reverse",
                                            "color": `0x${(await checkDefaultColors(args[i+1])).color}`,
                                            "color2": null
                                        })
                                        i += 1;
                                        break;
                                        break;
                                    case 'rainbow':
                                        newDefault.push({
                                            "id": 3,
                                            "type": "rainbow",
                                            "name": "rainbow",
                                            "color": null,
                                            "color2": null
                                        })
                                        break;
                                    case 'rainbowcycle':
                                        newDefault.push({
                                            "id": 4,
                                            "type": "rainbow-cycle",
                                            "name": "rainbow cycle",
                                            "color": null,
                                            "color2": null
                                        })
                                        break;
                                    case 'colortwinkle':
                                        let color2;
                                        if(args[i+2]){
                                            color2 = args[i+2];
                                        }else{
                                            color2 = 'white';
                                        }
                                        newDefault.push({
                                            "id": 16,
                                            "type": "color-twinkle",
                                            "name": "color twinkle",
                                            "color": `0x${(await checkDefaultColors(args[i+1])).color}`,
                                            "color2": `0x${(await checkDefaultColors(color2)).color}`
                                        })
                                        i += 2;
                                        break;
                                    default:
                                        break;
                                }
                            }
                        }
                        if(newDefault.length > 0){
                            console.log(defaultQueue.length)
                            const num = defaultQueue.length;
                            for (let i = 0; i < num; i++) {
                                console.log(i)
                                defaultQueue.shift();                        
                            }
                            for (let i = 0; i < newDefault.length; i++) {
                                defaultQueue.push(newDefault[i]);                        
                            }
                            console.log(defaultQueue)
                        }else{
                            return
                        }
                        break;
                    case 2:
                        notiQueue.push({
                            "id": 6,
                            "type": "color-flash",
                            "name": "color flash",
                            "color": `0x${(await checkDefaultColors(args[0])).color}`
                        })
                        console.log(notiQueue)
                        break;
                    default:
                        break;
                }
                
            }   
            if(json.type === 'RESPONSE'){
                if(json.error === "" && json.message === ""){
                    // console.log('Request Response: Error: None Message: Success');
                }else{
                    console.log('Request Response: Error: ' + json.error + " Message: " + json.message);    
                }
        	}else if(json.type === "MESSAGE"){
                //Runs lightshow based on Channel Event Types.
                if(json.topic === "channel_follow"){
                    notiQueue.push({
                        id : 8,
                        type: 'follower',
                        name: "follower",
                        color: `0x${(await checkDefaultColors('#3d0061')).color}`
                    });
                }else if(json.topic === "channel_bits"){
                    notiQueue.push({
                        id : 9,
                        type: 'bits',
                        name: "bits",
                        color: `0x${(await checkDefaultColors('green')).color}`,
                        color2: `0x${(await checkDefaultColors('white')).color}`,
                    });
                }else if(json.topic === "channel_subscribe"){
                    notiQueue.push({
                        id : 10,
                        type: 'sub',
                        name: "sub",
                        color: `0x${(await checkDefaultColors('purple')).color}`,
                        color2: `0x${(await checkDefaultColors('white')).color}`,
                    });
                }else if(json.topic === "channel_resubscribe"){
                    notiQueue.push({
                        id : 11,
                        type: 'resub',
                        name: "resub",
                        color: `0x${(await checkDefaultColors('blue')).color}`,
                        color2: `0x${(await checkDefaultColors('white')).color}`,
                    }); 
                }else if(json.topic === "channel_sub_gifting"){
                    notiQueue.push({
                        id : 12,
                        type: 'gift-sub',
                        name: "gift sub",
                        color: `0x${(await checkDefaultColors('pink')).color}`,
                        color2: `0x${(await checkDefaultColors('white')).color}`,
                    });
                }else if(json.topic === "channel_sub_community_gifting"){
                    notiQueue.push({
                        id : 13,
                        type: 'community-gift-sub',
                        name: "community gift sub",
                        color: `0x${(await checkDefaultColors('orange')).color}`,
                        color2: `0x${(await checkDefaultColors('white')).color}`,
                    });
                }else if(json.topic === "channel_raid"){
                    notiQueue.push({
                        id : 14,
                        type: 'raid',
                        name: "raid",
                        color: `0x${(await checkDefaultColors('red')).color}`,
                        color2: `0x${(await checkDefaultColors('white')).color}`,
                    });
                }else if(json.topic === "channel_points_reward_redeem"){
                    const id = json.message.redemption.reward.id;
                    if(id == 'e890f1a5-5443-4493-9b58-570dddf892f5'){
                        await parseInput(json.message.redemption.user_input,1) 
                    }else if(id == '91a5cdef-cf1d-49d1-8fd1-110bc81f8367'){
                        await parseInput(json.message.redemption.user_input,2)
                    }else if(id == '0cde8816-e02a-42bf-939c-78d33d5fd45d'){
                        notiQueue.push({
                            "id": 7,
                            "type": "rainbow-flash",
                            "name": "rainbow flash",
                            "color": null
                        })
                    }                  
                }
            } 	
        }
    })

    //Send Listen Request
    if(connection.connected){
        connection.send(JSON.stringify({
            "type" : "LISTEN",
            "nonce" : `${nonce(80)}`,
            "channel_id" : `${process.env.channelID}`,
            "topics" : ["channel_points_reward_redeem", "channel_follow", "channel_bits", "channel_subscribe", "channel_resubscribe", "channel_sub_community_gifting", "channel_sub_gifting", "channel_raid"],
            "token" : `${process.env.MJRToken}`
        }));
    }
})
wsStart();
