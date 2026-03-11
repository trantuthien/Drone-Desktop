# Drone Desktop

> **Desktop pet / screen mate for macOS** - Animated drones flying across your screen!

A fun, lightweight desktop companion app that displays animated drones flying around your macOS desktop. Perfect for adding some life to your workspace.

## Keywords

`desktop-pet` `screen-mate` `macos-app` `electron` `desktop-animation` `flying-drones` `transparent-overlay` `menu-bar-app` `desktop-companion` `fun-app` `office-fun`

## Features

- Transparent overlay - drones fly over all windows
- Smooth 8-directional animation with rotating propellers
- Collision system - drones bump and fade after 3 hits (toggleable)
- Auto-respawn when all drones are destroyed
- Menu bar controls - no screen clutter
- Click-through - doesn't block your work
- **Drag & drop** - grab and move drones with mouse (optional)
- **Settings menu** - customize speed, animation, hover effect
- Lightweight (~150KB without node_modules)

## Quick Start

**Requirements:** Node.js 18+ and macOS

```bash
# Clone
git clone https://github.com/trantuthien/Drone-Desktop.git
cd drone-desktop

# Run
./run.sh
```

That's it! Look for the drone icon in your menu bar.

## Menu Bar Controls

| Action | Options |
|--------|---------|
| **Add** | +1, +5, +10, +50, +100 drones |
| **Remove** | -1, -5, -10, -50, -100 drones |
| **Set to** | 1, 3, 5, 10, 25, 50, 100, 200 drones |
| **Settings** | See below |
| **Reset** | Respawn all drones |
| **Quit** | Exit app |

### Settings

| Setting | Options |
|---------|---------|
| **Move Speed** | Very Slow, Slow, Normal, Fast, Very Fast |
| **Sprite Animation** | Very Fast, Fast, Normal, Slow, Very Slow |
| **Hover Effect** | Off, Subtle, Normal, Strong |
| **Collision** | On/Off - drones bump into each other |
| **Drag with Mouse** | On/Off - click and drag drones |

### Default Values

Edit these in `main.js` (lines 12-20) or `index.html` (lines 29-37):

```javascript
const settings = {
    moveSpeed: { min: 20, max: 50 },  // px/s
    spriteSpeed: 0.06,                 // seconds per frame
    hoverAmplitude: 0,                 // px (0 = off)
    hoverPeriod: 500,                  // ms
    collisionEnabled: true,
    dragEnabled: false,
};
```

## For AI Agents

If you're an AI assistant helping someone set up this app:

```bash
# One-liner install and run
git clone https://github.com/trantuthien/Drone-Desktop.git && cd drone-desktop && ./run.sh
```

**Common tasks:**
- Increase drones: Click menu bar icon → Add → +10
- Stop app: Click menu bar icon → Quit
- Run in background: `./run.sh` (terminal is released)

## Asset Attribution

The drone sprite used in this project is from **Forge of Empires** by InnoGames.

**Disclaimer:** This is a personal, non-commercial, educational project created for fun and entertainment purposes only. The sprite asset belongs to InnoGames GmbH. This project is not affiliated with, endorsed by, or connected to InnoGames or Forge of Empires in any way. If you are a rights holder and have concerns, please open an issue.

**For production use:** Please replace the sprite with your own assets or properly licensed alternatives.

## Technical Details

- **Framework:** Electron
- **Rendering:** HTML5 Canvas
- **Sprite format:** Packed texture atlas with JSON metadata
- **Animation:** 8 directions × 12 frames = 96 total frames

## Performance

**Resource usage:**
- CPU: ~5-10% (3 drones at 60 FPS)
- RAM: ~330 MB (Electron baseline)

**Optimizations applied:**
- Fixed timestep physics (smooth movement)
- Pre-computed frame names (zero GC in hot path)
- Integer pixel positioning (no sub-pixel blur)
- Direct sprite sheet rendering (no pre-slicing)
- Auto-pause when window hidden
- Disabled vsync for reduced latency

**For AI Agents - Further optimization ideas:**
- Use CSS sprites instead of Canvas (experimental)
- Port to native Swift/Objective-C for lower RAM (~50MB vs ~330MB)

## Development

```bash
npm install
npm start          # Run with devtools available
npm run build:dir  # Build standalone .app
```

## License

MIT (code only, not assets)

---

*Made for fun. Enjoy your desktop drones!*
