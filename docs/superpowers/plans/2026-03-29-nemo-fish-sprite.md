# Nemo Fish Sprite Sheet Generator — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a standalone HTML tool that programmatically generates a Clownfish (Nemo) pixel art sprite sheet as a drop-in replacement for the existing drone sprite.

**Architecture:** Single self-contained HTML file with embedded JavaScript. Uses Canvas API to draw pixel art, generate animation frames across 8 directions, pack into a texture atlas, and produce both a downloadable PNG and copyable SPRITE_DATA metadata.

**Tech Stack:** HTML5 Canvas API, vanilla JavaScript, no dependencies.

---

## File Structure

- **Create:** `generate-fish-sprite.html` — the generator tool (open in browser to use)
- **Modify:** `index.html` — update sprite references after generation (lines 54-57, 62, 414)

---

### Task 1: Generator HTML Shell + Fish Pixel Data

**Files:**
- Create: `generate-fish-sprite.html`

This task creates the generator page structure and defines the base clownfish pixel art as a 2D array.

- [ ] **Step 1: Create generator HTML with UI layout**

Create `generate-fish-sprite.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Nemo Fish Sprite Generator</title>
<style>
  body { background: #1a1a1a; color: #eee; font-family: monospace; padding: 20px; }
  h1 { color: #ff6b35; }
  .controls { margin: 16px 0; display: flex; gap: 12px; }
  button { background: #ff6b35; color: #fff; border: none; padding: 10px 20px;
           cursor: pointer; font-size: 14px; border-radius: 4px; font-family: monospace; }
  button:hover { background: #ff8c5a; }
  #preview { border: 1px solid #333; margin: 12px 0; image-rendering: pixelated; }
  #atlas { border: 1px solid #333; margin: 12px 0; image-rendering: pixelated; }
  .preview-row { display: flex; gap: 16px; flex-wrap: wrap; margin: 12px 0; }
  .dir-preview { text-align: center; }
  .dir-preview canvas { border: 1px solid #333; image-rendering: pixelated; }
  .dir-label { font-size: 12px; color: #888; margin-top: 4px; }
  #spriteDataOutput { background: #111; color: #0f0; padding: 12px; font-size: 11px;
                      max-height: 200px; overflow: auto; white-space: pre-wrap;
                      border: 1px solid #333; margin: 12px 0; display: none; }
  .status { color: #888; margin: 8px 0; }
</style>
</head>
<body>
<h1>Nemo Fish Sprite Generator</h1>
<p>Generates a 96-frame sprite sheet (8 directions x 12 animation frames) for Drone Desktop.</p>
<div class="controls">
  <button onclick="generate()">Generate Sprite Sheet</button>
  <button onclick="downloadPNG()">Download PNG</button>
  <button onclick="copySpriteData()">Copy SPRITE_DATA</button>
</div>
<p class="status" id="status">Click "Generate" to start.</p>
<h3>Animation Preview (8 directions)</h3>
<div class="preview-row" id="dirPreviews"></div>
<h3>Texture Atlas</h3>
<canvas id="atlas"></canvas>
<pre id="spriteDataOutput"></pre>

<script>
// ===== CONFIGURATION =====
const FRAME_W = 60;   // Actual sprite width
const FRAME_H = 48;   // Actual sprite height
const LOGICAL_W = 96; // Logical frame width (matching drone)
const LOGICAL_H = 96; // Logical frame height
const ANIM_FRAMES = 12;
const DIRECTIONS = 8;
const TOTAL_FRAMES = DIRECTIONS * ANIM_FRAMES; // 96
const ATLAS_W = 254;  // Match existing atlas width
const PADDING = 1;    // Padding between frames
const DIR_LABELS = ['Up','Up-Right','Right','Down-Right','Down','Down-Left','Left','Up-Left'];

// Computed offsets to center sprite in logical frame
const OFFSET_X = -Math.floor((LOGICAL_W - FRAME_W) / 2);
const OFFSET_Y = -Math.floor((LOGICAL_H - FRAME_H) / 2);

let atlasCanvas, atlasCtx;
let spriteDataJSON = '';
let allFrames = []; // [{name, canvas, w, h}]
```

