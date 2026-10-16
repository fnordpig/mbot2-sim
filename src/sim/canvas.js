import { t } from '../i18n/index.js';
import { robot, resetRobot, ROBOT_CONSTANTS } from './robot.js';
import { step } from './kinematics.js';
import { PX_PER_CM, worldToScreen } from './world.js';
import { DISPLAY_SCALE, ROBOT_LENGTH_PX, ROBOT_WIDTH_PX } from './constants.js';
import { drawMap, hasMap, getMapSizeCm, getColorNameAt } from './map.js';
import { ledState, resetLeds } from './leds.js';
import { resetDisplay } from '../ui/display.js';
import { getQuadRGBWorldPositions, getQuadRGBProbeData, getUltrasonicConeRays, resetTickCache } from './sensors.js';
import { getEndOnCollision } from './settings.js';
import { appendConsoleMessage } from '../ui/console.js';

let ctx    = null;
let canvas = null;
let lastTime = 0;
let paused   = false;

const MAX_DT = 1 / 30;

const camera = { offsetX: 0, offsetY: 0, scale: 1 };

let isPanning    = false;
let panStartX    = 0;
let panStartY    = 0;
let panStartOffX = 0;
let panStartOffY = 0;

// ── Robot sprite ──────────────────────────────────────────────────────────────
// Loaded once at module init. Falls back to a procedural rectangle until ready.
const robotImg = new Image();
let robotSpriteLoaded = false;
robotImg.onload  = () => { robotSpriteLoaded = true; };
robotImg.onerror = () => { console.warn('[sim] robot sprite failed to load — using fallback rectangle'); };
robotImg.src = '/sprites/robot.png';

export function initSim() {
  canvas = document.getElementById('sim-canvas');
  ctx    = canvas.getContext('2d');
  lastTime = performance.now();

  canvas.addEventListener('wheel',      onWheel,    { passive: false });
  canvas.addEventListener('mousedown',  onMouseDown);
  canvas.addEventListener('mousemove',  onMouseMove);
  canvas.addEventListener('mouseup',    onMouseUp);
  canvas.addEventListener('mouseleave', onMouseUp);

  canvas.style.cursor = 'grab';
  requestAnimationFrame(loop);
  console.log('[sim] canvas initialised');
}

/** Resize canvas to match loaded map dimensions and reset camera to fit-to-view. */
export function resizeCanvas(mapInfo) {
  // mapInfo.width and mapInfo.height are in cm; convert to px for the canvas bitmap.
  canvas.width  = Math.round(mapInfo.width  * DISPLAY_SCALE);
  canvas.height = Math.round(mapInfo.height * DISPLAY_SCALE);
  resetCamera();
}

function onWheel(e) {
  e.preventDefault();
  // Convert CSS px → canvas bitmap px to keep zoom anchor at mouse position.
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (canvas.width  / rect.width);
  const my = (e.clientY - rect.top)  * (canvas.height / rect.height);

  const factor  = e.deltaY < 0 ? 1.1 : 1 / 1.1;
  const newScale = Math.min(16, Math.max(0.5, camera.scale * factor));

  camera.offsetX = mx - (mx - camera.offsetX) * (newScale / camera.scale);
  camera.offsetY = my - (my - camera.offsetY) * (newScale / camera.scale);
  camera.scale   = newScale;
}

function onMouseDown(e) {
  if (e.button !== 0) return;
  isPanning    = true;
  panStartX    = e.clientX;
  panStartY    = e.clientY;
  panStartOffX = camera.offsetX;
  panStartOffY = camera.offsetY;
  canvas.style.cursor = 'grabbing';
}

function onMouseMove(e) {
  if (!isPanning) return;
  // Convert CSS pixel delta → canvas bitmap pixel delta to keep panning 1:1
  const rect  = canvas.getBoundingClientRect();
  const scaleX = canvas.width  / rect.width;
  const scaleY = canvas.height / rect.height;
  camera.offsetX = panStartOffX + (e.clientX - panStartX) * scaleX;
  camera.offsetY = panStartOffY + (e.clientY - panStartY) * scaleY;
}

function onMouseUp() {
  if (!isPanning) return;
  isPanning = false;
  canvas.style.cursor = 'grab';
}

export function resetCamera() {
  camera.offsetX = 0;
  camera.offsetY = 0;
  camera.scale   = 1;
}

function loop(now) {
  const dtMs = now - lastTime;
  lastTime   = now;
  const dt   = Math.min(dtMs / 1000, MAX_DT);

  if (!paused) {
    const wasColliding = robot.collided;
    const endOnCollision = getEndOnCollision();
    step(robot, dt, { endOnCollision });
    if (robot.collision) {
      robot.lastCollision = robot.collision;
      if (!wasColliding && !endOnCollision) {
        appendConsoleMessage(t('COLLISION_AT', {
          x: robot.collision.x.toFixed(1), y: robot.collision.y.toFixed(1),
        }), 'warn');
      }
    }
  }

  // Clear per-tick sensor cache every frame so visualisations (cone, quad-RGB dots)
  // always reflect current robot position, even when no interpreter is running.
  resetTickCache();

  draw();
  requestAnimationFrame(loop);
}

