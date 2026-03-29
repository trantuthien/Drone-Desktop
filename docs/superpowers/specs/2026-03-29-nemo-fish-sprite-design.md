# Nemo Fish Sprite Sheet Generator

## Summary

Create a standalone HTML tool (`generate-fish-sprite.html`) that programmatically draws a Clownfish (Nemo) pixel art sprite sheet using Canvas API. The output is a drop-in replacement for the existing drone sprite (`drone5_0-a87912ea5.png`) with matching format and metadata.

## Output Artifacts

1. **PNG texture atlas** — packed sprite sheet matching the existing atlas format (~254px wide, variable height)
2. **SPRITE_DATA JavaScript object** — frame metadata in the exact format used by `index.html`:
   ```
   [name, x, y, w, h, offsetX, offsetY, logicalWidth, logicalHeight]
   ```

## Fish Design

### Appearance
- **Species**: Clownfish (Nemo)
- **Body**: Oval shape, orange (#FF6B35)
- **Markings**: 3 white (#FFFFFF) vertical stripes with thin black (#1A1A1A) outlines
- **Eyes**: Round, black pupil with white highlight
- **Fins**: Dorsal fin (top), caudal/tail fin (back), pectoral fin (side), ventral fin (bottom)
- **Fin color**: Orange with black edges

### Dimensions
- Actual sprite size: ~60×48px per frame (matching drone sprite)
- Logical frame size: 96×96px (with offset positioning)

## Animation

### 12 Frames Per Direction
- **Tail**: Sinusoidal wave motion (swing left-right), primary swimming motion
- **Fins**: Subtle oscillation synced to tail cycle
- **Body**: Slight body curve following tail direction (body wave effect)

### Frame Breakdown
- Frames 0-5: Tail swings from center → left → center
- Frames 6-11: Tail swings from center → right → center
- Continuous loop creates smooth swimming animation

## 8 Directions

| Direction | Angle | View | Generation |
|-----------|-------|------|------------|
| 0 (Up) | 90° | Top-down, head up | Rotate base |
| 1 (Up-Right) | 45° | 3/4 view | Rotate base |
| 2 (Right) | 0° | Side view, facing right | **Base sprite** |
| 3 (Down-Right) | -45° | 3/4 view | Rotate base |
| 4 (Down) | -90° | Top-down, head down | Rotate base |
| 5 (Down-Left) | -135° | Mirror of direction 3 | Flip direction 3 |
| 6 (Left) | 180° | Side view, facing left | Flip direction 2 |
| 7 (Up-Left) | 135° | Mirror of direction 1 | Flip direction 1 |

Directions 5, 6, 7 are horizontal flips of directions 3, 2, 1 respectively. Only 5 unique directions need to be drawn.

## Frame Naming Convention

```
fish_nemo_{direction}-{frameNumber:02d}
```
Example: `fish_nemo_2-05` (direction 2, frame 5)

## Texture Atlas Packing

- Frames packed into atlas similar to existing drone sprite
- Atlas width: ~254px (matching existing)
- 1px padding between frames to prevent bleeding
- Frames arranged to minimize total atlas height

## Integration

### Drop-in Replacement
1. Replace `drone5_0-a87912ea5.png` with generated `fish_nemo.png`
2. Replace `SPRITE_DATA` object in `index.html` with generated metadata
3. Update `FRAME_NAMES` prefix from `drone5_` to `fish_nemo_`
4. No other code changes required — animation, physics, collision all work as-is

### Code Changes in index.html
- Line ~52-59: Update `FRAME_NAMES` array prefix
- Line ~62: Replace `SPRITE_DATA` object
- Line ~413: Update image filename

## Generator Tool (generate-fish-sprite.html)

### Features
- Opens in any browser
- Canvas-based pixel art rendering
- Preview of all 8 directions with animation playback
- "Download PNG" button → saves atlas
- "Copy SPRITE_DATA" button → copies JS object to clipboard
- Live preview of individual frames

### Technical Approach
1. Define fish shape as pixel data array (base sprite facing right)
2. For each of 12 animation frames: apply tail/fin transforms
3. For each of 8 directions: rotate/flip the animated frame
4. Pack all 96 frames into texture atlas
5. Generate SPRITE_DATA metadata with coordinates
