import test from 'node:test';
import assert from 'node:assert/strict';
import { COLLISION_SETTING_KEY, initSimulationSettings, getEndOnCollision, setEndOnCollision } from '../src/sim/settings.js';

test.afterEach(() => {
  delete globalThis.localStorage;
  initSimulationSettings();
});

test('collision stopping defaults to enabled and only a saved false disables it', () => {
  for (const value of [null, 'true', 'invalid']) {
    globalThis.localStorage = { getItem: () => value };
    initSimulationSettings();
    assert.equal(getEndOnCollision(), true);
  }
  globalThis.localStorage = { getItem: () => 'false' };
  initSimulationSettings();
  assert.equal(getEndOnCollision(), false);
});

test('a chosen collision behavior survives settings reinitialization', () => {
  const stored = new Map();
  globalThis.localStorage = { getItem: key => stored.get(key), setItem: (key, value) => stored.set(key, value) };
  for (const enabled of [false, true]) {
    setEndOnCollision(enabled);
    assert.equal(stored.get(COLLISION_SETTING_KEY), String(enabled));
    initSimulationSettings();
    assert.equal(getEndOnCollision(), enabled);
  }
});

test('blocked browser storage leaves the collision setting usable in memory', () => {
  globalThis.localStorage = {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('blocked'); },
  };
  assert.doesNotThrow(initSimulationSettings);
  assert.equal(getEndOnCollision(), true);
  assert.doesNotThrow(() => setEndOnCollision(false));
  assert.equal(getEndOnCollision(), false);
});
