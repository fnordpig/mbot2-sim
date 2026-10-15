import * as Blockly from 'blockly';
import { prepareLanguage, activateLanguage, getActiveLanguage, getSavedLanguage, t } from '../i18n/index.js';
import { appendConsoleMessage } from '../ui/console.js';
import { beginnerToolbox } from './toolboxes/beginner.js';
import { expertToolbox } from './toolboxes/expert.js';
import { registerActionBlocks } from './blocks/action.js';
import { registerSensorBlocks } from './blocks/sensor.js';
import { registerControlBlocks } from './blocks/control.js';
import { registerListBlocks } from './blocks/list.js';
import { registerColourBlocks } from './blocks/colour.js';
import { registerCommunicationBlocks } from './blocks/communication.js';
import { registerUnknownStubs } from './blocks/_unknownStub.js';

let workspace = null;
let toolboxMode = 'beginner';

function reportLanguageError(err) {
  console.error('[language] Could not load saved language; using English:', err);
  appendConsoleMessage(t('LANGUAGE_ERROR'), 'warn');
}

export async function initBlockly({ inject = Blockly.inject, prepare = prepareLanguage, onLanguageError = reportLanguageError } = {}) {
  let prepared;
  let languageError;
  try {
    prepared = await prepare(getSavedLanguage());
  } catch (err) {
    languageError = err;
    prepared = await prepareLanguage('en'); // English is bundled, requiring no locale chunk.
  }
  Blockly.setLocale(activateLanguage(prepared));
  registerBlocks();

  workspace = inject('blockly-area', {
    toolbox: beginnerToolbox,
    grid: { spacing: 20, length: 3, colour: '#ccc', snap: true },
    zoom: { controls: true, wheel: true, startScale: 1.0 },
    trashcan: true,
  });
  toolboxMode = 'beginner';
  if (languageError) onLanguageError(languageError);

  console.log('[blockly] mounted');
  return workspace;
}

function registerBlocks() {
  registerActionBlocks();
  registerSensorBlocks();
  registerControlBlocks();
  registerListBlocks();
  registerColourBlocks();
  registerCommunicationBlocks();
  registerUnknownStubs();   // must remain LAST — skips any already-defined block
}

export function setToolboxMode(mode) {
  toolboxMode = mode === 'expert' ? 'expert' : 'beginner';
  if (!workspace) return;
  workspace.updateToolbox(toolboxMode === 'expert' ? expertToolbox : beginnerToolbox);
}

export async function setWorkspaceLanguage(code, { prepare = prepareLanguage } = {}) {
  const prepared = await prepare(code);
  const previous = getActiveLanguage();
  // A failed snapshot must leave both the application and Blockly locales intact.
  const state = Blockly.serialization.workspaces.save(workspace);
  const scrollX = workspace.scrollX;
  const scrollY = workspace.scrollY;
  const selected = Blockly.common.getSelected();
  const selectedId = selected?.workspace === workspace ? selected.id : null;
  const eventGroup = Blockly.Events.getGroup();
  const recordUndo = Blockly.Events.getRecordUndo();
  const rebuild = (language) => {
    Blockly.setLocale(activateLanguage(language));
    workspace.getInjectionDiv().setAttribute('aria-label', Blockly.Msg.WORKSPACE_ARIA_LABEL);
    registerBlocks();
    workspace.clear();
    setToolboxMode(toolboxMode);
    try {
      Blockly.serialization.workspaces.load(state, workspace);
    } catch (err) {
      // Blockly 11 also leaves its text-width cache open on deserialization errors.
      Blockly.utils.dom.stopTextWidthCache();
      throw err;
    }
    workspace.scroll(scrollX, scrollY);
    if (selectedId) workspace.getBlockById(selectedId)?.select?.();
  };
  Blockly.Events.disable();
  try {
    rebuild(prepared);
  } catch (err) {
    rebuild(previous);
    throw err;
  } finally {
    // Blockly 11's loader does not restore these globals when a serializer throws.
    Blockly.Events.setGroup(eventGroup);
    Blockly.Events.setRecordUndo(recordUndo);
    try { workspace.setResizesEnabled?.(true); }
    finally { Blockly.Events.enable(); }
  }
}

export function getWorkspace() {
  return workspace;
}
