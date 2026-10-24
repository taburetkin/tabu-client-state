import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Storages } from '../Storages.js';
import { stored, withStorages } from './helpers.js';

describe('Storages', () => {
	it('writes and reads with the prefix; missing key is undefined', () => {
		withStorages((local, session) => {
			let storages = new Storages('t.');
			storages.write('theme', 'dark', false);
			storages.write('theme', 'night', true);
			assert.equal(local.getItem('t.theme'), stored('dark'));
			assert.equal(session.getItem('t.theme'), stored('night'));
			assert.equal(storages.read('theme', false), 'dark');
			assert.equal(storages.read('theme', true), 'night');
			assert.equal(storages.read('missing', false), undefined);
		});
	});

	it('stringifies any id before joining the prefix', () => {
		withStorages((local) => {
			const mark = Symbol('mark');
			const storages = new Storages('t.');
			const cases = [
				[null, 't.null'],
				[undefined, 't.undefined'],
				[Infinity, 't.Infinity'],
				[-Infinity, 't.-Infinity'],
				[NaN, 't.NaN'],
				[true, 't.true'],
				[false, 't.false'],
				[mark, `t.${String(mark)}`],
			];
			for (const [id, key] of cases) {
				storages.write(id, 'held', false);
				assert.equal(local.getItem(key), stored('held'), key);
				assert.equal(storages.read(id, false), 'held', key);
			}
		});
	});

	it('round-trips the same JS value: token stays string, boolean stays boolean', () => {
		withStorages((local) => {
			let storages = new Storages('t.');
			storages.write('hover', true, false);
			storages.write('theme', 'dark', false);
			storages.write('flag', 'true', false);
			assert.equal(local.getItem('t.hover'), stored(true));
			assert.equal(local.getItem('t.theme'), stored('dark'));
			assert.equal(local.getItem('t.flag'), stored('true'));
			assert.equal(storages.read('hover', false), true);
			assert.equal(typeof storages.read('hover', false), 'boolean');
			assert.equal(storages.read('theme', false), 'dark');
			assert.equal(storages.read('flag', false), 'true');
			assert.equal(typeof storages.read('flag', false), 'string');
			storages.write('hover', false, false);
			assert.equal(storages.read('hover', false), false);
		});
	});

	it('ignores a raw value that is not JSON and warns', () => {
		withStorages((local) => {
			const warnings = [];
			const prev = console.warn;
			console.warn = message => warnings.push(message);
			try {
				const storages = new Storages('t.');
				local.setItem('t.theme', 'dark');
				assert.equal(storages.read('theme', false), undefined);
				assert.deepEqual(warnings, ['parse failed trying to parse value dark']);
			} finally {
				console.warn = prev;
			}
		});
	});

	it('write undefined removes the key', () => {
		withStorages((local) => {
			let storages = new Storages('t.');
			storages.write('theme', 'dark', false);
			storages.write('theme', undefined, false);
			assert.equal(local.getItem('t.theme'), null);
			assert.equal(storages.read('theme', false), undefined);
		});
	});

	it('swallows missing storage', () => {
		let prevLocal = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
		let prevSession = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
		Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: undefined });
		Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: undefined });
		try {
			let storages = new Storages('t.');
			storages.write('theme', 'dark', false);
			assert.equal(storages.read('theme', false), undefined);
		} finally {
			if (prevLocal) Object.defineProperty(globalThis, 'localStorage', prevLocal);
			else delete globalThis.localStorage;
			if (prevSession) Object.defineProperty(globalThis, 'sessionStorage', prevSession);
			else delete globalThis.sessionStorage;
		}
	});

	it('swallows storage that throws on probe', () => {
		let prevLocal = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
		let prevSession = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
		let denied = {
			setItem() { throw new Error('denied'); },
			getItem() { return null; },
			removeItem() {},
		};
		Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: denied });
		Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: denied });
		try {
			let storages = new Storages('t.');
			storages.write('theme', 'dark', false);
			assert.equal(storages.read('theme', false), undefined);
		} finally {
			if (prevLocal) Object.defineProperty(globalThis, 'localStorage', prevLocal);
			else delete globalThis.localStorage;
			if (prevSession) Object.defineProperty(globalThis, 'sessionStorage', prevSession);
			else delete globalThis.sessionStorage;
		}
	});
});
