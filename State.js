import { createSource, normalizeSource } from './source.js';
import { getStoragesSingleton } from './Storages.js';

const emptyObject = {};
const emptySet = new Set();
const listeners = new WeakMap();

export class State {

	id;
	attrName;
	attrTarget;
	attrOriginValue;

	#source;
	#storages;
	#updateForSource;

	#sourceOptions;
	#valueGetter;
	#attrValue;
	
	
	#value;
	#memoryOverride;

	#hooks;

	constructor({ id, attrName, attrTarget, source, value, attrValue, hooks, storageKeyPrefix } = {}) {
		this.id = requireId(id);
		this.attrName = attrName ?? this.id;
		this.attrTarget = attrTarget ?? document.documentElement;
		this.attrOriginValue = this.attrTarget.getAttribute(this.attrName);

		this.#storages = getStoragesSingleton(storageKeyPrefix);


		this.#sourceOptions = normalizeSource(source);
		this.#valueGetter = value;

		if (typeof attrValue === 'function')
			this.#attrValue = attrValue;

		this.#updateForSource = newValue => {
			if (this.hasOverrides()) return;
			this.#setValue(newValue);
		};

		this.#hooks = Object.assign({}, hooks);

		this.#initSource();


	}

	get value() { 
		this.#ensureAlive();
		return this.#value; 
	}
	set value(newValue) {
		this.set(newValue)
	}

	setTarget(target, dontStart) {
		this.#ensureAlive();
		this.stop();
		this.#sourceOptions.target = target;
		this.#initSource();
		if (!dontStart) this.start();
	}

	#sync() { this.#source.sync(); }

	#initSource() {
		const source = createSource(this.#sourceOptions, this.#valueGetter, this.#updateForSource);
		this.#source = source;
		
	}

	hasOverrides() {
		return this.getOverrides() != null;
	}

	getOverrides() {
		const memory = this.#memoryOverride !== undefined;
		const session = this.#storages.hasValue(this.id, true);
		const local = this.#storages.hasValue(this.id, false);
		if (memory || session || local) {
			return { memory, session, local };
		}
	}

	set(value, setOptions) {
		this.#ensureAlive();
		setOptions = normalizeSetOptions(setOptions);

		const overrided = this.#setOverride(value, setOptions);

		if (overrided === undefined) {
			this.isStarted && this.#source.start();
			this.#sync();
		}
		else {
			this.#source.stop();
			this.#setValue(overrided);
		}
	}

	#setValue(value) {
		const changed = value !== this.value;
		changed && (this.#value = value);
		this.#setTargetAttribute(this.#toAttr(this.value));

		if (this.isStarted && changed) 
			this.#callHook('change', this.value);

	}

	#callHook(hook, ...args) {
		const hooks = this.#hooks ?? emptyObject;
		tryCall(hooks[hooksHash[hook]], this, args);

		const payload = [hook, this, ...args];
		tryCall(hooks.all, this, payload);
		for (const fn of listeners.get(this) ?? emptySet) fn.apply(this, payload);
	}

	#setOverride(value, options) {
		let removing = value === undefined;
		let { memory, session, local } = options;
		let sessionFail, localFail;
		let both = !!session && !!local;

		memory && (this.#memoryOverride = value);
		session && (sessionFail = this.#storages.write(this.id, value, true) === false);
		local && (localFail = this.#storages.write(this.id, value, false) === false);

		const fallbackToMemory = !removing && (
			(both && sessionFail && localFail) 
			|| (!both && (sessionFail || localFail))
		);

		
		if (fallbackToMemory) {
			this.#memoryOverride = value;
		}
		return this.#getOverride();
	}

	#getOverride() {
		if (this.#memoryOverride !== undefined) return this.#memoryOverride;
		let value = this.#storages.read(this.id, true);
		if (value !== undefined) return value;
		return this.#storages.read(this.id, false);
	}



	#toAttr(value) {
		return this.#attrValue ? this.#attrValue(value) : value;
	}

	#setTargetAttribute(value) {
		setAttr(this.attrTarget, this.attrName, value);
	}

	start() {
		this.#ensureAlive();
		if (this.isStarted) return;
		
		this.#callHook('before:start');

		let overrided = this.#getOverride();

		this.#source.start();
		this.isStarted = true;

		if (overrided !== undefined) {
			this.#source.stop();
			this.#setValue(overrided);
		}
		else {
			this.#sync();
		}

		this.#callHook('start', this.value);
	}

	stop() {
		if (!this.isStarted) return;
		this.#callHook('before:stop');
		this.#source.stop();
		this.isStarted = false;
		this.#callHook('stop');

	}

	destroy() {
		if (this.isDestroyed) return;
		this.#callHook('before:destroy');

		this.stop();
		this.#setTargetAttribute(this.attrOriginValue);
		this.isDestroyed = true;

		this.#callHook('destroy');

	}

	#ensureAlive() {
		ensureState(this);
	}
}



function normalizeSetOptions(options) {
	if (options == null) {
		return { memory: true }
	}

	if (typeof options === 'object') {
		let { memory, session, local } = options;
		if (memory || session || local) return options;
		return { memory: true };
	}

	const stringId = String(options);
	switch(stringId){
		case 'true':
		case 'session':
			return { session: true };
		default:
			return { local: true };
	}

}



function setAttr(el, name, value) {
	if (!el || typeof el.setAttribute !== 'function') return;
	if (value == null) {
		el.removeAttribute(name);
	} else {
		el.setAttribute(name, value);
	}
}



export const stateHookNames = [
	'before:start',
	'start',
	'before:stop',
	'stop',
	'before:destroy',
	'destroy',
	'change'
]

const hooksHash = stateHookNames.reduce((m, hook) => {
	m[hook] = toCamelCase(hook)
	return m;
}, {})




export function toCamelCase(str) {
  const parts = str.split(':');
  return parts[0] + parts.slice(1)
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');
}

export function tryCall(method, _this, args) {
	if (typeof method !== 'function') return;
	method.apply(_this, args);
}

export function requireId(id) {
	if (id == null || String(id) === '') {
		throw new Error('missing state id');
	}
	return String(id);
}

export function ensureState(state) {
	if (state.isDestroyed === true) {
		throw new Error(`state ${state.id} destroyed and can not be used`);
	}
	return state;
}

export function listen(state, fn) {
	if (typeof fn !== 'function') return;
	let set = listeners.get(state);
	if (!set) {
		set = new Set();
		listeners.set(state, set);
	}
	set.add(fn);
}

export function unlisten(state, fn) {
	listeners.get(state)?.delete(fn);
}