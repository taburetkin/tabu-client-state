import { State } from '../State.js';
import { Storages } from '../Storages.js';

const attrTarget = {
	getAttribute(_name: string) { return null as string | null; },
	setAttribute(_name: string, _value: string) {},
	removeAttribute(_name: string) {},
};

const state = new State({
	id: 'theme',
	attrTarget,
	storages: new Storages('t.'),
	value: () => 'light',
	hooks: {
		change(_id, _value) {},
		all(_hook) {},
	},
});
void state.id;
void state.attrName;
void state.value;
state.value = 'dark';
state.value = undefined;
state.start();
state.set('dark', false);
state.setTarget({});
state.stop();
state.destroy();

// @ts-expect-error getValue was removed
state.getValue();

const constant = new State({
	id: 'theme',
	attrTarget,
	storages: new Storages('t.'),
	value: 'light',
});
void constant.value;

const named = new State({
	id: 'theme',
	attrName: 'data-theme',
	attrTarget,
	storages: new Storages('t.'),
});
void named.attrName;

const coerced = new State({
	id: true,
	attrTarget,
	storages: new Storages('t.'),
});
const coercedId: string = coerced.id;
void coercedId;

// @ts-expect-error attrTarget is required
new State({ id: 'x', storages: new Storages('t.') });

// @ts-expect-error storages is required
new State({ id: 'x', attrTarget });
