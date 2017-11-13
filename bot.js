const Discord = require('discord.io')
const logger = require('winston')
const request = require('request')
const uuidv4 = require('uuid/v4')
const auth = require('./auth.json')
const fs = require('fs')

// file containing saved game names and UUIDs
const saveFile = './.saves'
// the API base URL
const baseURL = 'http://zork.ruf.io/'

// saveFile read into an object
let saves = {}
// let activePlayers = new Set();
// the active game's UUID
let activeUUID = null

// Configure logger settings
logger.remove(logger.transports.Console)
logger.add(logger.transports.Console, {
  colorize: true
})
logger.level = 'debug'

fs.readFile(saveFile, (err, data) => {
  if (err) {
    logger.error(err)
  } else {
    saves = JSON.parse(data)
  }
})

// Initialize Discord Bot
let bot = new Discord.Client({
  token: auth.token,
  autorun: true
})
bot.on('ready', function (evt) {
  logger.info('Connected')
  logger.info('Logged in as: ')
  logger.info(bot.username + ' - (' + bot.id + ')')
})
bot.on('message', function (user, userID, channelID, message, evt) {
  function sendCommand (cmd) {
    request(baseURL + activeUUID + '>' + cmd, function (error, response, body) {
      if (error) {
        bot.sendMessage({
          to: channelID,
          message: 'Error recieving Zork game data, please try again'
        })
        return
      }
      let msg = ''
      try {
        msg = JSON.parse(body)['msg'].substring(1)
      } catch (err) {
        logger.warn('Bad JSON recieved, ignoring...')
      }
      bot.sendMessage({
        to: channelID,
        message: msg
      })
    })
  }

  if (message.substring(0, 2) === '!z') {
    if (message.substring(2, 6) === 'load') {
      let args = message.toLowerCase().substring(6).split(/\s+/)
      if (args.length < 2) {
        // list saves
        let keys = Object.keys(saves)
        if (keys.length === 0) {
          bot.sendMessage({
            to: channelID,
            message: "No games found. Try '!zload New Game Name' to create a new game with the name 'New Game Name'"
          })
        } else {
          let savedList = ''
          for (let i = 0; i < keys.length; i++) {
            savedList += '\t' + (i + 1).toString() + '. ' + keys[i] + '\n'
          }
          bot.sendMessage({
            to: channelID,
            message: 'Current saved games:\n' + savedList
          })
        }
      } else {
        let savedGameName = args.slice(1).join(' ')
        let index = parseInt(savedGameName)
        if (!isNaN(index) && isFinite(savedGameName)) {
          let keys = Object.keys(saves)
          if (keys.length < index || index <= 0) {
            bot.sendMessage({
              to: channelID,
              message: "I can't find that game, try again"
            })
            return
          }
          savedGameName = keys[index - 1]
        }
        if (savedGameName in saves) {
          // load savedGameName
          activeUUID = saves[savedGameName]
        } else {
          // create savedGameName
          activeUUID = uuidv4()
          saves[savedGameName] = activeUUID
          fs.writeFile(saveFile, JSON.stringify(saves), function (err) {
            if (err) {
              return console.log(err)
            }
            console.log('The file was saved!')
          })
        }
        bot.sendMessage({
          to: channelID,
          message: sendCommand('look')
        })
      }
      return
    }
    if (activeUUID == null) {
      bot.sendMessage({
        to: channelID,
        message: "No games are currently loadad. Try '!zload' to see the current saved games"
      })
    } else {
      sendCommand(message.substring(2))
    }
  }
})
