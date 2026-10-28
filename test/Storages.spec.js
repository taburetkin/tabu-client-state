import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Storages, getStoragesSingleton, DEFAULT_STORAGE_KEY_PREFIX } from '../Storages.js';
import { failingStorage, stored, withStorages } from './helpers.js';

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

	it('returns a raw value that is not JSON and warns', () => {
		withStorages((local) => {
			const warnings = [];
			const prev = console.warn;
			console.warn = message => warnings.push(message);
			try {
				const storages = new Storages('t.');
				local.setItem('t.theme', 'dark');
				assert.equal(storages.read('theme', false), 'dark');
				assert.deepEqual(warnings, ['read storage failed trying to parse value dark']);
			} finally {
				console.warn = prev;
			}
		});
	});

	it('write undefined removes the key', () => {
		withStorages((local) => {
			let storages = new Storages('t.');
			assert.equal(storages.write('theme', 'dark', false), true);
			assert.equal(storages.write('theme', undefined, false), undefined);
			assert.equal(local.getItem('t.theme'), null);
			assert.equal(storages.read('theme', false), undefined);
		});
	});

	it('hasValue follows the stored key, including raw strings', () => {
		withStorages((local) => {
			const storages = new Storages('t.');
			assert.equal(storages.hasValue('theme', false), false);
			storages.write('theme', 'dark', false);
			assert.equal(storages.hasValue('theme', false), true);
			storages.write('theme', undefined, false);
			assert.equal(storages.hasValue('theme', false), false);
			local.setItem('t.theme', 'dark');
			assert.equal(storages.hasValue('theme', false), true);
			storages.write('hover', false, false);
			assert.equal(storages.hasValue('hover', false), true);
		});
	});

	it('swallows missing storage', () => {
		withStorages(() => {
			let storages = new Storages('t.');
			assert.equal(storages.write('theme', 'dark', false), false);
			assert.equal(storages.read('theme', false), undefined);
			assert.equal(storages.hasValue('theme', false), false);
		}, { local: undefined, session: undefined });
	});

	it('returns false and logs when setItem throws', () => {
		const errors = [];
		const prev = console.error;
		console.error = error => errors.push(error);
		try {
			withStorages(() => {
				const storages = new Storages('t.');
				assert.equal(storages.write('theme', 'dark', false), false);
				assert.equal(storages.read('theme', false), undefined);
				assert.equal(errors.length, 1);
			}, { local: failingStorage() });
		} finally {
			console.error = prev;
		}
	});

	it('returns false and logs when the value cannot be stringified', () => {
		const errors = [];
		const prev = console.error;
		console.error = error => errors.push(error);
		try {
			withStorages(() => {
				const storages = new Storages('t.');
				const cyclic = {};
				cyclic.self = cyclic;
				assert.equal(storages.write('theme', cyclic, false), false);
				assert.equal(storages.read('theme', false), undefined);
				assert.equal(errors.length, 1);
			});
		} finally {
			console.error = prev;
		}
	});

	it('swallows storage that throws on probe', () => {
		const denied = {
			setItem() { throw new Error('denied'); },
			getItem() { return null; },
			removeItem() {},
		};
		withStorages(() => {
			let storages = new Storages('t.');
			assert.equal(storages.write('theme', 'dark', false), false);
			assert.equal(storages.read('theme', false), undefined);
		}, { local: denied, session: denied });
	});

	it('reuses one instance per prefix', () => {
		assert.equal(getStoragesSingleton('t.'), getStoragesSingleton('t.'));
		assert.equal(getStoragesSingleton(), getStoragesSingleton(DEFAULT_STORAGE_KEY_PREFIX));
		assert.notEqual(getStoragesSingleton('t.'), getStoragesSingleton('u.'));
		withStorages((local) => {
			const storages = getStoragesSingleton('t.');
			storages.write('theme', 'dark', false);
			assert.equal(local.getItem('t.theme'), stored('dark'));
		});
	});
});
