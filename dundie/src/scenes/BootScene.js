import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Load loading screen assets
        this.load.image('logo', 'assets/logo.png');
    }

    create() {
        this.scene.start('PreloadScene');
    }
} 