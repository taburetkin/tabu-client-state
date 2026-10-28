import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
	tokenByThresholds,
	mediaQueriesFromSizes,
	matchMediaState,
	viewport,
	workspace,
	hover,
	colorScheme,
	orientation,
	event,
	resizeWindow,
	resizeElement,
	timer,
	mediaQuery,
} from '../presets.js';
import { createSource } from '../source.js';
import { State } from '../State.js';
import { FakeElement, FakeResizeObserver, fakeMedia, fakeTarget, installDom, withFakeTimers } from './helpers.js';

function queryMatchesWidth(query, width) {
	if (query === 'all') return true;
	const min = query.match(/^\(min-width:\s*(\d+)px\)$/);
	return min ? width >= Number(min[1]) : false;
}

function tokenFromQueries(queries, width) {
	let token;
	for (const [name, query] of queries) {
		if (queryMatchesWidth(query, width)) token = name;
	}
	return token;
}

function matchMediaForWidth(width) {
	return query => ({
		matches: queryMatchesWidth(query, width),
		media: query,
		addEventListener() {},
		removeEventListener() {},
	});
}

describe('tokenByThresholds', () => {
	const sizes = [
		['xs', 768],
		['sm', 900],
		['xl', 1600],
	];

	it('returns the first token whose limit is above the value', () => {
		assert.equal(tokenByThresholds(sizes, 500), 'xs');
		assert.equal(tokenByThresholds(sizes, 800), 'sm');
	});

	it('returns the last token when the value reaches every limit', () => {
		assert.equal(tokenByThresholds(sizes, 1600), 'xl');
		assert.equal(tokenByThresholds(sizes, 2000), 'xl');
	});

	it('returns undefined when there are no thresholds', () => {
		assert.equal(tokenByThresholds([], 100), undefined);
	});
});

