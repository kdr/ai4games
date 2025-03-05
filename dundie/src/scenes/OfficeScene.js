import Phaser from 'phaser';
import Player from '../objects/Player';
import NPC from '../objects/NPC';
import DialogBox from '../objects/DialogBox';

export default class OfficeScene extends Phaser.Scene {
    constructor() {
        super('OfficeScene');
    }
    
    create() {
        // Set up the office map
        this.createMap();
        
        // Create characters
        this.createCharacters();
        
        // Set up camera
        this.cameras.main.startFollow(this.player, true);
        this.cameras.main.setZoom(2);
        
        // Create dialog box
        this.dialogBox = new DialogBox(this);
        
        // Interaction handler
        this.input.keyboard.on('keydown-E', this.handleInteraction, this);
        this.input.keyboard.on('keydown-SPACE', this.handleDialogContinue, this);
        
        // Add collisions
        this.physics.add.collider(this.player, this.wallsLayer);
        this.physics.add.collider(this.player, this.furnitureLayer);
        this.physics.add.collider(this.player, this.npcs);
        
        // Add NPC collisions with environment
        this.physics.add.collider(this.npcs, this.wallsLayer);
        this.physics.add.collider(this.npcs, this.furnitureLayer);
        this.physics.add.collider(this.npcs, this.npcs);
    }
    
    update() {
        // Update player
        if (this.player && !this.dialogBox.isVisible()) {
            this.player.update();
        }
        
        // Update NPCs
        this.npcs.getChildren().forEach(npc => {
            npc.update();
        });
    }
    
    createMap() {
        // Create the tilemap
        this.map = this.make.tilemap({ key: 'office_map' });
        
        // Add the tileset
        const tileset = this.map.addTilesetImage('office_tiles', 'office_tiles');
        
        // Create layers
        this.floorLayer = this.map.createLayer('Floor', tileset);
        this.wallsLayer = this.map.createLayer('Walls', tileset);
        this.furnitureLayer = this.map.createLayer('Furniture', tileset);
        this.decorationsLayer = this.map.createLayer('Decorations', tileset);
        
        // Set collisions
        this.wallsLayer.setCollisionByProperty({ collides: true });
        this.furnitureLayer.setCollisionByProperty({ collides: true });
        
        // Set world bounds
        this.physics.world.bounds.width = this.map.widthInPixels;
        this.physics.world.bounds.height = this.map.heightInPixels;
    }
    
    createCharacters() {
        // NPC group
        this.npcs = this.physics.add.group();
        
        // Create player (Dwight)
        const playerSpawn = this.getSpawnPoint('player_spawn');
        this.player = new Player(this, playerSpawn.x, playerSpawn.y, 'dwight');
        
        // Create NPCs based on the floor plan
        this.createNPC('michael', 'Michael Scott', [
            "That's what she said!",
            "I'm not superstitious, but I am a little stitious.",
            "Would I rather be feared or loved? Easy. Both. I want people to be afraid of how much they love me."
        ]);
        
        this.createNPC('jim', 'Jim Halpert', [
            "Bears. Beets. Battlestar Galactica.",
            "Fact: I am not Dwight.",
            "I've been looking forward to lunch since I woke up this morning."
        ]);
        
        this.createNPC('pam', 'Pam Beesly', [
            "I'm sorry, what were you saying? I was distracted by the sound of Jim's voice.",
            "Dunder Mifflin, this is Pam.",
            "I'm full-on corrupt."
        ]);
        
        this.createNPC('angela', 'Angela Martin', [
            "I don't have a headache. I'm just preparing.",
            "I find the mystery genre disgusting.",
            "I'm not gaining anything from this conversation."
        ]);
        
        this.createNPC('stanley', 'Stanley Hudson', [
            "Did I stutter?",
            "It's called hentai, and it's art.",
            "Boy, have you lost your mind? 'Cause I'll help you find it!"
        ]);
        
        this.createNPC('kevin', 'Kevin Malone', [
            "Why waste time say lot word when few word do trick?",
            "I just want to lie on the beach and eat hot dogs.",
            "The only problem is whenever I try to make a taco, I get too excited and crush it."
        ]);
        
        this.createNPC('oscar', 'Oscar Martinez', [
            "Actually...",
            "I consider myself a rational person, but I'm terrified of snakes.",
            "I'm too busy conducting this interview to answer your question."
        ]);
        
        this.createNPC('phyllis', 'Phyllis Vance', [
            "I wonder what people like about me. Probably my jugs.",
            "Close your mouth, sweetie. You look like a trout.",
            "You have a lot to learn about this town, sweetie."
        ]);
        
        this.createNPC('meredith', 'Meredith Palmer', [
            "It's like casual Friday on a Monday.",
            "I've slept with so many guys at this point, I've started having sex dreams about girls.",
            "Hey, I have never cheated on, been cheated on, or been used to cheat with."
        ]);
        
        this.createNPC('creed', 'Creed Bratton', [
            "I've been involved in a number of cults, both as a leader and a follower. You have more fun as a follower, but you make more money as a leader.",
            "If I can't scuba, then what's this all been about?",
            "Nobody steals from Creed Bratton and gets away with it. The last person to do this disappeared. His name? Creed Bratton."
        ]);
        
        this.createNPC('ryan', 'Ryan Howard', [
            "I'm not saying I had a meteoric rise, but I did.",
            "I'd rather she be alone than with somebody. Is that love?",
            "I miss the days when there was only one party I didn't want to go to."
        ]);
        
        this.createNPC('kelly', 'Kelly Kapoor', [
            "I talk a lot, so I've learned to tune myself out.",
            "I don't talk trash, I talk smack. They're totally different.",
            "I have a lot of questions. Number one: how dare you?"
        ]);
        
        this.createNPC('toby', 'Toby Flenderson', [
            "Why you gotta be so mean to me?",
            "I tried to talk to Toby and be his friend, but that is like trying to be friends with an evil snail.",
            "Every day, I shoot Toby twice."
        ]);
        
        this.createNPC('darryl', 'Darryl Philbin', [
            "I taught Mike some phrases to help with his interracial conversations. 'Bippity boppity, give me the zoppity.'",
            "Dinkin' flicka.",
            "You can't be scared of everything."
        ]);
    }
    
