import { StateManager, type StateManagerOptions } from '../StateManager.js';
import type { StateOptions } from '../State.js';
import { workspace, type LimitFn } from '../index.js';

const cs = new StateManager();
void cs.isStarted;

const input: StateOptions = {
	id: 'data-theme',
	value: () => 'light',
	source: { bind() {}, unbind() {} },
};
cs.add({ ...input, id: 'data-theme' });
cs.add({ id: 1, value: () => 'num' });
cs.add({ id: null, value: () => 'nil', attrName: 'data-nil' });
cs.add({ id: Symbol('mark'), value: () => 'sym' });
const _config: StateOptions = { id: 'data-theme', value: () => 'light' };
void _config;
cs.values[1];
cs.values['data-theme'];
cs.values['data-theme'] = 'dark';
cs.storeValue('data-theme', 'dark');
cs.storeValue('data-theme', 'dark', true);
cs.setTarget('data-theme', {} as EventTarget);
cs.start();
cs.start(true);
cs.start(false);
cs.start('data-theme');
cs.stop('data-theme');
cs.stop(false);
cs.stop(true);
cs.stop();
cs.remove('data-theme');
cs.remove();

// @ts-expect-error get is not public
cs.get('data-theme');

const withMap: StateManagerOptions = {
	states: {
		theme: { value: () => 'light' },
		ws: { id: 'data-ws', source: { bind() {}, unbind() {} }, value: ({ target }) => (target as { clientWidth?: number })?.clientWidth },
	},
	attrTarget: undefined,
	storageKeyPrefix: 'app.',
	hooks: {
		all() {},
		stateChange() {},
	},
	stateOptions: {
		hooks: {
			change() {},
		},
		proxyHooks: false,
	},
};

void workspace({
	limit: ((fn) => fn) satisfies LimitFn,
});
void new StateManager(withMap);

void new StateManager({
	states: [{ id: 'theme', value: () => 'light' }],
});

// @ts-expect-error delay lives outside the package
new StateManager({ delay: 50 });

// @ts-expect-error id is required
cs.add({ value: () => 'x' });

// @ts-expect-error setTarget requires a target
cs.setTarget('aside');

// @ts-expect-error onChange was removed
cs.onChange('data-theme', 'dark');