describe('presets', () => {
	let dom;

	before(() => {
		dom = installDom();
	});

	after(() => {
		dom.restore();
	});

	it('exposes the built-in ids and data-* attributes', () => {
		assert.equal(viewport().id, 'vp');
		assert.equal(viewport().attrName, 'data-vp');
		assert.equal(workspace().id, 'ws');
		assert.equal(workspace().attrName, 'data-ws');
		assert.equal(hover().id, 'hover');
		assert.equal(hover().attrName, 'data-hover');
		assert.equal(colorScheme().id, 'dark');
		assert.equal(colorScheme().attrName, 'data-color-scheme');
		assert.equal(orientation().id, 'portrait');
		assert.equal(orientation().attrName, 'data-orientation');
	});

	it('maps workspace width to tokens and tolerates a missing target', () => {
		const ws = workspace();
		assert.equal(ws.value({ target: { clientWidth: 200 } }), 'xs');
		assert.equal(ws.value({ target: { clientWidth: 500 } }), 'md');
		assert.equal(ws.value({ target: { clientWidth: 900 } }), 'xl');
		assert.equal(ws.value({}), undefined);
		assert.equal(typeof ws.source.bind, 'function');
		assert.equal(typeof ws.source.unbind, 'function');
	});

	it('reads matchMedia as booleans and maps them onto attributes', () => {
		assert.equal(hover().source.target().media, '(hover: hover)');
		assert.equal(hover().value({ target: { matches: true } }), true);
		assert.equal(hover().value({ target: { matches: false } }), false);
		assert.equal(hover().attrValue(true), 'yes');
		assert.equal(hover().attrValue(false), 'no');
		assert.equal(hover().attrValue(undefined), 'no');
		assert.equal(colorScheme().value({ target: { matches: true } }), true);
		assert.equal(colorScheme().attrValue(true), 'dark');
		assert.equal(colorScheme().attrValue(false), 'light');
		assert.equal(orientation().value({ target: { matches: true } }), true);
		assert.equal(orientation().attrValue(true), 'portrait');
		assert.equal(orientation().attrValue(false), 'landscape');
		assert.equal(hover().value({}), undefined);
		const named = hover({ id: 'html.hover', attrName: 'hover' });
		assert.equal(named.id, 'html.hover');
		assert.equal(named.attrName, 'hover');
		const relabeled = hover({ true: 'can', false: 'cannot' });
		assert.equal(relabeled.attrValue(true), 'can');
		assert.equal(relabeled.attrValue(false), 'cannot');
		const coarse = hover({ query: '(hover: none)' });
		assert.equal(coarse.source.target().media, '(hover: none)');
		assert.equal(coarse.attrValue(true), 'yes');
	});

	it('lets factories override id and sizes', () => {
		const prevMatchMedia = window.matchMedia;
		window.matchMedia = matchMediaForWidth(200);
		const vp = viewport({
			id: 'screen',
			sizes: [['s', 400], ['l', 800]]
		});
		assert.equal(vp.id, 'screen');
		assert.equal(vp.attrName, 'data-screen');
		assert.equal(vp.value(), 's');

		const ws = workspace({ id: 'pane' });
		assert.equal(ws.id, 'pane');
		assert.equal(ws.attrName, 'data-pane');
		assert.equal(typeof ws.source.bind, 'function');
		assert.equal(ws.source.limit, undefined);

		const named = viewport({ id: 'html.vp', attrName: 'vp' });
		assert.equal(named.id, 'html.vp');
		assert.equal(named.attrName, 'vp');
		const node = { clientWidth: 80 };
		const pane = workspace({ id: 'body.ws', attrName: 'ws', target: node });
		assert.equal(pane.attrName, 'ws');
		assert.equal(pane.source.target, node);
		assert.equal(hover({ id: 'html.hover' }).attrName, 'data-html.hover');
		const scheme = colorScheme({ id: 'html.dark' });
		assert.equal(scheme.id, 'html.dark');
		assert.equal(scheme.attrName, 'data-color-scheme');
		const rotated = orientation({ id: 'html.portrait' });
		assert.equal(rotated.id, 'html.portrait');
		assert.equal(rotated.attrName, 'data-orientation');
		window.matchMedia = prevMatchMedia;
	});

	it('lets workspace take a limit wrapper', () => {
		function throttle(fn) { return fn; }
		const ws = workspace({ limit: throttle });
		assert.equal(typeof ws.source.bind, 'function');
		assert.equal(ws.source.delay, undefined);
	});

	it('builds a custom media-query state', () => {
		const reduced = matchMediaState({
			id: 'motion',
			attrName: 'data-motion',
			query: '(prefers-reduced-motion: reduce)',
			true: 'reduce',
			false: 'ok'
		});
		assert.equal(reduced.id, 'motion');
		assert.equal(reduced.attrName, 'data-motion');
		assert.equal(typeof reduced.source.bind, 'function');
		assert.equal(reduced.source.target().media, '(prefers-reduced-motion: reduce)');
		assert.equal(reduced.value({ target: { matches: true } }), true);
		assert.equal(reduced.attrValue(true), 'reduce');
		assert.equal(reduced.attrValue(false), 'ok');
		const bare = matchMediaState({
			id: 'plain',
			query: '(hover: hover)'
		});
		assert.equal(bare.attrName, 'data-plain');
		assert.equal(bare.value({ target: { matches: false } }), false);
		assert.equal(bare.attrValue(true), 'true');
		assert.equal(bare.attrValue(false), 'false');
	});

});

describe('mediaQueriesFromSizes', () => {
	it('turns each threshold into a min-width query at that exact bound', () => {
		assert.deepEqual(mediaQueriesFromSizes([
			['xs', 768],
			['sm', 900],
			['md', 1200],
			['lg', 1400],
			['xl', 1600],
		]), [
			['xs', 'all'],
			['sm', '(min-width: 768px)'],
			['md', '(min-width: 900px)'],
			['lg', '(min-width: 1200px)'],
			['xl', '(min-width: 1400px)'],
		]);
	});

	it('uses all when there is a single token', () => {
		assert.deepEqual(mediaQueriesFromSizes([['xs', 768]]), [['xs', 'all']]);
	});
});