function draw() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.setTransform(camera.scale, 0, 0, camera.scale, camera.offsetX, camera.offsetY);

  if (hasMap()) drawMap(ctx);

  ctx.globalAlpha = hasMap() ? 0.25 : 1.0;
  drawGrid();
  ctx.globalAlpha = 1.0;

  const mapSize = getMapSizeCm();
  if (mapSize) {
    ctx.strokeStyle = '#999';
    ctx.lineWidth   = 1 / camera.scale;
    ctx.strokeRect(0, 0, mapSize.wCm * PX_PER_CM, mapSize.hCm * PX_PER_CM);
  }

  const { xPx, yPx } = worldToScreen(robot.x, robot.y);

  // Ultrasonic cone rays — drawn before the robot so the sprite overlays them.
  const cone   = getUltrasonicConeRays();
  const coneFX = cone.ox * PX_PER_CM;
  const coneFY = cone.oy * PX_PER_CM;
  ctx.strokeStyle = 'rgba(0, 200, 255, 0.3)';
  ctx.lineWidth   = Math.max(0.5, 0.15 * PX_PER_CM) / camera.scale;
  for (let i = 0; i < 3; i++) {
    const hx = coneFX + Math.cos(cone.angles[i]) * cone.dists[i] * PX_PER_CM;
    const hy = coneFY + Math.sin(cone.angles[i]) * cone.dists[i] * PX_PER_CM;
    ctx.beginPath();
    ctx.moveTo(coneFX, coneFY);
    ctx.lineTo(hx, hy);
    ctx.stroke();
  }
  const halfRad = (ROBOT_CONSTANTS.ULTRASONIC_CONE_DEG / 2) * (Math.PI / 180);
  ctx.strokeStyle = 'rgba(0, 200, 255, 0.15)';
  ctx.lineWidth   = Math.max(0.3, 0.1 * PX_PER_CM) / camera.scale;
  ctx.beginPath();
  ctx.arc(coneFX, coneFY, cone.min * PX_PER_CM, robot.theta - halfRad, robot.theta + halfRad);
  ctx.stroke();

  // Collision ring — drawn behind the sprite, slightly larger than the robot bounding box.
  if (robot.collided) {
    ctx.save();
    ctx.translate(xPx, yPx);
    ctx.rotate(robot.theta);
    ctx.strokeStyle = 'red';
    ctx.lineWidth   = Math.max(1, 0.5 * PX_PER_CM) / camera.scale;
    const rX = ROBOT_LENGTH_PX / 2 + Math.max(2, 1 * PX_PER_CM);
    const rY = ROBOT_WIDTH_PX  / 2 + Math.max(2, 1 * PX_PER_CM);
    ctx.beginPath();
    ctx.ellipse(0, 0, rX, rY, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Robot sprite (or fallback rectangle if sprite not yet loaded).
  ctx.save();
  ctx.translate(xPx, yPx);
  ctx.rotate(robot.theta);
  if (robotSpriteLoaded) {
    ctx.drawImage(robotImg, -ROBOT_LENGTH_PX / 2, -ROBOT_WIDTH_PX / 2, ROBOT_LENGTH_PX, ROBOT_WIDTH_PX);
  } else {
    // Fallback until sprite loads
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(-ROBOT_LENGTH_PX / 2, -ROBOT_WIDTH_PX / 2, ROBOT_LENGTH_PX, ROBOT_WIDTH_PX);
  }
  ctx.restore();

  // LEDs — 5 dots positioned in the centre-rear of the robot body (close to centre, slightly behind).
  const ledR     = 0.7 * PX_PER_CM;  // world-space radius — scales with zoom
  const ledFront = -ROBOT_LENGTH_PX * 0.01;  // behind centre (negative = toward rear of sprite)
  const spread   = 2.0 * PX_PER_CM;
  const perpX    = -Math.sin(robot.theta);
  const perpY    =  Math.cos(robot.theta);
  for (let i = 0; i < 5; i++) {
    const offset = (i - 2) * spread;
    const lx = xPx + Math.cos(robot.theta) * ledFront + perpX * offset;
    const ly = yPx + Math.sin(robot.theta) * ledFront + perpY * offset;
    const led = ledState[i];
    ctx.beginPath();
    ctx.arc(lx, ly, ledR, 0, Math.PI * 2);
    ctx.fillStyle = led.on ? led.colour : '#333333';
    ctx.fill();
    ctx.strokeStyle = '#555';
    ctx.lineWidth   = 0.1 * PX_PER_CM;  // world-space — scales with zoom
    ctx.stroke();
  }

  // QuadRGB probe dots — four dots, one per probe, coloured with the live sampled pixel
  const probePositions = getQuadRGBWorldPositions();
  const probeData = getQuadRGBProbeData();
  const dotR = 3 / camera.scale;
  for (let i = 0; i < 4; i++) {
    const { xPx: dpx, yPx: dpy } = worldToScreen(probePositions[i].x, probePositions[i].y);
    const p = probeData[i];
    ctx.beginPath();
    ctx.arc(dpx, dpy, dotR, 0, Math.PI * 2);
    ctx.fillStyle  = 'rgb(' + p.r + ',' + p.g + ',' + p.b + ')';
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth   = 1 / camera.scale;
    ctx.stroke();
  }

  // HUD — screen space (reset transform so it's always top-left regardless of pan/zoom).
  // Font size is scaled up to compensate for CSS downscaling of the canvas, so the text
  // always appears at ~14 px visual size regardless of the native canvas resolution.
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const cssScale  = (canvas.getBoundingClientRect().width / canvas.width) || 1;
  drawCollisionMarker(cssScale);
  const hudFont   = Math.round(14 / cssScale);
  const hudLine   = Math.round(20 / cssScale);
  const hudX      = Math.round(10 / cssScale);
  const hudY0     = hudLine;
  const lineCount = paused ? 5 : 4;

  // Semi-transparent background behind HUD text
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, 0, Math.round(310 / cssScale), hudY0 + hudLine * lineCount + Math.round(6 / cssScale));

  ctx.fillStyle = '#eee';
  ctx.font = `${hudFont}px monospace`;
  ctx.fillText(`x:${robot.x.toFixed(1)}cm  y:${robot.y.toFixed(1)}cm  θ:${(robot.theta * 180 / Math.PI).toFixed(1)}\xB0`, hudX, hudY0);
  ctx.fillText(`vL:${robot.vL} vR:${robot.vR} RPM`, hudX, hudY0 + hudLine);
  ctx.fillText(`${t('HUD_DISTANCE')}:${robot.totalDistanceCm.toFixed(1)}cm`, hudX, hudY0 + hudLine * 2);
  const colour = getColorNameAt(robot.x, robot.y);
  const colourLabel = colour === 'none' ? t('HUD_NO_COLOUR') : t('BLOCK_' + colour.toUpperCase());
  ctx.fillText(`${t('HUD_COLOUR')}: ${colourLabel}`, hudX, hudY0 + hudLine * 3);
  if (paused) {
    ctx.fillStyle = '#f87171';
    ctx.fillText(t('HUD_PAUSED'), hudX, hudY0 + hudLine * 4);
  }
}

