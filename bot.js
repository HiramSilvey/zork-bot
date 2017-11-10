let Discord = require('discord.io');
let logger = require('winston');
let request = require('request');
let uuid = require('uuid');
let auth = require('./auth.json');

let baseURL = "http://zork.ruf.io/";

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
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
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
            // !ping
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
            // Just add any case commands if you want to..
         }
     }
});