describe('viewport', () => {
	let dom;

	before(() => {
		dom = installDom();
	});

	after(() => {
		dom.restore();
	});

	it('maps widths to the same tokens as tokenByThresholds, including on a fractional bound', () => {
		const sizes = [
			['xs', 768],
			['sm', 900],
			['md', 1200],
			['lg', 1400],
			['xl', 1600],
		];
		const queries = mediaQueriesFromSizes(sizes);
		for (const width of [0, 1, 767, 767.9, 768, 899.9, 900, 1199.9, 1200, 1399.9, 1400, 1599.9, 1600, 2000]) {
			const token = tokenByThresholds(sizes, width);
			assert.equal(tokenFromQueries(queries, width), token, String(width));
			window.matchMedia = matchMediaForWidth(width);
			assert.equal(viewport().value(), token, `viewport ${width}`);
		}
		assert.equal(tokenByThresholds(sizes, 1399.9), 'lg');
		assert.equal(tokenByThresholds(sizes, 1400), 'xl');
	});

	it('returns nothing when no media query matches', () => {
		window.matchMedia = () => ({
			matches: false,
			addEventListener() {},
			removeEventListener() {},
		});
		assert.equal(viewport().value(), undefined);
	});

	it('listens to min-width queries and unbinds them', () => {
		const added = [];
		const removed = [];
		window.matchMedia = query => {
			const mql = {
				query,
				matches: false,
				addEventListener(name, fn) { added.push([query, name, fn]); },
				removeEventListener(name, fn) { removed.push([query, name, fn]); },
			};
			return mql;
		};
		const state = viewport();
		const ctx = { callback() {} };
		state.source.bind(ctx);
		assert.deepEqual(added.map(([query, name]) => [query, name]), [
			['(min-width: 768px)', 'change'],
			['(min-width: 900px)', 'change'],
			['(min-width: 1200px)', 'change'],
			['(min-width: 1400px)', 'change'],
		]);
		assert.equal(ctx.mqls.length, added.length);
		const bound = added.map(([, , fn]) => fn);
		assert.equal(new Set(bound).size, 1);
		state.source.unbind(ctx);
		assert.deepEqual(removed.map(([, , fn]) => fn), bound);
		state.source.unbind({});
	});

	it('publishes one token when several breakpoint queries change together', async () => {
		const listeners = [];
		let width = 1000;
		window.matchMedia = query => ({
			get matches() { return queryMatchesWidth(query, width); },
			addEventListener(_name, fn) { listeners.push(fn); },
			removeEventListener(_name, fn) {
				const i = listeners.indexOf(fn);
				if (i >= 0) listeners.splice(i, 1);
			},
		});
		const seen = [];
		const state = new State({
			...viewport(),
			attrTarget: new FakeElement(),
			storageKeyPrefix: 't.',
			hooks: {
				change(value) { seen.push(value); },
			},
		});
		state.start();
		assert.equal(state.value, 'md');
		seen.length = 0;
		width = 1500;
		for (const fn of [...listeners]) fn();
		await new Promise(resolve => queueMicrotask(resolve));
		assert.deepEqual(seen, ['xl']);
	});

	it('needs matchMedia to read and bind', () => {
		const prev = window.matchMedia;
		delete window.matchMedia;
		const state = viewport();
		assert.throws(() => state.value());
		assert.throws(() => state.source.bind({ callback() {} }));
		window.matchMedia = prev;
	});

	it('lets viewport override id and sizes', () => {
		window.matchMedia = query => ({
			matches: query === 'all',
			addEventListener() {},
			removeEventListener() {},
		});
		const state = viewport({
			id: 'screen',
			sizes: [['s', 400]],
		});
		assert.equal(state.id, 'screen');
		assert.equal(state.attrName, 'data-screen');
		assert.equal(state.value(), 's');
	});
});

