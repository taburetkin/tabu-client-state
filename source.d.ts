export type SourceCtx = {
	target?: unknown;
	callback: () => void;
	[key: string]: unknown;
};

type SourceListeners = {
	bind: (ctx: SourceCtx) => unknown;
	unbind: (ctx: SourceCtx) => void;
};

export type SourceOptions = {
	target?: unknown | (() => unknown);
} & (SourceListeners | {
	bind?: undefined;
	unbind?: undefined;
});

export type Source = {
	sync: () => void;
	readonly isStarted: boolean;
	start(): false | void;
	stop(): void;
};

export function normalizeSource(source?: SourceOptions | (() => SourceOptions)): SourceOptions;
export function createSource(
	source: SourceOptions,
	value: ((ctx: SourceCtx) => unknown) | string | boolean | number | undefined,
	update: (value: unknown) => void,
): Source;
