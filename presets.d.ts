import type { SourceOptions } from './source.js';
import type { StateOptions } from './State.js';

export type LimitedFn = (() => void) & { cancel?: () => void };
export type LimitFn = (fn: () => void) => LimitedFn;

export type Threshold = [string, number];

export type MatchMediaStateOptions = {
	id: any;
	attrName?: string;
	query: string;
	true?: string;
	false?: string;
};

export type ViewportOptions = {
	id?: any;
	attrName?: string;
	sizes?: Threshold[];
};

export type WorkspaceOptions<T = unknown> = {
	id?: any;
	attrName?: string;
	sizes?: Threshold[];
	limit?: LimitFn;
	target?: T | (() => T);
};

export type MediaPresetOptions = {
	id?: any;
	attrName?: string;
	query?: string;
	true?: string;
	false?: string;
};

export type ResizeWindowOptions<T = Window> = { target?: T | (() => T) };
export type ResizeElementOptions<T = unknown> = { target?: T | (() => T); limit?: LimitFn };
export type MediaQueryOptions = { query?: string; target?: MediaQueryList | (() => MediaQueryList) };
export type EventOptions<T = unknown> = { event: string; target?: T | (() => T) };
export type TimerOptions = { delay?: number };

export function event<T = unknown>(options?: EventOptions<T>): SourceOptions<T>;
export function resizeWindow<T = Window>(options?: ResizeWindowOptions<T>): SourceOptions<T>;
export function resizeElement<T = unknown>(options?: ResizeElementOptions<T>): SourceOptions<T>;
export function timer(options?: TimerOptions): SourceOptions;
export function mediaQuery(options?: MediaQueryOptions): SourceOptions<MediaQueryList | undefined>;

export function tokenByThresholds(thresholds: Threshold[], value: number): string | undefined;
export function mediaQueriesFromSizes(sizes: Threshold[]): Array<[string, string]>;
export function matchMediaState(options: MatchMediaStateOptions): StateOptions;
export function viewport(options?: ViewportOptions): StateOptions;
export function workspace<T = unknown>(options?: WorkspaceOptions<T>): StateOptions<T>;
export function hover(options?: MediaPresetOptions): StateOptions;
export function colorScheme(options?: MediaPresetOptions): StateOptions;
export function orientation(options?: MediaPresetOptions): StateOptions;