describe('event, mediaQuery, resizeWindow, resizeElement, timer', () => {
	let dom;

	before(() => {
		dom = installDom();
	});

	after(() => {
		dom.restore();
	});

	it('binds a named event and no-ops a missing target', () => {
		const node = fakeTarget();
		const click = createSource(
			event({ event: 'click', target: node }),
			() => 'ok',
			() => {}
		);
		click.start();
		assert.equal(node.added[0][0], 'click');
		click.stop();

		const unbound = event({ event: 'click' });
		assert.equal(unbound.bind({ callback() {} }), undefined);
		assert.equal(unbound.unbind({ callback() {} }), undefined);

		const missing = createSource(unbound, () => 'ok', () => {});
		assert.equal(missing.start(), undefined);
		assert.equal(missing.isStarted, true);
		missing.stop();
	});

	it('binds a media query and falls back to matchMedia', () => {
		const media = fakeMedia(true);
		const mq = createSource(
			mediaQuery({ target: media, query: '(hover: hover)' }),
			({ target }) => target.matches,
			() => {}
		);
		mq.start();
		assert.equal(media.added[0][0], 'change');
		mq.stop();
		assert.equal(media.removed.length, 1);

		const fallback = mediaQuery({ query: '(min-width: 1px)' });
		assert.equal(typeof fallback.target, 'function');
		assert.equal(typeof fallback.target().addEventListener, 'function');
	});

	it('uses window for resizeWindow unless a target is given', () => {
		const custom = fakeTarget();
		const withTarget = resizeWindow({ target: custom });
		assert.equal(withTarget.target, custom);

		const fallback = resizeWindow();
		assert.equal(fallback.target, window);

		const source = createSource(fallback, () => window.innerWidth, () => {});
		source.start();
		source.stop();
	});

	it('limits resizeElement ticks without wrapping sync', () => {
		const node = fakeTarget();
		const seen = [];
		let cancelled = 0;
		function limit(fn) {
			const wrapped = () => seen.push('limited');
			wrapped.cancel = () => { cancelled += 1; };
			return wrapped;
		}
		const source = createSource(
			resizeElement({ target: node, limit }),
			() => 'live',
			value => seen.push(value)
		);
		source.start();
		source.sync();
		assert.deepEqual(seen, ['live']);
		source.stop();
		assert.equal(cancelled, 1);

		let arity;
		const passthrough = createSource(
			resizeElement({
				target: fakeTarget(),
				limit(fn) {
					arity = arguments.length;
					return fn;
				},
			}),
			() => 1,
			() => {}
		);
		passthrough.start();
		assert.equal(arity, 1);
		passthrough.stop();
	});

	it('observes an element and disconnects; bind no-ops without a target', () => {
		const node = fakeTarget();
		const source = createSource(
			resizeElement({ target: node }),
			() => 10,
			() => {}
		);
		source.start();
		assert.equal(source.isStarted, true);
		source.stop();

		const missing = createSource(
			resizeElement(),
			() => 10,
			() => {}
		);
		assert.equal(missing.start(), undefined);
		assert.equal(missing.isStarted, true);
		missing.stop();
	});

	it('runs a timer source', () => {
		withFakeTimers(clock => {
			const seen = [];
			const source = createSource(
				timer({ delay: 25 }),
				() => 'tick',
				value => seen.push(value)
			);
			source.start();
			clock.tick();
			assert.deepEqual(seen, ['tick']);
			source.stop();
			clock.tick();
			assert.deepEqual(seen, ['tick']);
		});
	});
});

function presetState(preset, extra = {}) {
	return new State({
		...preset,
		attrTarget: extra.attrTarget ?? new FakeElement(),
		storageKeyPrefix: 't.',
		...extra,
	});
}

function installWidthMedia(getWidth) {
	const lists = new Map();
	window.matchMedia = query => {
		let mql = lists.get(query);
		if (!mql) {
			mql = fakeTarget({ media: query });
			Object.defineProperty(mql, 'matches', {
				configurable: true,
				get() { return queryMatchesWidth(query, getWidth()); },
			});
			lists.set(query, mql);
		}
		return mql;
	};
	return {
		lists,
		fire() {
			for (const mql of lists.values()) {
				for (const fn of mql.listenersFor('change')) fn();
			}
		},
		liveListeners() {
			let n = 0;
			for (const mql of lists.values()) n += mql.listenerCount();
			return n;
		},
	};
}

function assertUnsubscribed(target) {
	assert.equal(target.listenerCount(), 0);
	assert.deepEqual(target.removed, target.added);
}

