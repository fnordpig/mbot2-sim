import test from 'node:test';
import assert from 'node:assert/strict';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import { run, stop } from '../src/runtime/runLoop.js';
import { robot } from '../src/sim/robot.js';
import { robotAPI } from '../src/sim/robotAPI.js';
import { asyncTicket, getRunState, RunState } from '../src/runtime/runState.js';

let frame;
globalThis.window = {};
globalThis.requestAnimationFrame = callback => { frame = callback; return 1; };
globalThis.cancelAnimationFrame = () => { frame = null; };

Blockly.Blocks.runtime_test = {
  init() { this.setPreviousStatement(true); this.setNextStatement(true); },
};

function runCode(code) {
  javascriptGenerator.forBlock.runtime_test = () => code;
  const workspace = new Blockly.Workspace();
  workspace.newBlock('runtime_test');
  try { run(workspace); } finally { workspace.dispose(); }
}

function assertStopped() {
  assert.equal(getRunState(), RunState.ERRORED);
  assert.equal(robot.vL, 0);
  assert.equal(robot.vR, 0);
  assert.equal(asyncTicket.pending, false);
  assert.equal(asyncTicket.callback, null);
  assert.equal(asyncTicket.resolveCondition, null);
}

test.afterEach(() => {
  stop();
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
});

test('code generation errors become a stopped error state', () => {
  javascriptGenerator.forBlock.runtime_test = () => { throw new Error('generation failed'); };
  const workspace = new Blockly.Workspace();
  workspace.newBlock('runtime_test');
  robotAPI.drive('FORWARD', 30);
  try { assert.doesNotThrow(() => run(workspace)); } finally { workspace.dispose(); }
  assertStopped();
});

test('a program can run again after an exception', () => {
  runCode('robotAPI.drive("FORWARD", 30); missingFunction();\n');
  frame();
  runCode('robotAPI.drive("FORWARD", 10);\n');
  frame();
  assert.equal(getRunState(), RunState.IDLE);
  assert.equal(robot.vL, 0);
  assert.equal(robot.vR, 0);
});
