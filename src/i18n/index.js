import portuguese from './messages/pt.js';
import * as PortugueseBlockly from 'blockly/msg/pt';
import english from './messages/en.js';
import * as EnglishBlockly from 'blockly/msg/en';
import { ptMessages } from './pt.js';

export const DEFAULT_LANGUAGE = 'pt';
export const LANGUAGE_STORAGE_KEY = 'mbot2sim:language';
export const languages = [
  { code: 'en', name: 'English', htmlLang: 'en' },
  { code: 'pt', name: 'Português', htmlLang: 'pt-PT' },
  { code: 'th', name: 'ไทย', htmlLang: 'th' },
  { code: 'zh-CN', name: '简体中文', htmlLang: 'zh-CN' },
  { code: 'fr', name: 'Français', htmlLang: 'fr' },
  { code: 'de', name: 'Deutsch', htmlLang: 'de' },
];

const loaders = {
  en: async () => [english, EnglishBlockly],
  pt: async () => [portuguese, PortugueseBlockly],
  th: async () => Promise.all([import('./messages/th.js').then(m => m.default), import('blockly/msg/th')]),
  'zh-CN': async () => Promise.all([import('./messages/zh-CN.js').then(m => m.default), import('blockly/msg/zh-hans')]),
  fr: async () => Promise.all([import('./messages/fr.js').then(m => m.default), import('blockly/msg/fr')]),
  de: async () => Promise.all([import('./messages/de.js').then(m => m.default), import('blockly/msg/de')]),
};

function languageState(code, catalogue, blockly) {
  return {
    code,
    catalogue,
    blocklyMessages: {
      ...EnglishBlockly,
      ...blockly,
      ...(code === 'pt' ? ptMessages : {}),
      ...english,
      ...catalogue,
    },
  };
}

let activeLanguage = languageState(DEFAULT_LANGUAGE, portuguese, PortugueseBlockly);

export function resolveLanguage(code) {
  return languages.some(item => item.code === code) ? code : DEFAULT_LANGUAGE;
}

export function getLanguage() { return activeLanguage.code; }
export function getActiveLanguage() { return activeLanguage; }

export function matchLanguage(code) {
  if (typeof code !== 'string') return null;
  const parts = code.toLowerCase().split('-');
  if (parts[0] === 'zh') {
    // Explicit Traditional Chinese preferences must not select Simplified Chinese.
    if (parts.includes('hant') || parts.includes('tw') || parts.includes('hk') || parts.includes('mo')) return null;
    return parts.length === 1 || parts[1] === 'hans' || parts[1] === 'cn' || parts[1] === 'sg' ? 'zh-CN' : null;
  }
  return languages.find(item => item.code === parts[0])?.code ?? null;
}

export function getSavedLanguage(browser = globalThis.navigator) {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (languages.some(item => item.code === saved)) return saved;
  } catch (_) { /* Browser preferences also work when storage is unavailable. */ }
  const preferences = browser?.languages?.length ? browser.languages : [browser?.language];
  for (const preference of preferences) {
    const matched = matchLanguage(preference);
    if (matched) return matched;
  }
  return DEFAULT_LANGUAGE;
}

export function saveLanguage() {
  try { localStorage.setItem(LANGUAGE_STORAGE_KEY, getLanguage()); }
  catch (_) { /* Language switching also works when storage is unavailable. */ }
}

// Loading chunks must not change the active interface before its caller is ready.
export async function prepareLanguage(code) {
  const next = resolveLanguage(code);
  const [catalogue, blockly] = await loaders[next]();
  return languageState(next, catalogue, blockly);
}

export function activateLanguage(prepared) {
  activeLanguage = prepared;
  return prepared.blocklyMessages;
}

export async function loadLanguage(code) {
  return activateLanguage(await prepareLanguage(code));
}

export function t(key, values = {}) {
  const text = activeLanguage.catalogue[key] ?? english[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (match, name) =>
    Object.hasOwn(values, name) ? String(values[name]) : match);
}