- [ ] **Step 2: Define the base clownfish pixel art drawing function**

Append to the `<script>` section in `generate-fish-sprite.html`:

```javascript
// ===== CLOWNFISH DRAWING =====
// Colors
const COL_ORANGE = '#FF6B35';
const COL_DARK_ORANGE = '#E05A2B';
const COL_WHITE = '#FFFFFF';
const COL_BLACK = '#1A1A1A';
const COL_EYE_WHITE = '#FFFFFF';
const COL_FIN_ORANGE = '#FF8C5A';
const COL_FIN_EDGE = '#222222';
const COL_STRIPE_EDGE = '#2A2A2A';

function drawPixel(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
}

function drawEllipsePixels(ctx, cx, cy, rx, ry, color) {
    for (let y = -ry; y <= ry; y++) {
        for (let x = -rx; x <= rx; x++) {
            if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) {
                drawPixel(ctx, cx + x, cy + y, color);
            }
        }
    }
}

// Draw a single clownfish frame facing RIGHT
// tailAngle: radians, how far the tail swings (-0.3 to 0.3)
// finOffset: pixels, vertical offset for fin animation (-2 to 2)
function drawClownfishRight(ctx, tailAngle, finOffset) {
    const cx = 28; // body center X
    const cy = 24; // body center Y

    // === TAIL FIN (drawn first, behind body) ===
    const tailX = cx - 14;
    const tailBaseY = cy;
    const tailTipX = tailX - 8;
    const tailTipY = tailBaseY + Math.round(Math.sin(tailAngle) * 8);
    // Tail shape: triangle fan
    for (let i = -5; i <= 5; i++) {
        const t = Math.abs(i) / 5;
        const px = tailTipX + Math.round(t * 8);
        const py = tailTipY + i;
        for (let dx = 0; dx < Math.round((1 - t) * 5) + 2; dx++) {
            drawPixel(ctx, px - dx, py, i === -5 || i === 5 ? COL_FIN_EDGE : COL_FIN_ORANGE);
        }
    }

    // === BODY (orange oval) ===
    drawEllipsePixels(ctx, cx, cy, 14, 10, COL_ORANGE);

    // Body outline (slightly darker ring)
    for (let angle = 0; angle < Math.PI * 2; angle += 0.05) {
        const bx = cx + Math.round(Math.cos(angle) * 14);
        const by = cy + Math.round(Math.sin(angle) * 10);
        drawPixel(ctx, bx, by, COL_BLACK);
    }

    // === WHITE STRIPES with black edges ===
    // Stripe 1: near head (x = cx + 8)
    for (let dy = -8; dy <= 8; dy++) {
        if ((dy * dy) / 64 + 0 <= 0.9) {
            drawPixel(ctx, cx + 9, cy + dy, COL_STRIPE_EDGE);
            drawPixel(ctx, cx + 8, cy + dy, COL_WHITE);
            drawPixel(ctx, cx + 7, cy + dy, COL_WHITE);
            drawPixel(ctx, cx + 6, cy + dy, COL_STRIPE_EDGE);
        }
    }
    // Stripe 2: middle (x = cx)
    for (let dy = -9; dy <= 9; dy++) {
        if ((dy * dy) / 81 <= 0.95) {
            drawPixel(ctx, cx + 1, cy + dy, COL_STRIPE_EDGE);
            drawPixel(ctx, cx, cy + dy, COL_WHITE);
            drawPixel(ctx, cx - 1, cy + dy, COL_WHITE);
            drawPixel(ctx, cx - 2, cy + dy, COL_STRIPE_EDGE);
        }
    }
    // Stripe 3: near tail (x = cx - 8)
    for (let dy = -7; dy <= 7; dy++) {
        if ((dy * dy) / 49 <= 0.9) {
            drawPixel(ctx, cx - 7, cy + dy, COL_STRIPE_EDGE);
            drawPixel(ctx, cx - 8, cy + dy, COL_WHITE);
            drawPixel(ctx, cx - 9, cy + dy, COL_WHITE);
            drawPixel(ctx, cx - 10, cy + dy, COL_STRIPE_EDGE);
        }
    }

    // === DORSAL FIN (top) ===
    const finTopY = cy - 10 + finOffset;
    for (let i = 0; i < 8; i++) {
        const fh = Math.max(0, 4 - Math.abs(i - 3));
        for (let fy = 0; fy < fh; fy++) {
            drawPixel(ctx, cx - 2 + i, finTopY - fy - 1,
                fy === fh - 1 ? COL_FIN_EDGE : COL_FIN_ORANGE);
        }
    }

    // === VENTRAL FIN (bottom) ===
    const finBotY = cy + 10 - finOffset;
    for (let i = 0; i < 6; i++) {
        const fh = Math.max(0, 3 - Math.abs(i - 2));
        for (let fy = 0; fy < fh; fy++) {
            drawPixel(ctx, cx - 1 + i, finBotY + fy + 1,
                fy === fh - 1 ? COL_FIN_EDGE : COL_FIN_ORANGE);
        }
    }

    // === PECTORAL FIN (side) ===
    const pecX = cx + 3;
    const pecY = cy + 2 + Math.round(finOffset * 0.5);
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 3 - Math.floor(i / 2); j++) {
            drawPixel(ctx, pecX + j, pecY + i,
                j === 0 || i === 4 ? COL_FIN_EDGE : COL_FIN_ORANGE);
        }
    }

    // === EYE ===
    const eyeX = cx + 10;
    const eyeY = cy - 1;
    // White of eye
    drawEllipsePixels(ctx, eyeX, eyeY, 2, 2, COL_EYE_WHITE);
    // Pupil
    drawPixel(ctx, eyeX + 1, eyeY, COL_BLACK);
    drawPixel(ctx, eyeX + 1, eyeY - 1, COL_BLACK);
    drawPixel(ctx, eyeX, eyeY, COL_BLACK);
    // Highlight
    drawPixel(ctx, eyeX + 1, eyeY - 1, '#FFFFFF');

    // === MOUTH ===
    drawPixel(ctx, cx + 14, cy + 1, COL_BLACK);
    drawPixel(ctx, cx + 13, cy + 2, COL_BLACK);
}
```

