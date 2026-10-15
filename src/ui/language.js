import { languages, getLanguage, saveLanguage, t } from '../i18n/index.js';
import { setWorkspaceLanguage, getWorkspace } from '../blockly/index.js';
import * as Blockly from 'blockly';
import { getRunState, onRunStateChange, RunState } from '../runtime/runState.js';
import { appendConsoleMessage } from './console.js';

export function applyInterfaceLanguage() {
  document.documentElement.lang = languages.find(item => item.code === getLanguage()).htmlLang;
  document.title = t('APP_TITLE');
  for (const element of document.querySelectorAll('[data-i18n]')) {
    element.textContent = (element.dataset.icon ? element.dataset.icon + ' ' : '') + t(element.dataset.i18n);
  }
  for (const element of document.querySelectorAll('[data-i18n-title]')) {
    element.title = t(element.dataset.i18nTitle);
  }
  for (const element of document.querySelectorAll('[data-i18n-label]')) {
    element.setAttribute('aria-label', t(element.dataset.i18nLabel));
  }
  // Translated controls can wrap onto another line and change the editor height.
  const workspace = getWorkspace();
  if (workspace) Blockly.svgResize(workspace);
}

export function initLanguageControls() {
  const select = document.getElementById('language-select');
  for (const language of languages) {
    const option = document.createElement('option');
    option.value = language.code;
    option.textContent = language.name;
    select.appendChild(option);
  }
  select.value = getLanguage();
  applyInterfaceLanguage();

  let changing = false;
  const syncDisabled = () => {
    const state = getRunState();
    select.disabled = changing || state === RunState.RUNNING || state === RunState.PAUSED_ASYNC;
    document.getElementById('btn-run').disabled = select.disabled;
  };
  onRunStateChange(syncDisabled);
  select.addEventListener('change', async () => {
    changing = true;
    syncDisabled();
    try {
      await setWorkspaceLanguage(select.value);
      saveLanguage();
      applyInterfaceLanguage();
    } catch (err) {
      console.error('[language] Could not switch language:', err);
      appendConsoleMessage(t('LANGUAGE_ERROR'), 'error');
    } finally {
      select.value = getLanguage();
      changing = false;
      syncDisabled();
    }
  });
}
