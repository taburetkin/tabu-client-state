import type {
	ManagerHookName,
	ManagerHooks,
	StateHookHost,
	StateHookName,
	StateHooks,
	StateProxyHooks,
	ToCamelCase,
} from '../hooks.js';
import type {
	ManagerHooks as PubManagerHooks,
	StateHookHost as PubStateHookHost,
	StateHookName as PubStateHookName,
	StateHooks as PubStateHooks,
	StateProxyHooks as PubStateProxyHooks,
} from '../index.js';
import { StateManager, type StateManagerOptions, type StateOptions } from '../index.js';
import * as StateMod from '../State.js';
import { toCamelCase, stateHookNames, callHook, tryCall } from '../State.js';

const _name: StateHookName = 'change';
const _mgrName: ManagerHookName = 'state:change';
const _pubName: PubStateHookName = _name;
void _pubName;

const host: StateHookHost = { id: 'vp', value: 'lg' };
const _pubHost: PubStateHookHost = host;
void _pubHost.id;

const stateHooks: StateHooks = {
	all(hook, id) {
		const _h: StateHookName = hook;
		void _h;
		void this.id;
		void id;
	},
	beforeStart(id) {
		const _id: string = id;
		void this.value;
		void _id;
	},
	start(id, value) {
		const _id: string = id;
		void _id;
		void value;
		void this.isStarted;
	},
	change(id, value) {
		const _id: string = id;
		void _id;
		void value;
	},
	startFail(id) { void id; },
};
const _pubHooks: PubStateHooks = stateHooks;
void _pubHooks;

const managerHooks: ManagerHooks = {
	all(hook) {
		const _h: ManagerHookName = hook;
		void _h;
		void this.isStarted;
	},
	beforeAdd(stateOptions, dontStart) {
		void stateOptions.id;
		void dontStart;
	},
	add(id) { void id; },
	stateStart(id, value) {
		void id;
		void value;
		void this.values;
	},
	stateChange(id, value) {
		void id;
		void value;
		void this.values;
	},
};
const _pubMgr: PubManagerHooks = managerHooks;
void _pubMgr;

const off: StateProxyHooks = false;
const custom: StateProxyHooks = function (hook, ...args) {
	void this.id;
	void hook;
	void args;
};
const _pubProxy: PubStateProxyHooks = off;
void custom;
void _pubProxy;

const options: StateOptions = {
	id: 'vp',
	hooks: stateHooks,
	proxyHooks: false,
};
void options;

const mgrOptions: StateManagerOptions = {
	hooks: managerHooks,
	stateOptions: { hooks: stateHooks, proxyHooks: false },
};
void new StateManager(mgrOptions);

void new StateManager({
	stateOptions: {
		proxyHooks(hook) {
			void this.id;
			void hook;
		},
	},
});

const _camel: ToCamelCase = toCamelCase;
void _camel;
void stateHookNames[0];
tryCall(undefined, {});
callHook({}, {}, undefined, 'change', 'change', []);

// @ts-expect-error createHooks was removed
void StateMod.createHooks;

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
	// @ts-expect-error proxyHooks is false or a function
	proxyHooks: true,
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
