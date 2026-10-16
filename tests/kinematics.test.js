import test from 'node:test';
import assert from 'node:assert/strict';
import { step } from '../src/sim/kinematics.js';
import { setMapData } from '../src/sim/map.js';
import { ROBOT_CONSTANTS } from '../src/sim/robot.js';

const radius = ROBOT_CONSTANTS.BODY_RADIUS_CM;
const speed = ROBOT_CONSTANTS.WHEEL_CIRCUMFERENCE_CM;

function map(wall = () => false) {
  const size = 640;
  const pixels = new Uint8ClampedArray(size * size * 4).fill(255);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    if (wall(x / 8, y / 8)) pixels[(y * size + x) * 4 + 1] = 0;
  }
  setMapData({ imageData: pixels, width: 80, height: 80, offscreenCanvas: { width: size, height: size } });
}

function robot(x, y, theta = 0) {
  return { x, y, theta, vL: 60, vR: 60, totalDistanceCm: 0, totalRotationRad: 0,
    encoderLeftAbs: 0, encoderRightAbs: 0, gyroCumulativeRad: 0 };
}

function near(actual, expected, epsilon = 1e-5) {
  assert.ok(Math.abs(actual - expected) < epsilon, `${actual} should be near ${expected}`);
}

test('default collision mode stops the complete circle at first contact without tunneling', () => {
  map((x) => x === 40);
  const r = robot(20, 30);
  step(r, 2);
  near(r.x, 40 - radius);
  near(r.y, 30);
  assert.equal(r.collided, true);
  near(r.collision.x, 40);
  near(r.collision.y, 30);
  near(r.collision.normalX, -1);
  near(r.collision.normalY, 0);
});

test('wall grinding keeps the tangential velocity and wheel odometry, stalls head-on and allows reversing', () => {
  map((x) => x === 40);
  const r = robot(40 - radius, 25, Math.PI / 4);
  step(r, 0.25, { endOnCollision: false });
  near(r.x, 40 - radius);
  near(r.y, 25 + speed * 0.25 / Math.sqrt(2));
  near(r.totalDistanceCm, speed * 0.25);
  near(r.encoderLeftAbs, 0.25);
  near(r.encoderRightAbs, 0.25);
  r.theta = 0;
  const y = r.y;
  step(r, 0.25, { endOnCollision: false });
  near(r.x, 40 - radius);
  near(r.y, y);
  r.vL = r.vR = -60;
  step(r, 0.25, { endOnCollision: false });
  near(r.x, 40 - radius - speed * 0.25);
  assert.equal(r.collided, false);
  assert.equal(r.collision, null);
});

test('raster diagonal walls redirect motion along their angle rather than a world axis', () => {
  map((x, y) => Math.abs(x + y - 65) < 0.13);
  const r = robot(25, 25);
  for (let i = 0; i < 90; i++) step(r, 1 / 60, { endOnCollision: false });
  // At contact a horizontal command has half its x component and half its -y component.
  const before = { x: r.x, y: r.y };
  for (let i = 0; i < 30; i++) step(r, 1 / 60, { endOnCollision: false });
  near(r.x - before.x, speed * 0.5 / 2, 0.15);
  near(r.y - before.y, -speed * 0.5 / 2, 0.15);
  assert.ok(r.x > 45, `expected diagonal sliding, x=${r.x}`);
  assert.ok(r.y < 14, `expected upward sliding, y=${r.y}`);
  assert.ok(r.x + r.y < 65 - radius * Math.sqrt(2) + 0.01);
});

test('corners and map boundaries block the footprint while steering and gyro readings continue', () => {
  map((x, y) => x === 40 || y === 40);
  const r = robot(30, 30, Math.PI / 4);
  step(r, 5, { endOnCollision: false });
  near(r.x, 40 - radius);
  near(r.y, 40 - radius);
  r.vL = 60;
  r.vR = -60;
  const theta = r.theta;
  step(r, 0.1, { endOnCollision: false });
  const rotation = 2 * speed / ROBOT_CONSTANTS.TRACK_WIDTH_CM * 0.1;
  near(r.theta, theta + rotation);
  near(r.gyroCumulativeRad, rotation);
  near(r.totalRotationRad, rotation);
  const edge = robot(10, 10, Math.PI);
  step(edge, 5, { endOnCollision: false });
  near(edge.x, radius);
  near(edge.collision.x, 0);
  near(edge.collision.normalX, 1);
});

test('a shallow raster wall preserves the projection onto its non-diagonal tangent', () => {
  map((x, y) => Math.abs(y - 0.5 * x - 20) < 0.13);
  const r = robot(30, 22, Math.PI / 2);
  for (let i = 0; i < 90; i++) step(r, 1 / 60, { endOnCollision: false });
  const before = { x: r.x, y: r.y };
  for (let i = 0; i < 30; i++) step(r, 1 / 60, { endOnCollision: false });
  // Project (0, speed) onto the unit tangent (2, 1) / sqrt(5).
  near(r.x - before.x, speed * 0.5 * 2 / 5, 0.2);
  near(r.y - before.y, speed * 0.5 / 5, 0.2);
});

test('thin walls remain solid at shallow incidence while unobstructed motion is unchanged', () => {
  map((x) => x === 40);
  const r = robot(30, 20, Math.PI / 3);
  for (let i = 0; i < 80; i++) {
    step(r, 1 / 60, { endOnCollision: false });
    assert.ok(r.x <= 40 - radius + 1e-6);
  }
  map();
  const free = robot(25, 25, Math.PI / 6);
  step(free, 0.5);
  near(free.x, 25 + speed * 0.5 * Math.cos(Math.PI / 6));
  near(free.y, 25 + speed * 0.5 * Math.sin(Math.PI / 6));
  assert.equal(free.collided, false);
  assert.equal(free.collision, null);
});

test('an initially overlapping footprint cannot drive deeper into a wall but can reverse away', () => {
  map((x) => x === 40);
  const r = robot(36, 25);
  step(r, 0.05, { endOnCollision: false });
  near(r.x, 36);
  near(r.y, 25);
  assert.equal(r.collided, true);
  r.vL = r.vR = -60;
  step(r, 0.05, { endOnCollision: false });
  assert.ok(r.x < 35.5);
  assert.equal(r.collided, false);
});

test('a footprint initially across the map corner stalls outward and can drive back inside', () => {
  map();
  const r = robot(radius - 0.5, radius - 0.5, -3 * Math.PI / 4);
  step(r, 0.1, { endOnCollision: false });
  near(r.x, radius - 0.5);
  near(r.y, radius - 0.5);
  assert.equal(r.collided, true);
  assert.ok(r.collision.x === 0 || r.collision.y === 0);
  r.vL = r.vR = -60;
  step(r, 0.1, { endOnCollision: false });
  assert.ok(r.x > radius);
  assert.ok(r.y > radius);
  assert.equal(r.collided, false);
  assert.equal(r.collision, null);
});
