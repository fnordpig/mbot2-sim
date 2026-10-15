import test from 'node:test';
import assert from 'node:assert/strict';
import * as Blockly from 'blockly';
import { initBlockly, setWorkspaceLanguage, setToolboxMode } from '../src/blockly/index.js';
import { getLanguage, t } from '../src/i18n/index.js';
import { generateCode } from '../src/codegen/index.js';

const storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
Object.defineProperty(globalThis, 'localStorage', { configurable: true, writable: true, value: undefined });
test.after(() => {
  if (storageDescriptor) Object.defineProperty(globalThis, 'localStorage', storageDescriptor);
  else delete globalThis.localStorage;
});

const flushEvents = () => new Promise(resolve => setTimeout(resolve, 10));

function headlessEditor() {
  const workspace = new Blockly.Workspace();
  const attributes = {};
  // Only the browser mount/viewport boundary is replaced; block serialization,
  // event history and the production language transaction remain real Blockly.
  Object.assign(workspace, {
    scrollX: 23,
    scrollY: 47,
    getInjectionDiv: () => ({ setAttribute: (name, value) => { attributes[name] = value; } }),
    updateToolbox(toolbox) { this.toolboxDefinition = toolbox; },
    scroll(x, y) { this.scrollX = x; this.scrollY = y; },
  });
  return { workspace, attributes };
}

function dispose(workspace) {
  Blockly.Events.disable();
  try { workspace.dispose(); }
  finally { Blockly.Events.enable(); }
}

test('startup falls back to bundled English when the saved language cannot load', async () => {
  const { workspace } = headlessEditor();
  const failure = new Error('locale chunk unavailable');
  const reported = [];
  globalThis.localStorage = { getItem: () => 'fr' };
  try {
    const result = await initBlockly({
      inject: () => workspace,
      prepare: async code => { assert.equal(code, 'fr'); throw failure; },
      onLanguageError: error => reported.push(error),
    });
    assert.equal(result, workspace);
    assert.equal(getLanguage(), 'en');
    assert.equal(Blockly.Msg.UNDO, 'Undo');
    assert.deepEqual(reported, [failure]);
    assert.equal(workspace.newBlock('robActions_motorDiff_stop').type, 'robActions_motorDiff_stop');
  } finally {
    globalThis.localStorage = undefined;
    dispose(workspace);
  }
});

test('failed language preparation and snapshot leave the active editor unchanged', async () => {
  const { workspace } = headlessEditor();
  await initBlockly({ inject: () => workspace });
  let failSave = false;
  Blockly.Blocks.language_snapshot_probe = {
    init() { this.appendDummyInput().appendField('snapshot probe'); },
    saveExtraState() { if (failSave) throw new Error('snapshot failed'); return {}; },
  };
  try {
    const block = workspace.newBlock('language_snapshot_probe');
    await flushEvents();
    await assert.rejects(setWorkspaceLanguage('fr', {
      prepare: async () => { throw new Error('locale chunk unavailable'); },
    }), /locale chunk unavailable/);
    assert.equal(getLanguage(), 'en');
    failSave = true;
    await assert.rejects(setWorkspaceLanguage('fr'), /snapshot failed/);
    assert.equal(getLanguage(), 'en');
    assert.equal(Blockly.Msg.UNDO, 'Undo');
    assert.equal(workspace.getBlockById(block.id), block);
    assert.equal(Blockly.Events.isEnabled(), true);
  } finally {
    failSave = false;
    dispose(workspace);
    delete Blockly.Blocks.language_snapshot_probe;
  }
});

