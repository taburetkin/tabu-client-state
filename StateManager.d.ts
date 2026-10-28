import type { State, StateOptions, StateOverrides, StateSetWhere } from './State.js';
import type { ManagerHooks } from './hooks.js';

export type AddOptions = {
	replace?: boolean;
	detach?: boolean;
	dontStart?: boolean;
};

export type RemoveOptions = {
	detach?: boolean;
};

type StateBagEntry = State | (Omit<StateOptions, 'id'> & { id?: any });

export type StateManagerOptions = {
	states?: Record<string, StateBagEntry> | Array<State | StateOptions>;
	storageKeyPrefix?: string;
	attrTarget?: Element;
	stateOptions?: Omit<StateOptions, 'id'>;
	hooks?: ManagerHooks;
	autoStartStates?: boolean;
	initialize?: (this: StateManager) => void;
};

export class StateManager {
	autoStartStates: boolean;
	readonly values: Record<string, unknown>;
	constructor(options?: StateManagerOptions);
	add<T = unknown>(stateOrOptions: State | StateOptions<T>, addOptions?: AddOptions): State;
	get(id: string | number | symbol): State | undefined;
	states(): State[];
	set(stateId: any | State, value: unknown, where?: StateSetWhere): void;
	setTarget(stateId: any | State, target: unknown | (() => unknown), dontStart?: boolean): void;
	hasOverrides(): boolean;
	hasOverrides(stateId: any | State): boolean;
	getOverrides(): Record<string, StateOverrides> | undefined;
	getOverrides(stateId: any | State): StateOverrides | undefined;
	remove(): void;
	remove(stateId: any | State, options?: RemoveOptions): void;
	start(): void;
	start(id: string | number | symbol | State): void;
	stop(): void;
	stop(id: string | number | symbol | State): void;
}
