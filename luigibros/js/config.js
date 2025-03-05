const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 480,
    parent: 'game-container',
    backgroundColor: '#87CEEB',
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: false
        }
    },
    scene: [
        BootScene,
        PreloadScene,
        TitleScene,
        GameScene
    ]
}; 