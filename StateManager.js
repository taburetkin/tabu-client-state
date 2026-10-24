import { Storages } from './Storages.js';
import { State, stateHookNames, toCamelCase, callHook } from './State.js';

export class StateManager {

	#states;
	#storages;
	#attrTarget;
	#stateOptions;
	#started = false;
	
	#hooks;

	values;

	get isStarted() { return this.#started; }

	constructor({ states, storageKeyPrefix, attrTarget, stateOptions, hooks } = {}) {
		storageKeyPrefix = storageKeyPrefix ?? 'tabu.clientstate.';

		this.#hooks = Object.assign({}, hooks);

		
		this.#states = Object.create(null);
		this.values = this.#createValues();



		this.#stateOptions = Object.assign({}, stateOptions);

		this.#storages = new Storages(storageKeyPrefix);
		this.#attrTarget = attrTarget ?? document.documentElement;
		if (Array.isArray(states)) {
			for (const stateOptions of states) {
				this.add(stateOptions, true);
			}
		} else if (states) {
			for (let id in states) {
				let stateOptions = states[id];
				stateOptions = Object.assign({ id }, stateOptions);
				this.add(stateOptions, true);
			}
		}
	}

	#get(stateId) {
		return this.#states[String(stateId)];
	}

	#callHook(hook, ...args) {
		const methodName = hooksHash[hook];
		callHook(this, this.#hooks, undefined, methodName, hook, args);
	}

	#proxyHooks(hook, ...args) {
		const proxyHook = proxyHooks[hook];
		const methodName = hooksHash[proxyHook];
		callHook(this, this.#hooks, undefined, methodName, proxyHook, args);
	}

	add(stateOptions, dontStart) {
		
		this.#callHook('before:add', stateOptions, dontStart);

		dontStart = getDontStart(dontStart, this.isStarted);
		if (stateOptions.id === undefined || stateOptions.id === '') {
			throw new Error('missing state id');
		}
		const stateId = stateOptions.id;
		this.remove(stateId);

		const state = this.#build(stateOptions);

		this.#states[state.id] = state;

		this.#callHook('add', state.id);

		if (!dontStart) state.start();
	}

	#build(stateOptions) {
		const proxyHooks = (...args) => this.#proxyHooks(...args);
		// inside state proxy hook called with state instance in this.
		// arrow function here is for calling manager hooks exactly with manager this 
		const state = new State({
			proxyHooks,
			...this.#stateOptions,
			...stateOptions,
			attrTarget: stateOptions.attrTarget ?? this.#attrTarget,
			storages: this.#storages
		});

		return state;
	}

	storeValue(stateId, value, where) {
		const state = this.#get(stateId);
		if (!state) return false;
		state.set(value, where);
		return true;
	}

	setTarget(stateId, target, dontStart) {
		dontStart = getDontStart(dontStart, this.isStarted);
		let state = this.#get(stateId);
		if (state) {
			state.setTarget(target, dontStart);
			return true;
		}
		return false;
	}

	remove(arg) {
		if (arguments.length === 0) {
			this.#forEachStateKey(key => this.remove(key));
			this.#states = Object.create(null);
			return;
		}

		const state = this.#get(arg);
		if (!state) return;
		state.destroy();
		delete this.#states[state.id];
	}

	// Any state start starts the manager. The manager may run with every state stopped.
	// start() === start(true): manager + all states. start(false): manager only.
	start(arg) {
		const startAllCase = arguments.length === 0 || (typeof arg === 'boolean');
		if (startAllCase) {
			const startAllStates = arg !== false;
			this.#started = true;
			startAllStates && this.#forEachStateKey(key => this.start(key));
			return;
		}

		if (!this.isStarted) this.#started = true;
		const state = this.#get(arg);
		state && state.start();
	}

	// Stopping states does not stop the manager. The manager cannot stop while a state is running.
	// stop() === stop(true): all states + manager. stop(false): all states, manager stays on.
	stop(arg) {
		const stopAllCase = arguments.length === 0 || (typeof arg === 'boolean');
		if (stopAllCase) {
			this.#forEachStateKey(key => this.stop(key));
			const shouldStopManager = arg !== false;
			shouldStopManager && (this.#started = false);
			return;
		}

		const state = this.#get(arg);
		state && state.stop();
	}



	#stateKeys() {
		return Reflect.ownKeys(this.#states);
	}

	#forEachStateKey(action) {
		const keys = this.#stateKeys();
		for (let key of keys) action(key);
	}

	#createValues() {
		const mgr = this;
		return new Proxy(Object.create(null), {
			get(_target, prop) {
				return mgr.#get(prop)?.value;
			},
			set(_target, prop, value) {
				if (!mgr.storeValue(prop, value)) throw new Error(`unknown state ${String(prop)}`);
				return true;
			},
			has(_target, prop) {
				return String(prop) in mgr.#states;
			},
			ownKeys() {
				return Reflect.ownKeys(mgr.#states);
			},
			getOwnPropertyDescriptor(_target, prop) {
				if (!(String(prop) in mgr.#states)) return;
				return {
					enumerable: true,
					configurable: true,
					writable: true,
					value: mgr.#get(prop).value,
				};
			},
			deleteProperty() {
				return true;
			},
		});
	}

}

function getDontStart(dontStart, started) {
	return dontStart || !started;
}




const managerHookNames = [

	'before:add',
	'add',

	...addStatePrefix(stateHookNames)

];

const proxyHooks = stateHookNames.reduce((m, k) => {
	m[k] = statePrefix(k);
	return m;
}, {})

const hooksHash = managerHookNames.reduce((m, hook) => {
	m[hook] = toCamelCase(hook)
	return m;
}, {})


function addStatePrefix(names) {
  return names.map(statePrefix);
}

function statePrefix(name) {
	return name.startsWith('before:')
      ? 'before:state:' + name.slice('before:'.length)
      : 'state:' + name
}