import test from 'node:test';
import assert from 'node:assert/strict';
import * as Blockly from 'blockly';
import { matchLanguage, languages, loadLanguage, getLanguage, getSavedLanguage, saveLanguage, t } from '../src/i18n/index.js';
import { registerActionBlocks } from '../src/blockly/blocks/action.js';
import { registerSensorBlocks } from '../src/blockly/blocks/sensor.js';
import { registerControlBlocks } from '../src/blockly/blocks/control.js';
import { registerListBlocks } from '../src/blockly/blocks/list.js';
import { registerColourBlocks } from '../src/blockly/blocks/colour.js';
import { registerCommunicationBlocks } from '../src/blockly/blocks/communication.js';
import { registerUnknownStubs } from '../src/blockly/blocks/_unknownStub.js';
import { beginnerToolbox } from '../src/blockly/toolboxes/beginner.js';
import { expertToolbox } from '../src/blockly/toolboxes/expert.js';
import { generateCode } from '../src/codegen/index.js';
import english from '../src/i18n/messages/en.js';

// Node 26 exposes a browser-style getter which warns before storage is configured.
const storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
Object.defineProperty(globalThis, 'localStorage', { configurable: true, writable: true, value: undefined });
test.after(() => {
  if (storageDescriptor) Object.defineProperty(globalThis, 'localStorage', storageDescriptor);
  else delete globalThis.localStorage;
});

async function useLanguage(code) {
  Blockly.setLocale(await loadLanguage(code));
  registerActionBlocks();
  registerSensorBlocks();
  registerControlBlocks();
  registerListBlocks();
  registerColourBlocks();
  registerCommunicationBlocks();
  registerUnknownStubs();
}

test('all languages cover the English messages and preserve interpolation parameters', async () => {
  const placeholders = value => [...value.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
  for (const { code } of languages) {
    const catalogue = (await import(`../src/i18n/messages/${code}.js`)).default;
    assert.deepEqual(Object.keys(catalogue).sort(), Object.keys(english).sort(), code);
    for (const key of Object.keys(english)) {
      assert.ok(catalogue[key].trim(), `${code}: ${key}`);
      assert.deepEqual(placeholders(catalogue[key]), placeholders(english[key]), `${code}: ${key}`);
    }
  }
});

test('Portuguese is bundled as the default locale', async () => {
  assert.equal(getLanguage(), 'pt');
  assert.equal(getSavedLanguage({ languages: ['ja', 'es'] }), 'pt');
  await loadLanguage('unsupported');
  assert.equal(getLanguage(), 'pt');
  assert.equal(t('PROGRAM_RUNTIME_ERROR', { error: 'example' }), 'Erro de execução: example');
  assert.doesNotThrow(saveLanguage);
});

test('browser preferences negotiate supported regional variants in order', () => {
  for (const [input, expected] of [['en-US', 'en'], ['pt-BR', 'pt'], ['fr-CA', 'fr'], ['de-AT', 'de'], ['th-TH', 'th'], ['zh', 'zh-CN'], ['zh-CN', 'zh-CN'], ['zh-SG', 'zh-CN'], ['zh-Hans', 'zh-CN'], ['ZH-hans-CN', 'zh-CN']]) {
    assert.equal(matchLanguage(input), expected, input);
  }
  for (const input of ['zh-Hant', 'zh-TW', 'zh-HK', 'zh-MO', 'zh-Hant-CN', 'ja', '', null]) assert.equal(matchLanguage(input), null, input);
  assert.equal(getSavedLanguage({ languages: ['ja', 'fr-CA', 'en-US'] }), 'fr');
  assert.equal(getSavedLanguage({ languages: ['zh-TW', 'de-DE'] }), 'de');
  assert.equal(getSavedLanguage({ languages: [], language: 'th-TH' }), 'th');
  assert.equal(getSavedLanguage({}), 'pt');
});

test('saved choices override browser preferences and invalid or blocked storage falls through', async () => {
  let saved = 'de';
  globalThis.localStorage = { getItem: () => saved, setItem: (_, value) => { saved = value; } };
  try {
    assert.equal(getSavedLanguage({ languages: ['fr'] }), 'de');
    saved = 'invalid';
    assert.equal(getSavedLanguage({ languages: ['fr'] }), 'fr');
    saved = null;
    assert.equal(getSavedLanguage({ languages: ['th'] }), 'th');
    await loadLanguage('en');
    saveLanguage();
    assert.equal(saved, 'en');
    assert.equal(getSavedLanguage({ languages: ['pt'] }), 'en');
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('blocked'); } });
    assert.equal(getSavedLanguage({ languages: ['zh-Hans'] }), 'zh-CN');
    assert.doesNotThrow(saveLanguage);
  } finally {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, writable: true, value: undefined });
    await loadLanguage('pt');
  }
});