describe('preset detect and leaks', () => {
	let dom;

	before(() => {
		dom = installDom();
	});

	after(() => {
		dom.restore();
	});

	it('viewport publishes tokens on media change and unsubscribes the same handlers', async () => {
		let width = 1000;
		const media = installWidthMedia(() => width);
		const preset = viewport();
		const state = presetState(preset);
		state.start();
		assert.equal(state.value, 'md');
		assert.equal(state.attrTarget.getAttribute('data-vp'), 'md');
		assert.equal(media.liveListeners(), 4);

		width = 1500;
		media.fire();
		await new Promise(resolve => queueMicrotask(resolve));
		assert.equal(state.value, 'xl');
		assert.equal(state.attrTarget.getAttribute('data-vp'), 'xl');

		width = 200;
		media.fire();
		await new Promise(resolve => queueMicrotask(resolve));
		assert.equal(state.value, 'xs');
		assert.equal(state.attrTarget.getAttribute('data-vp'), 'xs');

		const bound = [...media.lists.values()].filter(mql => mql.added.length);
		assert.equal(bound.length, 4);
		const handlers = bound.map(mql => mql.added[0][1]);
		assert.equal(new Set(handlers).size, 1);

		state.stop();
		assert.equal(media.liveListeners(), 0);
		for (const mql of bound) assertUnsubscribed(mql);
	});

	it('viewport pin pauses detect; unpin restores it without leaking', async () => {
		let width = 1000;
		const media = installWidthMedia(() => width);
		const state = presetState(viewport());
		state.start();
		for (let i = 0; i < 3; i++) {
			state.set('xs');
			assert.equal(media.liveListeners(), 0);
			state.set(undefined);
			assert.equal(media.liveListeners(), 4);
		}
		width = 1500;
		media.fire();
		await new Promise(resolve => queueMicrotask(resolve));
		assert.equal(state.value, 'xl');
		state.stop();
		assert.equal(media.liveListeners(), 0);
	});

	it('workspace publishes tokens on resize and disconnects the observer', () => {
		FakeResizeObserver.reset();
		const node = { clientWidth: 200 };
		const state = presetState(workspace({ target: node }));
		state.start();
		assert.equal(state.value, 'xs');
		assert.equal(state.attrTarget.getAttribute('data-ws'), 'xs');
		assert.equal(FakeResizeObserver.live().length, 1);
		assert.equal(FakeResizeObserver.live()[0].target, node);

		node.clientWidth = 500;
		FakeResizeObserver.live()[0].resize();
		assert.equal(state.value, 'md');
		assert.equal(state.attrTarget.getAttribute('data-ws'), 'md');

		node.clientWidth = 900;
		FakeResizeObserver.live()[0].resize();
		assert.equal(state.value, 'xl');

		const observer = FakeResizeObserver.live()[0];
		state.stop();
		assert.equal(observer.disconnected, true);
		assert.equal(FakeResizeObserver.live().length, 0);
		observer.resize();
		assert.equal(state.value, 'xl');
	});

	it('workspace pin pauses the observer; unpin restores it without leaking', () => {
		FakeResizeObserver.reset();
		const node = { clientWidth: 200 };
		const state = presetState(workspace({ target: node }));
		state.start();
		for (let i = 0; i < 3; i++) {
			state.set('xl');
			assert.equal(FakeResizeObserver.live().length, 0);
			state.set(undefined);
			assert.equal(FakeResizeObserver.live().length, 1);
		}
		node.clientWidth = 500;
		FakeResizeObserver.live()[0].resize();
		assert.equal(state.value, 'md');
		state.stop();
		assert.equal(FakeResizeObserver.live().length, 0);
	});

	it('workspace without a target does not create an observer', () => {
		FakeResizeObserver.reset();
		const state = presetState(workspace());
		state.start();
		assert.equal(state.value, undefined);
		assert.equal(FakeResizeObserver.instances.length, 0);
		state.stop();
		assert.equal(FakeResizeObserver.live().length, 0);
	});

	for (const spec of [
		{
			name: 'hover',
			factory: hover,
			query: '(hover: hover)',
			off: 'no',
			on: 'yes',
		},
		{
			name: 'colorScheme',
			factory: colorScheme,
			query: '(prefers-color-scheme: dark)',
			off: 'light',
			on: 'dark',
		},
		{
			name: 'orientation',
			factory: orientation,
			query: '(orientation: portrait)',
			off: 'landscape',
			on: 'portrait',
		},
	]) {
		it(`${spec.name} follows matchMedia, writes the attribute, and unsubscribes the same handler`, () => {
			const mql = fakeTarget({ media: spec.query, matches: false });
			window.matchMedia = query => query === spec.query ? mql : fakeTarget({ media: query, matches: false });
			const preset = spec.factory();
			const state = presetState(preset);
			state.start();
			assert.equal(state.value, false);
			assert.equal(state.attrTarget.getAttribute(preset.attrName), spec.off);
			assert.equal(mql.listenerCount('change'), 1);

			mql.matches = true;
			for (const fn of mql.listenersFor('change')) fn();
			assert.equal(state.value, true);
			assert.equal(state.attrTarget.getAttribute(preset.attrName), spec.on);

			mql.matches = false;
			for (const fn of mql.listenersFor('change')) fn();
			assert.equal(state.value, false);
			assert.equal(state.attrTarget.getAttribute(preset.attrName), spec.off);

			state.set(true);
			assert.equal(mql.listenerCount(), 0);
			state.set(undefined);
			assert.equal(state.value, false);
			assert.equal(mql.listenerCount('change'), 1);

			state.stop();
			assertUnsubscribed(mql);
			assert.equal(mql.added[0][0], 'change');
			assert.equal(mql.removed[0][1], mql.added[0][1]);
		});
	}
});
