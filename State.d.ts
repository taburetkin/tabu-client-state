import type { SourceCtx, SourceOptions } from './source.js';
import type { StateHookName, StateHooks, ToCamelCase } from './hooks.js';

/** DOM `Element` in the app. Structural so tests can pass a fake. */
type AttrTarget = {
	getAttribute(name: string): string | null;
	setAttribute?(name: string, value: string): void;
	removeAttribute?(name: string): void;
};

export type StateOverrides = {
	memory: unknown;
	session: unknown;
	local: unknown;
};

export type StateSetOptions = {
	memory?: boolean;
	session?: boolean;
	local?: boolean;
};

export type StateSetWhere = boolean | 'session' | 'local' | StateSetOptions;

export type StateOptions<T = unknown> = {
	id: any;
	attrName?: string;
	attrTarget?: Element;
	value?: ((ctx: SourceCtx<T>) => unknown) | string | boolean | number;
	attrValue?: (value: unknown) => unknown;
	source?: SourceOptions<T> | (() => SourceOptions<T>);
	hooks?: StateHooks;
	storageKeyPrefix?: string;
};

type StateInit<T = unknown> = Omit<StateOptions<T>, 'attrTarget'> & {
	attrTarget?: AttrTarget;
};

export class State {
	id: string;
	attrName: string;
	/** DOM `Element`. Structural type is for tests; pass an element in the app. */
	attrTarget: AttrTarget;
	attrOriginValue: string | null;
	get value(): unknown;
	set value(newValue: unknown);
	isStarted?: boolean;
	isDestroyed?: boolean;
	constructor(options: StateInit<any>);
	hasOverrides(): boolean;
	getOverrides(): StateOverrides | undefined;
	set(value: unknown, where?: StateSetWhere): void;
	setTarget(target: unknown | (() => unknown), dontStart?: boolean): void;
	start(): void;
	stop(): void;
	destroy(): void;
}

export const stateHookNames: readonly StateHookName[];
export const toCamelCase: ToCamelCase;
export const tryCall: (method: unknown, thisArg: object, args?: unknown[]) => void;
export const requireId: (id: unknown) => string;
export const ensureState: <T extends State>(state: T) => T;
export type StateListener = (
	this: State,
	hook: StateHookName,
	state: State,
	...args: unknown[]
) => void;

export const listen: (state: State, fn: StateListener) => void;
export const unlisten: (state: State, fn: StateListener) => void;
