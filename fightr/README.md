# Fightr - Street Fighter Style Game

A fighting game inspired by Street Fighter, featuring a player versus AI combat system, created with HTML5, CSS, and JavaScript.

## Features

- Character selection with 4 unique fighters
- AI opponent with adaptive behavior
- Best out of 3 rounds gameplay
- Health bars and round indicators
- Timer for each round
- Victory screens and match management
- Special moves and combo attacks

## How to Play

1. Open `index.html` in a modern web browser
2. Click "START GAME"
3. Select your character
4. The AI will randomly select its character
5. Click "FIGHT!" to begin the match
6. Battle until one fighter wins 2 rounds

## Controls

### Player Controls
- W: Jump
- A: Move Left
- D: Move Right
- S: Block
- G: Punch
- H: Kick
- J: Special

### AI Behavior
The AI opponent will:
- Maintain optimal fighting distance
- Block incoming attacks with good timing
- Attack when in range
- Use special moves strategically
- Adapt to your fighting style

## Characters

The game features four distinct fighters, each with their own strengths and special moves:

- **Ninja**: Fast and agile, with quick attacks
- **Samurai**: Strong and powerful, with high damage output
- **Monk**: Balanced fighter with excellent jumping ability
- **Ronin**: Well-rounded fighter with medium speed and power

## Game Rules

- Each match is best out of 3 rounds
- Each round lasts 90 seconds
- If time runs out, the fighter with more health wins the round
- If both fighters have equal health when time runs out, both get a point
- First fighter to win 2 rounds wins the match

## Technical Implementation

- HTML5 Canvas for rendering
- JavaScript for game logic and AI behavior
- CSS for UI and animations
- Object-oriented design with separate classes for characters and game management

## AI Implementation

The AI opponent uses a combination of tactics:
- Decision-making at timed intervals to simulate human reaction time
- Distance management to maintain optimal fighting position
- Defensive reactions to player attacks
- Strategic offensive moves based on player position
- Randomized behavior to be less predictable

## Future Enhancements

- Add sprite animations for all characters
- Add background music and sound effects
- Implement more special moves and combos
- Add more stages/backgrounds
- Develop multiple AI difficulty levels
- Add training mode to practice against AI

## Credits

Created by [Your Name]

Inspired by classic fighting games like Street Fighter, Mortal Kombat, and Tekken. 