test('every toolbox block retains its input names and dropdown values in all languages', async () => {
  const types = new Set();
  const definitions = [];
  function collect(entry) {
    if (entry.kind === 'block') {
      types.add(entry.type);
      definitions.push(entry);
    }
    for (const child of entry.contents || []) collect(child);
  }
  collect(beginnerToolbox);
  collect(expertToolbox);
  let expected;
  for (const { code } of languages) {
    await useLanguage(code);
    const workspace = new Blockly.Workspace();
    try {
      // Loading the actual shadows also detects missing/renamed input connections.
      for (const definition of definitions) Blockly.serialization.blocks.append(definition, workspace);
      workspace.clear();
      const contracts = [...types].map(type => {
        const block = workspace.newBlock(type);
        return {
          type,
          inputs: block.inputList.map(input => ({
            name: input.name,
            dropdowns: input.fieldRow.filter(field => field instanceof Blockly.FieldDropdown && !(field instanceof Blockly.FieldVariable))
              .map(field => ({ name: field.name, values: field.getOptions(false).map(option => option[1]) })),
          })).filter(input => input.name || input.dropdowns.length),
        };
      });
      if (!expected) expected = contracts;
      else assert.deepEqual(contracts, expected, code);
    } finally { workspace.dispose(); }
  }
});

test('a saved program preserves code, student text, variables and dynamic branches across languages', async () => {
  await useLanguage('en');
  const workspace = new Blockly.Workspace();
  try {
    Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(`<xml xmlns="https://developers.google.com/blockly/xml">
      <variables><variable id="student-variable">นักเรียน élève 学生</variable></variables>
      <block type="robControls_ifElse" id="decision">
        <mutation elseif="1"/>
        <value name="IF0"><block type="logic_boolean"><field name="BOOL">TRUE</field></block></value>
        <statement name="DO0"><block type="robActions_motorDiff_on_for" id="drive">
          <field name="DIRECTION">BACKWARD</field>
          <value name="POWER"><shadow type="math_number"><field name="NUM">30</field></shadow></value>
          <value name="DISTANCE"><shadow type="math_number"><field name="NUM">10</field></shadow></value>
        </block></statement>
        <value name="IF1"><block type="logic_boolean"><field name="BOOL">FALSE</field></block></value>
        <statement name="DO1"><block type="robActions_println">
          <value name="OUT"><block type="text"><field name="TEXT">Bonjour สวัสดี 你好</field></block></value>
        </block></statement>
        <statement name="ELSE"><block type="variables_set">
          <field name="VAR" id="student-variable">นักเรียน élève 学生</field>
          <value name="VALUE"><block type="math_number"><field name="NUM">42</field></block></value>
        </block></statement>
      </block>
    </xml>`), workspace);
    const expectedCode = generateCode(workspace);
    assert.match(expectedCode, /robotAPI\.drive_for\("BACKWARD", 30, 10\)/);
    assert.match(expectedCode, /Bonjour สวัสดี 你好/);
    const state = Blockly.serialization.workspaces.save(workspace);
    for (const { code } of languages) {
      await useLanguage(code);
      Blockly.serialization.workspaces.load(state, workspace);
      assert.equal(generateCode(workspace), expectedCode, code);
      assert.equal(workspace.getBlockById('decision').extraCount_, 1, code);
      assert.equal(workspace.getBlockById('drive').getFieldValue('DIRECTION'), 'BACKWARD', code);
      assert.equal(workspace.getVariableById('student-variable').name, 'นักเรียน élève 学生', code);
      assert.equal(workspace.getBlockById('drive').inputList[0].fieldRow[0].getText(), t('BLOCK_DRIVE'), code);
    }
  } finally { workspace.dispose(); }
});