test('reconstruction failure rolls back language and preserves working undo history', async () => {
  const { workspace, attributes } = headlessEditor();
  await initBlockly({ inject: () => workspace });
  let failLoad = false;
  Blockly.Blocks.language_reconstruction_probe = {
    init() { this.appendDummyInput().appendField(new Blockly.FieldNumber(1), 'VALUE'); },
    saveExtraState() { return {}; },
    loadExtraState() {
      if (failLoad) { failLoad = false; throw new Error('reconstruction failed'); }
    },
  };
  try {
    const id = workspace.newBlock('language_reconstruction_probe').id;
    await flushEvents();
    workspace.clearUndo();
    failLoad = true;
    await assert.rejects(setWorkspaceLanguage('fr'), /reconstruction failed/);
    assert.equal(getLanguage(), 'en');
    assert.equal(Blockly.Msg.UNDO, 'Undo');
    assert.equal(attributes['aria-label'], Blockly.Msg.WORKSPACE_ARIA_LABEL);
    assert.equal(workspace.getAllBlocks(false).length, 1);
    assert.equal(workspace.scrollX, 23);
    assert.equal(workspace.scrollY, 47);
    assert.equal(Blockly.Events.getRecordUndo(), true);
    assert.equal(Blockly.Events.getGroup(), '');
    assert.equal(Blockly.Events.isEnabled(), true);
    workspace.getBlockById(id).setFieldValue(2, 'VALUE');
    await flushEvents();
    workspace.undo(false);
    assert.equal(workspace.getBlockById(id).getFieldValue('VALUE'), 1);

    Blockly.Events.disable();
    Blockly.Events.setRecordUndo(false);
    Blockly.Events.setGroup('outer-operation');
    try {
      failLoad = true;
      await assert.rejects(setWorkspaceLanguage('th'), /reconstruction failed/);
      assert.equal(Blockly.Events.isEnabled(), false);
      assert.equal(Blockly.Events.getRecordUndo(), false);
      assert.equal(Blockly.Events.getGroup(), 'outer-operation');
    } finally {
      Blockly.Events.setRecordUndo(true);
      Blockly.Events.setGroup(false);
      Blockly.Events.enable();
    }
  } finally {
    dispose(workspace);
    delete Blockly.Blocks.language_reconstruction_probe;
  }
});

test('the actual switch preserves program, branches, variables, viewport and undo across languages', async () => {
  const { workspace } = headlessEditor();
  await initBlockly({ inject: () => workspace });
  try {
    Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(`<xml xmlns="https://developers.google.com/blockly/xml">
      <variables><variable id="student">นักเรียน élève 学生</variable></variables>
      <block type="robControls_ifElse" id="decision"><mutation elseif="1"/>
        <statement name="DO0"><block type="robActions_motorDiff_on_for" id="drive">
          <field name="DIRECTION">BACKWARD</field>
          <value name="POWER"><shadow type="math_number"><field name="NUM">30</field></shadow></value>
          <value name="DISTANCE"><shadow type="math_number" id="distance"><field name="NUM">10</field></shadow></value>
        </block></statement>
        <statement name="DO1"><block type="robActions_println"><value name="OUT"><block type="text"><field name="TEXT">Bonjour สวัสดี 你好</field></block></value></block></statement>
      </block>
    </xml>`), workspace);
    await flushEvents();
    workspace.clearUndo();
    workspace.getBlockById('distance').setFieldValue(15, 'NUM');
    await flushEvents();
    const code = generateCode(workspace);
    setToolboxMode('expert');
    for (const language of ['fr', 'th', 'zh-CN', 'de', 'pt', 'en']) {
      await setWorkspaceLanguage(language);
      assert.equal(getLanguage(), language);
      assert.equal(generateCode(workspace), code);
      assert.equal(workspace.getBlockById('decision').extraCount_, 1);
      assert.equal(workspace.getVariableById('student').name, 'นักเรียน élève 学生');
      assert.equal(workspace.getBlockById('drive').inputList[0].fieldRow[0].getText(), t('BLOCK_DRIVE'));
      assert.equal(workspace.scrollX, 23);
      assert.equal(workspace.scrollY, 47);
      assert.ok(workspace.toolboxDefinition.contents.length > 0);
    }
    workspace.undo(false);
    assert.equal(workspace.getBlockById('distance').getFieldValue('NUM'), 10);
    workspace.undo(true);
    assert.equal(workspace.getBlockById('distance').getFieldValue('NUM'), 15);
  } finally { dispose(workspace); }
});
