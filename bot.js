const Discord = require('discord.io')
const logger = require('winston')
const request = require('request')
const uuidv4 = require('uuid/v4')
const auth = require('./auth.json')
const fs = require('fs')

const saveFile = './.saves' // file containing saved game names and UUIDs
const baseURL = 'http://zork.ruf.io/' // the API base URL
const msgTimeout = 1000 // 1 second timeout

let saves = {} // {channel ID: {saved game ID : UUID}}
let activeUUIDs = {} // {channel ID: active UUID}
let activeMsgTime = {} // {channel ID: last accepted message timeout}

// configure logger settings
logger.remove(logger.transports.Console)
logger.add(logger.transports.Console, {
  colorize: true
})
logger.level = 'debug'

// load the saved game data
fs.readFile(saveFile, (err, data) => {
  if (err) {
    logger.error(err)
  } else {
    saves = JSON.parse(data)
  }
})

// initialize discord bot
let bot = new Discord.Client({
  token: auth.token,
  autorun: true
})

// log when bot connects
bot.on('ready', function (evt) {
  logger.info('Connected')
  logger.info('Logged in as: ')
  logger.info(bot.username + ' - (' + bot.id + ')')
})

function sendMessage (userID, channelID, message) {
  bot.sendMessage({
    to: channelID,
    message: '<@' + userID + '>\n' + message
  })
}

// react when message is sent in the server chat
bot.on('message', function (user, userID, channelID, message, evt) {
  // send a command to the Zork API and say the response
  function sendCommand (cmd) {
    request(baseURL + activeUUIDs[channelID] + '>' + cmd, function (error, response, body) {
      // handle API error
      if (error) {
        sendMessage(userID, channelID, 'Error recieving Zork game data, please try again')
        return
      }
      // say response as long as it exists
      let msg = ''
      try {
        msg = JSON.parse(body)['msg'].substring(1)
      } catch (err) {
        logger.warn('Bad JSON recieved, ignoring...')
        return
      }
      sendMessage(userID, channelID, msg)
    })
  }

  // message to say if no games are currently loaded
  function noneLoaded () {
    sendMessage(userID, channelID, "No games are currently loaded\nTry '!zload' to see the current saved games")
  }

  // handle zork command
  if (message.substring(0, 2) === '!z') {
    // only accept messages that are outside of the timeout window
    let currTime = new Date().getTime()
    if (channelID in activeMsgTime && activeMsgTime[channelID] > currTime) {
      return
    }
    activeMsgTime[channelID] = currTime + msgTimeout
    // if it's the special bot command '!zload' then handle accordingly
    if (message.substring(2, 3) === 'l' || message.substring(2, 6) === 'load') {
      // get the saves that correspond to the specific channel
      let localSaves = {}
      if (channelID in saves) {
        localSaves = saves[channelID]
      }
      // split message by spaces
      let args = []
      if (message.substring(2, 6) === 'load') {
        args = message.toLowerCase().substring(6).split(/\s+/)
      } else {
        args = message.toLowerCase().substring(3).split(/\s+/)
      }
      // if there's no arguments then just list the saved games
      if (args.length < 2) {
        let keys = Object.keys(localSaves)
        if (keys.length === 0) {
          sendMessage(userID, channelID, "No games found\nTry '!zload New Game Name' to create a new game with the name 'New Game Name'")
        } else {
          // create a nicely formatted saved game list
          let savedList = ''
          for (let i = 0; i < keys.length; i++) {
            savedList += '\t' + (i + 1).toString() + '. ' + keys[i] + '\n'
          }
          sendMessage(userID, channelID, 'Current saved games:\n' + savedList + "\nTo load '" + keys[0] + "', try '!zload 1' or '!zload " + keys[0] + "'")
        }
      // try to load the specified saved game
      } else {
        let savedGameName = args.slice(1).join(' ')
        // if the game is specified by an index, transform it into the string name equivalent
        let index = parseInt(savedGameName)
        if (!isNaN(index) && isFinite(savedGameName)) {
          let keys = Object.keys(localSaves)
          if (keys.length < index || index <= 0) {
            sendMessage(userID, channelID, "I can't find that game, try again")
            return
          }
          savedGameName = keys[index - 1]
        }
        // load the saved game
        if (savedGameName in localSaves) {
          activeUUIDs[channelID] = localSaves[savedGameName]
        // create a new game
        } else {
          activeUUIDs[channelID] = uuidv4()
          localSaves[savedGameName] = activeUUIDs[channelID]
          saves[channelID] = localSaves
          fs.writeFile(saveFile, JSON.stringify(saves), function (err) {
            if (err) {
              return console.log(err)
            }
            logger.info('Game ' + savedGameName + ' successfully created!')
          })
        }
        // send the 'look' command for the newly loaded/created game
        sendCommand('look')
      }
      return
    // try to quit the current game
    } else if (message.substring(2, 3) === 'q' || message.substring(2, 6) === 'quit') {
      if (channelID in activeUUIDs) {
        delete activeUUIDs[channelID]
        sendMessage(userID, channelID, 'Thanks for playing!')
      // handle if no game is currently loaded
      } else {
        noneLoaded()
      }
      return
    // get the list of commands
    } else if (message.substring(2, 3) === 'h' || message.substring(2, 6) === 'help') {
      sendMessage(userID, channelID, 'Commands:\n\t!zl[oad] [saved game]\n\t!zq[uit]\n\t!zh[elp]\n\t!z [command]')
      return
    }
    // handle if no game is currently loaded
    if (!(channelID in activeUUIDs)) {
      noneLoaded()
    // send the message as a command for the current game
    } else {
      sendCommand(message.substring(2))
    }
  }
})
