// T is what source.target resolves to, inferred on add(). Without it, target stays unknown.
export type SourceCtx<T = unknown> = {
	callback: () => void;
	[key: string]: unknown;
} & (unknown extends T ? { target?: unknown } : { target: T });

type SourceListeners<T> = {
	bind: (ctx: SourceCtx<T>) => void;
	unbind: (ctx: SourceCtx<T>) => void;
};

export type SourceOptions<T = unknown> = {
	target?: T | (() => T);
} & (SourceListeners<T> | {
	bind?: undefined;
	unbind?: undefined;
});

export type Source = {
	sync: () => void;
	readonly isStarted: boolean;
	start(): void;
	stop(): void;
};

export function normalizeSource<T = unknown>(
	source?: SourceOptions<T> | (() => SourceOptions<T>),
): SourceOptions<T>;
export function createSource<T = unknown>(
	source: SourceOptions<T>,
	value: ((ctx: SourceCtx<T>) => unknown) | string | boolean | number | undefined,
	update: (value: unknown) => void,
): Source;
