# Architecture

This document describes the mbot2-sim system for contributors. Read it before diving into source files; it will save you significant time orienting.

---

## High-level pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│  Browser tab                                                        │
│                                                                     │
│  ┌──────────────┐   workspaceToCode()   ┌──────────────────────┐   │
│  │  Blockly     │──────────────────────►│  src/codegen/        │   │
│  │  workspace   │                       │  (JS string emitter) │   │
│  └──────────────┘                       └──────────┬───────────┘   │
│                                                    │ JS string      │
│                                         ┌──────────▼───────────┐   │
│                                         │  src/runtime/        │   │
│                                         │  JS-Interpreter      │   │
│                                         │  (step() loop)       │   │
│                                         └──────────┬───────────┘   │
│                                                    │ robotAPI.*     │
│                                         ┌──────────▼───────────┐   │
│                                         │  src/sim/robotAPI.js │   │
│                                         │  (the only bridge)   │   │
│                                         └──────────┬───────────┘   │
│                                                    │ mutates state  │
│  ┌──────────────┐   requestAnimationFrame   ┌──────▼────────────┐  │
│  │  HTML canvas │◄──────────────────────────│  src/sim/         │  │
│  │  (60 fps)    │                           │  physics + render │  │
│  └──────────────┘                           └───────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

The two loops (interpreter tick loop and canvas render loop) both run inside `requestAnimationFrame` but are separate RAF callbacks started independently. The physics sim advances every frame regardless of whether any program is running.

---

## Directory layout

```
src/
├── blockly/
│   ├── blocks/         Custom Blockly block definitions. One file per OR category.
│   │   ├── action.js       Drive, display, sound, LED blocks
│   │   ├── sensor.js       Ultrasonic, QuadRGB, gyro, timer, key blocks
│   │   ├── control.js      Loop, wait, if, flow-control blocks
│   │   ├── communication.js  send/receive message blocks
│   │   ├── colour.js       Colour picker + RGB constructor blocks
│   │   └── list.js         List operation blocks
│   ├── generators/
│   │   └── javascript.js   Bootstraps Blockly's built-in JS generator
│   └── toolboxes/
│       ├── beginner.js     Beginner toolbox JSON (mirrors program.toolbox.beginner.xml)
│       └── expert.js       Expert toolbox JSON (mirrors program.toolbox.expert.xml)
│
├── codegen/
│   ├── index.js        Entry point: calls all registerXCodegen() and exports generateCode()
│   ├── action.js       Codegen for action blocks (locomotion, display, sound, LED)
│   ├── sensor.js       Codegen for sensor blocks
│   ├── control.js      Codegen for control blocks (wait, loops, if)
│   ├── expr.js         Codegen for expression helpers (type casts, RGB constructor)
│   ├── communication.js  Codegen for communication blocks
│   ├── builtin.js      Overrides for standard Blockly blocks that need custom output
│   └── stubs.js        Placeholder registrations (prevent "no generator" warnings)
│
├── runtime/
│   ├── runLoop.js      Main run/stop logic; drives interpreter step() via RAF
│   ├── interpreter.js  Thin wrapper around js-interpreter: create/step/destroy
│   ├── sandbox.js      JS-Interpreter initFunc: injects robotAPI and console shims
│   └── runState.js     Shared run-state enum + asyncTicket object
│
├── sim/
│   ├── robot.js        Robot state object + constants + spawn/reset helpers
│   ├── kinematics.js   One-step differential-drive integrator (mutates robot)
│   ├── map.js          Off-screen canvas, pixel lookup, obstacle/colour queries
│   ├── mapLoader.js    Load PNG from URL, detect cyan/yellow spawn markers
│   ├── mapCatalogue.js Fetch /maps/catalogue.json (written by Vite plugin)
│   ├── sensors.js      Sensor implementations: ultrasonic, QuadRGB, gyro, encoder…
│   ├── robotAPI.js     THE bridge: all robotAPI.* methods called by generated code
│   ├── leds.js         LED state (5 front LEDs + ultrasonic ring)
│   ├── audio.js        Web Audio API tone and note playback
│   ├── canvas.js       RAF render loop, camera (pan/zoom), draw functions
│   └── world.js        Coordinate constants (PX_PER_CM = DISPLAY_SCALE = 8)
│
├── ui/
│   ├── console.js      Append-only console panel (student output + errors)
│   ├── display.js      128×128 CyberPi display overlay (text grid + println)
│   ├── buttons.js      Keyboard state tracker (A/B keys, joystick directions)
│   ├── controls.js     Run/Stop/Reset button wiring
│   ├── mapSelector.js  Map dropdown populated from catalogue.json
│   └── programIO.js    Save/load Blockly XML; localStorage auto-save
│
└── i18n/
    └── pt.js           All Blockly.Msg.* overrides for PT-PT
```

