import english from './messages/en.js';
import * as EnglishBlockly from 'blockly/msg/en';
import { ptMessages } from './pt.js';

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
  pt: async () => Promise.all([import('./messages/pt.js').then(m => m.default), import('blockly/msg/pt')]),
  th: async () => Promise.all([import('./messages/th.js').then(m => m.default), import('blockly/msg/th')]),
  'zh-CN': async () => Promise.all([import('./messages/zh-CN.js').then(m => m.default), import('blockly/msg/zh-hans')]),
  fr: async () => Promise.all([import('./messages/fr.js').then(m => m.default), import('blockly/msg/fr')]),
  de: async () => Promise.all([import('./messages/de.js').then(m => m.default), import('blockly/msg/de')]),
};

let language = 'en';
let messages = english;

export function resolveLanguage(code) {
  return languages.some(item => item.code === code) ? code : 'en';
}

export function getLanguage() { return language; }

export function getSavedLanguage() {
  try { return resolveLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY)); }
  catch (_) { return 'en'; }
}

export function saveLanguage() {
  try { localStorage.setItem(LANGUAGE_STORAGE_KEY, language); }
  catch (_) { /* Language switching also works when storage is unavailable. */ }
}

export async function loadLanguage(code) {
  const next = resolveLanguage(code);
  const [catalogue, blockly] = await loaders[next]();
  language = next;
  messages = catalogue;
  return {
    ...EnglishBlockly,
    ...blockly,
    ...(next === 'pt' ? ptMessages : {}),
    ...english,
    ...catalogue,
  };
}

export function t(key, values = {}) {
  const text = messages[key] ?? english[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (match, name) =>
    Object.hasOwn(values, name) ? String(values[name]) : match);
}
