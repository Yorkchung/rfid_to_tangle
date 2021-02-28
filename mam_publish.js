/*
Author: York

The mam_publish.js file publishes random generated numbers on the tangle using MAM.
This file will work on a computer or Raspberry Pi.

Usage:
1)  You can change the default settings: MODE, SIDEKEY, SECURITYLEVEL or TIMEINTERVAL
    If you do, make the same changes in mam_receive.js file.
2)  Start the app: node mam_publish.js

*/

var mqtt = require('mqtt')
var client  = mqtt.connect('mqtt://your ip')
const Mam = require('./lib/mam.client.js');
const IOTA = require('iota.lib.js');
const moment = require('moment');
const iota = new IOTA({ provider: 'https://nodes.devnet.iota.org:443' });

const MODE = 'restricted'; // public, private or restricted
const SIDEKEY = 'your sidekey'; // Enter only ASCII characters. Used only in restricted mode
const SECURITYLEVEL = 3; // 1, 2 or 3
const TIMEINTERVAL  = 30; // seconds
var data = '';//mqtt data

// Initialise MAM State
let mamState = Mam.init(iota, undefined, SECURITYLEVEL);

// Set channel mode
if (MODE == 'restricted') {
    const key = iota.utils.toTrytes(SIDEKEY);
	console.log(key);
    mamState = Mam.changeMode(mamState, MODE, key);
} else {
    mamState = Mam.changeMode(mamState, MODE);
}

// Publish data to the tangle
const publish = async function(packet) {
    // Create MAM Payload
    const trytes = iota.utils.toTrytes(JSON.stringify(packet));
    const message = Mam.create(mamState, trytes);

    // Save new mamState
    mamState = message.state;
    console.log('Root: ', message.root);
    console.log('Address: ', message.address);

    // Attach the payload.
    await Mam.attach(message.payload, message.address,3,9);

    return message.root;
}

const generateJSON = function() {
    // Generate some random numbers simulating sensor data
    //const data = Math.floor((Math.random()*89)+10);
    const dateTime = moment().format('DD/MM/YYYY hh:mm:ss');
    const json = {"data": data, "dateTime": dateTime};
    return json;
}

const executeDataPublishing = async function() {
    const json = generateJSON();
    console.log("json=",json);

    const root = await publish(json);
    console.log(`dateTime: ${json.dateTime}, data: ${json.data}, root: ${root}`);
}

// Start it immediately
//executeDataPublishing();

//setInterval(executeDataPublishing, TIMEINTERVAL*1000);

//mqtt fetch
client.on('connect', function () {
    //client.subscribe('myTopic')
    client.subscribe('ledState')
})
client.on('message', function (topic, message) {
	context = message.toString();
	data = context;
	executeDataPublishing();
})

//mqtt server
var mosca = require('mosca');
var settings = {
		port:1883
}

var server = new mosca.Server(settings);

server.on('ready', function(){
	console.log("ready");
});
