import { PX_PER_CM } from './world.js';
import { DISPLAY_SCALE } from './constants.js';

// Tolerance (Euclidean RGB distance) for palette matching
const TOLERANCE = 40;

// Sensor colour palette. Cyan uses #33ffff (r:51) to avoid collision with the
// reserved spawn-zone marker #00ffff. Yellow uses #ffff00 which is also the
// reserved direction-marker colour — see getColorNameAt for how that is handled.
const PALETTE = [
  { r: 204, g:   0, b:   0, name: 'red'     },
  { r: 255, g: 102, b:   0, name: 'orange'  },
  { r: 255, g: 255, b:   0, name: 'yellow'  },
  { r:  51, g: 204, b:   0, name: 'green'   },
  { r:  51, g: 255, b: 255, name: 'cyan'    }, // swatch #33ffff; exact #00ffff is reserved
  { r:  51, g: 102, b: 255, name: 'blue'    },
  { r: 204, g:  51, b: 204, name: 'purple'  },
  { r: 255, g: 255, b: 255, name: 'white'   },
  { r:   0, g:   0, b:   0, name: 'black'   },
  { r: 255, g:   0, b: 255, name: 'magenta' }, // obstacle marker — collision only, not a sensor colour
];

let pixels = null;       // Uint8ClampedArray, cached once on load
let mapWidthPx  = 0;     // native pixel width of the loaded map image
let mapHeightPx = 0;     // native pixel height
let mapWidthCm  = 0;     // world width in cm (= mapWidthPx / DISPLAY_SCALE)
let mapHeightCm = 0;     // world height in cm
let offscreenCanvas = null;

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Accepts pre-loaded map data from mapLoader.loadMapFromUrl and stores it
 * as the active map. Replaces any previously loaded map.
 * width and height are in cm; pixel dimensions are read from the offscreen canvas.
 */
export function setMapData({ imageData, width, height, offscreenCanvas: oc }) {
  pixels          = imageData;
  mapWidthPx      = oc.width;   // native pixel dims for pixel-index bounds checking
  mapHeightPx     = oc.height;
  mapWidthCm      = width;      // cm — used for world-space queries
  mapHeightCm     = height;
  offscreenCanvas = oc;
}

/** Legacy: loads a map from a File object (used by optional direct-upload path). */
export async function loadMap(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      mapWidthPx  = img.naturalWidth;
      mapHeightPx = img.naturalHeight;
      // cm → px for pixel-index bounds; px → cm for world-space queries
      mapWidthCm  = mapWidthPx  / DISPLAY_SCALE;
      mapHeightCm = mapHeightPx / DISPLAY_SCALE;

      offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width  = mapWidthPx;
      offscreenCanvas.height = mapHeightPx;
      const ctx = offscreenCanvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      pixels = ctx.getImageData(0, 0, mapWidthPx, mapHeightPx).data;

      URL.revokeObjectURL(url);
      resolve({ wCm: mapWidthCm, hCm: mapHeightCm });
    };

    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load map image')); };
    img.src = url;
  });
}

export function hasMap()       { return pixels !== null; }

export function getMapSizeCm() {
  if (!pixels) return null;
  return { wCm: mapWidthCm, hCm: mapHeightCm };
}

// Visit solid pixel squares intersecting a world-space rectangle. Collision
// queries use squared distance directly rather than matching the sensor palette.
export function visitObstaclePixels(minX, minY, maxX, maxY, visit) {
  if (!pixels) return;
  const left = Math.max(0, Math.floor(minX * DISPLAY_SCALE));
  const top = Math.max(0, Math.floor(minY * DISPLAY_SCALE));
  const right = Math.min(mapWidthPx - 1, Math.floor(maxX * DISPLAY_SCALE));
  const bottom = Math.min(mapHeightPx - 1, Math.floor(maxY * DISPLAY_SCALE));
  for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) {
    const i = (y * mapWidthPx + x) * 4;
    const red = pixels[i] - 255;
    const green = pixels[i + 1];
    const blue = pixels[i + 2] - 255;
    if (red * red + green * green + blue * blue <= TOLERANCE * TOLERANCE) {
      visit(x / DISPLAY_SCALE, y / DISPLAY_SCALE, (x + 1) / DISPLAY_SCALE, (y + 1) / DISPLAY_SCALE);
    }
  }
}

