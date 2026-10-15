import { t } from '../i18n/index.js';
import { generateCode } from '../codegen/index.js';
import { createInterpreter, stepInterpreter, destroyInterpreter, isInterpreterPaused } from './interpreter.js';
import { RunState, getRunState, setRunState, asyncTicket } from './runState.js';
import { appendConsoleMessage, clear as clearConsole } from '../ui/console.js';
import { robot, resetMotors, ROBOT_CONSTANTS } from '../sim/robot.js';
import { resetTickCache, resetSensors, getQuadRGBProbeData } from '../sim/sensors.js';
import { isMagentaCollision } from '../sim/map.js';
import { robotAPI } from '../sim/robotAPI.js';

const STEP_BUDGET_PER_FRAME = 1000;

let _rafId = null;

export function run(workspace) {
  if (getRunState() === RunState.RUNNING || getRunState() === RunState.PAUSED_ASYNC) return;

  clearConsole();

  const jsCode = generateCode(workspace);
  console.log('--- Generated JS ---\n' + jsCode + '\n--- End Generated JS ---');

  try {
    createInterpreter(jsCode);
  } catch (err) {
    console.error('[runLoop] Interpreter init error:', err);
    appendConsoleMessage(t('PROGRAM_INIT_ERROR', { error: err.message }), 'error');
    setRunState(RunState.ERRORED);
    return;
  }

  resetSensors();
  robotAPI._resetMessageBus();
  setRunState(RunState.RUNNING);
  _rafId = requestAnimationFrame(_tick);
}

export function stop() {
  const state = getRunState();
  if (state === RunState.IDLE || state === RunState.STOPPED) return;

  if (_rafId !== null) {
    cancelAnimationFrame(_rafId);
    _rafId = null;
  }
  destroyInterpreter();

  // Clear any pending async ticket and zero motors
  asyncTicket.pending = false;
  asyncTicket.resolveCondition = null;
  asyncTicket.callback = null;
  resetMotors();

  setRunState(RunState.STOPPED);
  appendConsoleMessage(t('PROGRAM_STOPPED'), 'warn');
}

function _tick() {
  _rafId = null;

  if (getRunState() !== RunState.RUNNING && getRunState() !== RunState.PAUSED_ASYNC) return;

  // Clear per-tick sensor cache so sensors compute once per frame, not per loop iteration
  resetTickCache();

  // Populate DevTools-accessible simState with current probe samples each tick
  if (!window.simState) window.simState = {};
  window.simState.quadRGBProbes = getQuadRGBProbeData();

  // Magenta collision → halt the program cleanly (not an error, an expected obstacle hit)
  if (isMagentaCollision(robot.x, robot.y, ROBOT_CONSTANTS.BODY_RADIUS_CM)) {
    resetMotors();
    asyncTicket.pending = false;
    asyncTicket.resolveCondition = null;
    asyncTicket.callback = null;
    destroyInterpreter();
    setRunState(RunState.STOPPED);
    appendConsoleMessage(t('PROGRAM_COLLISION'), 'error');
    return;
  }

  // Check if a pending async operation has now resolved (canvas loop advances physics)
  if (asyncTicket.pending && asyncTicket.resolveCondition && asyncTicket.resolveCondition()) {
    asyncTicket.pending = false;
    asyncTicket.resolveCondition = null;
    const cb = asyncTicket.callback;
    asyncTicket.callback = null;
    if (cb) {
      cb();  // calls the js-interpreter resume callback → sets paused_ = false
    } else {
      // Ticket resolved but no resume callback registered — interpreter cannot unpause.
      // Stop rather than loop forever in PAUSED_ASYNC with nothing to resolve it.
      console.error('[runLoop] asyncTicket resolved with null callback');
      appendConsoleMessage(t('PROGRAM_ASYNC_ERROR'), 'error');
      destroyInterpreter();
      resetMotors();
      setRunState(RunState.ERRORED);
      return;
    }
  }

  // If interpreter is still paused, keep polling — physics continue in canvas loop
  if (isInterpreterPaused()) {
    if (getRunState() !== RunState.PAUSED_ASYNC) setRunState(RunState.PAUSED_ASYNC);
    _rafId = requestAnimationFrame(_tick);
    return;
  }

  // Interpreter unpaused: flip state back to RUNNING
  if (getRunState() === RunState.PAUSED_ASYNC) {
    setRunState(RunState.RUNNING);
  }

  try {
    for (let i = 0; i < STEP_BUDGET_PER_FRAME; i++) {
      if (!stepInterpreter()) {
        resetMotors(); // safety net: zero motors even if program had no explicit stop block
        setRunState(RunState.IDLE);
        appendConsoleMessage(t('PROGRAM_FINISHED'), 'info');
        destroyInterpreter();
        return;
      }
      if (isInterpreterPaused()) {
        setRunState(RunState.PAUSED_ASYNC);
        break;
      }
    }
  } catch (err) {
    console.error('[runLoop] Runtime error:', err);
    appendConsoleMessage(t('PROGRAM_RUNTIME_ERROR', { error: err.message }), 'error');
    setRunState(RunState.ERRORED);
    destroyInterpreter();
    return;
  }

  const current = getRunState();
  if (current === RunState.RUNNING || current === RunState.PAUSED_ASYNC) {
    _rafId = requestAnimationFrame(_tick);
  }
}

// Called by Phase 4-1+ async handlers to resume after a robot call completes.
export function resumeFromAsync() {
  if (getRunState() !== RunState.PAUSED_ASYNC) return;
  setRunState(RunState.RUNNING);
  if (_rafId === null) {
    _rafId = requestAnimationFrame(_tick);
  }
}