    createNPC(texture, name, dialogues) {
        const spawnPoint = this.getSpawnPoint(texture + '_spawn');
        if (spawnPoint) {
            const npc = new NPC(this, spawnPoint.x, spawnPoint.y, texture, name, dialogues);
            this.npcs.add(npc);
        }
    }
    
    getSpawnPoint(name) {
        // Get the spawn point from the map
        const spawn = this.map.findObject('SpawnPoints', obj => obj.name === name);
        
        // If spawn point not found in the map, use default positions based on the floor plan
        if (!spawn) {
            const defaultSpawns = {
                player_spawn: { x: 400, y: 300 },
                michael_spawn: { x: 425, y: 85 },
                jim_spawn: { x: 465, y: 305 },
                pam_spawn: { x: 425, y: 407 },
                angela_spawn: { x: 300, y: 478 },
                stanley_spawn: { x: 643, y: 407 },
                kevin_spawn: { x: 308, y: 523 },
                oscar_spawn: { x: 410, y: 456 },
                phyllis_spawn: { x: 584, y: 407 },
                meredith_spawn: { x: 480, y: 574 },
                creed_spawn: { x: 594, y: 502 },
                ryan_spawn: { x: 960, y: 455 },
                kelly_spawn: { x: 1402, y: 570 },
                toby_spawn: { x: 1410, y: 425 },
                darryl_spawn: { x: 730, y: 502 }
            };
            
            return defaultSpawns[name] || { x: 400, y: 300 };
        }
        
        return spawn;
    }
    
    handleInteraction() {
        // Don't allow interaction if dialog is showing
        if (this.dialogBox.isVisible()) {
            return this.handleDialogContinue();
        }
        
        // Get interaction point
        const interactionPoint = this.player.getInteractionPoint();
        
        // Check if any NPC is at the interaction point
        const npc = this.npcs.getChildren().find(npc => {
            const distance = Phaser.Math.Distance.Between(
                npc.x, npc.y,
                interactionPoint.x, interactionPoint.y
            );
            return distance < 40; // Interaction radius
        });
        
        // If found an NPC to interact with
        if (npc) {
            // Make NPC face the player
            npc.faceObject(this.player);
            
            // Start interaction
            this.player.startInteraction();
            npc.startInteraction();
            
            // Show dialog
            const dialog = npc.interact();
            this.dialogBox.show(npc.name, dialog);
        }
    }
    
    handleDialogContinue() {
        // If dialog is visible
        if (this.dialogBox.isVisible()) {
            // If still typing, skip to the end
            if (this.dialogBox.isTyping()) {
                this.dialogBox.skipTyping();
            } else {
                // Hide dialog
                this.dialogBox.hide();
                
                // End interactions
                this.player.stopInteraction();
                this.npcs.getChildren().forEach(npc => {
                    npc.stopInteraction();
                });
            }
            
            return true;
        }
        
        return false;
    }
} 