---

## Block lifecycle

When a user drags a block and clicks Run, this is the complete path:

1. **Block definition** (`src/blockly/blocks/*.js`)
   Registers a Blockly block type with `Blockly.common.defineBlocks()`. Sets the visual shape (inputs, dropdowns, default values), colour, and tooltip. Block type IDs must match Open Roberta exactly (e.g. `robActions_motorDiff_on_for`).

2. **Toolbox JSON** (`src/blockly/toolboxes/beginner.js` / `expert.js`)
   References the block by type ID inside a category tree. Mirrors the structure of the Open Roberta XML files in `reference_openroberta/`.

3. **Workspace → JS string** (`src/codegen/`)
   `generateCode(workspace)` (from `src/codegen/index.js`) calls Blockly's `javascriptGenerator.workspaceToCode(workspace)`. Each block type has a registered generator function (e.g. `javascriptGenerator.forBlock['robActions_motorDiff_on_for']`) that emits a JS fragment like:
   ```js
   robotAPI.drive_for('FORWARD', 30, 50);
   ```
   Async blocks emit ordinary calls. `sandbox.js` injects methods marked `._async` through `createAsyncFunction`, which supplies the native completion callback.

4. **JS-Interpreter execution** (`src/runtime/`)
   `src/runtime/runLoop.js` creates a new `Interpreter` instance with the generated code string, then drives it with up to `STEP_BUDGET_PER_FRAME = 1000` `step()` calls per RAF frame.

5. **robotAPI call** (`src/sim/robotAPI.js`)
   The interpreter's global scope contains a `robotAPI` object injected by `src/runtime/sandbox.js`. When the interpreter executes `robotAPI.drive_for(...)`, it calls the native JavaScript function in `robotAPI.js`.

6. **Simulation state mutation** (`src/sim/`)
   `robotAPI.drive_for` sets `robot.vL` and `robot.vR` via `setWheelSpeeds()`, sets up the `asyncTicket`, and returns. The canvas loop's `kinematics.step()` then integrates the new wheel speeds into position each frame.

7. **Canvas render** (`src/sim/canvas.js`)
   Every RAF frame, `canvas.js` calls `kinematics.step(robot, dt)`, then redraws the canvas: map image, grid, robot body, LED dots, ultrasonic cone rays, QuadRGB sensor dots, and the HUD overlay.

---

## The async ticketing pattern

JS-Interpreter is a synchronous ES5 interpreter. It has no native `async`/`await`. Actions that take time (drive a distance, turn an angle, wait N milliseconds) need a mechanism to pause the interpreter until the physics sim reports completion.

### Why it's needed

The physics sim runs in a separate RAF loop. A `drive_for(50cm)` call needs to:
1. Start the motors.
2. Pause the interpreter until the robot has traveled 50 cm.
3. Resume execution.

### How it works

**`asyncTicket`** (in `src/runtime/runState.js`) is a single shared object:
```js
{
  pending: false,
  resolveCondition: null,  // () => boolean — checked each frame
  callback: null,          // js-interpreter resume callback
}
```

**Async API methods** (those marked `._async = true` on `robotAPI`) are injected into the interpreter via `interpreter.createAsyncFunction()`. When the interpreter calls one, js-interpreter passes a `callback` as the last argument and sets its internal `paused_` flag to `true`. Execution halts.

**The API method** sets `asyncTicket.pending = true`, stores the `callback`, and writes a `resolveCondition` closure that checks sim state each frame:
```js
asyncTicket.resolveCondition = () => {
  return robot.totalDistanceCm - startDist >= targetCm;
};
```

**The run loop** (`src/runtime/runLoop.js`), at the start of each RAF tick, checks:
```js
if (asyncTicket.pending && asyncTicket.resolveCondition()) {
  asyncTicket.pending = false;
  asyncTicket.callback();   // tells js-interpreter to resume
}
```
Once the callback fires, `paused_` is set to `false` and `step()` calls resume.

### Async methods

These are the robotAPI methods that use the async ticket pattern:

| Method | Resolves when |
|--------|---------------|
| `drive_for(direction, power, cm, cb)` | `totalDistanceCm` reaches target |
| `turn_for(direction, power, deg, cb)` | `totalRotationRad` reaches target |
| `curve_for(direction, pL, pR, cm, cb)` | `totalDistanceCm` reaches target |
| `motor_on_for(port, power, value, mode, cb)` | encoder reaches target rotations |
| `wait_ms(ms, cb)` | `performance.now()` reaches `startTime + ms` |

