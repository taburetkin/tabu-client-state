import type { StateOptions } from './State.js';
import type { ManagerHooks } from './hooks.js';

export type StateManagerOptions = {
	states?: Record<string, Omit<StateOptions, 'id'> & { id?: any }> | StateOptions[];
	storageKeyPrefix?: string;
	attrTarget?: Element;
	stateOptions?: Omit<StateOptions, 'id'>;
	hooks?: ManagerHooks;
};

export class StateManager {
	readonly isStarted: boolean;
	readonly values: Record<string, unknown>;
	constructor(options?: StateManagerOptions);
	add(stateOptions: StateOptions, dontStart?: boolean): void;
	storeValue(stateId: any, value: unknown, where?: boolean): boolean;
	setTarget(stateId: any, target: unknown | (() => unknown), dontStart?: boolean): boolean;
	remove(): void;
	remove(stateId: any): void;
	start(): void;
	start(startAllStates: boolean): void;
	start(stateId: any): void;
	stop(): void;
	stop(stopManager: boolean): void;
	stop(stateId: any): void;
}
