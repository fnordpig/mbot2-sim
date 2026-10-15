import { t } from '../i18n/index.js';
import * as Blockly from 'blockly';
import { getWorkspace } from '../blockly/index.js';
import { RunState, getRunState, onRunStateChange } from '../runtime/runState.js';
import { stop as stopProgram } from '../runtime/runLoop.js';

const STORAGE_KEY = 'mbot2sim:lastProgram';
const DEBOUNCE_MS = 500;

let _debounceTimer = null;
let _autoSaveEnabled = true;
let _dispose = null;
let _lastSerialized = null;

function _serialize(ws) {
  const dom = Blockly.Xml.workspaceToDom(ws);
  return Blockly.Xml.domToText(dom);
}

function _replaceProgram(ws, xmlText) {
  const root = Blockly.utils.xml.textToDom(xmlText);
  if (root.nodeName !== 'xml') throw new Error(`Unexpected root element: ${root.nodeName}`);
  const candidate = new Blockly.Workspace();
  const eventGroup = Blockly.Events.getGroup();
  const recordUndo = Blockly.Events.getRecordUndo();
  Blockly.Events.disable();
  try {
    // Validate every block and mutation before clearing the student's editor.
    Blockly.Xml.domToWorkspace(root, candidate);
    const validated = Blockly.Xml.workspaceToDom(candidate);
    for (const tag of ['block', 'shadow']) {
      if (validated.getElementsByTagName(tag).length !== root.getElementsByTagName(tag).length) {
        throw new Error('The XML contains blocks that could not be imported');
      }
    }
    const next = Blockly.serialization.workspaces.save(candidate);
    const previous = Blockly.serialization.workspaces.save(ws);
    if (getRunState() === RunState.RUNNING || getRunState() === RunState.PAUSED_ASYNC) stopProgram();
    try {
      Blockly.serialization.workspaces.load(next, ws);
    } catch (err) {
      // Blockly 11 does not close its cache or restore event flags on failure.
      Blockly.utils.dom.stopTextWidthCache();
      try { Blockly.serialization.workspaces.load(previous, ws); }
      catch (rollbackError) {
        Blockly.utils.dom.stopTextWidthCache();
        throw rollbackError;
      }
      throw err;
    }
    ws.clearUndo();
  } finally {
    try { candidate.dispose(); }
    finally {
      Blockly.Events.setGroup(eventGroup);
      Blockly.Events.setRecordUndo(recordUndo);
      try { ws.setResizesEnabled?.(true); }
      finally { Blockly.Events.enable(); }
    }
  }
}

function _flushAutoSave(ws, force = false) {
  clearTimeout(_debounceTimer);
  _debounceTimer = null;
  try {
    const xml = _serialize(ws);
    if (!force && xml === _lastSerialized) return;
    localStorage.setItem(STORAGE_KEY, xml);
    _lastSerialized = xml;
  } catch (e) {
    console.warn('[programIO] Persistence unavailable; keeping the program in memory', e);
  }
}

function _scheduleAutoSave(ws) {
  if (!_autoSaveEnabled) return;
  clearTimeout(_debounceTimer);
  _debounceTimer = setTimeout(() => {
    if (!_autoSaveEnabled) return;
    _flushAutoSave(ws);
  }, DEBOUNCE_MS);
}

function _buildFilename() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  const date = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  const time = `${p(d.getHours())}${p(d.getMinutes())}`;
  return `mbot2-program-${date}-${time}.xml`;
}

export function initProgramIO(ws = getWorkspace()) {
  if (!ws) return;
  _dispose?.();
  _autoSaveEnabled = getRunState() !== RunState.RUNNING && getRunState() !== RunState.PAUSED_ASYNC;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      _replaceProgram(ws, saved);
      console.log('[programIO] Workspace restored from localStorage');
    }
  } catch (e) {
    // Keep rejected data intact so an unsupported saved program can be recovered.
    console.warn('[programIO] Could not restore the saved program', e);
  }
  _lastSerialized = _serialize(ws);

  const onChange = (e) => {
    if (e.isUiEvent) return;
    _scheduleAutoSave(ws);
  };
  ws.addChangeListener(onChange);

  const offRunState = onRunStateChange((state) => {
    const running = state === RunState.RUNNING || state === RunState.PAUSED_ASYNC;
    const wasRunning = !_autoSaveEnabled;
    // Flush before Run cancels the edit debounce, and again when execution ends.
    if (running !== wasRunning) _flushAutoSave(ws, true);
    _autoSaveEnabled = !running;
  });
  const onPageHide = () => _flushAutoSave(ws);
  window.addEventListener('pagehide', onPageHide);

  const dispose = () => {
    clearTimeout(_debounceTimer);
    _debounceTimer = null;
    ws.removeChangeListener(onChange);
    offRunState();
    window.removeEventListener('pagehide', onPageHide);
    if (_dispose === dispose) _dispose = null;
  };
  _dispose = dispose;

  console.log('[programIO] initialised');
  return dispose;
}

export function saveProgram() {
  const ws = getWorkspace();
  if (!ws) return;

  if (ws.getAllBlocks(false).length === 0) {
    if (!window.confirm(t('PROGRAM_SAVE_EMPTY_CONFIRM'))) return;
  }

  const xml = _serialize(ws);
  const blob = new Blob([xml], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = _buildFilename();
  a.click();
  URL.revokeObjectURL(url);
}

export function loadProgramFromFile(file, ws = getWorkspace()) {
  if (!ws) return;

  const state = getRunState();
  if (state === RunState.RUNNING || state === RunState.PAUSED_ASYNC) {
    if (!window.confirm(t('PROGRAM_LOAD_RUNNING_CONFIRM'))) return;
  }

  if (ws.getAllBlocks(false).length > 0) {
    if (!window.confirm(t('PROGRAM_LOAD_CONFIRM'))) return;
  }

  const reader = new FileReader();
  reader.onload = (evt) => {
    const text = evt.target.result;
    try {
      _replaceProgram(ws, text);
      _flushAutoSave(ws, true);
    } catch (e) {
      console.error('[programIO] Load failed:', e);
      window.alert(t('PROGRAM_LOAD_ERROR'));
    }
  };
  reader.onerror = () => window.alert(t('PROGRAM_LOAD_ERROR'));
  reader.readAsText(file);
}

export function newProgram(ws = getWorkspace()) {
  if (!ws) return;
  if (!window.confirm(t('PROGRAM_NEW_CONFIRM'))) return;
  ws.clear();
  try {
    localStorage.removeItem(STORAGE_KEY);
    _lastSerialized = null;
  } catch (e) {}
}
