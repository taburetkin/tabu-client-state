import type { SourceCtx, SourceOptions } from './source.js';
import type { Storages } from './Storages.js';
import type { StateHookName, StateHooks, StateProxyHooks, ToCamelCase } from './hooks.js';

type AttrTarget = {
	getAttribute(name: string): string | null;
	setAttribute?(name: string, value: string): void;
	removeAttribute?(name: string): void;
};

export type StateOptions = {
	id: any;
	attrName?: string;
	attrTarget?: Element;
	value?: ((ctx: SourceCtx) => unknown) | string | boolean | number;
	attrValue?: (value: unknown) => unknown;
	source?: SourceOptions | (() => SourceOptions);
	hooks?: StateHooks;
	proxyHooks?: StateProxyHooks;
};

type StateInit = Omit<StateOptions, 'attrTarget'> & {
	attrTarget: AttrTarget;
	storages: Storages;
};

export class State {
	id: string;
	attrName: string;
	attrTarget: AttrTarget;
	attrOriginValue: string | null;
	get value(): unknown;
	set value(newValue: unknown);
	isStarted?: boolean;
	isDestroyed?: boolean;
	constructor(options: StateInit);
	set(value: unknown, storageIdentifier?: boolean): void;
	setTarget(target: unknown | (() => unknown), dontStart?: boolean): void;
	start(): void;
	stop(): void;
	destroy(): void;
}

export const stateHookNames: readonly StateHookName[];
export const toCamelCase: ToCamelCase;
export const tryCall: (method: unknown, thisArg: object, ...args: unknown[]) => void;
export const callHook: (
	instance: object,
	hooks: object,
	proxy: ((hook: string, ...args: unknown[]) => void) | false | undefined,
	methodName: string,
	hook: string,
	args: readonly unknown[],
) => void;