- [ ] **Step 3: Verify file is valid HTML — open in browser**

Open `generate-fish-sprite.html` in a browser. You should see the dark page with title, buttons, and empty preview area. No errors in console.

- [ ] **Step 4: Commit**

```bash
git add generate-fish-sprite.html
git commit -m "feat: add nemo fish sprite generator shell with pixel art drawing"
```

---

### Task 2: Frame Generation — Animation + Directions

**Files:**
- Modify: `generate-fish-sprite.html`

This task adds the logic to generate all 96 frames (12 animation frames x 8 directions) using rotation and flipping.

- [ ] **Step 1: Add animation frame generation for a single direction**

Append to the `<script>` section:

```javascript
// ===== FRAME GENERATION =====

// Generate 12 animation frames for direction "right" (direction 2)
function generateRightFrames() {
    const frames = [];
    for (let f = 0; f < ANIM_FRAMES; f++) {
        const c = document.createElement('canvas');
        c.width = FRAME_W;
        c.height = FRAME_H;
        const fCtx = c.getContext('2d');

        // Animation parameters
        const t = (f / ANIM_FRAMES) * Math.PI * 2; // full cycle over 12 frames
        const tailAngle = Math.sin(t) * 0.35;
        const finOffset = Math.sin(t + 0.5) * 1.5;

        drawClownfishRight(fCtx, tailAngle, finOffset);
        frames.push(c);
    }
    return frames;
}

// Rotate a frame canvas by angle (radians) around its center
function rotateFrame(srcCanvas, angle) {
    const dst = document.createElement('canvas');
    dst.width = FRAME_W;
    dst.height = FRAME_H;
    const dCtx = dst.getContext('2d');
    dCtx.translate(FRAME_W / 2, FRAME_H / 2);
    dCtx.rotate(angle);
    dCtx.drawImage(srcCanvas, -FRAME_W / 2, -FRAME_H / 2);
    return dst;
}

// Flip a frame canvas horizontally
function flipFrame(srcCanvas) {
    const dst = document.createElement('canvas');
    dst.width = FRAME_W;
    dst.height = FRAME_H;
    const dCtx = dst.getContext('2d');
    dCtx.translate(FRAME_W, 0);
    dCtx.scale(-1, 1);
    dCtx.drawImage(srcCanvas, 0, 0);
    return dst;
}

// Generate all 96 frames across 8 directions
function generateAllFrames() {
    allFrames = [];
    const rightFrames = generateRightFrames(); // direction 2 is the base

    // Direction angles relative to "right" (direction 2)
    // dir 0=Up(-90deg), 1=UpRight(-45deg), 2=Right(0deg), 3=DownRight(45deg), 4=Down(90deg)
    const dirAngles = [-Math.PI/2, -Math.PI/4, 0, Math.PI/4, Math.PI/2];

    for (let dir = 0; dir < DIRECTIONS; dir++) {
        for (let f = 0; f < ANIM_FRAMES; f++) {
            const name = `fish_nemo_${dir}-${f.toString().padStart(2, '0')}`;
            let frameCanvas;

            if (dir <= 4) {
                // Directions 0-4: rotate from right-facing base
                frameCanvas = dirAngles[dir] === 0
                    ? rightFrames[f]
                    : rotateFrame(rightFrames[f], dirAngles[dir]);
            } else {
                // Directions 5,6,7: horizontal flip of directions 3,2,1
                const mirrorDir = 8 - dir; // 5->3, 6->2, 7->1
                const mirrorAngle = dirAngles[mirrorDir];
                const rotated = mirrorAngle === 0
                    ? rightFrames[f]
                    : rotateFrame(rightFrames[f], mirrorAngle);
                frameCanvas = flipFrame(rotated);
            }

            allFrames.push({ name, canvas: frameCanvas, w: FRAME_W, h: FRAME_H });
        }
    }
}
```

