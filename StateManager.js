import { DEFAULT_STORAGE_KEY_PREFIX } from './Storages.js';
import { State, stateHookNames, toCamelCase, ensureState, requireId, tryCall, listen, unlisten } from './State.js';



export class StateManager {

	#states;
	#attrTarget;
	#stateOptions;
	
	#storageKeyPrefix;

	#hooks;
	#listen;
	values;

	autoStartStates;

	

	constructor({ states, storageKeyPrefix, attrTarget, stateOptions, hooks, autoStartStates, initialize } = {}) {
		
		this.#storageKeyPrefix = storageKeyPrefix ?? DEFAULT_STORAGE_KEY_PREFIX;

		this.#hooks = Object.assign({}, hooks);
		this.autoStartStates = autoStartStates === true;
		
		this.#states = Object.create(null);
		this.values = this.#createValues();

		this.#listen = (hook, state, ...args) => {
			const name = proxyHooks[hook];
			const payload = [name, state, ...args];
			tryCall(this.#hooks[hooksHash[name]], this, payload);
			tryCall(this.#hooks.all, this, payload);
			if (hook === 'destroy') {
				unlisten(state, this.#listen);
				delete this.#states[state.id];
			}
		};

		this.#stateOptions = Object.assign({}, stateOptions);

		this.#attrTarget = attrTarget ?? document.documentElement;

		initialize?.call(this);

		if (Array.isArray(states)) {
			for (const item of states) {
				this.add(addArg(item));
			}
		} else if (states) {
			for (let id in states) {
				this.add(addArg(states[id], id));
			}
		}
	}

	#get(stateId) {
		return this.#states[String(stateId)];
	}

	#state(arg) {
		return asState(arg) ?? this.#get(arg);
	}

	#needState(arg) {
		const state = this.#state(arg);
		if (!state) throw new Error(`unknown state ${String(arg)}`);
		return state;
	}

	#callHook(hook, ...args) {
		const payload = [hook, ...args];
		tryCall(this.#hooks[hooksHash[hook]], this, payload);
		tryCall(this.#hooks.all, this, payload);
	}


	add(stateOptions, addOptions = {}) {
		let { replace, detach, dontStart } = addOptions;

		let stateId = requireId(stateOptions?.id);

		let foreign = asState(stateOptions);
		let exist = this.#get(stateId);
		if (foreign && exist === foreign) return exist;

		this.#callHook('before:add', stateOptions, addOptions);
		
		if (exist) {
			
			if (!replace) {
				throw new Error(`state with id "${stateId}" already exists. use { replace: true, detach: true/false } option for auto removing/destroying`);
			}

			this.#remove(exist, detach !== true);
		} 
		
		let state = foreign ?? this.#build(stateOptions);
		listen(state, this.#listen);
		this.#states[state.id] = state;

		this.#callHook('add', state);

		if (this.autoStartStates && !dontStart) state.start();

		return state;
	}

	
	#build(stateOptions) {
		return new State({
			attrTarget: this.#attrTarget,
			storageKeyPrefix: this.#storageKeyPrefix,
			...this.#stateOptions,
			...stateOptions,
		});
	}

	get(id) {
		return this.#get(id);
	}

	states() {
		return this.#stateKeys().map(id => this.#get(id));
	}

	set(arg, value, setOptions) {
		this.#needState(arg).set(value, setOptions);
	}

	setTarget(arg, target, dontStart) {
		this.#needState(arg).setTarget(target, dontStart);
	}

	hasOverrides(arg) {
		if (arguments.length === 0) {
			return this.states().some(state => state.hasOverrides());
		}
		return this.#state(arg)?.hasOverrides() ?? false;
	}

	getOverrides(arg) {
		if (arguments.length === 0) {
			let map;
			for (const state of this.states()) {
				const overrides = state.getOverrides();
				if (overrides == null) continue;
				(map ??= {})[state.id] = overrides;
			}
			return map;
		}
		return this.#state(arg)?.getOverrides();
	}

	remove(arg, options = {}) {

		if (arguments.length === 0) {
			this.#forEachStateKey(key => this.remove(key));
			this.#states = Object.create(null);
			return;
		}

		const foreign = asState(arg);
		const state = this.#get(foreign?.id ?? arg);
		if (foreign && foreign !== state) {
			unlisten(foreign, this.#listen);
			return;
		}

		this.#remove(state, options?.detach !== true);

	}

	#remove(state, destroy) {
		if (!state) return;
		if (destroy) {
			state.destroy();
			delete this.#states[state.id];
			return;
		}

		this.#callHook('before:detach', state);
		state.stop();
			unlisten(state, this.#listen);
		delete this.#states[state.id];
		this.#callHook('detach', state);
	}


	start(arg) {
		if (arguments.length === 0) {
			this.#forEachStateKey(key => this.start(key));
			return;
		}

		const state = this.#state(arg);
		state && state.start();
	}


	stop(arg) {
		if (arguments.length === 0) {
			this.#forEachStateKey(key => this.stop(key));
			return;
		}

		const state = this.#state(arg);
		state && state.stop();
	}



	#stateKeys() {
		return Object.keys(this.#states);
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
				mgr.set(prop, value);
				return true;
			},
			has(_target, prop) {
				return String(prop) in mgr.#states;
			},
			ownKeys() {
				return Object.keys(mgr.#states);
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

function asState(arg) {
	return arg instanceof State ? ensureState(arg) : undefined;
}

function addArg(item, id) {
	return asState(item) ?? (id == null ? item : Object.assign({ id }, item));
}

const managerHookNames = [

	'before:add',
	'add',
	'before:detach',
	'detach',
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