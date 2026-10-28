import { State, StateManager, type AddOptions, type StateManagerOptions, type StateOverrides } from '../index.js';
import type { StateOptions } from '../State.js';
import { workspace, type LimitFn, type SourceCtx } from '../index.js';

const cs = new StateManager();
void cs.autoStartStates;
void cs.values;

const input: StateOptions = {
	id: 'data-theme',
	value: () => 'light',
	source: { bind() {}, unbind() {} },
};
const added: State = cs.add({
	id: 'vp',
	attrName: 'data-vp',
	value(ctx) {
		return ctx.target.innerWidth < 768 ? 'xs' : 'lg';
	},
	source: {
		target: window,
		bind(ctx) {
			ctx.target.addEventListener('resize', ctx.callback);
		},
		unbind(ctx) {
			ctx.target.removeEventListener('resize', ctx.callback);
		},
	},
});
void added.id;
cs.add({
	id: 'vp-fn',
	value: ({ target }) => target.innerWidth < 768 ? 'xs' : 'lg',
	source: {
		target: () => window,
		bind(ctx) { ctx.target.addEventListener('resize', ctx.callback); },
		unbind(ctx) { ctx.target.removeEventListener('resize', ctx.callback); },
	},
});
cs.add({
	id: 'main',
	value: ({ target }) => target?.clientWidth,
	source: {
		target: () => document.querySelector('main'),
		bind(ctx) { if (!ctx.target) return; },
		unbind() {},
	},
});
cs.add({
	id: 'manual',
	value(ctx) {
		// @ts-expect-error target is unknown without source.target
		return ctx.target.innerWidth;
	},
	source: { bind() {}, unbind() {} },
});
const typedOptions: StateOptions<Window> = {
	id: 'w',
	value: ctx => ctx.target.innerWidth,
	source: { target: window, bind() {}, unbind() {} },
};
cs.add(typedOptions);

// @ts-expect-error source.target and value disagree on the target type
cs.add({ id: 'bad', value: (ctx: SourceCtx<Document>) => ctx.target.title, source: { target: window, bind() {}, unbind() {} } });

cs.add({ ...input, id: 'data-theme' });
cs.add({ id: 1, value: () => 'num' });
cs.add({ id: Symbol('mark'), value: () => 'sym' });
cs.add({ id: 'pref', value: () => 'x', storageKeyPrefix: 'app.' });
const _config: StateOptions = { id: 'data-theme', value: () => 'light' };
void _config;
cs.values[1];
cs.values['data-theme'];
cs.values['data-theme'] = 'dark';
cs.set('data-theme', 'dark');
cs.set(added, 'dark', true);
cs.set('data-theme', 'dark', false);
cs.set('data-theme', 'dark', 'session');
cs.set('data-theme', 'dark', 'local');
cs.set('data-theme', 'dark', { memory: true, local: true });
cs.set('data-theme', undefined, { memory: true, session: true, local: true });
cs.hasOverrides();
cs.hasOverrides('data-theme');
cs.hasOverrides(added);
const allPins: Record<string, StateOverrides> | undefined = cs.getOverrides();
void allPins;
cs.getOverrides('data-theme');
cs.getOverrides(added);
cs.setTarget('data-theme', {} as EventTarget);
cs.setTarget(added, {} as EventTarget, true);
cs.start();
cs.start('data-theme');
cs.start(added);
cs.stop('data-theme');
cs.stop(added);
cs.stop();
cs.remove('data-theme');
cs.remove(added, { detach: true });
cs.remove();
const got: State | undefined = cs.get('data-theme');
void got;
const listed: State[] = cs.states();
void listed;

const addOpts: AddOptions = { replace: true, detach: true, dontStart: true };
cs.add({ id: 'x', value: () => 'x' }, addOpts);

// @ts-expect-error where is not an arbitrary string
cs.set('data-theme', 'dark', 'memory');

// @ts-expect-error start no longer takes a boolean
cs.start(true);

// @ts-expect-error stop no longer takes a boolean
cs.stop(false);

// @ts-expect-error isStarted was removed
cs.isStarted;

// @ts-expect-error storeValue was replaced by set
cs.storeValue('data-theme', 'dark');

const ready = new State({ id: 'solo', value: 'light' });
cs.add(ready);
void new StateManager({
	autoStartStates: true,
	states: [ready, { id: 'listed', value: () => 'x' }],
});
void new StateManager({
	states: { slot: ready, theme: { value: () => 'light' } },
});

const withMap: StateManagerOptions = {
	initialize() {
		void this.values;
	},
	autoStartStates: false,
	states: {
		theme: { value: () => 'light' },
		ws: { id: 'data-ws', source: { bind() {}, unbind() {} }, value: ({ target }) => (target as { clientWidth?: number })?.clientWidth },
	},
	attrTarget: undefined,
	storageKeyPrefix: 'app.',
	hooks: {
		all() {},
		stateChange() {},
		beforeDetach() {},
		detach() {},
	},
	stateOptions: {
		hooks: {
			change() {},
		},
	},
};

void workspace({
	limit: ((fn) => fn) satisfies LimitFn,
});
void new StateManager(withMap);

void new StateManager({
	states: [{ id: 'theme', value: () => 'light' }],
});

// @ts-expect-error delay lives outside the package
new StateManager({ delay: 50 });

// @ts-expect-error id is required
cs.add({ value: () => 'x' });

// @ts-expect-error setTarget requires a target
cs.setTarget('aside');

// @ts-expect-error onChange was removed
cs.onChange('data-theme', 'dark');

// @ts-expect-error get does not take a State
cs.get(ready);