// Returns {r, g, b, a} or null if out-of-bounds / no map loaded.
// xCm, yCm are world-space centimetres; converted to map pixel coords here.
export function getPixelAt(xCm, yCm) {
  if (!pixels) return null;
  const xPx = Math.floor(xCm * DISPLAY_SCALE); // cm → px for pixel sampling
  const yPx = Math.floor(yCm * DISPLAY_SCALE);
  if (xPx < 0 || yPx < 0 || xPx >= mapWidthPx || yPx >= mapHeightPx) return null;
  const i = (yPx * mapWidthPx + xPx) * 4;
  return { r: pixels[i], g: pixels[i + 1], b: pixels[i + 2], a: pixels[i + 3] };
}

/**
 * Returns the closest palette colour name within TOLERANCE, or 'none'.
 * Reserved spawn-marker colours (#00ffff and #ffff00) are invisible to sensors
 * and read as 'white' (passable floor). Map authors must use #33ffff for
 * sensor-detectable cyan and a non-exact yellow for sensor-detectable yellow.
 */
export function getColorNameAt(xCm, yCm) {
  const p = getPixelAt(xCm, yCm);
  if (!p) return 'none';

  // Reserved spawn-marker colours → transparent floor
  if (p.r === 0   && p.g === 255 && p.b === 255 && p.a > 0) return 'white'; // #00ffff spawn zone
  if (p.r === 255 && p.g === 255 && p.b === 0   && p.a > 0) return 'white'; // #ffff00 spawn direction

  let bestName = 'none';
  let bestDist = Infinity;
  for (const entry of PALETTE) {
    const d = Math.sqrt(
      (p.r - entry.r) ** 2 +
      (p.g - entry.g) ** 2 +
      (p.b - entry.b) ** 2
    );
    if (d < bestDist) { bestDist = d; bestName = entry.name; }
  }
  return bestDist <= TOLERANCE ? bestName : 'none';
}

// True if position is a magenta obstacle pixel or out-of-map when a map is loaded.
export function isObstacle(xCm, yCm) {
  if (!pixels) return false;
  const xPx = Math.floor(xCm * DISPLAY_SCALE); // cm → px for pixel sampling
  const yPx = Math.floor(yCm * DISPLAY_SCALE);
  if (xPx < 0 || yPx < 0 || xPx >= mapWidthPx || yPx >= mapHeightPx) return true;
  return getColorNameAt(xCm, yCm) === 'magenta';
}

// Returns true if the robot's bounding circle overlaps at least one magenta pixel.
export function isMagentaCollision(xCm, yCm, radiusCm) {
  if (!pixels) return false;
  if (getColorNameAt(xCm, yCm) === 'magenta') return true;
  const SAMPLES = 8;
  for (let i = 0; i < SAMPLES; i++) {
    const a = (i / SAMPLES) * 2 * Math.PI;
    if (getColorNameAt(xCm + Math.cos(a) * radiusCm, yCm + Math.sin(a) * radiusCm) === 'magenta') return true;
  }
  return false;
}

// Returns distance (cm) to nearest obstacle along heading ray, up to maxDistanceCm.
export function raycast(originX, originY, headingRad, maxDistanceCm = 300) {
  if (!pixels) return maxDistanceCm;
  const dx = Math.cos(headingRad);
  const dy = Math.sin(headingRad);
  const STEP = 0.5; // cm per step
  for (let d = STEP; d <= maxDistanceCm; d += STEP) {
    if (isObstacle(originX + dx * d, originY + dy * d)) return d;
  }
  return maxDistanceCm;
}

// Draw map image onto ctx in world-pixel space (camera transform already applied by caller).
// Map PNG native resolution = world cm × DISPLAY_SCALE, so drawImage at mapWidthCm * PX_PER_CM
// renders 1 map-px per screen-px (at camera.scale = 1).
export function drawMap(ctx) {
  if (!offscreenCanvas) return;
  ctx.drawImage(offscreenCanvas, 0, 0, mapWidthCm * PX_PER_CM, mapHeightCm * PX_PER_CM);
}
