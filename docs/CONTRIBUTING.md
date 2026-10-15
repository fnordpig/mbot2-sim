# Contributing

This document is for developers who want to add blocks, fix bugs, or extend the simulator. Read [ARCHITECTURE.md](ARCHITECTURE.md) first — it covers the full block lifecycle and will save you time.

---

## Setup

```bash
git clone https://github.com/USER/mbot2-sim.git
cd mbot2-sim
npm install
npm run dev          # dev server at http://localhost:5173
```

Edit source files; Vite hot-reloads the browser automatically.

```bash
npm run build        # verify a production build before opening a PR
```

---

## Code style

There is no enforced linter or formatter. Match the style of the file you're editing:

- **ES modules** everywhere (`import`/`export`); no CommonJS `require`.
- **No ES6+ syntax in generated code.** JS-Interpreter is ES5. See [ARCHITECTURE.md — What we deliberately do not do](ARCHITECTURE.md#what-we-deliberately-do-not-do).
- Regular JS files (not codegen output) may use ES6+ freely — Vite bundles them.
- No TypeScript; no JSDoc type annotations (the codebase does not use them).
- No comments explaining *what* code does — the identifiers do that. Comments only for non-obvious *why* (hidden constraints, workarounds, deliberate quirks like gyro overshoot).
- All user-facing strings in PT-PT via `src/i18n/pt.js`. Code comments and this document are in English.

---

## Adding a new block

Follow these steps in order. Each step is a checkpoint — test after each one before moving on.

### 1. Add the block definition

Open (or create) the appropriate file in `src/blockly/blocks/`:

| Block category | File |
|---|---|
| Drive, display, sound, LED | `action.js` |
| Sensors | `sensor.js` |
| Control flow, wait, loops | `control.js` |
| Communication | `communication.js` |
| Colour picker, RGB | `colour.js` |
| List operations | `list.js` |

Inside the file, call `Blockly.common.defineBlocks({ … })`. The block type ID **must** match Open Roberta exactly. Visual shape, dropdown options, default values, and argument order must match the XML in `reference_openroberta/`. Labels must be in PT-PT.

Example skeleton:
```js
Blockly.common.defineBlocks({
  robActions_my_block: {
    init() {
      this.appendValueInput('POWER')
          .setCheck('Number')
          .appendField(Blockly.Msg.MY_BLOCK_LABEL);
      this.appendDummyInput()
          .appendField(new Blockly.FieldDropdown([
            ['frente', 'FORWARD'], ['trás', 'BACKWARD'],
          ]), 'DIRECTION');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(0);
    },
  },
});
```

### 2. Add the block to the toolbox

Open `src/blockly/toolboxes/beginner.js` or `expert.js` (or both). Add a `{ kind: 'block', type: 'robActions_my_block' }` entry in the correct category and position, mirroring the order in the corresponding Open Roberta XML file (`reference_openroberta/program.toolbox.beginner.xml` or `expert.xml`).

### 3. Add the PT-PT label

Open `src/i18n/pt.js` and add a `Blockly.Msg.MY_BLOCK_LABEL = 'minha etiqueta'` line. All student-visible strings must be here, never hard-coded in block definitions.

### 4. Add codegen

Open the appropriate file in `src/codegen/`. Inside the `register*Codegen()` function, add:

```js
javascriptGenerator.forBlock['robActions_my_block'] = (block) => {
  const direction = block.getFieldValue('DIRECTION');
  const power = javascriptGenerator.valueToCode(block, 'POWER', Order.NONE) || '0';
  return `robotAPI.my_action('${direction}', ${power});\n`;
};
```

**Important:** generated code runs in ES5 under JS-Interpreter. Do not emit `let`, `const`, arrow functions, template literals, or any ES6+.

For async blocks (actions that take time), use the async-call wrapper:

```js
javascriptGenerator.forBlock['robActions_my_timed_block'] = (block) => {
  const ms = javascriptGenerator.valueToCode(block, 'MS', Order.NONE) || '0';
  return createJsAsyncWrapper(`robotAPI.my_async_action`, [ms]);
};
```

See the existing `drive_for` or `turn_for` codegen entries as a complete example. Also mark the robotAPI method with `._async = true` (step 5).

### 5. Add the robotAPI method

Open `src/sim/robotAPI.js` and add the method to the `robotAPI` object:

```js
my_action(direction, power) {
  // synchronous: mutate sim state and return immediately
  setWheelSpeeds(/* … */);
},
```

For an async action that blocks execution until done:

```js
my_async_action(param, callback) {
  // start the action
  const startValue = robot.someAccumulator;
  asyncTicket.pending = true;
  asyncTicket.callback = callback;
  asyncTicket.resolveCondition = () => {
    return robot.someAccumulator - startValue >= targetValue;
  };
},
```

Then after the object definition, mark it async:
```js
robotAPI.my_async_action._async = true;
```

`sandbox.js` reads the `._async` flag to decide whether to inject the method via `createAsyncFunction` or `createNativeFunction`. See [ARCHITECTURE.md — The async ticketing pattern](ARCHITECTURE.md#the-async-ticketing-pattern) for a full explanation.

### 6. Update BLOCK_MAPPING.md

Add a row to the correct table in `BLOCK_MAPPING.md` at the repo root. Keep it consistent with the existing entries: block ID, toolbox (B/E/B+E), args with defaults, JS API call signature, and sim behaviour.

### 7. Test manually

```bash
npm run dev
```

Open the browser, drag your new block into the workspace, set some values, and click Run. Verify the sim behaves correctly. For async blocks, verify that the interpreter pauses (the Run button stays active, not erroring) and resumes after the action completes.

---

## Adding a new sensor

Sensors follow a slightly different recipe:

1. Add the **block definition** in `src/blockly/blocks/sensor.js`. Sensor blocks are value blocks (output `Number` or `String`) rather than statement blocks.
2. Add to **toolbox** as above.
3. Add **codegen** in `src/codegen/sensor.js`. Sensor blocks return a value expression, not a statement:
   ```js
   javascriptGenerator.forBlock['robSensors_my_sensor'] = (block) => {
     return [`robotAPI.my_sensor()`, Order.FUNCTION_CALL];
   };
   ```
4. Add the **`robotAPI` method** in `src/sim/robotAPI.js`, calling into `src/sim/sensors.js`.
5. Add the **sensor implementation** in `src/sim/sensors.js`. Use `_tickCache` to avoid redundant computation when the block is read multiple times in a tight loop:
   ```js
   export function sensorMySensor() {
     if (_tickCache.has('my_sensor')) return _tickCache.get('my_sensor');
     const result = /* compute from robot state or map */;
     _tickCache.set('my_sensor', result);
     return result;
   }
   ```
6. Update **`BLOCK_MAPPING.md`**.

---

## Adding map features

The map system deliberately has a simple interface: PNG pixels → obstacle/colour queries. If you need a new map-level feature (e.g. a new reserved colour, a new spawn-marker convention), make changes in:

- `src/sim/mapLoader.js` — spawn detection logic
- `src/sim/map.js` — pixel lookup, obstacle detection, colour matching
- `docs/MAP_AUTHORING.md` — document the new feature for map authors

See `CLAUDE.md` Rule 9 for the reserved colour table. Do not add reserved colours without updating `CLAUDE.md`.

---

## Testing

Run `npm test` for runtime regression checks using Node's built-in test runner. The tests exercise the actual Blockly generator and JS-Interpreter with controlled animation frames and audio.

The project also uses manual acceptance criteria (see `docs/HISTORY.md`). Additional useful test targets include:

- `src/sim/kinematics.js` — pure function, easy to unit test
- `src/codegen/*.js` — generate code from a known workspace XML, assert the JS string
- `src/sim/sensors.js` — mock the map pixel data, assert sensor return values

---

## PT-PT translations

All user-facing strings live in `src/i18n/pt.js` as `Blockly.Msg.*` assignments. This file is loaded before any block definitions so the strings are available when blocks initialise. Never hard-code Portuguese text inside block definitions or UI code — always add a key to `pt.js` first.

Internal code comments and developer console messages are in English.

---

## PR guidelines

- Keep PRs focused: one logical change per PR. A new block + its codegen + its robotAPI method is one unit; mixing in unrelated refactors makes review harder.
- Reference any existing issue in the PR description.
- Include a short manual test plan in the PR description: what you dragged into the workspace, what you expected, what you observed.
- Run `npm run build` before pushing. If the build fails, fix it before opening the PR.
- Do not modify any `.xml` files in `reference_openroberta/` — those are upstream source-of-truth files and must not drift from the Open Roberta Lab release.

---

## Reporting bugs

When opening an issue, include:

- **Browser and OS** (e.g. Chrome 124 on Ubuntu 22.04)
- **Steps to reproduce** (specific blocks you used, values you entered, map you had loaded)
- **Expected behaviour**
- **Actual behaviour** (include any console errors from DevTools)
- **Generated JS** if relevant (visible in the DevTools console when you click Run — labelled `--- Generated JS ---`)
