import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { StateManager } from '../StateManager.js';
import { FakeElement, fakeTarget, installDom, stored, withStorages } from './helpers.js';

function options(id, extra = {}) {
	return {
		id,
		value: ({ target } = {}) => target?.token ?? id,
		source: {
			target: extra.target ?? fakeTarget({ token: id }),
			bind() {},
			unbind() {},
		},
		...extra,
	};
}

describe('StateManager', () => {
	let dom;

	before(() => {
		dom = installDom();
	});

	after(() => {
		dom.restore();
	});

	it('uses document.documentElement and does not auto-start constructor states', () => {
		const cs = new StateManager({
			states: {
				one: options('data-one'),
			},
		});
		assert.equal('data-one' in cs.values, true);
		assert.equal(cs.values['data-one'], undefined);
		assert.equal(dom.documentElement.getAttribute('data-one'), null);
		cs.start();
		assert.equal(cs.isStarted, true);
		assert.equal(dom.documentElement.getAttribute('data-one'), 'data-one');
	});

	it('accepts constructor states as a list of named exports', () => {
		const cs = new StateManager({
			states: [options('data-one'), options('data-two')],
		});
		assert.equal('data-one' in cs.values, true);
		assert.equal('data-two' in cs.values, true);
		assert.equal(cs.values['data-one'], undefined);
		cs.start();
		assert.equal(dom.documentElement.getAttribute('data-one'), 'data-one');
		assert.equal(dom.documentElement.getAttribute('data-two'), 'data-two');
	});

	it('accepts a custom attr target and storage prefix', () => {
		withStorages((local) => {
			const el = new FakeElement();
			const cs = new StateManager({
				attrTarget: el,
				storageKeyPrefix: 'app.',
			});
			cs.add(options('theme'));
			cs.start();
			assert.equal(cs.storeValue('theme', 'dark', false), true);
			assert.equal(el.getAttribute('theme'), 'dark');
			assert.equal(local.getItem('app.theme'), stored('dark'));
		});
	});

	it('starts a state added after start(), unless dontStart is set', () => {
		const el = new FakeElement();
		const cs = new StateManager({ attrTarget: el });
		cs.start();
		cs.add(options('a'));
		assert.equal(el.getAttribute('a'), 'a');
		cs.add(options('b'), true);
		assert.equal(el.getAttribute('b'), null);
		assert.equal(cs.values.b, undefined);
		assert.equal('b' in cs.values, true);
	});

	it('throws without an id and replaces an existing id', () => {
		const el = new FakeElement();
		const cs = new StateManager({ attrTarget: el });
		assert.throws(() => cs.add({ value: () => 'x' }), /missing state id/);
		assert.throws(() => cs.add({ id: undefined, value: () => 'x' }), /missing state id/);
		assert.throws(() => cs.add({ id: '', value: () => 'x' }), /missing state id/);
		cs.add(options('x', { value: () => 'one' }));
		cs.start();
		cs.add(options('x', { value: () => 'two' }));
		assert.equal(cs.values.x, 'two');
	});

	it('stringifies id; 1 and Symbol become strings', () => {
		const el = new FakeElement();
		const cs = new StateManager({ attrTarget: el });
		const mark = Symbol('mark');
		cs.add(options(1, { value: () => 'num' }));
		cs.add(options(mark, { value: () => 'sym' }));
		cs.add(options(true, { value: () => 'yes', attrName: 'data-yes' }));
		cs.start();
		assert.equal(cs.values[1], 'num');
		assert.equal(cs.values['1'], 'num');
		assert.equal('1' in cs.values, true);
		assert.equal(cs.values[mark], 'sym');
		assert.equal(cs.values[String(mark)], 'sym');
		assert.equal(cs.values[true], 'yes');
		assert.equal(cs.values['true'], 'yes');
		assert.deepEqual(Object.keys(cs.values).sort(), ['1', String(mark), 'true'].sort());
		assert.equal(Reflect.ownKeys(cs.values).includes(mark), false);
	});

	it('persists overrides for ids that stringify, including null and infinities', () => {
		withStorages((local) => {
			const mark = Symbol('mark');
			for (const id of [null, Infinity, -Infinity, NaN, true, false, mark]) {
				const el = new FakeElement();
				const cs = new StateManager({ attrTarget: el, storageKeyPrefix: 't.' });
				cs.add(options(id, { value: () => 'live', attrName: 'data-x' }));
				cs.start();
				assert.equal(cs.storeValue(id, 'held', false), true);
				assert.equal(cs.values[id], 'held');
				assert.equal(local.getItem(`t.${String(id)}`), stored('held'), String(id));
				cs.remove(id);
				cs.add(options(id, { value: () => 'live', attrName: 'data-x' }));
				cs.start();
				assert.equal(cs.values[id], 'held', String(id));
			}
		});
	});

	it('reads and writes through values; storeValue persists', () => {
		const el = new FakeElement();
		const cs = new StateManager({ attrTarget: el });
		assert.equal(cs.values.missing, undefined);
		assert.equal('missing' in cs.values, false);
		assert.equal(Object.getOwnPropertyDescriptor(cs.values, 'not-exist'), undefined);
		assert.throws(() => { cs.values.missing = 'no'; }, /unknown state missing/);
		assert.equal(cs.setTarget('missing', {}), false);

		cs.add(options('ok'));
		cs.add(options('other'));
		cs.start();
		assert.equal(cs.values.ok, 'ok');
		assert.equal('ok' in cs.values, true);
		assert.deepEqual({ ...cs.values }, { ok: 'ok', other: 'other' });
		cs.values.ok = 'held';
		assert.equal(cs.values.ok, 'held');
		assert.equal(delete cs.values.ok, true);
		assert.equal(cs.values.ok, 'held');
		assert.equal('ok' in cs.values, true);
		assert.deepEqual(Object.keys(cs.values), ['ok', 'other']);
		assert.deepEqual({ ...cs.values }, { ok: 'held', other: 'other' });
		assert.equal(cs.setTarget('ok', fakeTarget({ token: 'next' })), true);
		assert.equal(cs.values.ok, 'held');
		cs.values.ok = undefined;
		assert.equal(cs.values.ok, 'next');
		assert.equal(cs.storeValue('missing', 'no'), false);
		assert.equal(cs.storeValue('ok', 'stored', false), true);
	});

	it('setTarget respects dontStart and the manager flag', () => {
		const el = new FakeElement();
		const cs = new StateManager({ attrTarget: el });
		cs.add(options('ws', {
			source: {
				bind(ctx) { if (!ctx.target) return false; },
				unbind() {},
			},
			value: ({ target } = {}) => target?.clientWidth,
		}));
		assert.equal(cs.setTarget('ws', { clientWidth: 120 }, true), true);
		assert.equal(cs.values.ws, undefined);
		cs.start();
		assert.equal(cs.setTarget('ws', { clientWidth: 80 }), true);
		assert.equal(cs.values.ws, 80);
		assert.equal(cs.setTarget('ws', { clientWidth: 40 }, true), true);
		assert.equal(cs.values.ws, 80);
	});

	it('removes by id and restores the original attribute', () => {
		const el = new FakeElement({ a: 'origin' });
		const cs = new StateManager({ attrTarget: el });
		cs.add(options('a'));
		cs.start();
		cs.remove('a');
		assert.equal('a' in cs.values, false);
		assert.equal(el.getAttribute('a'), 'origin');

		cs.add(options('b'));
		cs.remove('b');
		assert.equal('b' in cs.values, false);
		cs.remove('ghost');
	});

	it('start(id) turns the manager on; stop(id) does not turn it off', () => {
		const el = new FakeElement();
		const cs = new StateManager({ attrTarget: el });
		cs.add(options('one'));
		cs.add(options('two'));
		cs.start('one');
		assert.equal(cs.isStarted, true);
		assert.equal(el.getAttribute('one'), 'one');
		assert.equal(el.getAttribute('two'), null);
		cs.add(options('three'));
		assert.equal(el.getAttribute('three'), 'three');
		cs.stop('one');
		assert.equal(cs.isStarted, true);
		cs.start('ghost');
		cs.stop();
		assert.equal(cs.isStarted, false);
		assert.equal(el.getAttribute('two'), null);
	});

	it('start() equals start(true); start(false) leaves states stopped', () => {
		const el = new FakeElement();
		const cs = new StateManager({ attrTarget: el });
		cs.add(options('one'));
		cs.add(options('two'));
		cs.start(false);
		assert.equal(cs.isStarted, true);
		assert.equal(el.getAttribute('one'), null);
		assert.equal(el.getAttribute('two'), null);
		cs.start(true);
		assert.equal(el.getAttribute('one'), 'one');
		assert.equal(el.getAttribute('two'), 'two');
	});

	it('stop() equals stop(true); stop(false) keeps the manager on', () => {
		const el = new FakeElement();
		const cs = new StateManager({ attrTarget: el });
		cs.add(options('one'));
		cs.add(options('two'));
		cs.start();
		cs.stop(false);
		assert.equal(cs.isStarted, true);
		assert.equal(el.getAttribute('one'), 'one');
		assert.equal(el.getAttribute('two'), 'two');
		cs.add(options('three'));
		assert.equal(el.getAttribute('three'), 'three');
		cs.stop(true);
		assert.equal(cs.isStarted, false);
	});

	it('calls stateChange only after start', () => {
		const el = new FakeElement();
		const seen = [];
		const cs = new StateManager({
			attrTarget: el,
			hooks: {
				stateChange(id, value) { seen.push([id, value, this.isStarted]); },
			},
		});
		cs.add(options('theme', { value: () => 'light' }));
		assert.deepEqual(seen, []);
		cs.start();
		assert.deepEqual(seen, [['theme', 'light', true]]);
		cs.values.theme = 'dark';
		assert.deepEqual(seen, [
			['theme', 'light', true],
			['theme', 'dark', true],
		]);
	});

	it('remove() destroys every state and leaves the manager usable', () => {
		const el = new FakeElement({ x: 'origin' });
		const cs = new StateManager({ attrTarget: el });
		cs.add(options('x'));
		cs.start();
		cs.remove();
		cs.remove();
		assert.equal('x' in cs.values, false);
		assert.equal(el.getAttribute('x'), 'origin');
		assert.equal(cs.isStarted, true);
		cs.add(options('y'));
		assert.equal(el.getAttribute('y'), 'y');
	});
});