All other robotAPI methods are synchronous and return immediately.

### Overshoot correction

Because the `resolveCondition` is checked once per frame (at 60 fps), the robot will always have traveled slightly past its target before the ticket resolves. The resolve-condition closure corrects this by subtracting the overshoot from position/angle/encoder accumulators before stopping the motors. The `gyroCumulativeRad` accumulator is intentionally NOT corrected for turn_for — this gives a 1–3° gyro overshoot that matches real CyberPi inertia.

---

## Run loop and step budget

```js
// src/runtime/runLoop.js
const STEP_BUDGET_PER_FRAME = 1000;
```

Each RAF frame, the run loop calls `interpreter.step()` up to 1000 times. This prevents a tight loop in user code (e.g. `while(true) {}`) from freezing the browser tab. The physics sim and canvas render still happen in the canvas RAF loop regardless.

### Interaction with async tickets

When an async API call is active, the interpreter's `paused_` flag is `true` and `step()` returns without advancing execution. The run loop detects this and enters `PAUSED_ASYNC` state, which skips the step budget loop and just polls the async ticket each frame.

### The two RAF loops

- **Canvas loop** (`src/sim/canvas.js → initSim → loop()`): always running; calls `kinematics.step()` and `draw()` every frame. It also calls `resetTickCache()` to clear sensor caches.
- **Run loop** (`src/runtime/runLoop.js → _tick()`): started only when a program is running; checks the async ticket, runs the step budget, then re-schedules itself.

Both loops use `requestAnimationFrame` independently. They do not share a single RAF callback.

---

## Sensor model

### Ultrasonic (3-ray cone)

`sensorUltrasonic()` in `src/sim/sensors.js` casts three rays:
- Left offset: `robot.theta - 7.5°`
- Centre: `robot.theta`
- Right offset: `robot.theta + 7.5°`

Ray origin is offset 9 cm forward from the robot's kinematic centre (matching the physical sensor position). Each ray steps in 0.5 cm increments (= 4 px at the 8 px/cm scale), converting cm coords to map-pixel indices at each step. The return value is the **minimum** distance across the three rays in cm — matching real ultrasonic "closest reflector wins" behaviour. Cyan and yellow pixels are transparent to raycasts.

The cone result is cached per interpreter tick in `_tickCache` to avoid redundant raycasts when sensor blocks are read multiple times in one loop iteration.

### Quad-RGB sensor

`src/sim/sensors.js` samples four probes in robot-local coordinates (+x = forward, +y = right of robot):

```
Probe  Local x (cm)  Local y (cm)  Bit
  1       +6.0          -1.5       bit 0 (LSB / leftmost)
  2       +6.0          -0.5       bit 1
  3       +6.0          +0.5       bit 2
  4       +6.0          +1.5       bit 3 (MSB / rightmost)
```

Constants live in `src/sim/constants.js`: `QUADRGB_FORWARD_OFFSET_CM = 6.0`, `QUADRGB_LATERAL_OFFSETS_CM = [-1.5, -0.5, 0.5, 1.5]`, `QUADRGB_LIGHT_THRESHOLD = 128`.

World transform for probe n at robot pose (x, y, θ):
```
worldX = robot.x + localX·cos(θ) − localY·sin(θ)
worldY = robot.y + localX·sin(θ) + localY·cos(θ)
```

Each probe reads the raw pixel RGB via `getPixelAt()` (returns `{r,g,b}` in world-cm coordinates), computes `brightness = (r+g+b)/3`, and caches all four results as `quadrgb_probes` in `_tickCache`.

`sensorQuadRGBForProbe(property, probeIndex)` dispatches to:
- **COLOUR**: `getColorNameAt()` palette match (handles spawn-zone remapping → 'white').
- **LIGHT**: `Math.round(brightness / 255 * 100)` — 0..100 integer.
- **RGB**: `[r, g, b]` raw values.

