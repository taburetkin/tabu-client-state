import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { State } from '../State.js';
import { Storages } from '../Storages.js';
import { matchMediaState } from '../presets.js';
import { FakeElement, fakeMedia, fakeTarget, installDom, stored, withStorages } from './helpers.js';

function liveState(el, overrides = {}) {
	return new State({
		id: 'data-x',
		attrTarget: el,
		storages: new Storages('t.'),
		value: ({ target } = {}) => target?.token ?? 'live',
		source: {
			target: overrides.target ?? fakeTarget({ token: 'live' }),
			bind() {},
			unbind() {},
		},
		...overrides,
	});
}


describe('State', () => {
	let dom;

	before(() => {
		dom = installDom();
	});

	after(() => {
		dom.restore();
	});

	it('defaults attrName to id and does not publish until start', () => {
		const el = new FakeElement();
		const state = liveState(el);
		assert.equal(state.id, 'data-x');
		assert.equal(state.attrName, 'data-x');
		assert.equal(state.value, undefined);
		assert.equal(el.getAttribute('data-x'), null);
		state.start();
		assert.equal(state.value, 'live');
		assert.equal(el.getAttribute('data-x'), 'live');
	});

	it('stringifies id and uses it as attrName when omitted', () => {
		const el = new FakeElement();
		const state = new State({
			id: 1,
			attrTarget: el,
			storages: new Storages('t.'),
			value: () => 'n',
			source: { bind() {}, unbind() {} },
		});
		assert.equal(state.id, '1');
		assert.equal(state.attrName, '1');
	});

	it('keeps a custom attrName and the original attribute', () => {
		const el = new FakeElement({ 'data-theme': 'old' });
		const state = new State({
			id: 'theme',
			attrName: 'data-theme',
			attrTarget: el,
			storages: new Storages('t.'),
			value: () => 'light',
			source: { bind() {}, unbind() {} },
		});
		assert.equal(state.attrOriginValue, 'old');
		state.start();
		assert.equal(el.getAttribute('data-theme'), 'light');
		state.destroy();
		assert.equal(el.getAttribute('data-theme'), 'old');
		state.destroy();
	});

	it('restores a missing attribute on destroy', () => {
		const el = new FakeElement();
		const state = liveState(el);
		state.start();
		assert.equal(el.getAttribute('data-x'), 'live');
		state.destroy();
		assert.equal(el.getAttribute('data-x'), null);
	});

	it('writes the attribute on start and leaves it on stop', () => {
		const el = new FakeElement();
		const target = fakeTarget({ token: 'xs' });
		const state = liveState(el, { target });
		state.start();
		assert.equal(state.isStarted, true);
		assert.equal(el.getAttribute('data-x'), 'xs');
		state.start();
		state.stop();
		assert.equal(state.isStarted, false);
		assert.equal(el.getAttribute('data-x'), 'xs');
	});

	it('starts even when bind returns false', () => {
		const el = new FakeElement();
		const state = new State({
			id: 'data-ws',
			attrTarget: el,
			storages: new Storages('t.'),
			value: () => 'xs',
			source: { bind() { return false; }, unbind() {} },
		});
		state.start();
		assert.equal(state.isStarted, true);
		assert.equal(state.value, 'xs');
		assert.equal(el.getAttribute('data-ws'), 'xs');
	});

	it('locks an override, persists it, and clears both storages on undefined', () => {
		withStorages((local, session) => {
			const el = new FakeElement();
			const state = liveState(el);
			state.start();
			state.set('locked');
			assert.equal(el.getAttribute('data-x'), 'locked');
			state.set('session', true);
			assert.equal(session.getItem('t.data-x'), stored('session'));
			state.set('local', false);
			assert.equal(local.getItem('t.data-x'), stored('local'));
			state.set(undefined);
			assert.equal(session.getItem('t.data-x'), null);
			assert.equal(local.getItem('t.data-x'), null);
			assert.equal(el.getAttribute('data-x'), 'live');
		});
	});

	it('prefers a session override, then local, when starting', () => {
		withStorages((local, session) => {
			const el = new FakeElement();
			session.setItem('t.data-x', stored('from-session'));
			const state = liveState(el);
			state.start();
			assert.equal(state.value, 'from-session');
			assert.equal(el.getAttribute('data-x'), 'from-session');
			state.destroy();

			const el2 = new FakeElement();
			local.setItem('t.data-y', stored('from-local'));
			const localOnly = new State({
				id: 'data-y',
				attrTarget: el2,
				storages: new Storages('t.'),
				value: () => 'live',
				source: { bind() {}, unbind() {} },
			});
			localOnly.start();
			assert.equal(localOnly.value, 'from-local');
		});
	});

	it('rebuilds the source on setTarget and can stay stopped', () => {
		const el = new FakeElement();
		const first = fakeTarget({ token: 'one' });
		const second = fakeTarget({ token: 'two' });
		const state = liveState(el, { target: first });
		state.start();
		assert.equal(el.getAttribute('data-x'), 'one');
		state.setTarget(second);
		assert.equal(el.getAttribute('data-x'), 'two');
		state.setTarget(first, true);
		assert.equal(state.isStarted, false);
	});

	it('locks through value assignment and unlocks on undefined', () => {
		const el = new FakeElement();
		let fire;
		const state = new State({
			id: 'data-x',
			attrTarget: el,
			storages: new Storages('t.'),
			value: () => 'live',
			source: {
				bind(ctx) { fire = ctx.callback; },
				unbind() {},
			},
		});
		state.start();
		state.value = 'held';
		fire();
		assert.equal(state.value, 'held');
		assert.equal(el.getAttribute('data-x'), 'held');
		state.value = undefined;
		assert.equal(state.value, 'live');
		assert.equal(el.getAttribute('data-x'), 'live');
	});

	it('ignores a live source tick while locked', () => {
		const el = new FakeElement();
		let fire;
		const state = new State({
			id: 'data-x',
			attrTarget: el,
			storages: new Storages('t.'),
			value: () => 'live',
			source: {
				bind(ctx) { fire = ctx.callback; },
				unbind() {},
			},
		});
		state.start();
		state.set('held');
		fire();
		assert.equal(state.value, 'held');
		assert.equal(el.getAttribute('data-x'), 'held');
	});

	it('keeps a locked value across setTarget', () => {
		const el = new FakeElement();
		const state = liveState(el);
		state.start();
		state.set('held');
		state.setTarget(fakeTarget({ token: 'other' }));
		assert.equal(state.value, 'held');
		assert.equal(el.getAttribute('data-x'), 'held');
	});

	it('keeps a boolean value and writes the mapped attribute', () => {
		withStorages((local) => {
			const media = matchMediaState({
				id: 'hover',
				query: '(hover: hover)',
				true: 'yes',
				false: 'no',
			});
			const el = new FakeElement();
			const state = new State({
				...media,
				attrName: 'data-hover',
				attrTarget: el,
				storages: new Storages('t.'),
				source: {
					target: fakeMedia(true),
					bind() {},
					unbind() {},
				},
			});
			state.start();
			assert.equal(state.value, true);
			assert.equal(el.getAttribute('data-hover'), 'yes');
			state.set(false, false);
			assert.equal(state.value, false);
			assert.equal(el.getAttribute('data-hover'), 'no');
			assert.equal(local.getItem('t.hover'), stored(false));
			state.destroy();

			const restored = new State({
				...media,
				attrName: 'data-hover',
				attrTarget: new FakeElement(),
				storages: new Storages('t.'),
				value: () => true,
				source: { bind() {}, unbind() {} },
			});
			restored.start();
			assert.equal(restored.value, false);
			assert.equal(restored.attrTarget.getAttribute('data-hover'), 'no');
		});
	});

	it('writes boolean attributes as true/false when there is no mapping', () => {
		const el = new FakeElement();
		const state = new State({
			id: 'on',
			attrTarget: el,
			storages: new Storages('t.'),
			value: () => false,
			source: { bind() {}, unbind() {} },
		});
		state.start();
		assert.equal(state.value, false);
		assert.equal(el.getAttribute('on'), 'false');
	});

	it('writes an empty string as an attribute and removes when attrValue is undefined', () => {
		const el = new FakeElement();
		const state = liveState(el);
		state.start();
		state.set('');
		assert.equal(el.getAttribute('data-x'), '');

		const mapped = new State({
			id: 'data-m',
			attrTarget: new FakeElement(),
			storages: new Storages('t.'),
			value: () => 'on',
			attrValue: (v) => v === 'on' ? v : undefined,
			source: { bind() {}, unbind() {} },
		});
		mapped.start();
		assert.equal(mapped.attrTarget.getAttribute('data-m'), 'on');
		mapped.set('off');
		assert.equal(mapped.attrTarget.getAttribute('data-m'), null);

		const silent = { getAttribute() { return null; } };
		const other = new State({
			id: 'data-z',
			attrTarget: silent,
			storages: new Storages('t.'),
			value: () => 'v',
			source: { bind() {}, unbind() {} },
		});
		other.start();
		assert.equal(other.value, 'v');

		const empty = liveState(new FakeElement());
		empty.attrTarget = undefined;
		empty.start();
		assert.equal(empty.value, 'live');
	});

	it('notifies change only after start, and only when the slot changes', () => {
		const seen = [];
		const el = new FakeElement();
		const target = fakeTarget({ token: 'live' });
		const state = liveState(el, {
			target,
			hooks: {
				change(id, value) { seen.push([id, value, state.isStarted, el.getAttribute('data-x')]); },
			},
		});
		assert.deepEqual(seen, []);

		state.start();
		assert.deepEqual(seen, [['data-x', 'live', true, 'live']]);
		state.start();
		assert.deepEqual(seen, [['data-x', 'live', true, 'live']]);

		state.stop();
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
		assert.equal(el.getAttribute('data-x'), 'while-stopped');

		state.start();
		assert.equal(seen.length, 2);
		assert.equal(state.value, 'while-stopped');
		assert.equal(el.getAttribute('data-x'), 'while-stopped');
	});

	it('does not notify change when the live value is undefined', () => {
		const seen = [];
		const el = new FakeElement();
		const state = new State({
			id: 'data-x',
			attrTarget: el,
			storages: new Storages('t.'),
			value: () => undefined,
			source: { bind() {}, unbind() {} },
			hooks: {
				change() { seen.push('change'); },
			},
		});
		state.start();
		assert.deepEqual(seen, []);
		assert.equal(state.value, undefined);
		assert.equal(el.getAttribute('data-x'), null);
	});

	it('keeps a memory lock over storage on start', () => {
		withStorages((_local, session) => {
			session.setItem('t.data-x', stored('from-session'));
			const el = new FakeElement();
			const state = liveState(el);
			state.set('memory');
			assert.equal(state.value, 'memory');
			assert.equal(el.getAttribute('data-x'), 'memory');
			state.start();
			assert.equal(state.value, 'memory');
			assert.equal(el.getAttribute('data-x'), 'memory');

			session.setItem('t.data-x', stored('later'));
			state.stop();
			state.start();
			assert.equal(state.value, 'memory');
			assert.equal(el.getAttribute('data-x'), 'memory');
		});
	});

	it('accepts a pin-only state, a value without listeners, and a detect pair', () => {
		const pinEl = new FakeElement();
		const pin = new State({
			id: 'pin',
			attrTarget: pinEl,
			storages: new Storages('t.'),
		});
		pin.start();
		assert.equal(pin.value, undefined);
		assert.equal(pinEl.getAttribute('pin'), null);
		pin.set('held');
		assert.equal(pin.value, 'held');
		assert.equal(pinEl.getAttribute('pin'), 'held');

		const defEl = new FakeElement();
		const def = new State({
			id: 'def',
			attrTarget: defEl,
			storages: new Storages('t.'),
			value: () => 'default',
		});
		def.start();
		assert.equal(def.value, 'default');
		assert.equal(defEl.getAttribute('def'), 'default');

		const liveEl = new FakeElement();
		const live = new State({
			id: 'live',
			attrTarget: liveEl,
			storages: new Storages('t.'),
			value: () => 'auto',
			source: { bind() {}, unbind() {} },
		});
		live.start();
		assert.equal(live.value, 'auto');
		assert.equal(liveEl.getAttribute('live'), 'auto');
	});

	it('unlocks a pin-only state to undefined and a constant back to that default', () => {
		const pinEl = new FakeElement();
		const pinSeen = [];
		const pin = new State({
			id: 'pin',
			attrTarget: pinEl,
			storages: new Storages('t.'),
			hooks: {
				change(_id, value) { pinSeen.push(value); },
			},
		});
		pin.start();
		pin.set('held');
		assert.deepEqual(pinSeen, ['held']);
		pin.set(undefined);
		assert.equal(pin.value, undefined);
		assert.equal(pinEl.getAttribute('pin'), null);
		assert.deepEqual(pinSeen, ['held', undefined]);

		const themeEl = new FakeElement();
		const themeSeen = [];
		const theme = new State({
			id: 'theme',
			attrTarget: themeEl,
			storages: new Storages('t.'),
			value: 'light',
			hooks: {
				change(_id, value) { themeSeen.push(value); },
			},
		});
		theme.start();
		assert.equal(theme.value, 'light');
		theme.set('dark');
		theme.set(undefined);
		assert.equal(theme.value, 'light');
		assert.equal(themeEl.getAttribute('theme'), 'light');
		assert.deepEqual(themeSeen, ['light', 'dark', 'light']);
	});

	it('unlocks with one change to the live value', () => {
		const seen = [];
		const el = new FakeElement();
		const state = liveState(el, {
			hooks: {
				change(_id, value) { seen.push(value); },
			},
		});
		state.start();
		state.set('held');
		assert.deepEqual(seen, ['live', 'held']);
		state.set(undefined);
		assert.deepEqual(seen, ['live', 'held', 'live']);
		assert.equal(state.value, 'live');
	});

	it('binds then unbinds on a locked start; a live start leaves the listener on', () => {
		let bound = 0;
		let unbound = 0;
		const source = {
			bind() { bound += 1; },
			unbind() { unbound += 1; },
		};
		const locked = new State({
			id: 'data-x',
			attrTarget: new FakeElement(),
			storages: new Storages('t.'),
			value: () => 'live',
			source,
		});
		locked.set('held');
		locked.start();
		assert.equal(bound, 1);
		assert.equal(unbound, 1);
		assert.equal(locked.isStarted, true);
		assert.equal(locked.value, 'held');

		const live = new State({
			id: 'data-y',
			attrTarget: new FakeElement(),
			storages: new Storages('t.'),
			value: () => 'live',
			source: {
				bind() { bound += 1; },
				unbind() { unbound += 1; },
			},
		});
		live.start();
		assert.equal(bound, 2);
		assert.equal(unbound, 1);
		assert.equal(live.value, 'live');
	});

	it('locks storage on start even when bind returns false', () => {
		withStorages((_local, session) => {
			session.setItem('t.data-x', stored('from-session'));
			const el = new FakeElement();
			const state = new State({
				id: 'data-x',
				attrTarget: el,
				storages: new Storages('t.'),
				value: () => 'live',
				source: {
					bind() { return false; },
					unbind() {},
				},
			});
			state.start();
			assert.equal(state.isStarted, true);
			assert.equal(state.value, 'from-session');
			assert.equal(el.getAttribute('data-x'), 'from-session');
		});
	});

	it('publishes a memory pin on start even when bind returns false', () => {
		const el = new FakeElement();
		const state = new State({
			id: 'data-x',
			attrTarget: el,
			storages: new Storages('t.'),
			value: () => 'live',
			source: {
				bind() { return false; },
				unbind() {},
			},
		});
		state.set('held');
		state.start();
		assert.equal(state.isStarted, true);
		assert.equal(state.value, 'held');
		assert.equal(el.getAttribute('data-x'), 'held');
	});

	it('notifies change for a storage override and a live retarget', () => {
		withStorages((_local, session) => {
			session.setItem('t.data-x', stored('from-session'));
			const seen = [];
			const el = new FakeElement();
			const state = liveState(el, {
				hooks: {
					change(id, value) { seen.push([id, value]); },
				},
			});
			state.start();
			assert.deepEqual(seen, [['data-x', 'from-session']]);
			assert.equal(el.getAttribute('data-x'), 'from-session');
		});

		const seen = [];
		const el = new FakeElement();
		const first = fakeTarget({ token: 'one' });
		const second = fakeTarget({ token: 'two' });
		const state = liveState(el, {
			target: first,
			hooks: {
				change(_id, value) { seen.push(value); },
			},
		});
		state.start();
		state.setTarget(second);
		assert.deepEqual(seen, ['one', 'two']);
		assert.equal(el.getAttribute('data-x'), 'two');
	});

	it('notifies change on start even when bind returns false', () => {
		const seen = [];
		const el = new FakeElement();
		const state = new State({
			id: 'data-ws',
			attrTarget: el,
			storages: new Storages('t.'),
			value: () => 'xs',
			hooks: {
				change() { seen.push('change'); },
			},
			source: { bind() { return false; }, unbind() {} },
		});
		state.start();
		assert.deepEqual(seen, ['change']);
		assert.equal(state.isStarted, true);
	});

	it('refuses to run after destroy', () => {
		const el = new FakeElement();
		const state = liveState(el);
		state.destroy();
		assert.throws(() => state.start(), /destroyed/);
		assert.throws(() => state.set('x'), /destroyed/);
		assert.throws(() => { state.value = 'x'; }, /destroyed/);
		assert.throws(() => state.setTarget({}), /destroyed/);
	});
});
