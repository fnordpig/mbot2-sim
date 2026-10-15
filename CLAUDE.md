# CLAUDE.md — Non-Negotiable Rules

> These rules are conventions for contributors (human or AI-assisted) working on this codebase. They reflect deliberate design decisions made during the project's initial phases. For architectural rationale, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

Read this **before every coding session**. Violating any rule below means rework.

---

## 1. Block-Level Fidelity to Open Roberta Lab

- Every block **type ID** must match Open Roberta exactly (e.g., `robActions_motorDiff_on_for`, `robSensors_ultrasonic_getSample`).
- Every block **visual shape, dropdown options, default values, and argument order** must match the XML files in `reference_openroberta/`.
- Portuguese block **labels** must match Open Roberta's PT-PT translation (e.g., `conduzir ◇ a velocidade ◇ % distância ◇ cm`). Other locales translate labels while preserving block IDs, inputs, dropdown values, and argument order.
- The **toolbox structure** (categories, subcategories, order) must match `program.toolbox.beginner.xml` and `program.toolbox.expert.xml`.

## 2. Source of Truth

- `reference_openroberta/openrobertambot2context.md` — semantic spec (units, ranges, behaviour)
- `reference_openroberta/program.toolbox.beginner.xml` — beginner toolbox structure
- `reference_openroberta/program.toolbox.expert.xml` — expert toolbox structure
- `reference_openroberta/configuration.default.xml` — robot constants
- `reference_openroberta/configuration.toolbox.xml` — sensor configuration blocks

If `openrobertambot2context.md` and an XML file conflict, **the XML wins** (it is the actual UI source).

## 3. Robot Constants (HARD CODED, DO NOT CHANGE)

```js
WHEEL_DIAMETER_CM         = 6.5
WHEEL_RADIUS_CM           = 3.25
WHEEL_CIRCUMFERENCE_CM    = 20.420352248333657
TRACK_WIDTH_CM            = 11.5
MOTOR_PORTS               = ['EM1', 'EM2']  // left=EM1, right=EM2
MAX_RPM                   = 200
MIN_RPM                   = -200
CHASSIS_FRONT_OFFSET_CM   = 9
BODY_RADIUS_CM            = 4.5
ULTRASONIC_CONE_DEG       = 15
```

Source: `src/sim/robot.js → ROBOT_CONSTANTS`.

## 4. Units & Ranges

- **Motor power:** RPM, range −200 to +200 (NOT %, NOT m/s)
- **Distance:** cm
- **Angle/Turn:** degrees
- **Tone frequency:** Hz
- **Tone duration:** ms
- **Display:** 128×128 px, addressable as text grid (0–7 cols × 0–7 rows for `display_text`)
- **Wait time:** ms
- **Volume:** 0–100
- **LED brightness:** 0–100

## 5. No Python. No Pyodide.

Code generation target is **JavaScript**, executed via **JS-Interpreter**. The pivot away from hardware-compatible Python export is permanent. Do not introduce Python anywhere.

## 6. Excluded From Scope

- **Neural Network blocks** — `robActions_NNstep`, `robActions_set_inputneuron_val`, and related `#ifdef nn` blocks are explicitly excluded. Do not implement them.
- **Multi-robot communication** — `communication_send_message` / `communication_receive_message` must exist (they are in the expert toolbox) but are stubbed as a local pub/sub FIFO bus (single-robot sim). Log to console; do not error.

## 7. Execution Model

