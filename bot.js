let Discord = require('discord.io');
let logger = require('winston');
let request = require('request');
let uuid = require('uuid');
let auth = require('./auth.json');
let fs = require('fs');

let baseURL = "http://zork.ruf.io/";

let saves = []

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

fs.writeFile("./test", "Hey there!", function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("The file was saved!");
}); 

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';
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
    if (message.substring(0, 2) == '!z') {
        let args = message.substring(2).split(/\s+/);
        let idx = 0
        if (args[0] == '') {
            idx = 1
        }
        let cmd = args[idx];

        function sendCommand (cmd) {
            request(baseURL + '>' + cmd, function (error, response, body) {
                bot.sendMessage({
                    to: channelID,
                    message: JSON.parse(body)['msg'].substring(1)
                });
            });
        }

        args = args.splice(1);
        switch(cmd) {
            case 'play':
                sendCommand('look');
            break;
            case 'quit':
                bot.sendMessage({
                    to: channelID,
                    message: 'thanks for playing!'
                });
            break;
            default:
                bot.sendMessage({
                    to: channelID,
                    message: 'lol what?'
                });
         }
     }
});