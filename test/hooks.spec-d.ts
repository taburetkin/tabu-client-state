import type {
	ManagerHookName,
	ManagerHooks,
	StateHookHost,
	StateHookName,
	StateHooks,
	ToCamelCase,
} from '../hooks.js';
import type {
	ManagerHooks as PubManagerHooks,
	StateHookHost as PubStateHookHost,
	StateHookName as PubStateHookName,
	StateHooks as PubStateHooks,
} from '../index.js';
import { StateManager, type StateManagerOptions, type StateOptions } from '../index.js';
import * as StateMod from '../State.js';
import { toCamelCase, stateHookNames, tryCall } from '../State.js';

const _name: StateHookName = 'change';
const _mgrName: ManagerHookName = 'state:change';
const _pubName: PubStateHookName = _name;
void _pubName;
void _mgrName;

const host: StateHookHost = { id: 'vp', value: 'lg' };
const _pubHost: PubStateHookHost = host;
void _pubHost.id;

const stateHooks: StateHooks = {
	all(hook, state, value) {
		const _h: StateHookName = hook;
		void _h;
		void this.id;
		void state.id;
		void value;
	},
	beforeStart() {
		void this.value;
	},
	start(value) {
		void value;
		void this.isStarted;
	},
	change(value) {
		void value;
	},
	beforeStop() { void this.isStarted; },
	stop() {},
	beforeDestroy() {},
	destroy() { void this.isDestroyed; },
};
const _pubHooks: PubStateHooks = stateHooks;
void _pubHooks;

const managerHooks: ManagerHooks = {
	all(hook, state) {
		const _h: ManagerHookName = hook;
		void _h;
		void state;
		void this.values;
		void this.autoStartStates;
	},
	beforeAdd(hook, stateOptions, addOptions) {
		void hook;
		void stateOptions;
		void addOptions?.replace;
	},
	add(hook, state) {
		void hook;
		void state.id;
	},
	beforeDetach(hook, state) { void hook; void state.id; },
	detach(hook, state) { void hook; void state.id; },
	stateStart(hook, state, value) {
		void hook;
		void state.id;
		void value;
		void this.values;
	},
	stateChange(hook, state, value) {
		void hook;
		void state.id;
		void value;
	},
	beforeStateStart(hook, state) { void hook; void state.id; },
	beforeStateStop(hook, state) { void hook; void state.id; },
	stateStop(hook, state) { void hook; void state.id; },
	beforeStateDestroy(hook, state) { void hook; void state.id; },
	stateDestroy(hook, state) { void hook; void state.id; },
};
const _pubMgr: PubManagerHooks = managerHooks;
void _pubMgr;

const options: StateOptions = {
	id: 'vp',
	hooks: stateHooks,
};
void options;

const mgrOptions: StateManagerOptions = {
	autoStartStates: true,
	hooks: managerHooks,
	stateOptions: { hooks: stateHooks },
};
void new StateManager(mgrOptions);

const _camel: ToCamelCase = toCamelCase;
void _camel;
void stateHookNames[0];
tryCall(undefined, {});

// @ts-expect-error createHooks was removed
void StateMod.createHooks;

// @ts-expect-error callHook was removed
void StateMod.callHook;

const _badState: StateOptions = {
	id: 'vp',
	// @ts-expect-error onChange was replaced by hooks
	onChange() {},
};

const _badMgr: StateManagerOptions = {
	hooks: {},
	// @ts-expect-error onChange was replaced by hooks
	onChange() {},
};

const _badDefaults: StateManagerOptions = {
	stateOptions: {
		// @ts-expect-error onChange was replaced by hooks
		onChange() {},
	},
};
void _badState;
void _badMgr;
void _badDefaults;

const _badProxy: StateOptions = {
	id: 'vp',
	// @ts-expect-error proxyHooks is not a State option
	proxyHooks: false,
};
void _badProxy;

// @ts-expect-error all hook names are a closed set
const _unknown: StateHookName = 'update';
void _unknown;

const _hooks: StateHooks = {
	// @ts-expect-error onChange is not a hook slot
	onChange() {},
};
void _hooks;
