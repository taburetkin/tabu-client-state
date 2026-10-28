import type { State, StateOptions } from './State.js';
import type { AddOptions, StateManager } from './StateManager.js';

export type StateHookName =
	| 'before:start'
	| 'start'
	| 'before:stop'
	| 'stop'
	| 'before:destroy'
	| 'destroy'
	| 'change';

export type ManagerHookName =
	| 'before:add'
	| 'add'
	| 'before:detach'
	| 'detach'
	| 'before:state:start'
	| 'state:start'
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
	all?: (this: StateHookHost, hook: StateHookName, state: StateHookHost, value?: unknown) => void;
	beforeStart?: (this: StateHookHost) => void;
	start?: (this: StateHookHost, value: unknown) => void;
	beforeStop?: (this: StateHookHost) => void;
	stop?: (this: StateHookHost) => void;
	beforeDestroy?: (this: StateHookHost) => void;
	destroy?: (this: StateHookHost) => void;
	change?: (this: StateHookHost, value: unknown) => void;
};

export type ManagerHooks = {
	all?: (this: StateManager, hook: ManagerHookName, ...args: unknown[]) => void;
	beforeAdd?: (this: StateManager, hook: 'before:add', stateOptions: State | StateOptions, addOptions?: AddOptions) => void;
	add?: (this: StateManager, hook: 'add', state: State) => void;
	beforeDetach?: (this: StateManager, hook: 'before:detach', state: State) => void;
	detach?: (this: StateManager, hook: 'detach', state: State) => void;
	beforeStateStart?: (this: StateManager, hook: 'before:state:start', state: State) => void;
	stateStart?: (this: StateManager, hook: 'state:start', state: State, value: unknown) => void;
	beforeStateStop?: (this: StateManager, hook: 'before:state:stop', state: State) => void;
	stateStop?: (this: StateManager, hook: 'state:stop', state: State) => void;
	beforeStateDestroy?: (this: StateManager, hook: 'before:state:destroy', state: State) => void;
	stateDestroy?: (this: StateManager, hook: 'state:destroy', state: State) => void;
	stateChange?: (this: StateManager, hook: 'state:change', state: State, value: unknown) => void;
};

export type ToCamelCase = (str: string) => string;
