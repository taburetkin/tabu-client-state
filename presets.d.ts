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

export type WorkspaceOptions = {
	id?: any;
	attrName?: string;
	sizes?: Threshold[];
	limit?: LimitFn;
	target?: unknown | (() => unknown);
};

export type MediaPresetOptions = {
	id?: any;
	attrName?: string;
	query?: string;
	true?: string;
	false?: string;
};

export type ResizeWindowOptions = { target?: unknown | (() => unknown) };
export type ResizeElementOptions = { target?: unknown | (() => unknown); limit?: LimitFn };
export type MediaQueryOptions = { query?: string; target?: MediaQueryList | (() => MediaQueryList) };
export type EventOptions = { event: string; target?: unknown | (() => unknown) };
export type TimerOptions = { delay?: number };

export function event(options?: EventOptions): SourceOptions;
export function resizeWindow(options?: ResizeWindowOptions): SourceOptions;
export function resizeElement(options?: ResizeElementOptions): SourceOptions;
export function timer(options?: TimerOptions): SourceOptions;
export function mediaQuery(options?: MediaQueryOptions): SourceOptions;

export function tokenByThresholds(thresholds: Threshold[], value: number): string | undefined;
export function mediaQueriesFromSizes(sizes: Threshold[]): Array<[string, string]>;
export function matchMediaState(options: MatchMediaStateOptions): StateOptions;
export function viewport(options?: ViewportOptions): StateOptions;
export function workspace(options?: WorkspaceOptions): StateOptions;
export function hover(options?: MediaPresetOptions): StateOptions;
export function colorScheme(options?: MediaPresetOptions): StateOptions;
export function orientation(options?: MediaPresetOptions): StateOptions;
