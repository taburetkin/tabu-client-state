import { createSource, normalizeSource, type SourceCtx } from '../source.js';

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
