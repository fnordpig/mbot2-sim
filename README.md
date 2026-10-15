# mbot2-sim

A browser-based digital twin of the **Makeblock mBot 2 (CyberPi)** with a drag-and-drop block editor that mirrors the **Open Roberta Lab** toolbox. Students write programs in the browser, run them on a 2D simulated course, and then recreate the same program in Open Roberta Lab to flash to real hardware.

<!-- Screenshot placeholder: drop a 1200×630px screenshot of the app as docs/screenshot.png and update the line below -->
<!-- ![mbot2-sim screenshot](docs/screenshot.png) -->

---

## What it is

A static, client-side web application that gives Portuguese-speaking robotics classrooms a sandboxed environment to test mBot 2 programs before deploying to hardware. The block editor is visually and structurally compatible with Open Roberta Lab's mBot 2 toolbox (Beginner + Expert levels, with Portuguese labels preserved). Programs execute inside [JS-Interpreter](https://github.com/NeilFraser/JS-Interpreter) against a 2D physics simulation with differential-drive kinematics, ultrasonic raycasting, quad-RGB colour sensing, and PNG-based arena maps.

## What it is NOT

- **Not a full Open Roberta replacement.** Only the mBot 2 block subset is implemented. Logic, math, text, list, and variable blocks are stock Blockly; Open Roberta's full language list is not replicated.
- **Not a hardware bridge.** There is no code path from this simulator to real mBot 2 hardware. Use Open Roberta Lab for that.
- **Not multi-robot.** The simulator runs a single robot. Communication blocks use a local pub/sub stub.
- **Not account-aware.** There is no backend, no login, no cloud save. Everything is client-side; programs auto-save to `localStorage`.

---

## Features

- Open Roberta Lab toolbox (Beginner + Expert) cloned in European Portuguese (PT-PT)
- All locomotion, audio, display, LED, sensor, control-flow, math, text, list, and communication blocks implemented
- 2D differential-drive physics at 60 fps (differential drive, axis-separated collision)
- 3-ray ultrasonic cone raycast (15° aperture) against obstacle pixels
- Quad-RGB colour sensor (4 sub-sensors) with 8-colour palette + brightness + line-code
- PNG-based map system with automatic spawn-point detection (cyan/yellow markers)
- Map catalogue: drop PNGs in `public/maps/`, auto-discovered at build/dev time
- Pan and zoom canvas navigation (mouse wheel + drag)
- Save/load programs as Blockly XML; last session auto-restored from `localStorage`
- Pure static site — no backend, no API keys, no environment variables

---

## Quick start

### Prerequisites

Node 18 or newer.

```bash
git clone https://github.com/USER/mbot2-sim.git
cd mbot2-sim
npm install
npm run dev          # dev server at http://localhost:5173
```

### Production build

```bash
npm run build        # outputs to dist/
npm run preview      # preview the built site locally
```

The `dist/` directory is a self-contained static site ready to deploy anywhere.

### Hosting

**Netlify drop:** drag the `dist/` folder onto [app.netlify.com/drop](https://app.netlify.com/drop). Done.

**Cloudflare Pages:** connect the GitHub repo; set build command `npm run build` and output directory `dist`.

**GitHub Pages:** use the [`gh-pages`](https://github.com/tschaub/gh-pages) package or the GitHub Actions workflow below.

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for full deployment details and map-update workflow.

---

## Adding maps

Drop PNG files into `public/maps/` before building. The Vite plugin scans the directory at dev-server start and at build time, writing a `catalogue.json` that the app reads. Maps are auto-discovered — no code changes needed.

See [docs/MAP_AUTHORING.md](docs/MAP_AUTHORING.md) for the full authoring guide: reserved colours, spawn markers, obstacle painting, and dimension constraints.

---

## Project structure

```
mbot2-sim/
├── public/
│   └── maps/           PNG arena maps + auto-generated catalogue.json
├── src/
│   ├── blockly/
│   │   ├── blocks/     Custom Blockly block definitions (one file per category)
│   │   ├── toolboxes/  Beginner and Expert toolbox JSON
│   │   └── generators/ Blockly JS generator bootstrap
│   ├── codegen/        Code generation: Blockly workspace → JS string
│   ├── runtime/        JS-Interpreter lifecycle, async ticketing, sandbox injection
│   ├── sim/            Physics simulation: kinematics, map, sensors, robot state, LEDs
│   ├── ui/             DOM panels: console, display overlay, buttons, map selector
│   └── i18n/           Interface catalogues and Blockly locale overrides
├── docs/               Contributor and operator documentation
├── reference_openroberta/  Upstream XML and context files (source of truth for block fidelity)
├── scripts/            Build-time utilities (e.g. map generation)
├── index.html
├── vite.config.js
└── CLAUDE.md           Non-negotiable contributor rules for this codebase
```

---

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full system description: the Blockly → codegen → JS-Interpreter → robotAPI → sim pipeline, the async ticketing pattern, the run loop step budget, sensor models, and the map system.

---

## Contributing

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for the development setup, code style, the step-by-step recipe for adding a new block, and PR guidelines.

---

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for hosting recipes (Netlify, Cloudflare Pages, GitHub Pages) and the map-update workflow for self-hosted instances.

---

## Licence

MIT. See [LICENSE](LICENSE).

---

## Acknowledgements

- **[Open Roberta Lab](https://lab.open-roberta.org/)** — block names, toolbox structure, and PT-PT translations are derived from the Open Roberta mBot 2 configuration. Open Roberta Lab is developed by Fraunhofer IAIS.
- **[Makeblock](https://www.makeblock.com/)** — mBot 2 / CyberPi hardware reference: wheel geometry, track width, motor RPM range, sensor specifications.
- **[Blockly](https://developers.google.com/blockly)** — the block programming framework this editor is built on.
- **[JS-Interpreter](https://github.com/NeilFraser/JS-Interpreter)** (Neil Fraser) — the sandboxed, steppable JavaScript interpreter that executes generated programs.

## Interface languages

Portuguese, English, Thai, Simplified Chinese, French and German are available in the language selector. The simulator uses your saved selection first, then your browser’s preferred supported language, with Portuguese as the fallback. Switching language preserves your program and student-entered text.
