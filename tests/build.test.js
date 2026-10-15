import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { resolveObjectURL } from 'node:buffer';
import { runInNewContext } from 'node:vm';
import { build, createLogger } from 'vite';

let output;
let directory;
const warnings = [];

test.before(async () => {
  const logger = createLogger('silent');
  logger.warn = logger.warnOnce = message => warnings.push(message);
  const result = await build({ customLogger: logger, build: { write: false } });
  output = result.output;
  directory = await mkdtemp(path.join(tmpdir(), 'mbot2-browser-build-'));
  await writeFile(path.join(directory, 'package.json'), '{"type":"module"}');
  for (const chunk of output.filter(item => item.type === 'chunk')) {
    const destination = path.join(directory, chunk.fileName);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, chunk.code);
  }
});

test.after(async () => {
  if (directory) await rm(directory, { recursive: true, force: true });
});

test('production builds without warnings and keeps application and vendor chunks within budget', () => {
  assert.deepEqual(warnings, []);
  const chunks = output.filter(item => item.type === 'chunk');
  const entry = chunks.find(chunk => chunk.isEntry);
  assert.ok(Buffer.byteLength(entry.code) < 200_000, 'application entry exceeds 200 kB');
  for (const name of ['blockly-core', 'blockly-blocks', 'blockly-javascript', 'interpreter']) {
    assert.ok(chunks.some(chunk => chunk.name === name), `missing ${name} chunk`);
  }
  for (const chunk of chunks) {
    const budget = chunk.name === 'blockly-core' ? 600_000 : 500_000;
    assert.ok(Buffer.byteLength(chunk.code) < budget, `${chunk.name} exceeds ${budget} bytes`);
    assert.ok(!Object.keys(chunk.modules).some(id => id.includes('__vite-browser-external')),
      `${chunk.name} includes an unsupported Node module stub`);
  }
});

test('the built browser interpreter survives repeated missing Workers and later uses an available Worker', async () => {
  const chunk = output.find(item => item.type === 'chunk' && item.name === 'interpreter');
  assert.ok(chunk, 'interpreter must be independently loadable');
  const module = await import(pathToFileURL(path.join(directory, chunk.fileName)).href);
  const Interpreter = module[chunk.exports[0]];
  assert.equal(typeof Interpreter, 'function');
  const interpreter = new Interpreter('var result = 6 * 7;');
  while (interpreter.step()) {}
  assert.equal(interpreter.getProperty(interpreter.globalObject, 'result'), 42);

  // A browser without Workers must not treat a Node stub as an isolation API.
  const workerDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'Worker');
  Object.defineProperty(globalThis, 'Worker', { configurable: true, writable: true, value: undefined });
  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      const regex = new Interpreter("var result = 'hello'.match(/ell/);");
      assert.throws(() => { while (regex.step()) {} }, /Regular expressions not supported/);
      assert.equal(Interpreter.vm, null);
    }

    let workerCount = 0;
    // Execute the dependency's actual worker script; only browser message delivery
    // is replaced. A cached fake VM must not bypass this path on a later run.
    globalThis.Worker = class {
      constructor(url) {
        workerCount++;
        this.ready = resolveObjectURL(url).text().then(code => {
          URL.revokeObjectURL(url);
          this.scope = { postMessage: data => this.onmessage({ data }), close() {} };
          runInNewContext(code, this.scope);
        });
      }
      postMessage(data) { this.ready.then(() => this.scope.onmessage({ data })); }
      terminate() {}
    };
    const regex = new Interpreter("var result = 'hello'.match(/ell/)[0];");
    for (let steps = 0; regex.step(); steps++) {
      assert.ok(steps < 10_000, 'RegExp worker did not finish');
      if (regex.paused_) await new Promise(resolve => setImmediate(resolve));
    }
    assert.equal(regex.getProperty(regex.globalObject, 'result'), 'ell');
    assert.equal(workerCount, 1);
    assert.equal(Interpreter.vm, null);
  } finally {
    if (workerDescriptor) Object.defineProperty(globalThis, 'Worker', workerDescriptor);
    else delete globalThis.Worker;
  }
});
