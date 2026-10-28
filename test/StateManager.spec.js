import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { State } from '../State.js';
import { StateManager } from '../StateManager.js';
import { DEFAULT_STORAGE_KEY_PREFIX } from '../Storages.js';
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

	it('does not auto-start constructor states unless autoStartStates is true', () => {
		const cs = new StateManager({
			states: { one: options('data-one') },
		});
		assert.equal(cs.autoStartStates, false);
		assert.equal('data-one' in cs.values, true);
		assert.equal(cs.values['data-one'], undefined);
		assert.equal(dom.documentElement.getAttribute('data-one'), null);
		cs.start();
		assert.equal(dom.documentElement.getAttribute('data-one'), 'data-one');
	});

	it('autoStartStates starts constructor states and later adds', () => {
		const el = new FakeElement();
		const cs = new StateManager({
			attrTarget: el,
			autoStartStates: true,
			states: [options('a')],
		});
		assert.equal(el.getAttribute('a'), 'a');
		cs.add(options('b'));
		assert.equal(el.getAttribute('b'), 'b');
		cs.add(options('c'), { dontStart: true });
		assert.equal(el.getAttribute('c'), null);
		assert.equal(cs.get('c').isStarted, undefined);
	});

	it('accepts constructor states as a list and as ready State instances', () => {
		const el = new FakeElement();
		const ready = new State(options('ready', { attrTarget: el, storageKeyPrefix: 't.' }));
		const cs = new StateManager({
			attrTarget: el,
			states: [options('listed'), ready],
		});
		assert.equal(cs.get('listed') instanceof State, true);
		assert.equal(cs.get('ready'), ready);
		cs.start();
		assert.equal(el.getAttribute('listed'), 'listed');
		assert.equal(el.getAttribute('ready'), 'ready');
	});

	it('keeps a ready state as-is on an object key', () => {
		const el = new FakeElement();
		const ws = new State(options('ws', { attrTarget: el, storageKeyPrefix: 't.' }));
		const cs = new StateManager({
			attrTarget: el,
			states: { ignored: ws },
		});
		assert.equal(cs.get('ws'), ws);
		assert.equal(cs.get('ignored'), undefined);
	});

	it('throws on a missing or empty id', () => {
		const cs = new StateManager({ attrTarget: new FakeElement() });
		assert.throws(() => cs.add({ value: () => 'x' }), /missing state id/);
		assert.throws(() => cs.add({ id: undefined, value: () => 'x' }), /missing state id/);
		assert.throws(() => cs.add({ id: '', value: () => 'x' }), /missing state id/);
		assert.throws(() => cs.add({ id: null, value: () => 'x' }), /missing state id/);
	});

	it('returns the same instance on add and get', () => {
		const cs = new StateManager({ attrTarget: new FakeElement() });
		const state = cs.add(options('x'));
		assert.equal(state instanceof State, true);
		assert.equal(cs.get('x'), state);
		assert.equal(cs.get('missing'), undefined);
	});

	it('throws when the id is taken unless replace is set', () => {
		const el = new FakeElement();
		const cs = new StateManager({ attrTarget: el });
		const first = cs.add(options('x', { value: () => 'one' }));
		cs.start();
		assert.throws(() => cs.add(options('x', { value: () => 'two' })), /already exists/);
		assert.equal(cs.get('x'), first);
		const second = cs.add(options('x', { value: () => 'two' }), { replace: true });
		second.start();
		assert.equal(cs.get('x'), second);
		assert.notEqual(second, first);
		assert.equal(cs.values.x, 'two');
		assert.equal(first.isDestroyed, true);
	});

	it('same instance in the slot is a no-op', () => {
		const cs = new StateManager({ attrTarget: new FakeElement() });
		const state = cs.add(options('x'));
		assert.equal(cs.add(state), state);
		assert.equal(cs.add(state, { replace: true }), state);
		assert.equal(cs.get('x'), state);
	});

	it('replace with detach stops and keeps the old state alive', () => {
		const el = new FakeElement();
		const cs = new StateManager({ attrTarget: el });
		const first = cs.add(options('x', { value: () => 'one' }));
		cs.start();
		cs.autoStartStates = true;
		const second = cs.add(options('x', { value: () => 'two' }), {
			replace: true,
			detach: true,
		});
		assert.equal(first.isDestroyed, undefined);
		assert.equal(first.isStarted, false);
		assert.equal(cs.get('x'), second);
		assert.equal(el.getAttribute('x'), 'two');
	});

	it('accepts a ready State on add', () => {
		const el = new FakeElement();
		const state = new State(options('solo', { attrTarget: el, storageKeyPrefix: 't.' }));
		const cs = new StateManager({ attrTarget: el });
		assert.equal(cs.add(state), state);
		cs.start();
		assert.equal(cs.values.solo, 'solo');
	});

	it('rejects a destroyed state', () => {
		const el = new FakeElement();
		const state = new State(options('dead', { attrTarget: el, storageKeyPrefix: 't.' }));
		state.destroy();
		const cs = new StateManager({ attrTarget: el });
		assert.throws(() => cs.add(state), /destroyed/);
		assert.throws(() => cs.start(state), /destroyed/);
		assert.throws(() => cs.set(state, 'x'), /destroyed/);
	});

	it('persists under tabu.clientstate. when storageKeyPrefix is omitted', () => {
		withStorages((local) => {
			assert.equal(DEFAULT_STORAGE_KEY_PREFIX, 'tabu.clientstate.');
			const el = new FakeElement();
			const cs = new StateManager({ attrTarget: el });
			cs.add(options('theme'));
			cs.start();
			cs.set('theme', 'dark', false);
			assert.equal(local.getItem('tabu.clientstate.theme'), stored('dark'));
		});
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
			cs.set('theme', 'dark', false);
			assert.equal(el.getAttribute('theme'), 'dark');
			assert.equal(local.getItem('app.theme'), stored('dark'));
		});
	});

	it('does not auto-start add after start() unless autoStartStates is on', () => {
		const el = new FakeElement();
		const cs = new StateManager({ attrTarget: el });
		cs.start();
		cs.add(options('a'));
		assert.equal(el.getAttribute('a'), null);
		cs.get('a').start();
		assert.equal(el.getAttribute('a'), 'a');
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
		assert.equal(cs.get(1), cs.get('1'));
		assert.equal(cs.values[mark], 'sym');
		assert.equal(cs.values[String(mark)], 'sym');
		assert.equal(cs.values[true], 'yes');
		assert.deepEqual(Object.keys(cs.values).sort(), ['1', String(mark), 'true'].sort());
	});

	it('persists overrides for ids that stringify', () => {
		withStorages((local) => {
			const mark = Symbol('mark');
			for (const id of [Infinity, -Infinity, NaN, true, false, mark]) {
				const el = new FakeElement();
				const cs = new StateManager({ attrTarget: el, storageKeyPrefix: 't.' });
				cs.add(options(id, { value: () => 'live', attrName: 'data-x' }));
				cs.start();
				cs.set(id, 'held', false);
				assert.equal(cs.values[id], 'held');
				assert.equal(local.getItem(`t.${String(id)}`), stored('held'), String(id));
				cs.remove(id);
				cs.add(options(id, { value: () => 'live', attrName: 'data-x' }));
				cs.start();
				assert.equal(cs.values[id], 'held', String(id));
			}
		});
	});

	it('reads and writes through values; set persists', () => {
		const el = new FakeElement();
		const cs = new StateManager({ attrTarget: el });
		assert.equal(cs.values.missing, undefined);
		assert.equal('missing' in cs.values, false);
		assert.throws(() => { cs.values.missing = 'no'; }, /unknown state missing/);
		assert.throws(() => cs.setTarget('missing', {}), /unknown state missing/);
		assert.throws(() => cs.set('missing', 'no'), /unknown state missing/);
		assert.equal(cs.hasOverrides('missing'), false);
		assert.equal(cs.getOverrides('missing'), undefined);

		cs.add(options('ok'));
		cs.add(options('other'));
		cs.start();
		assert.equal(cs.values.ok, 'ok');
		cs.values.ok = 'held';
		assert.equal(cs.values.ok, 'held');
		cs.setTarget('ok', fakeTarget({ token: 'next' }));
		assert.equal(cs.values.ok, 'held');
		cs.values.ok = undefined;
		assert.equal(cs.values.ok, 'next');
		cs.set('ok', 'stored', false);
		assert.equal(cs.values.ok, 'stored');
	});

	it('set and setTarget accept a state instance', () => {
		const el = new FakeElement();
		const cs = new StateManager({ attrTarget: el });
		const state = cs.add(options('ok'));
		cs.start();
		cs.set(state, 'held');
		assert.equal(cs.values.ok, 'held');
		assert.deepEqual(cs.getOverrides(state), { memory: true, session: false, local: false });
		assert.equal(cs.hasOverrides('ok'), true);
		cs.setTarget(state, fakeTarget({ token: 'next' }), true);
		assert.equal(cs.values.ok, 'held');
	});

	it('set writes named layers and clears them independently', () => {
		withStorages((local, session) => {
			const el = new FakeElement();
			const cs = new StateManager({ attrTarget: el, storageKeyPrefix: 't.' });
			cs.add(options('ok'));
			cs.start();
			cs.set('ok', 'dark', { memory: true, local: true });
			assert.equal(cs.values.ok, 'dark');
			assert.equal(local.getItem('t.ok'), stored('dark'));
			cs.set('ok', 'night', 'session');
			assert.equal(session.getItem('t.ok'), stored('night'));
			assert.equal(cs.values.ok, 'dark');
			cs.set('ok', undefined, { memory: true });
			assert.equal(cs.values.ok, 'night');
			cs.set('ok', undefined, { memory: true, session: true, local: true });
			assert.equal(cs.values.ok, 'ok');
			assert.equal(local.getItem('t.ok'), null);
			assert.equal(session.getItem('t.ok'), null);
		});
	});

	it('setTarget respects dontStart', () => {
		const el = new FakeElement();
		const cs = new StateManager({ attrTarget: el });
		cs.add(options('ws', {
			source: {
				bind(ctx) { if (!ctx.target) return; },
				unbind() {},
			},
			value: ({ target } = {}) => target?.clientWidth,
		}));
		cs.setTarget('ws', { clientWidth: 120 }, true);
		assert.equal(cs.values.ws, undefined);
		cs.start();
		cs.setTarget('ws', { clientWidth: 80 });
		assert.equal(cs.values.ws, 80);
		cs.setTarget('ws', { clientWidth: 40 }, true);
		assert.equal(cs.values.ws, 80);
	});

	it('start and stop take an id or a state; missing id is a no-op', () => {
		const el = new FakeElement();
		const cs = new StateManager({ attrTarget: el });
		const one = cs.add(options('one'));
		cs.add(options('two'));
		cs.start(one);
		assert.equal(el.getAttribute('one'), 'one');
		assert.equal(el.getAttribute('two'), null);
		cs.start('ghost');
		cs.stop('one');
		assert.equal(one.isStarted, false);
		cs.start();
		assert.equal(el.getAttribute('two'), 'two');
		cs.stop();
		assert.equal(cs.get('two').isStarted, false);
	});

	it('remove destroys by default and detaches when asked', () => {
		const el = new FakeElement({ a: 'origin' });
		const cs = new StateManager({ attrTarget: el });
		const a = cs.add(options('a'));
		cs.start();
		cs.remove('a');
		assert.equal(cs.get('a'), undefined);
		assert.equal(a.isDestroyed, true);
		assert.equal(el.getAttribute('a'), 'origin');

		const b = cs.add(options('b'));
		cs.start('b');
		cs.remove(b, { detach: true });
		assert.equal(cs.get('b'), undefined);
		assert.equal(b.isDestroyed, undefined);
		assert.equal(b.isStarted, false);
		cs.remove('ghost');
	});

	it('remove() destroys every state', () => {
		const el = new FakeElement({ x: 'origin' });
		const cs = new StateManager({ attrTarget: el });
		cs.add(options('x'));
		cs.start();
		cs.remove();
		assert.equal(cs.get('x'), undefined);
		assert.equal(el.getAttribute('x'), 'origin');
		cs.add(options('y'));
		assert.equal(el.getAttribute('y'), null);
	});
});