function drawCollisionMarker(cssScale) {
  const contact = robot.lastCollision;
  if (!contact) return;
  const x = contact.x * PX_PER_CM * camera.scale + camera.offsetX;
  const y = contact.y * PX_PER_CM * camera.scale + camera.offsetY;
  if (x < 0 || y < 0 || x > canvas.width || y > canvas.height) return;

  const size = 5 / cssScale;
  const font = 12 / cssScale;
  const padding = 4 / cssScale;
  const label = t('COLLISION_MARKER', { x: contact.x.toFixed(1), y: contact.y.toFixed(1) });
  ctx.save();
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 2 / cssScale;
  ctx.beginPath();
  ctx.moveTo(x - size, y - size);
  ctx.lineTo(x + size, y + size);
  ctx.moveTo(x + size, y - size);
  ctx.lineTo(x - size, y + size);
  ctx.stroke();
  ctx.font = `${font}px sans-serif`;
  const width = ctx.measureText(label).width + padding * 2;
  const left = Math.max(0, Math.min(x + size + padding, canvas.width - width));
  const top = Math.max(0, Math.min(y - font - padding, canvas.height - font - padding * 2));
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.fillRect(left, top, width, font + padding * 2);
  ctx.fillStyle = '#b91c1c';
  ctx.fillText(label, left + padding, top + font + padding / 2);
  ctx.restore();
}

function drawGrid() {
  const step = 10 * PX_PER_CM;  // grid line every 10 cm
  const mapSize = getMapSizeCm();
  const maxX = mapSize ? mapSize.wCm * PX_PER_CM : 400 * PX_PER_CM;
  const maxY = mapSize ? mapSize.hCm * PX_PER_CM : 400 * PX_PER_CM;

  ctx.strokeStyle = '#ddd';
  ctx.lineWidth   = 1 / camera.scale;
  for (let x = 0; x <= maxX; x += step) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, maxY); ctx.stroke();
  }
  for (let y = 0; y <= maxY; y += step) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(maxX, y); ctx.stroke();
  }
}

export function pauseSim()   { paused = true; }
export function resumeSim()  { paused = false; }
export function togglePause(){ paused = !paused; }
export function isPaused()   { return paused; }

export function resetSim() {
  resetRobot();
  resetLeds();
  resetDisplay();
}
