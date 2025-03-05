# 2D Fighting Game

A simple HTML5/JavaScript based 2D fighting game inspired by classic street fighters.

## Description

This is a simple 2D fighting game with the following features:
- Two fighters in a dojo setting
- Best of 3 rounds system
- Timer-based rounds
- Health bars for each fighter
- Basic attacks (punch and kick)
- Blocking capability
- Simple AI opponent
- Background music

## How to Play

### Controls

- Move left: A
- Move right: D
- Jump: W
- Block: S
- Punch: F
- Kick: G

### Game Mechanics

- Win 2 out of 3 rounds to win the match
- Rounds can be won by:
  - Reducing your opponent's health to zero
  - Having more health than your opponent when the timer reaches zero
- Blocking prevents damage but restricts movement
- Punches do less damage but are faster
- Kicks do more damage but are slower

## Setup

Simply open the `index.html` file in a modern web browser to play the game.

## Development

This game is built with vanilla JavaScript, HTML5 Canvas, and CSS. The core files are:
- `index.html` - Main HTML structure
- `style.css` - Styling for the game UI
- `game.js` - Game logic
- `fight.mp3` - Background music

## Future Improvements

Potential improvements could include:
- More sophisticated AI behavior
- Additional attack moves
- Character selection
- More detailed graphics
- Additional stages/backgrounds
- Sound effects for attacks and hits 