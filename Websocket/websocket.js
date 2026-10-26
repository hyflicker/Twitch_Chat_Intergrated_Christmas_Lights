import { notiQueue, defaultQueue, reset } from '../Lights/lightSettings.js';
import WebSocketClient from 'websocket/lib/WebSocketClient.js';
import { defaultColors } from '../Lights/defaultColors.js';
import 'dotenv/config'

//Global Variables
let wsConnected = false;
let wsStartInt = null;

// Blackout / Off color detection configuration
const BLACKOUT_DURATION_MS = 20000;
const NEAR_BLACK_CHANNEL_THRESHOLD = 0x0f; // 15: pure black (#000000) through near-black (<= #0F0F0F)

// Initial fallback patterns to revert to if previousDefault is empty or off
const fallbackDefault = JSON.parse(JSON.stringify(defaultQueue));

// Keeps track of the last active visible (non-off) patterns
let previousDefault = JSON.parse(JSON.stringify(defaultQueue));

// Timer tracking active blackout auto-reversion
let blackoutTimer = null;

function isColorOff(colorHex) {
    if (!colorHex) return false;
    const cleanHex = String(colorHex).toLowerCase().replace(/^0x|^#/, '');
    if (cleanHex.length !== 6) return false;
    const c1 = parseInt(cleanHex.slice(0, 2), 16);
    const c2 = parseInt(cleanHex.slice(2, 4), 16);
    const c3 = parseInt(cleanHex.slice(4, 6), 16);
    if (isNaN(c1) || isNaN(c2) || isNaN(c3)) return false;
    return c1 <= NEAR_BLACK_CHANNEL_THRESHOLD &&
        c2 <= NEAR_BLACK_CHANNEL_THRESHOLD &&
        c3 <= NEAR_BLACK_CHANNEL_THRESHOLD;
}

function isPatternOff(pattern) {
    if (!pattern || !pattern.color) {
        return false;
    }
    if (!isColorOff(pattern.color)) {
        return false;
    }
    if (pattern.color2 && !isColorOff(pattern.color2)) {
        return false;
    }
    return true;
}

function isQueueAllOff(queue) {
    return Array.isArray(queue) && queue.length > 0 && queue.every(isPatternOff);
}

function updateDefaultQueue(newItems) {
    defaultQueue.splice(0, defaultQueue.length, ...JSON.parse(JSON.stringify(newItems)));
}

function wsStart() {
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
    connection.on('pong', () => {
        // console.log('PONG')
    })

    //Connection Closed Handler
    connection.on('close', (reasonCode, message) => {
        console.log("Connection Closed, Reason Code: " + reasonCode + " Message: " + message);
        wsConnected = false;
        let wsStartCounter = 0;
        let intTime = 30000;
        let wsStartFunc = function () {
            if (wsConnected === false)
                if (wsStartCounter <= 10) {
                    wsStartCounter++
                    wsStart();
                } else if (wsStartCounter > 10 && wsStartCounter <= 25) {
                    wsStartCounter++
                    intTime = 60000;
                    wsStart();
                } else {
                    clearInterval(wsStartInt);
                    setTimeout(function () {
                        wsStart();
                        1800000
                    }, 1800000)
                }

        }
        wsStartInt = setInterval(wsStartFunc, intTime);
    })

    //Incoming Message Handler
    connection.on('message', async (message) => {
        if (message.type === 'utf8') {
            let newDefault = [];
            let json = JSON.parse(message.utf8Data);

            async function checkDefaultColors(input) {
                if (!input || typeof input !== 'string') {
                    return {
                        color: null,
                        defaultStatus: false
                    };
                }
                input = input.trim().toLowerCase();
                const matched = defaultColors.find(color => color.name.toLowerCase() === input);
                if (matched) {
                    return {
                        color: matched.color,
                        defaultStatus: true
                    }
                } else {
                    if (/^#?[0-9a-f]{3}$/i.test(input)) {
                        const hexOnly = input.replace('#', '');
                        input = '#' + hexOnly[0] + hexOnly[0] + hexOnly[1] + hexOnly[1] + hexOnly[2] + hexOnly[2];
                    } else if (/^[0-9a-f]{6}$/i.test(input)) {
                        input = '#' + input;
                    }
                    if (!/^#[0-9a-f]{6}$/i.test(input)) {
                        return {
                            color: null,
                            defaultStatus: false
                        }
                    }
                    return {
                        color: input.slice(3, 5) + input.slice(1, 3) + input.slice(5, 7),
                        defaultStatus: false
                    }
                }
            }


            async function parseInput(input, type) {
                //Parses the input from the user.
                const args = input.split(' ');
                switch (type) {
                    case 1:
                        for (let i = 0; i < args.length; i++) {
                            const currentArg = args[i];
                            if (!currentArg) continue;
                            const colorInfo = await checkDefaultColors(currentArg);
                            console.log(colorInfo);

                            //Runs Solid Lightshow when only arg is HEX or Default Color name
                            if (colorInfo.color && (currentArg.startsWith("#") || colorInfo.defaultStatus)) {
                                newDefault.push({
                                    "id": 5,
                                    "type": "solid",
                                    "name": "solid",
                                    "color": `0x${colorInfo.color}`,
                                    "color2": null
                                })
                            } else {
                                //Runs each Lightshow based on input from chatter
                                switch (currentArg.toLowerCase()) {
                                    case 'solid': {
                                        if (!args[i + 1]) return;
                                        const nextColor = await checkDefaultColors(args[i + 1]);
                                        if (!nextColor.color) return;
                                        newDefault.push({
                                            "id": 5,
                                            "type": "solid",
                                            "name": "solid",
                                            "color": `0x${nextColor.color}`,
                                            "color2": null
                                        })
                                        i += 1;
                                        break;
                                    }
                                    case 'colorwipe': {
                                        if (!args[i + 1]) return;
                                        const nextColor = await checkDefaultColors(args[i + 1]);
                                        if (!nextColor.color) return;
                                        newDefault.push({
                                            "id": 1,
                                            "type": "color-wipe",
                                            "name": "color wipe",
                                            "color": `0x${nextColor.color}`,
                                            "color2": null
                                        })
                                        i += 1;
                                        break;
                                    }
                                    case 'colorwipereverse': {
                                        if (!args[i + 1]) return;
                                        const nextColor = await checkDefaultColors(args[i + 1]);
                                        if (!nextColor.color) return;
                                        newDefault.push({
                                            "id": 2,
                                            "type": "color-wipe-reverse",
                                            "name": "color wipe reverse",
                                            "color": `0x${nextColor.color}`,
                                            "color2": null
                                        })
                                        i += 1;
                                        break;
                                    }
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
                                    case 'colortwinkle': {
                                        if (!args[i + 1]) return;
                                        const c1 = await checkDefaultColors(args[i + 1]);
                                        if (!c1.color) return;
                                        const c2Arg = args[i + 2] ? args[i + 2].toLowerCase() : 'white';
                                        const c2 = await checkDefaultColors(c2Arg);
                                        if (!c2.color) return;
                                        newDefault.push({
                                            "id": 16,
                                            "type": "color-twinkle",
                                            "name": "color twinkle",
                                            "color": `0x${c1.color}`,
                                            "color2": `0x${c2.color}`
                                        })
                                        i += (args[i + 2] ? 2 : 1);
                                        break;
                                    }
                                    case 'candycane':
                                        newDefault.push({
                                            "id": 15,
                                            "type": "candycane",
                                            "name": "candycane",
                                            "color": null,
                                            "color2": null
                                        })
                                        break;
                                    case 'christmas':
                                        newDefault.push({
                                            "id": 17,
                                            "type": "christmas",
                                            "name": "christmas",
                                            "color": null,
                                            "color2": null
                                        })
                                        break;
                                    default:
                                        break;
                                }
                            }
                        }
                        if (newDefault.length > 0) {
                            const isBlackout = isQueueAllOff(newDefault);

                            if (blackoutTimer) {
                                clearTimeout(blackoutTimer);
                                blackoutTimer = null;
                            }

                            if (!isBlackout) {
                                previousDefault = JSON.parse(JSON.stringify(newDefault));
                                updateDefaultQueue(newDefault);
                                console.log('defaultQueue updated:', defaultQueue);
                            } else {
                                console.log('Blackout redemption detected. Turning lights off for 20 seconds, then reverting...');
                                updateDefaultQueue(newDefault);
                                console.log('defaultQueue set to blackout:', defaultQueue);

                                blackoutTimer = setTimeout(() => {
                                    const revertQueue = (Array.isArray(previousDefault) && previousDefault.length > 0 && !isQueueAllOff(previousDefault))
                                        ? previousDefault
                                        : fallbackDefault;
                                    console.log('20 seconds elapsed. Reverting defaultQueue from blackout to:', revertQueue);
                                    updateDefaultQueue(revertQueue);
                                    blackoutTimer = null;
                                }, BLACKOUT_DURATION_MS);
                            }
                        } else {
                            return
                        }
                        break;
                    case 2: {
                        const flashColor = await checkDefaultColors(args[0]);
                        if (flashColor.color) {
                            notiQueue.push({
                                "id": 18,
                                "type": "color-flash",
                                "name": "color flash",
                                "color": `0x${flashColor.color}`
                            });
                        }
                        console.log(notiQueue);
                        break;
                    }
                    default:
                        break;
                }

            }
            if (json.type === 'RESPONSE') {
                if (json.error === "" && json.message === "") {
                    // console.log('Request Response: Error: None Message: Success');
                } else {
                    console.log('Request Response: Error: ' + json.error + " Message: " + json.message);
                }
            } else if (json.type === "MESSAGE") {
                //Runs lightshow based on Channel Event Types.
                if (json.topic === "channel_follow") {
                    notiQueue.push({
                        id: 8,
                        type: 'follower',
                        name: "follower",
                        color: `0x${(await checkDefaultColors('#3d0061')).color}`
                    });
                } else if (json.topic === "channel_bits") {
                    notiQueue.push({
                        id: 9,
                        type: 'bits',
                        name: "bits",
                        color: `0x${(await checkDefaultColors('green')).color}`,
                        color2: `0x${(await checkDefaultColors('white')).color}`,
                    });
                } else if (json.topic === "channel_subscribe") {
                    notiQueue.push({
                        id: 10,
                        type: 'sub',
                        name: "sub",
                        color: `0x${(await checkDefaultColors('purple')).color}`,
                        color2: `0x${(await checkDefaultColors('white')).color}`,
                    });
                } else if (json.topic === "channel_resubscribe") {
                    notiQueue.push({
                        id: 11,
                        type: 'resub',
                        name: "resub",
                        color: `0x${(await checkDefaultColors('blue')).color}`,
                        color2: `0x${(await checkDefaultColors('white')).color}`,
                    });
                } else if (json.topic === "channel_sub_gifting") {
                    notiQueue.push({
                        id: 12,
                        type: 'gift-sub',
                        name: "gift sub",
                        color: `0x${(await checkDefaultColors('pink')).color}`,
                        color2: `0x${(await checkDefaultColors('white')).color}`,
                    });
                } else if (json.topic === "channel_sub_community_gifting") {
                    notiQueue.push({
                        id: 13,
                        type: 'community-gift-sub',
                        name: "community gift sub",
                        color: `0x${(await checkDefaultColors('orange')).color}`,
                        color2: `0x${(await checkDefaultColors('white')).color}`,
                    });
                } else if (json.topic === "channel_raid") {
                    notiQueue.push({
                        id: 14,
                        type: 'raid',
                        name: "raid",
                        color: `0x${(await checkDefaultColors('red')).color}`,
                        color2: `0x${(await checkDefaultColors('white')).color}`,
                    });
                } else if (json.topic === "channel_points_reward_redeem") {
                    const id = json.message.redemption.reward.id;
                    if (id == 'e890f1a5-5443-4493-9b58-570dddf892f5') {
                        await parseInput(json.message.redemption.user_input, 1)
                    } else if (id == '91a5cdef-cf1d-49d1-8fd1-110bc81f8367') {
                        await parseInput(json.message.redemption.user_input, 2)
                    } else if (id == '0cde8816-e02a-42bf-939c-78d33d5fd45d') {
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
    if (connection.connected) {
        connection.send(JSON.stringify({
            "type": "LISTEN",
            "nonce": `${nonce(80)}`,
            "channel_id": `${process.env.channelID}`,
            "topics": ["channel_points_reward_redeem", "channel_follow", "channel_bits", "channel_subscribe", "channel_resubscribe", "channel_sub_community_gifting", "channel_sub_gifting", "channel_raid"],
            "token": `${process.env.MJRToken}`,
            "platform": "Twitch",
            "app_id": "Christmas Lights"
        }));
    }
})
wsStart();
