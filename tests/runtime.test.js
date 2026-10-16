import test from 'node:test';
import assert from 'node:assert/strict';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import { run, stop } from '../src/runtime/runLoop.js';
import { stepInterpreter } from '../src/runtime/interpreter.js';
import { robot, resetRobot } from '../src/sim/robot.js';
import { robotAPI } from '../src/sim/robotAPI.js';
import { step } from '../src/sim/kinematics.js';
import { setMapData } from '../src/sim/map.js';
import { asyncTicket, getRunState, RunState } from '../src/runtime/runState.js';
import { setEndOnCollision } from '../src/sim/settings.js';

const frames = new Map();
let nextFrameId = 0;
const oscillators = [];

// Headless editor change events are unrelated to the interpreter's frame queue.
Blockly.Events.disable();
test.after(() => Blockly.Events.enable());

class AudioContextFixture {
  currentTime = 0;
  destination = {};
  createGain() { return { gain: {}, connect() {} }; }
  createOscillator() {
    const oscillator = {
      frequency: {}, stops: [], disconnected: false,
      connect() {}, start() {},
      stop(time) { this.stops.push(time); },
      disconnect() { this.disconnected = true; },
    };
    oscillators.push(oscillator);
    return oscillator;
  }
}

globalThis.window = { AudioContext: AudioContextFixture };
globalThis.requestAnimationFrame = callback => {
  const id = ++nextFrameId;
  frames.set(id, callback);
  return id;
};
globalThis.cancelAnimationFrame = id => frames.delete(id);

function frame() {
  assert.equal(frames.size, 1, 'exactly one interpreter frame should be scheduled');
  const [id, callback] = frames.entries().next().value;
  frames.delete(id);
  callback();
}

Blockly.Blocks.runtime_test = {
  init() { this.setPreviousStatement(true); this.setNextStatement(true); },
};

function runCode(code) {
  javascriptGenerator.forBlock.runtime_test = () => code;
  const workspace = new Blockly.Workspace();
  workspace.newBlock('runtime_test');
  try { run(workspace); } finally { workspace.dispose(); }
}

function assertStopped(state = RunState.ERRORED) {
  assert.equal(getRunState(), state);
  assert.equal(robot.vL, 0);
  assert.equal(robot.vR, 0);
  assert.equal(asyncTicket.pending, false);
  assert.equal(asyncTicket.callback, null);
  assert.equal(asyncTicket.resolveCondition, null);
  assert.equal(frames.size, 0, 'termination must cancel all interpreter frames');
  assert.equal(stepInterpreter(), false, 'the interpreter must be destroyed');
}

function assertAudioStopped() {
  assert.equal(oscillators.length, 1);
  assert.deepEqual(oscillators[0].stops, [30, undefined], 'stop the scheduled tone immediately');
  assert.equal(oscillators[0].disconnected, true);
}

test.beforeEach(() => {
  setEndOnCollision(true);
  resetRobot();
  oscillators.length = 0;
  setMapData({ imageData: null, width: 0, height: 0, offscreenCanvas: { width: 0, height: 0 } });
});

test.afterEach(() => {
  stop();
  setEndOnCollision(true);
  robotAPI.audio_stop();
  frames.clear();
  delete robotAPI.runtime_test_async;
});

test('runtime exceptions stop motors and destroy the interpreter', () => {
  runCode('robotAPI.drive("FORWARD", 30); missingFunction();\n');
  frame();
  assertStopped();
});

test('async completion exceptions clear the pending operation', () => {
  robotAPI.runtime_test_async = function(callback) {
    robotAPI.drive('FORWARD', 30);
    robotAPI.play_tone(440, 30000);
    asyncTicket.pending = true;
    asyncTicket.callback = callback;
    asyncTicket.resolveCondition = () => { throw new Error('completion failed'); };
  };
  robotAPI.runtime_test_async._async = true;
  runCode('robotAPI.runtime_test_async();\n');
  frame();
  assert.equal(getRunState(), RunState.PAUSED_ASYNC);
  assert.doesNotThrow(() => frame());
  assertStopped();
  assertAudioStopped();
});

test('code generation errors become a stopped error state', () => {
  javascriptGenerator.forBlock.runtime_test = () => { throw new Error('generation failed'); };
  const workspace = new Blockly.Workspace();
  workspace.newBlock('runtime_test');
  robotAPI.drive('FORWARD', 30);
  robotAPI.play_tone(440, 30000);
  try { assert.doesNotThrow(() => run(workspace)); } finally { workspace.dispose(); }
  assertStopped();
  assertAudioStopped();
});

test('a program can run again after an exception', () => {
  runCode('robotAPI.drive("FORWARD", 30); missingFunction();\n');
  frame();
  runCode('robotAPI.drive("FORWARD", 10);\n');
  frame();
  assertStopped(RunState.IDLE);
});

test('real drive, turn and wait actions complete in order', () => {
  const heading = robot.theta;
  runCode('robotAPI.drive_for("FORWARD", 30, 10); robotAPI.turn_for("RIGHT", 30, 90); robotAPI.wait_ms(0);\n');
  for (let i = 0; i < 300 && frames.size; i++) {
    step(robot, 1 / 30);
    frame();
  }
  assertStopped(RunState.IDLE);
  assert.ok(Math.abs(robot.totalDistanceCm - 10) < 1e-9);
  assert.ok(Math.abs(robot.theta - heading - Math.PI / 2) < 1e-9);
});

