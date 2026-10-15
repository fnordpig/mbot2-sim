import test from 'node:test';
import assert from 'node:assert/strict';
import * as Blockly from 'blockly';
import { initProgramIO, loadProgramFromFile, newProgram } from '../src/ui/programIO.js';
import { RunState, setRunState } from '../src/runtime/runState.js';

const STORAGE_KEY = 'mbot2sim:lastProgram';
const globals = ['window', 'localStorage', 'FileReader'];
const descriptors = new Map(globals.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
test.after(() => {
  for (const name of globals) {
    if (descriptors.get(name)) Object.defineProperty(globalThis, name, descriptors.get(name));
    else delete globalThis[name];
  }
});
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const xml = (value, id = 'number') => `<xml xmlns="https://developers.google.com/blockly/xml"><block type="math_number" id="${id}"><field name="NUM">${value}</field></block></xml>`;
const serialize = ws => Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(ws));

function fixture(saved = xml(12)) {
  const data = new Map(saved ? [[STORAGE_KEY, saved]] : []);
  const alerts = [];
  const window = Object.assign(new EventTarget(), { confirm: () => true, alert: text => alerts.push(text) });
  const storage = {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: key => data.delete(key),
  };
  Object.defineProperty(globalThis, 'window', { configurable: true, writable: true, value: window });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, writable: true, value: storage });
  globalThis.FileReader = class {
    readAsText(file) {
      if (file.error) this.onerror();
      else this.onload({ target: { result: file.text } });
    }
  };
  setRunState(RunState.IDLE);
  const ws = new Blockly.Workspace();
  let cleanup;
  return {
    ws, data, alerts, window, storage,
    init() { cleanup = initProgramIO(ws); },
    load(text) { loadProgramFromFile({ text }, ws); },
    dispose() {
      cleanup?.();
      setRunState(RunState.IDLE);
      Blockly.Events.disable();
      try { ws.dispose(); } finally { Blockly.Events.enable(); }
    },
  };
}

test('rejected imports preserve both the current and saved program, including after debounce', async () => {
  const f = fixture();
  try {
    f.init();
    const before = serialize(f.ws);
    const saved = f.data.get(STORAGE_KEY);
    for (const invalid of [
      '<xml><block type="review_missing_block"/></xml>',
      '<xml><block',
      '<html/>',
      '<xml><block type="math_number"><value name="MISSING"><block type="math_number"/></value></block></xml>',
    ]) {
      f.load(invalid);
      assert.equal(serialize(f.ws), before);
      assert.equal(f.data.get(STORAGE_KEY), saved);
      assert.equal(Blockly.Events.isEnabled(), true);
      assert.equal(Blockly.Events.getRecordUndo(), true);
      assert.equal(Blockly.Events.getGroup(), '');
    }
    await wait(600);
    assert.equal(f.data.get(STORAGE_KEY), saved);
    assert.equal(f.alerts.length, 4);
    loadProgramFromFile({ error: true }, f.ws);
    assert.equal(f.alerts.length, 5);
  } finally { f.dispose(); }
});

test('valid imports replace and persist the complete program and discard old undo history', async () => {
  const f = fixture();
  try {
    f.init();
    f.ws.getBlockById('number').setFieldValue(13, 'NUM');
    await wait(10);
    f.load(`<xml xmlns="https://developers.google.com/blockly/xml">
      <variables><variable id="student">élève นักเรียน 学生</variable></variables>
      <block type="math_arithmetic" id="sum"><field name="OP">ADD</field>
        <value name="A"><shadow type="math_number"><field name="NUM">1</field></shadow>
          <block type="math_number" id="replacement"><field name="NUM">42</field></block></value>
        <value name="B"><shadow type="math_number"><field name="NUM">2</field></shadow></value>
      </block></xml>`);
    assert.equal(f.alerts.length, 0);
    assert.equal(f.ws.getBlockById('number'), null);
    assert.equal(f.ws.getBlockById('replacement').getFieldValue('NUM'), 42);
    assert.equal(f.ws.getVariableById('student').name, 'élève นักเรียน 学生');
    assert.equal(f.data.get(STORAGE_KEY), serialize(f.ws));
    f.ws.undo(false);
    assert.equal(f.ws.getBlockById('number'), null);
    await wait(600);
    assert.equal(f.data.get(STORAGE_KEY), serialize(f.ws));
  } finally { f.dispose(); }
});