- [ ] **Step 2: Add atlas packing and SPRITE_DATA generation**

Append to the `<script>` section:

```javascript
// ===== ATLAS PACKING =====

function packAtlas() {
    // Simple row-based packing into ATLAS_W width
    let x = PADDING, y = PADDING, rowHeight = 0;
    const placements = [];

    for (const frame of allFrames) {
        if (x + frame.w + PADDING > ATLAS_W) {
            // New row
            x = PADDING;
            y += rowHeight + PADDING;
            rowHeight = 0;
        }
        placements.push({ name: frame.name, x, y, w: frame.w, h: frame.h, canvas: frame.canvas });
        rowHeight = Math.max(rowHeight, frame.h);
        x += frame.w + PADDING;
    }

    const atlasH = y + rowHeight + PADDING;

    // Draw atlas
    atlasCanvas = document.getElementById('atlas');
    atlasCanvas.width = ATLAS_W;
    atlasCanvas.height = atlasH;
    atlasCtx = atlasCanvas.getContext('2d');
    atlasCtx.clearRect(0, 0, ATLAS_W, atlasH);

    const spriteDataFrames = [];
    for (const p of placements) {
        atlasCtx.drawImage(p.canvas, p.x, p.y);
        spriteDataFrames.push([
            p.name, p.x, p.y, p.w, p.h, OFFSET_X, OFFSET_Y, LOGICAL_W, LOGICAL_H
        ]);
    }

    // Generate SPRITE_DATA JSON
    spriteDataJSON = JSON.stringify({ frames: spriteDataFrames });

    // Show in output
    const output = document.getElementById('spriteDataOutput');
    output.textContent = 'const SPRITE_DATA = ' + spriteDataJSON + ';';
    output.style.display = 'block';

    return placements;
}
```

- [ ] **Step 3: Add preview, download, and copy functions**

Append to the `<script>` section:

