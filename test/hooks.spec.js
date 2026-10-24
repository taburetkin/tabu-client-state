import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { State, callHook, tryCall, toCamelCase, stateHookNames } from '../State.js';
import { StateManager } from '../StateManager.js';
import { Storages } from '../Storages.js';
import { FakeElement, installDom } from './helpers.js';

const dead = { bind() {}, unbind() {} };

function options(id, extra = {}) {
	return {
		id,
		value: () => extra.token ?? id,
		source: extra.source ?? dead,
		...extra,
	};
}

function listen(mgrHooks = {}, stateHooks = {}, extra = {}) {
	const mgrAll = [];
	const stateAll = [];
	const el = new FakeElement();
	const cs = new StateManager({
		attrTarget: el,
		hooks: {
			all(...args) { mgrAll.push(args); },
			...mgrHooks,
		},
		stateOptions: {
			hooks: {
				all(...args) { stateAll.push(args); },
				...stateHooks,
			},
			...extra.stateOptions,
		},
	});
	return { cs, el, mgrAll, stateAll };
}

describe('hooks', () => {
	let dom;

	before(() => {
		dom = installDom();
	});

	after(() => {
		dom.restore();
	});

	it('maps colon names to camelCase', () => {
		assert.equal(toCamelCase('change'), 'change');
		assert.equal(toCamelCase('before:start'), 'beforeStart');
		assert.equal(toCamelCase('start:fail'), 'startFail');
		assert.equal(toCamelCase('before:state:start'), 'beforeStateStart');
		assert.equal(toCamelCase('state:start:fail'), 'stateStartFail');
		assert.ok(stateHookNames.includes('change'));
		assert.ok(stateHookNames.includes('before:start'));
	});

	describe('callHook', () => {
		it('runs the named slot, then all, then proxy, with the host as this', () => {
			const seen = [];
			const host = { id: 'x' };
			callHook(
				host,
				{
					beforeStart(id) { seen.push(['named', this.id, id]); },
					all(hook, ...args) { seen.push(['all', this.id, hook, ...args]); },
				},
				function proxy(hook, ...args) { seen.push(['proxy', this.id, hook, ...args]); },
				'beforeStart',
				'before:start',
				['x'],
			);
			assert.deepEqual(seen, [
				['named', 'x', 'x'],
				['all', 'x', 'before:start', 'x'],
				['proxy', 'x', 'before:start', 'x'],
			]);
		});

		it('skips a slot that is not a function', () => {
			const seen = [];
			tryCall(undefined, {});
			tryCall(false, {});
			tryCall('no', {});
			callHook({}, { change: false, all: 1 }, 0, 'change', 'change', []);
			callHook({ id: 'x' }, {}, function proxy(hook) { seen.push(hook); }, 'change', 'change', []);
			assert.deepEqual(seen, ['change']);
		});

		it('a throw in the named slot stops all and proxy', () => {
			const seen = [];
			assert.throws(() => callHook(
				{},
				{
					change() { throw new Error('named'); },
					all() { seen.push('all'); },
				},
				() => { seen.push('proxy'); },
				'change',
				'change',
				[],
			), /named/);
			assert.deepEqual(seen, []);
		});
	});

	describe('state', () => {
		it('notifies change only after start, and only when the slot changes', () => {
			const seen = [];
			const el = new FakeElement();
			const state = new State({
				id: 'data-x',
				attrTarget: el,
				storages: new Storages('t.'),
				value: () => 'live',
				source: dead,
				hooks: {
					change(id, value) {
						seen.push([id, value, state.isStarted, el.getAttribute('data-x')]);
					},
				},
			});
			assert.deepEqual(seen, []);
			state.start();
			assert.deepEqual(seen, [['data-x', 'live', true, 'live']]);
			state.start();
			assert.deepEqual(seen, [['data-x', 'live', true, 'live']]);
			state.set('held');
			assert.deepEqual(seen, [
				['data-x', 'live', true, 'live'],
				['data-x', 'held', true, 'held'],
			]);
			state.stop();
			state.set('while-stopped');
			assert.equal(seen.length, 2);
			assert.equal(state.value, 'while-stopped');
			assert.equal(el.getAttribute('data-x'), 'held');
			state.start();
			assert.equal(seen.length, 2);
			assert.equal(state.value, 'while-stopped');
			assert.equal(el.getAttribute('data-x'), 'while-stopped');
		});

		it('does not notify change when bind returns false; start:fail fires instead', () => {
			const seen = [];
			const state = new State({
				id: 'data-ws',
				attrTarget: new FakeElement(),
				storages: new Storages('t.'),
				value: () => 'xs',
				source: { bind() { return false; }, unbind() {} },
				hooks: {
					change() { seen.push('change'); },
					startFail(id) { seen.push(['fail', id, this.isStarted]); },
					start(id, value) { seen.push(['start', id, value]); },
					all(hook) { seen.push(['all', hook]); },
				},
			});
			state.start();
			assert.deepEqual(seen, [
				['all', 'before:start'],
				['fail', 'data-ws', false],
				['all', 'start:fail'],
			]);
			assert.equal(state.isStarted, false);
		});

		it('passes the published value to start', () => {
			const seen = [];
			const state = new State({
				id: 'vp',
				attrTarget: new FakeElement(),
				storages: new Storages('t.'),
				value: () => 'wide',
				source: dead,
				hooks: {
					start(id, value) { seen.push([id, value, this.isStarted]); },
				},
			});
			state.start();
			assert.deepEqual(seen, [['vp', 'wide', true]]);
		});

		it('does not treat beforeStart as a veto', () => {
			const el = new FakeElement();
			const state = new State({
				id: 'vp',
				attrTarget: el,
				storages: new Storages('t.'),
				value: () => 'wide',
				source: dead,
				hooks: { beforeStart() { return false; } },
			});
			state.start();
			assert.equal(state.isStarted, true);
			assert.equal(state.value, 'wide');
			assert.equal(el.getAttribute('vp'), 'wide');
		});

		it('a throw in a named hook stops the method', () => {
			const el = new FakeElement();
			const state = new State({
				id: 'vp',
				attrTarget: el,
				storages: new Storages('t.'),
				value: () => 'wide',
				source: dead,
				hooks: {
					beforeStart() { throw new Error('no'); },
					start() { throw new Error('should not run'); },
				},
			});
			assert.throws(() => state.start(), /no/);
			assert.equal(state.isStarted, undefined);
			assert.equal(el.getAttribute('vp'), null);
		});
	});

	describe('manager', () => {
		it('default hooks reach the state and fan out with a state: prefix', () => {
			const beforeStarts = [];
			const starts = [];
			const { cs, mgrAll, stateAll } = listen({
				stateStart(id, value) { starts.push([this === cs, id, value]); },
			}, {
				beforeStart(id) { beforeStarts.push(id); },
			});
			cs.add(options('vp', { token: 'wide' }));
			cs.start();
			assert.deepEqual(beforeStarts, ['vp']);
			assert.deepEqual(starts, [[true, 'vp', 'wide']]);
			assert.deepEqual(stateAll, [
				['before:start', 'vp'],
				['change', 'vp', 'wide'],
				['start', 'vp', 'wide'],
			]);
			assert.deepEqual(mgrAll.map(row => row[0]), [
				'before:add',
				'add',
				'before:state:start',
				'state:change',
				'state:start',
			]);
			assert.deepEqual(mgrAll.find(row => row[0] === 'state:change'), ['state:change', 'vp', 'wide']);
			assert.deepEqual(mgrAll.find(row => row[0] === 'state:start'), ['state:start', 'vp', 'wide']);
		});

		it('add({ hooks }) replaces the whole default bag and keeps the manager wire', () => {
			const local = [];
			const beforeStarts = [];
			const { cs, mgrAll, stateAll } = listen({}, {
				beforeStart(id) { beforeStarts.push(id); },
			});
			cs.start();
			cs.add(options('ws', {
				token: 12,
				hooks: { change(id, value) { local.push([id, value]); } },
			}));
			assert.deepEqual(local, [['ws', 12]]);
			assert.deepEqual(beforeStarts, []);
			assert.deepEqual(stateAll, []);
			assert.ok(mgrAll.some(row => row[0] === 'state:change' && row[1] === 'ws' && row[2] === 12));
			assert.ok(mgrAll.some(row => row[0] === 'before:state:start'));
		});

		it('reads only .hooks, not a loose all on the options object', () => {
			const seen = [];
			const { cs } = listen({
				all(hook) { seen.push(hook); },
			}, {
				all(hook) { seen.push(['state', hook]); },
			});
			cs.add({
				id: 'vp',
				value: () => 'wide',
				source: dead,
				all() { seen.push('options-all'); },
			});
			cs.start();
			assert.ok(!seen.includes('options-all'));
			assert.ok(seen.some(row => row[0] === 'state' && row[1] === 'change'));
			assert.ok(seen.includes('state:change'));
		});

		it('constructor states go through the same #build as later add', () => {
			const seen = [];
			const el = new FakeElement();
			const cs = new StateManager({
				attrTarget: el,
				states: [options('vp', { token: 'wide' })],
				hooks: {
					stateChange(id, value) { seen.push(['mgr', id, value]); },
				},
				stateOptions: {
					hooks: {
						change(id, value) { seen.push(['state', id, value]); },
					},
				},
			});
			assert.deepEqual(seen, []);
			cs.start();
			assert.deepEqual(seen, [
				['state', 'vp', 'wide'],
				['mgr', 'vp', 'wide'],
			]);
		});

		it('works with no hooks at all', () => {
			const el = new FakeElement();
			const cs = new StateManager({ attrTarget: el });
			cs.add(options('vp', { token: 'wide' }));
			cs.start();
			assert.equal(cs.values.vp, 'wide');
			assert.equal(el.getAttribute('vp'), 'wide');
		});

		it('manager all receives prefixed names; this is the manager', () => {
			const seen = [];
			const hosts = [];
			const el = new FakeElement();
			const cs = new StateManager({
				attrTarget: el,
				hooks: {
					all(hook, ...args) {
						hosts.push(this);
						seen.push([hook, ...args]);
					},
				},
			});
			cs.add(options('vp', { token: 'wide' }));
			cs.start();
			assert.ok(hosts.every(host => host === cs));
			assert.ok(seen.some(row => row[0] === 'state:change'));
			assert.ok(!seen.some(row => row[0] === 'change'));
		});

		it('proxyHooks: false on one state silences that fan-out', () => {
			const seen = [];
			const el = new FakeElement();
			const cs = new StateManager({
				attrTarget: el,
				hooks: {
					all(hook) { seen.push(hook); },
				},
			});
			cs.start();
			cs.add(options('vp', { token: 'wide' }));
			cs.add(options('ws', { token: 12, proxyHooks: false }));
			assert.ok(seen.includes('state:change'));
			assert.equal(seen.filter(name => name === 'state:change').length, 1);
			assert.ok(seen.includes('add'));
		});

		it('proxyHooks: false on stateOptions silences every state wire', () => {
			const seen = [];
			const { cs } = listen({
				all(hook) { seen.push(hook); },
			}, {}, {
				stateOptions: { proxyHooks: false },
			});
			cs.add(options('vp', { token: 'wide' }));
			cs.start();
			assert.ok(seen.includes('before:add'));
			assert.ok(seen.includes('add'));
			assert.ok(!seen.includes('state:change'));
			assert.ok(!seen.includes('before:state:start'));
			assert.ok(!seen.includes('state:start'));
		});

		it('a custom proxyHooks function is called as a method of the state', () => {
			const seen = [];
			const hosts = [];
			const el = new FakeElement();
			const cs = new StateManager({
				attrTarget: el,
				hooks: {
					all(hook) { seen.push(['mgr', hook]); },
				},
			});
			cs.start();
			cs.add(options('ws', {
				token: 12,
				proxyHooks(hook, ...args) {
					hosts.push(this);
					seen.push(['custom', this.id, hook, ...args]);
				},
			}));
			assert.ok(hosts.every(host => host && host.id === 'ws'));
			assert.ok(seen.some(row => row[0] === 'custom' && row[2] === 'change' && row[3] === 'ws' && row[4] === 12));
			assert.ok(!seen.some(row => row[0] === 'mgr' && row[1] === 'state:change'));
			assert.ok(seen.some(row => row[0] === 'mgr' && row[1] === 'add'));
		});
	});
});
