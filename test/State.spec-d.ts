import { State, listen, unlisten, type StateListener } from '../State.js';
import { workspace } from '../presets.js';

const attrTarget = {
	getAttribute(_name: string) { return null as string | null; },
	setAttribute(_name: string, _value: string) {},
	removeAttribute(_name: string) {},
};

const state = new State({
	id: 'theme',
	attrTarget,
	storageKeyPrefix: 't.',
	value: () => 'light',
	hooks: {
		change(_value) {},
		all(_hook, _host, _value) {},
		beforeStart() {},
		start(_value) {},
	},
});
void state.id;
void state.attrName;
void state.value;
state.value = 'dark';
state.value = undefined;
state.start();
state.set('dark', false);
state.set('dark', true);
state.set('dark', 'session');
state.set('dark', 'true');
state.set('dark', 'local');
state.set('dark', { memory: true, local: true });
state.set(undefined, { memory: true, session: true, local: true });
const overrides: { memory: boolean, session: boolean, local: boolean } | undefined = state.getOverrides();
void overrides;
const has: boolean = state.hasOverrides();
void has;
state.setTarget({});
state.stop();
state.destroy();

// @ts-expect-error where is not an arbitrary string
state.set('dark', 'memory');

// @ts-expect-error getValue was removed
state.getValue();

// @ts-expect-error subscribe is not a State method
state.subscribe(() => {});

// @ts-expect-error unsubscribe is not a State method
state.unsubscribe(() => {});

const onHook: StateListener = function (hook, host, value) {
	void hook;
	void host.id;
	void this.id;
	void value;
};
listen(state, onHook);
unlisten(state, onHook);

// @ts-expect-error listener must be a function
listen(state, 'no');

// @ts-expect-error listener must be a function
unlisten(state, 'no');

const constant = new State({
	id: 'theme',
	attrTarget,
	storageKeyPrefix: 't.',
	value: 'light',
});
void constant.value;

const named = new State({
	id: 'theme',
	attrName: 'data-theme',
	attrTarget,
	storageKeyPrefix: 't.',
});
void named.attrName;

const coerced = new State({
	id: true,
	attrTarget,
	storageKeyPrefix: 't.',
});
const coercedId: string = coerced.id;
void coercedId;

const standalone = new State({ id: 'x' });
void standalone.attrTarget;
standalone.start();

const prefixed = new State({ id: 'x', storageKeyPrefix: 'app.' });
void prefixed.id;

const preset = new State(workspace());
preset.start();
preset.destroy();

// @ts-expect-error id is required
new State({});

// @ts-expect-error storages is not a State option
new State({ id: 'x', storages: {} });

// @ts-expect-error proxyHooks is not a State option
new State({ id: 'x', proxyHooks: false });
