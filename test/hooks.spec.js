import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { State, tryCall, toCamelCase, stateHookNames } from '../State.js';
import { StateManager } from '../StateManager.js';
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
		assert.equal(toCamelCase('before:state:start'), 'beforeStateStart');
		assert.equal(toCamelCase('state:change'), 'stateChange');
		assert.ok(stateHookNames.includes('change'));
		assert.equal(stateHookNames.includes('start:fail'), false);
	});

	it('tryCall runs a function and skips the rest', () => {
		const seen = [];
		tryCall(function (a) { seen.push([this.id, a]); }, { id: 'x' }, ['v']);
		tryCall(undefined, {});
		tryCall(false, {});
		tryCall('no', {});
		assert.deepEqual(seen, [['x', 'v']]);
	});

	it('state named hooks get no id; all gets hook, state, value', () => {
		const named = [];
		const all = [];
		const el = new FakeElement();
		const state = new State({
			id: 'theme',
			attrTarget: el,
			storageKeyPrefix: 't.',
			value: () => 'light',
			source: dead,
			hooks: {
				beforeStart() { named.push(['before:start', this.id]); },
				start(value) { named.push(['start', this.id, value]); },
				change(value) { named.push(['change', this.id, value]); },
				all(hook, host, value) { all.push([hook, host === this, value]); },
			},
		});
		state.start();
		state.set('dark');
		assert.deepEqual(named, [
			['before:start', 'theme'],
			['change', 'theme', 'light'],
			['start', 'theme', 'light'],
			['change', 'theme', 'dark'],
		]);
		assert.deepEqual(all, [
			['before:start', true, undefined],
			['change', true, 'light'],
			['start', true, 'light'],
			['change', true, 'dark'],
		]);
	});

	it('manager fan-out is hook, state, ...args; this is the manager', () => {
		const named = [];
		const all = [];
		const el = new FakeElement();
		const cs = new StateManager({
			attrTarget: el,
			autoStartStates: true,
			hooks: {
				all(hook, state) {
					all.push([hook, state?.id, this === cs]);
				},
				beforeAdd(hook, stateOptions) {
					named.push(['before:add', hook, stateOptions.id, this === cs]);
				},
				add(hook, state) {
					named.push(['add', hook, state.id]);
				},
				stateStart(hook, state, value) {
					named.push(['state:start', hook, state.id, value]);
				},
				stateChange(hook, state, value) {
					named.push(['state:change', hook, state.id, value]);
				},
			},
		});
		cs.add(options('theme', { token: 'light' }));
		cs.set('theme', 'dark');
		assert.deepEqual(named, [
			['before:add', 'before:add', 'theme', true],
			['add', 'add', 'theme'],
			['state:change', 'state:change', 'theme', 'light'],
			['state:start', 'state:start', 'theme', 'light'],
			['state:change', 'state:change', 'theme', 'dark'],
		]);
		assert.deepEqual(all.map(row => row[0]), [
			'before:add',
			'add',
			'before:state:start',
			'state:change',
			'state:start',
			'state:change',
		]);
		assert.equal(all.every(row => row[2] === true), true);
	});

	it('same instance in the slot does not fire add hooks', () => {
		const seen = [];
		const el = new FakeElement();
		const cs = new StateManager({
			attrTarget: el,
			hooks: {
				beforeAdd() { seen.push('before:add'); },
				add() { seen.push('add'); },
			},
		});
		const state = cs.add(options('x'));
		assert.deepEqual(seen, ['before:add', 'add']);
		seen.length = 0;
		assert.equal(cs.add(state), state);
		assert.equal(cs.add(state, { replace: true }), state);
		assert.deepEqual(seen, []);
	});

	it('detach hooks fire when the state is unhooked, not destroyed', () => {
		const seen = [];
		const el = new FakeElement();
		const cs = new StateManager({
			attrTarget: el,
			hooks: {
				beforeDetach(hook, state) { seen.push(['before:detach', hook, state.id]); },
				detach(hook, state) { seen.push(['detach', hook, state.id, state.isDestroyed]); },
				stateDestroy() { seen.push('state:destroy'); },
			},
		});
		const first = cs.add(options('x'));
		cs.add(options('x'), { replace: true, detach: true });
		assert.deepEqual(seen, [
			['before:detach', 'before:detach', 'x'],
			['detach', 'detach', 'x', undefined],
		]);
		assert.equal(first.isDestroyed, undefined);

		seen.length = 0;
		const second = cs.get('x');
		cs.remove(second, { detach: true });
		assert.deepEqual(seen, [
			['before:detach', 'before:detach', 'x'],
			['detach', 'detach', 'x', undefined],
		]);
		assert.equal(second.isDestroyed, undefined);
	});

	it('destroy from outside drops the state from the manager map', () => {
		const el = new FakeElement();
		const cs = new StateManager({ attrTarget: el });
		const state = cs.add(options('x'));
		state.destroy();
		assert.equal(cs.get('x'), undefined);
		assert.equal(state.isDestroyed, true);
	});

	it('a throw in a named state hook stops all and manager fan-out', () => {
		const seen = [];
		const el = new FakeElement();
		const cs = new StateManager({
			attrTarget: el,
			hooks: {
				stateStart() { seen.push('mgr'); },
			},
		});
		const state = cs.add(options('x', {
			hooks: {
				beforeStart() { throw new Error('named'); },
				all() { seen.push('all'); },
			},
		}));
		assert.throws(() => state.start(), /named/);
		assert.deepEqual(seen, []);
	});
});
