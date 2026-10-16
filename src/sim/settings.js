export const COLLISION_SETTING_KEY = 'mbot2sim:endOnCollision';

let endOnCollision = true;

export function initSimulationSettings() {
  try { endOnCollision = localStorage.getItem(COLLISION_SETTING_KEY) !== 'false'; }
  catch (_) { endOnCollision = true; }
}

export function getEndOnCollision() { return endOnCollision; }

export function setEndOnCollision(value) {
  endOnCollision = value === true;
  try { localStorage.setItem(COLLISION_SETTING_KEY, String(endOnCollision)); }
  catch (_) { /* Collision behavior also works when browser storage is blocked. */ }
}
