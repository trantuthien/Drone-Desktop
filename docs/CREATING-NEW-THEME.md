# Creating a New Character Theme

This guide explains how to add a new sprite character to Drone Desktop.

## Overview

Each theme needs:
1. A **sprite sheet PNG** — texture atlas with 96 frames (8 directions x 12 animation frames)
2. A **SPRITE_DATA** object — frame coordinates metadata
3. A **theme entry** in `index.html` `THEMES` object
4. A **menu entry** in `main.js` tray menu

## Step 1: Create the Sprite Generator

Copy `generate-fish-sprite.html` and modify the drawing function.

### Key configuration (top of file)
```js
const FRAME_W = 60;    // Actual sprite width (pixels)
const FRAME_H = 48;    // Actual sprite height (pixels)
const LOGICAL_W = 96;  // Logical frame size (must be 96)
const LOGICAL_H = 96;  // Logical frame size (must be 96)
const ANIM_FRAMES = 12;
const DIRECTIONS = 8;
const ATLAS_W = 254;   // Atlas width (keep 254 to match existing)
const PADDING = 1;
```

### Drawing function
Replace `drawClownfishRight(ctx, tailAngle, finOffset)` with your character's drawing code.

Parameters:
- `ctx` — Canvas 2D context (60x48 area)
- `tailAngle` — Animation parameter, cycles as `sin(t) * 0.35` over 12 frames
- `finOffset` — Secondary animation parameter, `sin(t + 0.5) * 1.5`

Use Canvas 2D API for smooth results:
- `ctx.ellipse()`, `ctx.arc()` for body shapes
- `ctx.quadraticCurveTo()`, `ctx.bezierCurveTo()` for fins/tails
- `ctx.createRadialGradient()` for shading
- Avoid pixel-by-pixel drawing (looks rough when rotated)

### Direction generation
The generator creates 8 directions by rotating/flipping the base "facing right" sprite:
- Directions 0-4: rotate by clamped angles (max ~25 degrees for fish-like characters)
- Directions 5-7: horizontal flip of directions 3, 2, 1

Adjust `MAX_TILT` and `DIAG_TILT` for your character:
```js
const MAX_TILT = Math.PI / 7;   // ~25° for up/down (fish-like)
const DIAG_TILT = Math.PI / 12; // ~15° for diagonals
// For characters that look good fully rotated (like drones), use:
// const angles = [-Math.PI/2, -Math.PI/4, 0, Math.PI/4, Math.PI/2];
```

### Frame naming convention
```
{prefix}{direction}-{frame:02d}
```
Example: `fish_blue_2-05` = direction 2, frame 5

Change the prefix in `generateAllFrames()`:
```js
const name = 'fish_blue_' + dir + '-' + String(f).padStart(2, '0');
```

## Step 2: Generate the Sprite Sheet

1. Start a local HTTP server: `python3 -m http.server 8765`
2. Open `http://localhost:8765/generate-yourfish-sprite.html` in browser
3. Click **Generate**
4. Click **Download PNG** → save as `yourfish.png` in project root
5. Click **Copy SPRITE_DATA** → save for Step 3

## Step 3: Add Theme to index.html

Add entry to the `THEMES` object in `index.html`:

```js
const THEMES = {
    // ... existing themes ...
    your_theme_id: {
        label: 'Display Name',           // Shown in tray menu
        file: 'yourfish.png',            // PNG filename
        prefix: 'fish_blue_',            // Frame name prefix (must match generator)
        sectorToDir: [2,3,4,5,6,7,0,1], // Direction mapping (see below)
        bubbles: true,                   // Enable bubble effect
        verticalRatio: 0.15,             // Limit vertical movement (null = free movement)
        spriteData: { ... }              // Paste from generator
    }
};
```

### Theme properties

| Property | Type | Description |
|----------|------|-------------|
| `label` | string | Display name in tray menu |
| `file` | string | Sprite sheet PNG filename |
| `prefix` | string | Frame name prefix (e.g. `fish_blue_`) |
| `sectorToDir` | number[8] | Maps movement angle sectors to sprite directions |
| `bubbles` | boolean | Show bubble particles |
| `verticalRatio` | number/null | Max vy/vx ratio. `0.15` = mostly horizontal. `null` = free movement |
| `spriteData` | object | Frame coordinates from generator |

### sectorToDir explained

Maps the 8 movement angle sectors (0=right, 1=down-right, ... 7=up-right) to sprite direction indices.

- **Fish-style** (dir 2 = facing right): `[2, 3, 4, 5, 6, 7, 0, 1]`
- **Drone-style** (dir 6 = facing right): `[6, 7, 0, 1, 2, 3, 4, 5]`

If your character faces right in direction 2, use the fish-style mapping.

## Step 4: Add to Tray Menu

In `main.js`, add to the Theme submenu:

```js
{
    label: 'Theme',
    submenu: [
        // ... existing themes ...
        { label: 'Your Fish', type: 'checkbox',
          checked: settings.theme === 'your_theme_id',
          click: () => setTheme('your_theme_id') },
    ]
}
```

## Checklist

- [ ] Create generator HTML (copy from `generate-fish-sprite.html`)
- [ ] Modify `drawClownfishRight()` for your character
- [ ] Update frame name prefix in `generateAllFrames()`
- [ ] Generate PNG + SPRITE_DATA
- [ ] Add theme entry to `THEMES` in `index.html`
- [ ] Add menu item in `main.js`
- [ ] Test: `npm start` → switch theme from tray menu
