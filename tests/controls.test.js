import test from 'node:test';
import assert from 'node:assert/strict';

// Only the image/DOM boundaries are stubbed; the controls listener and pause/run
// state below are the same modules used by the browser application.
class Element extends EventTarget {
  constructor(tagName, parentElement = null, attributes = {}) {
    super();
    this.tagName = tagName;
    this.parentElement = parentElement;
    this.attributes = attributes;
    this.isContentEditable = attributes.contenteditable === 'true';
  }
  getAttribute(name) { return this.attributes[name] ?? null; }
}

const originalImage = Object.getOwnPropertyDescriptor(globalThis, 'Image');
const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
globalThis.Image = class {};
const document = new EventTarget();
const controls = new Map();
document.getElementById = id => {
  if (!controls.has(id)) controls.set(id, new Element('BUTTON'));
  return controls.get(id);
};
globalThis.document = document;

const { initControls } = await import('../src/ui/controls.js');
const { isPaused, resumeSim } = await import('../src/sim/canvas.js');
const { RunState, setRunState } = await import('../src/runtime/runState.js');
initControls();

function pressSpace(target = new Element('CANVAS'), options = {}) {
  const event = new Event('keydown', { cancelable: true });
  for (const [name, value] of Object.entries({ code: 'Space', target, ...options })) {
    Object.defineProperty(event, name, { value });
  }
  document.dispatchEvent(event);
  return event;
}

test.beforeEach(() => {
  resumeSim();
  setRunState(RunState.IDLE);
});
test.after(() => {
  for (const [name, descriptor] of [['Image', originalImage], ['document', originalDocument]]) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete globalThis[name];
  }
});

test('Space preserves native controls and their nested targets', () => {
  for (const tagName of ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'A', 'SUMMARY']) {
    const control = new Element(tagName);
    for (const target of [control, new Element('SPAN', control)]) {
      assert.equal(pressSpace(target).defaultPrevented, false, tagName);
      assert.equal(isPaused(), false, tagName);
    }
  }
});

test('Space preserves editable areas and interactive ARIA ancestors', () => {
  const editable = new Element('DIV', null, { contenteditable: 'true' });
  const inheritedEditable = new Element('SPAN', editable);
  const widget = new Element('DIV', null, { role: 'button' });
  const listbox = new Element('DIV', null, { role: 'listbox' });
  for (const target of [editable, inheritedEditable, widget, new Element('SVG', widget), listbox]) {
    assert.equal(pressSpace(target).defaultPrevented, false);
    assert.equal(isPaused(), false);
  }
});

test('Space ignores modifiers, composition, repetition, and previously handled events', () => {
  for (const flag of ['altKey', 'ctrlKey', 'metaKey', 'shiftKey', 'isComposing', 'repeat']) {
    assert.equal(pressSpace(undefined, { [flag]: true }).defaultPrevented, false, flag);
    assert.equal(isPaused(), false, flag);
  }
  const handled = new Event('keydown', { cancelable: true });
  Object.defineProperty(handled, 'code', { value: 'Space' });
  Object.defineProperty(handled, 'target', { value: new Element('CANVAS') });
  handled.preventDefault();
  document.dispatchEvent(handled);
  assert.equal(isPaused(), false);
  assert.equal(pressSpace(undefined, { code: 'Enter' }).defaultPrevented, false);
  assert.equal(isPaused(), false);
});

test('plain Space toggles the simulation once and leaves executing programs alone', () => {
  assert.equal(pressSpace().defaultPrevented, true);
  assert.equal(isPaused(), true);
  assert.equal(pressSpace(undefined, { repeat: true }).defaultPrevented, false);
  assert.equal(isPaused(), true);
  assert.equal(pressSpace().defaultPrevented, true);
  assert.equal(isPaused(), false);
  for (const state of [RunState.RUNNING, RunState.PAUSED_ASYNC]) {
    setRunState(state);
    assert.equal(pressSpace().defaultPrevented, false, state);
    assert.equal(isPaused(), false, state);
  }
});
