let Discord = require('discord.io');
let logger = require('winston');
let request = require('request');
let uuid = require('uuid');
let auth = require('./auth.json');
let fs = require('fs');

let baseURL = "http://zork.ruf.io/";

let saves = []
let activePlayers = new Set()

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

fs.readFile("./.saves", (err, data) => {
    if (err) {
        logger.error(err);
    } else {
        let lines = data.split('\n');
        for (let line of lines) {
            parts = line.split(':');
            saves.push({
                "name": parts[0],
                "uuid": parts[1]
            });
        }
    }
});

/*
fs.writeFile("./test", "Hey there!", function (err) {
    if (err) {
        return console.log(err);
    }

    console.log("The file was saved!");
});
*/

// Initialize Discord Bot
let bot = new Discord.Client({
    token: auth.token,
    autorun: true
});
bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});
bot.on('message', function (user, userID, channelID, message, evt) {

    function sendCommand(cmd) {
        request(baseURL + '>' + cmd, function (error, response, body) {
            let msg = ''
            try {
                msg = JSON.parse(body)['msg'].substring(1);
            } catch (err) {
                logger.warning('Bad JSON recieved, ignoring...');
            }
            bot.sendMessage({
                to: channelID,
                message: msg
            });
        });
    }

    if (message.substring(0, 2) == '!z') {
        let args = message.toLowerCase().substring(2).split(/\s+/);
        let idx = 0;
        let cmd = '';

        if (args[0] == '' && args.length > idx) {
            cmd = args[1];
        }
        switch (cmd) {
            case 'play':
                activePlayers.add(userID);
                sendCommand('look');
                break;
            case 'quit':
                activePlayers.delete(userID);
                bot.sendMessage({
                    to: channelID,
                    message: 'thanks for playing @' + user + '!'
                });
                break;
            default:
                return
        }
    } else if (activePlayers.has(userID)) {
        sendCommand(message);
        return;
    }
});