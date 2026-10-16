import { getEndOnCollision, setEndOnCollision } from '../sim/settings.js';
import { getRunState, onRunStateChange, RunState } from '../runtime/runState.js';

export function initSettingsMenu() {
  const opener = document.getElementById('btn-settings');
  const dialog = document.getElementById('settings-dialog');
  const close = document.getElementById('btn-settings-close');
  const map = document.getElementById('map-select');
  const expert = document.getElementById('toolbox-mode');
  const endOnCollision = document.getElementById('end-on-collision');
  const runningHint = document.getElementById('settings-running-hint');

  endOnCollision.checked = getEndOnCollision();
  opener.addEventListener('click', () => dialog.showModal());
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => opener.focus());
  endOnCollision.addEventListener('change', () => setEndOnCollision(endOnCollision.checked));

  const syncDisabled = () => {
    const state = getRunState();
    const running = state === RunState.RUNNING || state === RunState.PAUSED_ASYNC;
    for (const input of [map, expert, endOnCollision]) input.disabled = running;
    runningHint.hidden = !running;
  };
  onRunStateChange(syncDisabled);
  syncDisabled();
}
