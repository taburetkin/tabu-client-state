import { createSource, normalizeSource, type SourceCtx, type SourceOptions } from '../source.js';

const source = createSource(
	{ bind() {}, unbind() {} },
	(_ctx: SourceCtx) => 'x',
	(_value: unknown) => {},
);
source.start();
source.sync();
source.stop();
void source.isStarted;

void createSource({}, 'light', (_value: unknown) => {});
void createSource({}, undefined, (_value: unknown) => {});

void normalizeSource({ bind() {}, unbind() {} }).bind;
void normalizeSource();
void normalizeSource(() => ({ bind() {}, unbind() {} }));

const _legacyCtx: SourceCtx = { callback() {} };
void _legacyCtx.target;
const _typedCtx: SourceCtx<Window> = { target: window, callback() {} };
void _typedCtx.target.innerWidth;
const _typedSource: SourceOptions<Window> = {
	target: () => window,
	bind(ctx) { void ctx.target.innerWidth; },
	unbind() {},
};
void _typedSource;

// @ts-expect-error target is required when T is known
const _missing: SourceCtx<Window> = { callback() {} };
void _missing;