test('stop cancels a real pending drive and sound; a new run starts cleanly', () => {
  runCode('robotAPI.play_tone(440, 30000); robotAPI.drive_for("FORWARD", 30, 100);\n');
  frame();
  assert.equal(getRunState(), RunState.PAUSED_ASYNC);
  const pendingFrame = [...frames.keys()][0];
  stop();
  assert.equal(frames.has(pendingFrame), false);
  assertStopped(RunState.STOPPED);
  assertAudioStopped();
  runCode('robotAPI.wait_ms(0);\n');
  frame();
  frame();
  assertStopped(RunState.IDLE);
});

test('stop before the first frame cancels execution', () => {
  runCode('robotAPI.drive("FORWARD", 30);\n');
  stop();
  assertStopped(RunState.STOPPED);
});

test('normal completion preserves fire-and-forget audio until Stop or Reset', () => {
  runCode('robotAPI.play_tone(440, 30000);\n');
  frame();
  assertStopped(RunState.IDLE);
  assert.deepEqual(oscillators[0].stops, [30]);
  assert.equal(oscillators[0].disconnected, false);
  stop(); // Reset calls this same entry point even after normal completion.
  assertStopped(RunState.IDLE);
  assertAudioStopped();
});

test('stop also silences remaining audio in the already stopped state', () => {
  runCode('while (true) {}\n');
  stop();
  robotAPI.play_tone(440, 30000);
  stop();
  assertStopped(RunState.STOPPED);
  assertAudioStopped();
});

test('magenta collision stops a pending action and audio', () => {
  runCode('robotAPI.play_tone(440, 30000); robotAPI.drive_for("FORWARD", 30, 100);\n');
  frame();
  robot.x = 0;
  robot.y = 0;
  setMapData({ imageData: new Uint8ClampedArray([255, 0, 255, 255]), width: 1, height: 1,
    offscreenCanvas: { width: 1, height: 1 } });
  frame();
  assertStopped(RunState.STOPPED);
  assertAudioStopped();
});

test('a resolved async ticket without a callback stops execution and sound', () => {
  runCode('robotAPI.play_tone(440, 30000); robotAPI.wait_ms(0);\n');
  frame();
  asyncTicket.callback = null;
  frame();
  assertStopped();
  assertAudioStopped();
});

test('runtime errors silence audio immediately', () => {
  runCode('robotAPI.play_tone(440, 30000); missingFunction();\n');
  frame();
  assertStopped();
  assertAudioStopped();
});

test('interpreter construction failures stop prior audio', () => {
  robotAPI.play_tone(440, 30000);
  runCode('var = ;\n');
  assertStopped();
  assertAudioStopped();
});

test('a physics contact ends execution even when the circle stops outside the wall', () => {
  runCode('robotAPI.play_tone(440, 30000); robotAPI.drive_for("FORWARD", 30, 100);\n');
  frame();
  robot.collided = true;
  robot.collision = { x: 10, y: 10, normalX: -1, normalY: 0 };
  frame();
  assertStopped(RunState.STOPPED);
  assertAudioStopped();
});

test('disabling collision stopping keeps execution and pending movement active', () => {
  setEndOnCollision(false);
  runCode('robotAPI.play_tone(440, 30000); robotAPI.drive_for("FORWARD", 30, 100);\n');
  frame();
  robot.x = 0;
  robot.y = 0;
  robot.collided = true;
  robot.collision = { x: 0, y: 0, normalX: -1, normalY: 0 };
  setMapData({ imageData: new Uint8ClampedArray([255, 0, 255, 255]), width: 1, height: 1,
    offscreenCanvas: { width: 1, height: 1 } });
  frame();
  assert.equal(getRunState(), RunState.PAUSED_ASYNC);
  assert.equal(asyncTicket.pending, true);
  assert.equal(robot.vL, 30);
  assert.equal(robot.vR, 30);
  assert.equal(frames.size, 1);
  assert.deepEqual(oscillators[0].stops, [30]);
  stop();
  assertStopped(RunState.STOPPED);
  assertAudioStopped();
});

for (const command of ['drive_for("FORWARD", 30, 0.05)', 'curve_for("FORWARD", 30, 20, 0.05)']) {
  test(`${command} completes its wheel travel without snapping a stalled robot backwards`, () => {
    setEndOnCollision(false);
    const pixels = new Uint8ClampedArray(160 * 160 * 4);
    for (let y = 0; y < 160; y++) {
      const offset = (y * 160 + 100) * 4;
      pixels.set([255, 0, 255, 255], offset);
    }
    setMapData({ imageData: pixels, width: 20, height: 20, offscreenCanvas: { width: 160, height: 160 } });
    robot.x = 8;
    robot.y = 10;
    robot.theta = 0;
    runCode(`robotAPI.${command};\n`);
    frame();
    step(robot, 1 / 30, { endOnCollision: false });
    assert.equal(robot.collided, true);
    frame();
    assertStopped(RunState.IDLE);
    assert.ok(Math.abs(robot.x - 8) < 1e-5, 'blocked motion must not be undone as free travel');
    assert.ok(Math.abs(robot.y - 10) < 1e-5);
    assert.ok(Math.abs(robot.totalDistanceCm - 0.05) < 1e-9);
  });
}