- Code generator: **JavaScript** (Blockly's built-in JS generator, customised in `src/codegen/`).
- Runtime: **JS-Interpreter** (`src/runtime/`), with `interpreter.step()` driven by `requestAnimationFrame`.
- **STEP_BUDGET_PER_FRAME = 1000** — the run loop calls `step()` at most 1000 times per RAF frame to prevent browser hangs from tight user loops.
- Async robot calls (`drive_for`, `turn_for`, `wait_ms`, etc.) use the **async ticketing pattern**: the robotAPI method sets `asyncTicket.pending = true` and a `resolveCondition` closure; the run loop polls the condition each frame and fires the JS-Interpreter resume callback when it returns `true`. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#the-async-ticketing-pattern).
- Stop button = cancel RAF, destroy interpreter, call `resetMotors()`.
- Generated code must be valid **ES5**. Do not emit `let`, `const`, arrow functions, template literals, or other ES6+ syntax.

## 8. Sim Loop

- Fixed 60 fps (`requestAnimationFrame`), `dt = 1/60 s` nominal; capped at `1/30 s` to absorb tab-suspend lag.
- Sensor reads are synchronous against current sim state (no I/O latency simulated).
- The canvas render loop and the interpreter run loop are **separate** RAF callbacks.

## 9. Reserved Map Colours (DO NOT USE for sensor zones)

Map PNGs use three reserved colours. They are invisible to all sensors and do NOT trigger collision.

| Colour  | Hex       | Meaning |
|---------|-----------|---------|
| Magenta | `#ff00ff` | Obstacle wall — robot collision halt |
| Cyan    | `#00ffff` | Spawn zone body — centroid = robot start position |
| Yellow  | `#ffff00` | Spawn direction marker — vector cyan→yellow = robot heading |

**Collision:** only magenta triggers collision. Cyan and yellow are passable.
**Sensors:** cyan and yellow pixels return `'white'` from `getColorNameAt`. For sensor-detectable cyan lines use `#33ffff`.
**Authoring:** see `docs/MAP_AUTHORING.md` for the full guide.

## 10. Sensor Color Palette (8 colours + black for "no detection")

Quad RGB sensor returns one of: `red, orange, yellow, green, cyan, blue, purple, white, black`.

Hex swatches in toolbox (`robColour_picker`):
`#cc0000, #ff6600, #ffff00, #33cc00, #33ffff, #3366ff, #cc33cc, #FFFF (white), #0000 (black)`.

Colour matching uses ±40 RGB Euclidean distance tolerance. Source: `src/sim/map.js → getColorNameAt`.

## 11. UI Language

- **English is the default student-facing language.** Also support Portuguese (PT-PT), Thai, Simplified Chinese, French, and German. Sources: `src/i18n/messages/` plus the matching official Blockly locale. Keep every catalogue's keys and interpolation placeholders aligned with English.
- **Code comments + docs in English.**
- Console/error messages shown to students use the selected language through `t()` from `src/i18n/index.js`.
- Console/error messages for developers (DevTools): English is fine.

## 12. File Discipline

- One block category per file in `src/blockly/blocks/`.
- One sim concern per file in `src/sim/`.
- Never mix Blockly-side and sim-side code in the same module.
- `src/interpreter/api.js` re-exports `robotAPI` from `src/sim/robotAPI.js` — this is the declared bridge point. The actual injection into the JS-Interpreter sandbox happens in `src/runtime/sandbox.js`.

## 14. World Scale Convention (Phase 6-1)

- **World units are centimetres throughout.** `robot.x`, `robot.y`, sensor return values, drive distances — all in cm.
- **Display scale is 8 px = 1 cm.** `PX_PER_CM = 8` in `src/sim/world.js`, derived from `DISPLAY_SCALE = 8` in `src/sim/constants.js`.
- **Map PNGs are authored at 8 px = 1 cm.** Standard canvas = 1600×980 px (200×122.5 cm). Sensor/collision code converts cm→px (`xCm * DISPLAY_SCALE`) when reading `imageData`.
- **`src/sim/constants.js` is the single source of truth** for all scale and robot footprint constants (`DISPLAY_SCALE`, `ROBOT_LENGTH_CM`, `ROBOT_WIDTH_CM`, `ROBOT_LENGTH_PX`, `ROBOT_WIDTH_PX`, `CANVAS_MAX_WIDTH_PX`, `CANVAS_MAX_HEIGHT_PX`). No magic numbers in canvas/draw/sensor code.
- **Three coordinate spaces:** world (cm), map-px (PNG pixels = cm × DISPLAY_SCALE), screen (display px = world px at zoom 1). See `docs/ARCHITECTURE.md → Coordinate systems`.

## 13. Acceptance Gate (completed — Phase 5)

The following sample program runs end-to-end in the sim:
1. Wait for controller key A press
2. Play tone 440 Hz / 200 ms
3. Drive 50 cm at 30 RPM
4. Turn 90° at 30 RPM
5. Drive forward until ultrasonic < 10 cm OR quad-RGB sees red
6. Stop, display "Done"