```javascript
// ===== PREVIEW =====

function showDirectionPreviews() {
    const container = document.getElementById('dirPreviews');
    // Clear previous previews
    while (container.firstChild) container.removeChild(container.firstChild);

    for (let dir = 0; dir < DIRECTIONS; dir++) {
        const div = document.createElement('div');
        div.className = 'dir-preview';

        const c = document.createElement('canvas');
        c.width = FRAME_W * 3;  // 3x scale for visibility
        c.height = FRAME_H * 3;
        c.style.width = (FRAME_W * 3) + 'px';
        c.style.height = (FRAME_H * 3) + 'px';
        const pCtx = c.getContext('2d');
        pCtx.imageSmoothingEnabled = false;

        // Animate: cycle through frames
        let frame = 0;
        setInterval(() => {
            const idx = dir * ANIM_FRAMES + frame;
            pCtx.clearRect(0, 0, c.width, c.height);
            pCtx.drawImage(allFrames[idx].canvas, 0, 0, FRAME_W, FRAME_H,
                          0, 0, FRAME_W * 3, FRAME_H * 3);
            frame = (frame + 1) % ANIM_FRAMES;
        }, 80);

        const label = document.createElement('div');
        label.className = 'dir-label';
        label.textContent = dir + ': ' + DIR_LABELS[dir];

        div.appendChild(c);
        div.appendChild(label);
        container.appendChild(div);
    }
}

// ===== ACTIONS =====

function generate() {
    document.getElementById('status').textContent = 'Generating...';
    // Use setTimeout to let the UI update
    setTimeout(() => {
        generateAllFrames();
        packAtlas();
        showDirectionPreviews();
        document.getElementById('status').textContent =
            'Done! Generated ' + allFrames.length + ' frames. Atlas: ' + ATLAS_W + 'x' + atlasCanvas.height + 'px';
    }, 50);
}

function downloadPNG() {
    if (!atlasCanvas) { alert('Generate first!'); return; }
    const link = document.createElement('a');
    link.download = 'fish_nemo.png';
    link.href = atlasCanvas.toDataURL('image/png');
    link.click();
}

function copySpriteData() {
    if (!spriteDataJSON) { alert('Generate first!'); return; }
    const text = 'const SPRITE_DATA = ' + spriteDataJSON + ';';
    navigator.clipboard.writeText(text).then(() => {
        document.getElementById('status').textContent = 'SPRITE_DATA copied to clipboard!';
    });
}
</script>
</body>
</html>
```

- [ ] **Step 4: Open generator in browser and verify**

Open `generate-fish-sprite.html` in browser. Click "Generate". Verify:
- 8 animated fish previews appear (one per direction)
- Texture atlas canvas shows all 96 frames packed
- SPRITE_DATA JSON appears at the bottom
- "Download PNG" saves a valid PNG
- "Copy SPRITE_DATA" copies to clipboard

- [ ] **Step 5: Commit**

```bash
git add generate-fish-sprite.html
git commit -m "feat: complete nemo fish sprite generator with animation, atlas packing, and export"
```

---

### Task 3: Integration into Drone Desktop

**Files:**
- Modify: `index.html` (lines 54-57, 62, 414)

This task updates the app to use the generated fish sprite instead of the drone sprite.

- [ ] **Step 1: Generate the sprite sheet**

Open `generate-fish-sprite.html` in browser, click "Generate", then "Download PNG". Save the output as `fish_nemo.png` in the project root directory.

- [ ] **Step 2: Update FRAME_NAMES prefix in index.html**

In `index.html`, change line 57 from:
```javascript
FRAME_NAMES[dir][f] = `drone5_${dir}-${f.toString().padStart(2, '0')}`;
```
to:
```javascript
FRAME_NAMES[dir][f] = `fish_nemo_${dir}-${f.toString().padStart(2, '0')}`;
```

- [ ] **Step 3: Update SPRITE_DATA in index.html**

In `index.html`, replace line 62 (the entire `const SPRITE_DATA = {...};` line) with the SPRITE_DATA copied from the generator tool.

- [ ] **Step 4: Update image filename in index.html**

In `index.html`, change line 414 from:
```javascript
img.src = 'drone5_0-a87912ea5.png';
```
to:
```javascript
img.src = 'fish_nemo.png';
```

- [ ] **Step 5: Test the application**

Run the Electron app:
```bash
cd /Users/orwell/Repo/devops/temp/Drone-Desktop && npm start
```

Verify:
- Fish appears on screen and swims around
- All 8 directions display correctly
- Animation is smooth (tail/fin movement)
- Collision, drag, and hover features still work
- No console errors

- [ ] **Step 6: Commit**

```bash
git add index.html fish_nemo.png
git commit -m "feat: replace drone sprite with nemo clownfish sprite"
```
