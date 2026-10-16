import test from 'node:test';
import assert from 'node:assert/strict';
import { initSettingsMenu } from '../src/ui/settings.js';
import { getEndOnCollision, setEndOnCollision, initSimulationSettings } from '../src/sim/settings.js';
import { getRunState, setRunState, RunState } from '../src/runtime/runState.js';

// The dialog boundary supplies the browser's modal/keyboard behaviour; all
// application listeners, run-state transitions, and setting storage are real.
class Element extends EventTarget {
  disabled = false;
  checked = false;
  hidden = false;
  open = false;
  focus() { document.activeElement = this; }
  showModal() { this.open = true; }
  close() {
    this.open = false;
    this.dispatchEvent(new Event('close'));
  }
  pressEscape() {
    const event = new Event('cancel', { cancelable: true });
    this.dispatchEvent(event);
    if (!event.defaultPrevented) this.close();
  }
}

const descriptors = new Map(['document', 'localStorage'].map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
const elements = new Map([
  'btn-settings', 'settings-dialog', 'btn-settings-close', 'map-select',
  'toolbox-mode', 'end-on-collision', 'settings-running-hint',
].map(id => [id, new Element()]));
const data = new Map();
const storage = {
  getItem: key => data.get(key) ?? null,
  setItem: (key, value) => data.set(key, String(value)),
};
globalThis.document = { activeElement: null, getElementById: id => elements.get(id) };
globalThis.localStorage = storage;
const element = id => elements.get(id);

initSimulationSettings();
setEndOnCollision(false);
initSettingsMenu();

test.after(() => {
  setRunState(RunState.IDLE);
  for (const [name, descriptor] of descriptors) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete globalThis[name];
  }
});

test('Settings reflects a saved collision preference and saves changes for the next session', () => {
  assert.equal(element('end-on-collision').checked, false);
  element('end-on-collision').checked = true;
  element('end-on-collision').dispatchEvent(new Event('change'));
  assert.equal(getEndOnCollision(), true);
  initSimulationSettings();
  assert.equal(getEndOnCollision(), true);
  element('end-on-collision').checked = false;
  element('end-on-collision').dispatchEvent(new Event('change'));
  assert.equal(getEndOnCollision(), false);
  initSimulationSettings();
  assert.equal(getEndOnCollision(), false);
});

test('Settings can be inspected during execution while changes wait until the program stops', () => {
  const inputs = ['map-select', 'toolbox-mode', 'end-on-collision'];
  for (const state of [RunState.RUNNING, RunState.PAUSED_ASYNC]) {
    setRunState(state);
    element('btn-settings').dispatchEvent(new Event('click'));
    assert.equal(element('settings-dialog').open, true);
    for (const id of inputs) assert.equal(element(id).disabled, true, `${state}: ${id}`);
    assert.equal(element('settings-running-hint').hidden, false);
    assert.equal(element('btn-settings-close').disabled, false);
    element('btn-settings-close').dispatchEvent(new Event('click'));
    assert.equal(element('settings-dialog').open, false);
    assert.equal(getRunState(), state);
  }
  for (const state of [RunState.STOPPED, RunState.ERRORED, RunState.IDLE]) {
    setRunState(state);
    for (const id of inputs) assert.equal(element(id).disabled, false, `${state}: ${id}`);
    assert.equal(element('settings-running-hint').hidden, true);
  }
});

test('Close and native Escape return focus to the Settings button', () => {
  const opener = element('btn-settings');
  const dialog = element('settings-dialog');
  for (const dismiss of [
    () => element('btn-settings-close').dispatchEvent(new Event('click')),
    () => dialog.pressEscape(),
  ]) {
    opener.dispatchEvent(new Event('click'));
    assert.equal(dialog.open, true);
    element('map-select').focus();
    dismiss();
    assert.equal(dialog.open, false);
    assert.equal(document.activeElement, opener);
  }
});