**Line bitmask** (`sensorQuadRGBLine()`): `bit_i = (brightness_i > 128) ? 1 : 0`.
- bit=1 → light surface (off line), bit=0 → dark surface (on line).
- 15 = all probes on white (no line), 0 = all probes on black.
- Reserved spawn-marker colours (#00ffff brightness≈170, #ffff00 brightness=255) always read as light — no false line detection over spawn zones.

### Gyro

`sensorGyro(slot, axis)` returns the signed cumulative rotation in degrees since the last `gyro_reset` call (or program start). Only the Z axis (yaw) is meaningful in a 2D sim; X and Y always return 0.

Sign convention: clockwise rotation (right turn) → positive degrees.

The `slot` parameter (from Open Roberta's named-bookmark feature) is accepted but ignored — all slots return the same physical value.

### Sensor-invisible colours

`#00ffff` (pure cyan) and `#ffff00` (pure yellow) are reserved for spawn markers and treated as white by all sensors. This means spawn zones are undetectable by student programs. Colour sensors see them as `white`; raycast rays pass through them.

---

## Map system

### PNG format and scale

Maps are PNG files authored at **8 px = 1 cm** (`DISPLAY_SCALE = 8`). The standard canvas is 1600×980 px (= 200×122.5 cm). `PX_PER_CM = 8` is derived from `DISPLAY_SCALE` in `src/sim/constants.js`.

The canvas element is resized to match the loaded map's pixel dimensions. Pan (drag) and zoom (mouse wheel) navigate maps larger than the viewport.

### Spawn detection

`src/sim/mapLoader.js` scans the raw pixel data for two reserved colours:

1. **Cyan `#00ffff`**: the centroid of all pure-cyan pixels becomes the robot's spawn position.
2. **Yellow `#ffff00`**: the centroid of all pure-yellow pixels defines the spawn heading via `atan2(yellowCentroid - cyanCentroid)`.

Both are exact RGB matches (no tolerance). Anti-aliased edges produce non-reserved fringe pixels, which are harmless — only the exact-colour core pixels are used.

If no cyan zone is found, spawn defaults to the canvas centre (half of map width/height in cm). If no yellow marker, heading defaults to 0° (facing east).

### Obstacle detection

`isObstacle(x, y)` in `src/sim/map.js` checks if a circle of radius `BODY_RADIUS_CM = 4.5` centred at `(x, y)` intersects any magenta pixel `(R=255, G=0, B=255)`. Collision is detected via `isMagentaCollision()` which samples the robot's bounding circle at several points.

### Vite catalogue plugin

`vite.config.js` registers `mapCataloguePlugin()`, which:
- On dev-server start: scans `public/maps/*.png`, writes `public/maps/catalogue.json`.
- On hot-update: rescans and writes `catalogue.json` if a `.png` in that directory changed, then sends a full-reload signal to the browser.

At runtime, `src/sim/mapCatalogue.js` fetches `/maps/catalogue.json` and populates the map selector dropdown.

---

## Codegen registry

`src/codegen/index.js` is the entry point for code generation:

```js
import './builtin.js';      // applies before domain registrations
import './stubs.js';        // prevents "no generator" warnings for unregistered blocks
import { registerActionCodegen }       from './action.js';
import { registerSensorCodegen }       from './sensor.js';
import { registerControlCodegen }      from './control.js';
import { registerExprCodegen }         from './expr.js';
import { registerCommunicationCodegen } from './communication.js';

registerActionCodegen();
registerSensorCodegen();
registerControlCodegen();
registerExprCodegen();
registerCommunicationCodegen();
```

Each `register*` function calls `javascriptGenerator.forBlock['block_type_id'] = (block) => { ... }` for every block it owns.

### Adding a new block's codegen

1. Find the correct domain module (e.g. `action.js` for locomotion blocks).
2. Inside `registerActionCodegen()`, add:
   ```js
   javascriptGenerator.forBlock['robActions_my_new_block'] = (block) => {
     const val = javascriptGenerator.valueToCode(block, 'INPUT', Order.NONE) || '0';
     return `robotAPI.my_method(${val});\n`;
   };
   ```
3. For async blocks, wrap with the async convention — see any existing `drive_for` or `turn_for` codegen entry as a template.

The generated code runs inside JS-Interpreter under ES5 semantics — do not emit `let`, `const`, arrow functions, template literals, or any ES6+ syntax.

---

## Coordinate systems

The sim uses three distinct coordinate spaces. Mixing them silently is the most common source of scale bugs.

### World space (cm)

All physics, sensor, and kinematics code works in **centimetres**. `robot.x`, `robot.y`, drive distances, sensor return values, raycast origins and distances — everything is in cm.

```
worldToScreen(xCm, yCm) → { xPx, yPx }   where xPx = xCm × PX_PER_CM
```

### Map-pixel space (map px)

The raw `imageData` arrays from loaded PNG files are pixel-indexed. Map PNGs are authored at **8 px = 1 cm**, so:

```
map-px = world cm × DISPLAY_SCALE (= 8)
```

Every place that reads `imageData` (colour lookup, collision check, raycast) must convert cm → map-px before indexing:

```js
const xPx = Math.floor(xCm * DISPLAY_SCALE); // cm → px for pixel sampling
```

Map-pixel space and screen space coincide at zoom = 1 (one map pixel draws as one screen pixel). They are conceptually distinct even when numerically equal.

### Screen space (display px)

The HTML canvas operates in display pixels. The camera transform `ctx.setTransform(camera.scale, 0, 0, camera.scale, offsetX, offsetY)` maps world coordinates to screen pixels:

```
screen px = world cm × PX_PER_CM × camera.scale + panOffset
```

At default zoom (`camera.scale = 1`) and no pan:

```
screen px = world cm × DISPLAY_SCALE = map px
```

### Constants

| Constant | Value | Location |
|---|---|---|
| `DISPLAY_SCALE` | 8 px/cm | `src/sim/constants.js` |
| `PX_PER_CM` | 8 | `src/sim/world.js` (= DISPLAY_SCALE) |
| `ROBOT_LENGTH_PX` | 140 px | `src/sim/constants.js` |
| `ROBOT_WIDTH_PX` | 104 px | `src/sim/constants.js` |

All scale and footprint constants live in `src/sim/constants.js`. No magic numbers in sim code.

---

## State model

The `robot` object (`src/sim/robot.js`) is the single source of truth for the robot's physical state:

```js
robot = {
  x,                   // cm, world space (right = positive)
  y,                   // cm, world space (down = positive)
  theta,               // radians; 0 = east, increases clockwise
  vL,                  // left wheel speed, RPM; range -200..200
  vR,                  // right wheel speed, RPM; range -200..200
  collided,            // boolean; true for the frame of a collision
  totalDistanceCm,     // cumulative absolute distance traveled since reset
  totalRotationRad,    // cumulative absolute rotation since reset
  encoderLeftAbs,      // cumulative left-motor rotations since reset
  encoderRightAbs,     // cumulative right-motor rotations since reset
  gyroCumulativeRad,   // signed cumulative rotation (never normalised); used by gyro sensor
}
```

### Who mutates what

| Mutator | Fields written |
|---------|---------------|
| `kinematics.step()` | x, y, theta, collided, totalDistanceCm, totalRotationRad, encoderLeftAbs, encoderRightAbs, gyroCumulativeRad |
| `robotAPI.setWheelSpeeds()` (via `robot.js`) | vL, vR |
| `robot.resetRobot()` | all fields |
| `asyncTicket.resolveCondition` closures | x, y, theta, totalDistanceCm, totalRotationRad, encoderLeftAbs, encoderRightAbs (overshoot correction) |

### Who reads what

- `sensors.js` reads x, y, theta, vL, vR, gyroCumulativeRad, encoderLeftAbs/Right
- `canvas.js` reads x, y, theta, collided, vL, vR, totalDistanceCm
- `robotAPI.js` async resolve conditions read x, y, theta, totalDistanceCm, totalRotationRad, encoderLeftAbs/Right

---

## What we deliberately do not do

**No async/await or ES2017+ in generated code.** JS-Interpreter is an ES5 interpreter. Generated programs must not emit `let`, `const`, arrow functions, template literals, `Promise`, `async`/`await`, or any other ES6+ syntax. The async ticketing pattern (described above) is how we achieve blocking behaviour within ES5.

**No Python codegen.** An early design explored exporting hardware-compatible Python for Open Roberta. That was dropped permanently. All codegen targets JavaScript. `CLAUDE.md` Rule 5 captures this constraint.

**Dynamic canvas resizing (Phase 6-1).** `resizeCanvas(mapInfo)` in `src/sim/canvas.js` sets `canvas.width = mapInfo.width * DISPLAY_SCALE` and `canvas.height = mapInfo.height * DISPLAY_SCALE` when a map is loaded. For the standard 200×122.5 cm map this yields 1600×980 px. CSS `max-width: 100%` on the canvas element scales it visually on small screens while preserving the native pixel resolution. Pan/zoom still works on top of this scaling via the camera transform.

**No multi-robot.** The communication blocks (`send_message` / `receive_message`) use a local `Map`-based FIFO bus that loops back to the same robot. They log to the student console and do not error; extending them for real multi-robot scenarios would require a backend WebSocket layer.

**No sensor latency simulation.** Sensor reads are synchronous and return the instantaneous sim state. There is no I/O round-trip delay.

**No Neural Network blocks.** The `#ifdef nn` block category from Open Roberta (`robActions_NNstep`, etc.) is explicitly out of scope. See `CLAUDE.md` Rule 6.
