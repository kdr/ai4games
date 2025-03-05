# Simple Tileset Generator for "Dundie"
# This script creates a very basic tileset with colored rectangles

import numpy as np
from PIL import Image, ImageDraw

# Create a 320x320 pixel image (10x10 tiles of 32x32 pixels each)
img = Image.new('RGBA', (320, 320), color=(0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# Define some basic colors
floor_color = (200, 200, 200, 255)        # Light gray for floor
wall_color = (100, 100, 100, 255)         # Dark gray for walls
desk_color = (139, 69, 19, 255)           # Brown for desks
chair_color = (0, 0, 139, 255)            # Dark blue for chairs
computer_color = (50, 50, 50, 255)        # Almost black for computers
plant_color = (0, 100, 0, 255)            # Dark green for plants
door_color = (160, 82, 45, 255)           # Sienna for doors
window_color = (173, 216, 230, 255)       # Light blue for windows
carpet_color = (47, 79, 79, 255)          # Dark slate gray for carpet
table_color = (160, 82, 45, 255)          # Sienna for tables

# Create tiles (32x32 pixels each)
for y in range(10):
    for x in range(10):
        # Define the tile rectangle
        left = x * 32
        top = y * 32
        right = left + 32
        bottom = top + 32
        
        tile_index = y * 10 + x
        
        # Floor tile (0)
        if tile_index == 0:
            draw.rectangle([left, top, right, bottom], fill=floor_color)
        
        # Wall tile (1)
        elif tile_index == 1:
            draw.rectangle([left, top, right, bottom], fill=wall_color)
        
        # Desk tile (2)
        elif tile_index == 2:
            draw.rectangle([left, top, right, bottom], fill=desk_color)
        
        # Chair tile (3)
        elif tile_index == 3:
            # Base
            draw.rectangle([left, top, right, bottom], fill=floor_color)
            # Chair
            draw.rectangle([left+8, top+8, right-8, bottom-8], fill=chair_color)
        
        # Computer tile (4)
        elif tile_index == 4:
            # Base (desk)
            draw.rectangle([left, top, right, bottom], fill=desk_color)
            # Monitor
            draw.rectangle([left+8, top+5, right-8, bottom-15], fill=computer_color)
            # Screen
            draw.rectangle([left+10, top+7, right-10, bottom-17], fill=(173, 216, 230, 255))
        
        # Plant tile (5)
        elif tile_index == 5:
            # Base
            draw.rectangle([left, top, right, bottom], fill=floor_color)
            # Pot
            draw.rectangle([left+10, top+20, right-10, bottom-2], fill=(139, 69, 19, 255))
            # Plant
            draw.ellipse([left+8, top+5, right-8, bottom-12], fill=plant_color)
        
        # Door tile (6)
        elif tile_index == 6:
            # Wall base
            draw.rectangle([left, top, right, bottom], fill=wall_color)
            # Door
            draw.rectangle([left+2, top+2, right-2, bottom-2], fill=door_color)
            # Doorknob
            draw.ellipse([left+5, top+16, left+8, top+19], fill=(255, 215, 0, 255))
        
        # Window tile (7)
        elif tile_index == 7:
            # Wall base
            draw.rectangle([left, top, right, bottom], fill=wall_color)
            # Window
            draw.rectangle([left+3, top+5, right-3, bottom-5], fill=window_color)
            # Window frame
            draw.line([left+3, top+16, right-3, top+16], fill=wall_color, width=1)
            draw.line([left+16, top+5, left+16, bottom-5], fill=wall_color, width=1)
        
        # Carpet tile (8)
        elif tile_index == 8:
            draw.rectangle([left, top, right, bottom], fill=carpet_color)
        
        # Table tile (9)
        elif tile_index == 9:
            # Base
            draw.rectangle([left, top, right, bottom], fill=floor_color)
            # Table
            draw.rectangle([left+4, top+4, right-4, bottom-4], fill=table_color)

# Save the image
img.save('assets/tiles/office_tiles.png')
print('Tileset created: assets/tiles/office_tiles.png') 