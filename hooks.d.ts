import type { StateOptions } from './State.js';
import type { StateManager } from './StateManager.js';

export type StateHookName =
	| 'before:start'
	| 'start'
	| 'start:fail'
	| 'before:stop'
	| 'stop'
	| 'before:destroy'
	| 'destroy'
	| 'change';

export type ManagerHookName =
	| 'before:add'
	| 'add'
	| 'before:state:start'
	| 'state:start'
	| 'state:start:fail'
	| 'before:state:stop'
	| 'state:stop'
	| 'before:state:destroy'
	| 'state:destroy'
	| 'state:change';

export type StateHookHost = {
	readonly id: string;
	readonly value: unknown;
	readonly isStarted?: boolean;
	readonly isDestroyed?: boolean;
};

export type StateHooks = {
	all?: (this: StateHookHost, hook: StateHookName, ...args: unknown[]) => void;
	beforeStart?: (this: StateHookHost, id: string) => void;
	start?: (this: StateHookHost, id: string, value: unknown) => void;
	startFail?: (this: StateHookHost, id: string) => void;
	beforeStop?: (this: StateHookHost, id: string) => void;
	stop?: (this: StateHookHost, id: string) => void;
	beforeDestroy?: (this: StateHookHost, id: string) => void;
	destroy?: (this: StateHookHost, id: string) => void;
	change?: (this: StateHookHost, id: string, value: unknown) => void;
};

export type ManagerHooks = {
	all?: (this: StateManager, hook: ManagerHookName, ...args: unknown[]) => void;
	beforeAdd?: (this: StateManager, stateOptions: StateOptions, dontStart?: boolean) => void;
	add?: (this: StateManager, id: string) => void;
	beforeStateStart?: (this: StateManager, id: string) => void;
	stateStart?: (this: StateManager, id: string, value: unknown) => void;
	stateStartFail?: (this: StateManager, id: string) => void;
	beforeStateStop?: (this: StateManager, id: string) => void;
	stateStop?: (this: StateManager, id: string) => void;
	beforeStateDestroy?: (this: StateManager, id: string) => void;
	stateDestroy?: (this: StateManager, id: string) => void;
	stateChange?: (this: StateManager, id: string, value: unknown) => void;
};

export type StateProxyHooks =
	| false
	| ((this: StateHookHost, hook: StateHookName, ...args: unknown[]) => void);

export type ToCamelCase = (str: string) => string;
