import Phaser from 'phaser';

export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }

    preload() {
        // Display loading progress
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Loading text
        const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
            font: '20px monospace',
            fill: '#ffffff'
        });
        loadingText.setOrigin(0.5, 0.5);
        
        // Progress bar
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);
        
        // Loading progress events
        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
        });
        
        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
        });

        // Load game assets
        
        // Tilemaps and tilesets
        this.load.image('office_tiles', 'assets/tiles/office_tiles.png');
        this.load.tilemapTiledJSON('office_map', 'assets/tiles/office_map.json');
        
        // Character sprites
        this.load.spritesheet('dwight', 'assets/sprites/dwight.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('jim', 'assets/sprites/jim.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('pam', 'assets/sprites/pam.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('michael', 'assets/sprites/michael.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('angela', 'assets/sprites/angela.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('stanley', 'assets/sprites/stanley.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('kevin', 'assets/sprites/kevin.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('oscar', 'assets/sprites/oscar.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('phyllis', 'assets/sprites/phyllis.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('meredith', 'assets/sprites/meredith.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('creed', 'assets/sprites/creed.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('ryan', 'assets/sprites/ryan.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('kelly', 'assets/sprites/kelly.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('toby', 'assets/sprites/toby.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('darryl', 'assets/sprites/darryl.png', { frameWidth: 32, frameHeight: 32 });
        
        // UI elements
        this.load.image('dialog_box', 'assets/ui/dialog_box.png');
        this.load.image('dundie_logo', 'assets/ui/dundie_logo.png');
    }

    create() {
        // Create character animations
        this.createAnimations();
        
        // Start the main game scene
        this.scene.start('OfficeScene');
    }
    
    createAnimations() {
        // Create animations for each character
        const characters = [
            'dwight', 'jim', 'pam', 'michael', 'angela', 'stanley', 
            'kevin', 'oscar', 'phyllis', 'meredith', 'creed', 'ryan', 
            'kelly', 'toby', 'darryl'
        ];
        
        characters.forEach(character => {
            // Walking animations for each direction
            this.anims.create({
                key: `${character}_walk_down`,
                frames: this.anims.generateFrameNumbers(character, { start: 0, end: 3 }),
                frameRate: 10,
                repeat: -1
            });
            
            this.anims.create({
                key: `${character}_walk_left`,
                frames: this.anims.generateFrameNumbers(character, { start: 4, end: 7 }),
                frameRate: 10,
                repeat: -1
            });
            
            this.anims.create({
                key: `${character}_walk_right`,
                frames: this.anims.generateFrameNumbers(character, { start: 8, end: 11 }),
                frameRate: 10,
                repeat: -1
            });
            
            this.anims.create({
                key: `${character}_walk_up`,
                frames: this.anims.generateFrameNumbers(character, { start: 12, end: 15 }),
                frameRate: 10,
                repeat: -1
            });
            
            // Idle animations
            this.anims.create({
                key: `${character}_idle_down`,
                frames: [{ key: character, frame: 0 }],
                frameRate: 10
            });
            
            this.anims.create({
                key: `${character}_idle_left`,
                frames: [{ key: character, frame: 4 }],
                frameRate: 10
            });
            
            this.anims.create({
                key: `${character}_idle_right`,
                frames: [{ key: character, frame: 8 }],
                frameRate: 10
            });
            
            this.anims.create({
                key: `${character}_idle_up`,
                frames: [{ key: character, frame: 12 }],
                frameRate: 10
            });
        });
    }
} 