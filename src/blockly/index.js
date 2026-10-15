import * as Blockly from 'blockly';
import { loadLanguage, getSavedLanguage, getLanguage } from '../i18n/index.js';
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

export async function initBlockly() {
  Blockly.setLocale(await loadLanguage(getSavedLanguage()));
  registerBlocks();

  workspace = Blockly.inject('blockly-area', {
    toolbox: beginnerToolbox,
    grid: { spacing: 20, length: 3, colour: '#ccc', snap: true },
    zoom: { controls: true, wheel: true, startScale: 1.0 },
    trashcan: true,
  });

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

export async function setWorkspaceLanguage(code) {
  const previous = getLanguage();
  const messages = await loadLanguage(code);
  const state = Blockly.serialization.workspaces.save(workspace);
  const scrollX = workspace.scrollX;
  const scrollY = workspace.scrollY;
  Blockly.Events.disable();
  try {
    Blockly.setLocale(messages);
    workspace.getInjectionDiv().setAttribute('aria-label', Blockly.Msg.WORKSPACE_ARIA_LABEL);
    registerBlocks();
    workspace.clear();
    setToolboxMode(toolboxMode);
    Blockly.serialization.workspaces.load(state, workspace);
    workspace.scroll(scrollX, scrollY);
  } catch (err) {
    Blockly.setLocale(await loadLanguage(previous));
    workspace.getInjectionDiv().setAttribute('aria-label', Blockly.Msg.WORKSPACE_ARIA_LABEL);
    registerBlocks();
    workspace.clear();
    setToolboxMode(toolboxMode);
    Blockly.serialization.workspaces.load(state, workspace);
    throw err;
  } finally {
    Blockly.Events.enable();
  }
}

export function getWorkspace() {
  return workspace;
}
