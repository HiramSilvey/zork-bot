## zork-bot

Play Zork through a bot on Discord!

### Rules

1. All commands must be preceded by '!z'
1. Only one game of Zork can be loaded at a time on a server
1. Users become 'inactive' after not sending a command for 1 hour
1. Users can vote to change the current loaded game (2/3 majority of active players needed)

### Commands
!zload [savedGameName]: lists all saved games, loads the selected saved game, or starts a vote to change the current loaded game to the selected saved game
!z [zork command]: sends 'zork command' to the loaded zork game and returns the game's response text