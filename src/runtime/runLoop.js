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

  try {
    const jsCode = generateCode(workspace);
    console.log('--- Generated JS ---\n' + jsCode + '\n--- End Generated JS ---');
    createInterpreter(jsCode);
  } catch (err) {
    clearExecution();
    console.error('[runLoop] Interpreter init error:', err);
    appendConsoleMessage('Erro ao iniciar o programa: ' + err.message, 'error');
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
  // Reset also calls stop after successful completion, when a tone may still play.
  clearExecution();
  if (state === RunState.IDLE || state === RunState.STOPPED) return;

  setRunState(RunState.STOPPED);
  appendConsoleMessage('Programa interrompido.', 'warn');
}

function clearExecution(stopAudio = true) {
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
  if (stopAudio) robotAPI.audio_stop();
}

function _tick() {
  _rafId = null;
  try {
    advanceInterpreter();
  } catch (err) {
    clearExecution();
    console.error('[runLoop] Runtime error:', err);
    appendConsoleMessage('Erro de execução: ' + err.message, 'error');
    setRunState(RunState.ERRORED);
  }
}

function advanceInterpreter() {
  if (getRunState() !== RunState.RUNNING && getRunState() !== RunState.PAUSED_ASYNC) return;

  // Clear per-tick sensor cache so sensors compute once per frame, not per loop iteration
  resetTickCache();

  // Populate DevTools-accessible simState with current probe samples each tick
  if (!window.simState) window.simState = {};
  window.simState.quadRGBProbes = getQuadRGBProbeData();

  // Magenta collision → halt the program cleanly (not an error, an expected obstacle hit)
  if (isMagentaCollision(robot.x, robot.y, ROBOT_CONSTANTS.BODY_RADIUS_CM)) {
    clearExecution();
    setRunState(RunState.STOPPED);
    appendConsoleMessage('Colisão detectada.', 'error');
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
      appendConsoleMessage('Erro interno: operação assíncrona sem retorno.', 'error');
      clearExecution();
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

  for (let i = 0; i < STEP_BUDGET_PER_FRAME; i++) {
    if (!stepInterpreter()) {
      clearExecution(false); // Let fire-and-forget tones finish after normal completion.
      setRunState(RunState.IDLE);
      appendConsoleMessage('Programa terminado.', 'info');
      return;
    }
    if (isInterpreterPaused()) {
      setRunState(RunState.PAUSED_ASYNC);
      break;
    }
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