test('a live reconstruction failure rolls back the program and restores working undo', async () => {
  const f = fixture();
  Blockly.Blocks.import_failure_probe = {
    init() { this.appendDummyInput().appendField('import probe'); },
    saveExtraState() { return {}; },
    loadExtraState() { throw new Error('live rendering failed'); },
  };
  try {
    f.init();
    const before = serialize(f.ws);
    const saved = f.data.get(STORAGE_KEY);
    f.load('<xml><block type="import_failure_probe"/></xml>');
    assert.equal(f.alerts.length, 1);
    assert.equal(serialize(f.ws), before);
    assert.equal(f.data.get(STORAGE_KEY), saved);
    assert.equal(Blockly.Events.getRecordUndo(), true);
    assert.equal(Blockly.Events.getGroup(), '');
    assert.equal(Blockly.Events.isEnabled(), true);
    f.ws.getBlockById('number').setFieldValue(99, 'NUM');
    await wait(10);
    f.ws.undo(false);
    assert.equal(f.ws.getBlockById('number').getFieldValue('NUM'), 12);
  } finally {
    f.dispose();
    delete Blockly.Blocks.import_failure_probe;
  }
});

test('unavailable storage does not abort initialization, editing, import or New', () => {
  const f = fixture();
  try {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() { throw new DOMException('storage unavailable', 'SecurityError'); },
    });
    assert.doesNotThrow(() => f.init());
    f.load(xml(55));
    assert.equal(f.alerts.length, 0);
    assert.equal(f.ws.getBlockById('number').getFieldValue('NUM'), 55);
    assert.doesNotThrow(() => f.window.dispatchEvent(new Event('pagehide')));
    assert.doesNotThrow(() => newProgram(f.ws));
    assert.equal(f.ws.getAllBlocks(false).length, 0);
  } finally { f.dispose(); }
});

test('an unsupported saved program is retained for recovery while the editor still initializes', () => {
  const saved = '<xml><block type="future_block"/></xml>';
  const f = fixture(saved);
  try {
    f.ws.newBlock('math_number', 'existing');
    assert.doesNotThrow(() => f.init());
    assert.equal(f.ws.getAllBlocks(false).length, 1);
    assert.ok(f.ws.getBlockById('existing'));
    assert.equal(f.data.get(STORAGE_KEY), saved);
    f.window.dispatchEvent(new Event('pagehide'));
    assert.equal(f.data.get(STORAGE_KEY), saved);
  } finally { f.dispose(); }
});

test('a rejected import cannot turn a pending edit save into an empty program', async () => {
  const f = fixture();
  try {
    f.init();
    f.ws.getBlockById('number').setFieldValue(67, 'NUM');
    await wait(10);
    f.load('<xml><block type="missing_block"/></xml>');
    await wait(600);
    assert.equal(f.ws.getBlockById('number').getFieldValue('NUM'), 67);
    assert.equal(f.data.get(STORAGE_KEY), serialize(f.ws));
    assert.match(f.data.get(STORAGE_KEY), />67</);
  } finally { f.dispose(); }
});

test('quota and removal failures keep editing and New usable', () => {
  const f = fixture();
  try {
    f.init();
    f.storage.setItem = () => { throw new DOMException('full', 'QuotaExceededError'); };
    f.storage.removeItem = () => { throw new DOMException('blocked', 'SecurityError'); };
    f.load(xml(78));
    assert.equal(f.alerts.length, 0);
    assert.equal(f.ws.getBlockById('number').getFieldValue('NUM'), 78);
    assert.doesNotThrow(() => newProgram(f.ws));
    assert.equal(f.ws.getAllBlocks(false).length, 0);
  } finally { f.dispose(); }
});

for (const flush of ['debounce', 'pagehide']) {
  test(`New followed by immediate Undo persists the restored program on ${flush}`, async () => {
    const f = fixture();
    try {
      f.init();
      const before = serialize(f.ws);
      newProgram(f.ws);
      assert.equal(f.data.has(STORAGE_KEY), false);
      await wait(10);
      f.ws.undo(false);
      assert.equal(serialize(f.ws), before);
      if (flush === 'pagehide') f.window.dispatchEvent(new Event('pagehide'));
      else await wait(600);
      assert.equal(f.data.get(STORAGE_KEY), before);
    } finally { f.dispose(); }
  });
}

test('Run flushes pending edits; completion and pagehide save the latest workspace', async () => {
  const f = fixture();
  try {
    f.init();
    f.ws.getBlockById('number').setFieldValue(23, 'NUM');
    // Enter Run before Blockly dispatches the edit event or the 500ms timer fires.
    setRunState(RunState.RUNNING);
    assert.match(f.data.get(STORAGE_KEY), />23</);
    setRunState(RunState.PAUSED_ASYNC);
    f.ws.getBlockById('number').setFieldValue(34, 'NUM');
    await wait(10);
    assert.match(f.data.get(STORAGE_KEY), />23</);
    setRunState(RunState.RUNNING);
    assert.match(f.data.get(STORAGE_KEY), />23</);
    setRunState(RunState.IDLE);
    assert.match(f.data.get(STORAGE_KEY), />34</);
    f.ws.getBlockById('number').setFieldValue(45, 'NUM');
    f.window.dispatchEvent(new Event('pagehide'));
    assert.match(f.data.get(STORAGE_KEY), />45</);
  } finally { f.dispose(); }
});
