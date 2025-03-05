# Simple Character Sprite Generator for "Dundie"
# This script creates very basic character sprites for the game

import numpy as np
from PIL import Image, ImageDraw

def create_character_sprite(name, color_scheme, output_path):
    """
    Create a simple character sprite with walking animations.
    
    Args:
        name: Character name
        color_scheme: Dict with colors for shirt, pants, skin, hair
        output_path: Path to save the sprite
    """
    # Create a 128x128 pixel image (4x4 frames of 32x32 pixels each)
    img = Image.new('RGBA', (128, 128), color=(0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Define animation frames
    # 0-3: Walk down
    # 4-7: Walk left
    # 8-11: Walk right
    # 12-15: Walk up
    
    for frame in range(16):
        col = frame % 4
        row = frame // 4
        
        # Base position for this frame
        x = col * 32
        y = row * 32
        
        # Animation offset for legs
        leg_offset = (frame % 4) % 2 * 2 - 1 if frame % 4 > 0 else 0
        
        # Draw different poses based on direction
        if row == 0:  # Down
            # Body
            draw.rectangle([x+10, y+8, x+22, y+20], fill=color_scheme['shirt'])
            # Head
            draw.ellipse([x+10, y+2, x+22, y+14], fill=color_scheme['skin'])
            # Hair
            draw.rectangle([x+10, y+2, x+22, y+8], fill=color_scheme['hair'])
            # Legs
            draw.rectangle([x+10, y+20, x+15, y+30], fill=color_scheme['pants'])
            draw.rectangle([x+17, y+20, x+22, y+30], fill=color_scheme['pants'])
        
        elif row == 1:  # Left
            # Body
            draw.rectangle([x+10, y+8, x+22, y+20], fill=color_scheme['shirt'])
            # Head
            draw.ellipse([x+10, y+2, x+22, y+14], fill=color_scheme['skin'])
            # Hair
            draw.rectangle([x+10, y+2, x+22, y+8], fill=color_scheme['hair'])
            # Legs
            draw.rectangle([x+10+leg_offset, y+20, x+15+leg_offset, y+30], fill=color_scheme['pants'])
            draw.rectangle([x+17-leg_offset, y+20, x+22-leg_offset, y+30], fill=color_scheme['pants'])
        
        elif row == 2:  # Right
            # Body
            draw.rectangle([x+10, y+8, x+22, y+20], fill=color_scheme['shirt'])
            # Head
            draw.ellipse([x+10, y+2, x+22, y+14], fill=color_scheme['skin'])
            # Hair
            draw.rectangle([x+10, y+2, x+22, y+8], fill=color_scheme['hair'])
            # Legs
            draw.rectangle([x+10+leg_offset, y+20, x+15+leg_offset, y+30], fill=color_scheme['pants'])
            draw.rectangle([x+17-leg_offset, y+20, x+22-leg_offset, y+30], fill=color_scheme['pants'])
        
        elif row == 3:  # Up
            # Body
            draw.rectangle([x+10, y+8, x+22, y+20], fill=color_scheme['shirt'])
            # Head
            draw.ellipse([x+10, y+2, x+22, y+14], fill=color_scheme['skin'])
            # Hair (from behind)
            draw.rectangle([x+10, y+2, x+22, y+8], fill=color_scheme['hair'])
            # Legs
            draw.rectangle([x+10, y+20, x+15, y+30], fill=color_scheme['pants'])
            draw.rectangle([x+17, y+20, x+22, y+30], fill=color_scheme['pants'])
    
    # Save the image
    img.save(output_path)
    print(f'Character sprite created: {output_path}')

# Define character color schemes
characters = {
    'dwight': {
        'shirt': (255, 255, 220),  # Light yellow for shirt
        'pants': (77, 77, 77),     # Dark gray for pants
        'skin': (255, 213, 170),   # Skin tone
        'hair': (139, 69, 19)      # Brown hair
    },
    'jim': {
        'shirt': (173, 216, 230),  # Light blue shirt
        'pants': (50, 50, 50),     # Black pants
        'skin': (255, 213, 170),   # Skin tone
        'hair': (101, 67, 33)      # Dark brown hair
    },
    'pam': {
        'shirt': (255, 182, 193),  # Light pink blouse
        'pants': (169, 169, 169),  # Light gray skirt
        'skin': (255, 213, 170),   # Skin tone
        'hair': (205, 133, 63)     # Auburn hair
    },
    'michael': {
        'shirt': (230, 230, 250),  # Lavender shirt
        'pants': (47, 79, 79),     # Dark slate gray suit
        'skin': (255, 213, 170),   # Skin tone
        'hair': (0, 0, 0)          # Black hair
    },
    'angela': {
        'shirt': (240, 248, 255),  # Alice blue blouse
        'pants': (50, 50, 50),     # Black skirt
        'skin': (255, 213, 170),   # Skin tone
        'hair': (255, 215, 0)      # Blonde hair
    },
    'stanley': {
        'shirt': (245, 245, 220),  # Beige shirt
        'pants': (47, 79, 79),     # Dark slate gray pants
        'skin': (101, 67, 33),     # Dark brown skin
        'hair': (50, 50, 50)       # Dark hair/balding
    },
    'kevin': {
        'shirt': (220, 20, 60),    # Crimson shirt
        'pants': (50, 50, 50),     # Black pants
        'skin': (255, 213, 170),   # Skin tone
        'hair': (101, 67, 33)      # Brown hair
    },
    'oscar': {
        'shirt': (143, 188, 143),  # Dark sea green shirt
        'pants': (50, 50, 50),     # Black pants
        'skin': (210, 180, 140),   # Tan skin
        'hair': (0, 0, 0)          # Black hair
    },
    'phyllis': {
        'shirt': (216, 191, 216),  # Thistle blouse
        'pants': (64, 130, 109),   # Russian green skirt
        'skin': (255, 213, 170),   # Skin tone
        'hair': (211, 211, 211)    # Light gray hair
    },
    'meredith': {
        'shirt': (50, 205, 50),    # Lime green shirt
        'pants': (178, 34, 34),    # Firebrick pants
        'skin': (255, 213, 170),   # Skin tone
        'hair': (255, 127, 80)     # Coral red hair
    },
    'creed': {
        'shirt': (112, 128, 144),  # Slate gray shirt
        'pants': (50, 50, 50),     # Black pants
        'skin': (255, 213, 170),   # Skin tone
        'hair': (192, 192, 192)    # Silver hair
    },
    'ryan': {
        'shirt': (30, 144, 255),   # Dodger blue shirt
        'pants': (50, 50, 50),     # Black pants
        'skin': (255, 213, 170),   # Skin tone
        'hair': (0, 0, 0)          # Black hair
    },
    'kelly': {
        'shirt': (255, 105, 180),  # Hot pink shirt
        'pants': (123, 104, 238),  # Medium slate blue skirt
        'skin': (210, 180, 140),   # Tan skin
        'hair': (0, 0, 0)          # Black hair
    },
    'toby': {
        'shirt': (184, 134, 11),   # Dark goldenrod shirt
        'pants': (50, 50, 50),     # Black pants
        'skin': (255, 213, 170),   # Skin tone 
        'hair': (205, 133, 63)     # Light brown hair
    },
    'darryl': {
        'shirt': (70, 130, 180),   # Steel blue shirt
        'pants': (50, 50, 50),     # Black pants
        'skin': (139, 69, 19),     # Saddle brown skin
        'hair': (50, 50, 50)       # Black hair
    }
}

# Generate sprites for each character
try:
    for character, colors in characters.items():
        create_character_sprite(
            character, 
            colors, 
            f'assets/sprites/{character}.png'
        )
except Exception as e:
    print(f"Error generating sprites: {e}")

# Create a simple logo
try:
    logo = Image.new('RGBA', (200, 100), color=(0, 0, 0, 0))
    logo_draw = ImageDraw.Draw(logo)
    
    # Draw a background rectangle
    logo_draw.rectangle([0, 0, 200, 100], fill=(50, 50, 50, 200))
    
    # Add text (simulated)
    logo_draw.rectangle([20, 20, 180, 80], fill=(139, 69, 19, 255))
    logo_draw.rectangle([30, 30, 170, 70], fill=(255, 215, 0, 255))
    
    # Save the logo
    logo.save('assets/logo.png')
    logo.save('assets/ui/dundie_logo.png')
    print('Logo created')
    
    # Create a dialog box
    dialog = Image.new('RGBA', (300, 100), color=(0, 0, 0, 0))
    dialog_draw = ImageDraw.Draw(dialog)
    
    # Background with border
    dialog_draw.rectangle([0, 0, 300, 100], fill=(50, 50, 50, 200))
    dialog_draw.rectangle([2, 2, 298, 98], outline=(255, 255, 255, 255))
    
    # Save the dialog box
    dialog.save('assets/ui/dialog_box.png')
    print('Dialog box created')
    
    # Create a screenshot placeholder
    screenshot = Image.new('RGB', (800, 600), color=(30, 30, 30))
    screenshot_draw = ImageDraw.Draw(screenshot)
    
    # Draw some placeholder content
    screenshot_draw.rectangle([50, 50, 750, 550], fill=(60, 60, 60))
    screenshot_draw.rectangle([300, 200, 500, 400], fill=(100, 100, 100))
    
    # Save the screenshot
    screenshot.save('assets/screenshots/game_screenshot.png')
    print('Screenshot placeholder created')
    
except Exception as e:
    print(f"Error creating UI elements: {e}") 