import Phaser from 'phaser';

export default class DialogBox {
    constructor(scene, opts) {
        this.scene = scene;
        
        // Configure options
        const defaults = {
            x: 50,
            y: scene.cameras.main.height - 150,
            width: scene.cameras.main.width - 100,
            height: 130,
            padding: 10,
            background: 0x000000,
            alpha: 0.8,
            borderColor: 0xffffff,
            borderThickness: 2,
            closeBtnColor: 0xff0000,
            textColor: '#ffffff',
            nameColor: '#ffff00',
            speed: 3
        };
        
        this.opts = Object.assign(defaults, opts);
        
        // Dialog state
        this.visible = false;
        this.text = '';
        this.displayedText = '';
        this.name = '';
        this.typing = false;
        this.typewriterProgress = 0;
        
        // Create graphics for dialog box
        this.graphics = scene.add.graphics();
        
        // Create text objects
        this.nameText = scene.add.text(
            this.opts.x + this.opts.padding,
            this.opts.y + this.opts.padding,
            '',
            { 
                fontFamily: 'monospace',
                fontSize: '18px',
                color: this.opts.nameColor,
                wordWrap: { width: this.opts.width - (this.opts.padding * 2) }
            }
        );
        
        this.contentText = scene.add.text(
            this.opts.x + this.opts.padding,
            this.opts.y + 30 + this.opts.padding,
            '',
            { 
                fontFamily: 'monospace',
                fontSize: '16px', 
                color: this.opts.textColor,
                wordWrap: { width: this.opts.width - (this.opts.padding * 2) }
            }
        );
        
        // Create continue indicator
        this.continueText = scene.add.text(
            this.opts.x + this.opts.width - this.opts.padding - 20,
            this.opts.y + this.opts.height - this.opts.padding - 20,
            '▼',
            { 
                fontFamily: 'monospace',
                fontSize: '16px', 
                color: this.opts.textColor
            }
        );
        
        // Hide elements initially
        this.hide();
        
        // Add to scene update list
        this.scene.events.on('update', this.update, this);
    }
    
    update() {
        if (!this.visible) return;
        
        // Typewriter effect
        if (this.typing && this.displayedText.length < this.text.length) {
            this.typewriterProgress += this.opts.speed;
            
            if (this.typewriterProgress >= 1) {
                const charactersToAdd = Math.floor(this.typewriterProgress);
                this.displayedText += this.text.slice(this.displayedText.length, this.displayedText.length + charactersToAdd);
                this.contentText.setText(this.displayedText);
                this.typewriterProgress -= charactersToAdd;
            }
            
            // Hide continue indicator while typing
            this.continueText.setVisible(false);
        } else if (this.typing) {
            // Typing complete
            this.typing = false;
            // Show continue indicator
            this.continueText.setVisible(true);
        }
    }
    
    show(name, text) {
        this.visible = true;
        this.name = name;
        this.text = text;
        this.displayedText = '';
        this.typing = true;
        this.typewriterProgress = 0;
        
        // Update text
        this.nameText.setText(this.name);
        this.contentText.setText('');
        
        // Draw the dialog box
        this.graphics.clear();
        
        // Background
        this.graphics.fillStyle(this.opts.background, this.opts.alpha);
        this.graphics.fillRect(this.opts.x, this.opts.y, this.opts.width, this.opts.height);
        
        // Border
        this.graphics.lineStyle(this.opts.borderThickness, this.opts.borderColor, 1);
        this.graphics.strokeRect(this.opts.x, this.opts.y, this.opts.width, this.opts.height);
        
        // Make all elements visible
        this.graphics.setVisible(true);
        this.nameText.setVisible(true);
        this.contentText.setVisible(true);
        // Continue indicator starts hidden
        this.continueText.setVisible(false);
    }
    
    hide() {
        this.visible = false;
        this.graphics.setVisible(false);
        this.nameText.setVisible(false);
        this.contentText.setVisible(false);
        this.continueText.setVisible(false);
    }
    
    skipTyping() {
        if (this.typing) {
            // Show all text immediately
            this.displayedText = this.text;
            this.contentText.setText(this.displayedText);
            this.typing = false;
            this.continueText.setVisible(true);
            return true;
        }
        return false;
    }
    
    isVisible() {
        return this.visible;
    }
    
    isTyping() {
        return this.typing;
    }
    
    destroy() {
        this.scene.events.off('update', this.update, this);
        this.graphics.destroy();
        this.nameText.destroy();
        this.contentText.destroy();
        this.continueText.destroy();
    }
} 