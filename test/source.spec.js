import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createSource, normalizeSource } from '../source.js';
import { fakeTarget, installDom } from './helpers.js';

describe('source', () => {
	let dom;

	before(() => {
		dom = installDom();
	});

	after(() => {
		dom.restore();
	});

	it('starts, syncs, ignores a second start, then stops', () => {
		const target = fakeTarget();
		const seen = [];
		const source = createSource(
			{
				target,
				bind(ctx) { ctx.target.addEventListener('tick', ctx.callback); },
				unbind(ctx) { ctx.target.removeEventListener('tick', ctx.callback); },
			},
			({ target: t }) => t.token,
			value => seen.push(value)
		);

		target.token = 'a';
		assert.equal(source.start(), undefined);
		assert.equal(source.isStarted, true);
		source.sync();
		assert.deepEqual(seen, ['a']);
		assert.equal(source.start(), undefined);
		source.stop();
		assert.equal(source.isStarted, false);
		assert.equal(target.removed.length, 1);
		source.stop();
	});

	it('starts even when bind returns false', () => {
		const source = createSource(
			{
				bind() { return false; },
				unbind() {},
			},
			() => 'x',
			() => {}
		);
		assert.equal(source.start(), undefined);
		assert.equal(source.isStarted, true);
	});

	it('runs a function, a missing value, and a constant without listeners', () => {
		const seen = [];
		const withValue = createSource({}, () => 'x', value => seen.push(value));
		assert.equal(withValue.start(), undefined);
		withValue.sync();
		assert.deepEqual(seen, ['x']);
		withValue.stop();

		const withoutValue = createSource({}, undefined, value => seen.push(value));
		assert.equal(withoutValue.start(), undefined);
		withoutValue.sync();
		assert.deepEqual(seen, ['x', undefined]);
		assert.equal(withoutValue.isStarted, true);

		const constant = createSource({}, 'light', value => seen.push(value));
		constant.sync();
		assert.deepEqual(seen, ['x', undefined, 'light']);
	});

	it('requires bind, unbind and value together', () => {
		const update = () => {};
		assert.throws(() => createSource({ bind() {} }, () => 'x', update), /unbind must be a function/);
		assert.throws(() => createSource({ unbind() {} }, () => 'x', update), /bind must be a function/);
		assert.throws(() => createSource({ bind() {}, unbind() {} }, undefined, update), /value must be a function/);
		assert.throws(() => createSource({ bind: 1, unbind() {} }, () => 'x', update), /bind must be a function/);
		assert.throws(() => createSource({ bind() {}, unbind: 1 }, () => 'x', update), /unbind must be a function/);
	});

	it('gives bind the raw callback on every start', () => {
		const given = [];
		const source = createSource(
			{
				bind(ctx) {
					given.push(ctx.callback);
					const raw = ctx.callback;
					ctx.callback = () => raw();
				},
				unbind() {},
			},
			() => 'x',
			() => {}
		);
		source.start();
		source.stop();
		source.start();
		assert.equal(new Set(given).size, 1);
		assert.equal(given.length, 2);
	});

	it('cancels ctx.callback on stop', () => {
		let cancelled = 0;
		const source = createSource(
			{
				bind(ctx) {
					const raw = ctx.callback;
					ctx.callback = () => raw();
					ctx.callback.cancel = () => { cancelled += 1; };
				},
				unbind() {},
			},
			() => 'x',
			() => {}
		);
		source.start();
		source.stop();
		assert.equal(cancelled, 1);
		source.stop();
		assert.equal(cancelled, 1);
	});
});

describe('normalizeSource', () => {
	let dom;

	before(() => {
		dom = installDom();
	});

	after(() => {
		dom.restore();
	});

	it('copies a source, invokes a factory, and leaves bind/unbind as they are', () => {
		const bound = { bind() {}, unbind() {}, target: 'keep' };
		assert.equal(normalizeSource(bound).target, 'keep');

		const node = fakeTarget();
		const fromFn = normalizeSource(() => ({
			target: node,
			bind() {},
			unbind() {},
		}));
		assert.equal(fromFn.target, node);
		assert.equal(typeof fromFn.bind, 'function');

		assert.deepEqual(normalizeSource(), {});
		assert.deepEqual(normalizeSource({ foo: 1 }), { foo: 1 });
	});

	it('invokes a lazy target', () => {
		const target = fakeTarget();
		const source = normalizeSource({
			target: () => target,
			bind() {},
			unbind() {},
		});
		assert.equal(source.target, target);
	});
});
