import { createSource, normalizeSource } from './source.js';

export class State {

	id;
	attrName;
	attrTarget;
	attrOriginValue;

	#source;
	#storages;
	#locked = false;
	#updateForSource;

	#sourceOptions;
	#valueGetter;
	#attrValue;
	
	
	#value;

	#hooks;
	#proxyHooks;
	

	constructor({ id, attrName, attrTarget, source, value, attrValue, storages, hooks, proxyHooks } = {}) {
		this.id = String(id);
		this.attrName = attrName ?? this.id;
		this.attrTarget = attrTarget;
		this.attrOriginValue = attrTarget.getAttribute(this.attrName);

		this.#storages = storages;


		this.#sourceOptions = normalizeSource(source);
		this.#valueGetter = value;

		if (typeof attrValue === 'function')
			this.#attrValue = attrValue;

		this.#updateForSource = newValue => {
			if (this.#locked) return;
			this.#setValue(newValue);
		};

		this.#hooks = Object.assign({}, hooks);
		this.#proxyHooks = proxyHooks;

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


	set(value, storageIdentifier) {
		this.#ensureAlive();

		const shouldClear = value === undefined;
		this.#locked = !shouldClear;
		this.#tryOverride(value, storageIdentifier);

		if (shouldClear) {
			this.isStarted && this.#source.start();
			this.#sync();
		}
		else {
			this.#source.stop();
			this.#setValue(value);
		}
	}

	#setValue(value) {
		const changed = value !== this.value;
		changed && (this.#value = value);
		this.#setTargetAttribute(this.#toAttr(this.value));

		if (this.isStarted && changed) 
			this.#callHook('change', this.id, this.value);

	}

	#callHook(hook, ...args) {
		const methodName = hooksHash[hook];
		callHook(this, this.#hooks, this.#proxyHooks, methodName, hook, args);
	}

	#tryOverride(value, storageIdentifier) {
		if (value === undefined) {
			this.#storages.write(this.id, value, true);
			this.#storages.write(this.id, value, false);
			return;
		}
		if (storageIdentifier == null) return;
		this.#storages.write(this.id, value, storageIdentifier);
	}

	#getOverride() {
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
		
		this.#callHook('before:start', this.id);

		let overrided = this.#locked ? this.#value : this.#getOverride();
		let hasOverrided = overrided !== undefined;
		let shouldLock = hasOverrided && !this.#locked;
		if (shouldLock) this.#locked = true;

		this.#source.start();
		this.isStarted = true;

		if (this.#locked) {
			this.#source.stop();
			this.#setValue(overrided);
		}
		else {
			this.#sync();
		}

		this.#callHook('start', this.id, this.value);
	}

	stop() {
		if (!this.isStarted) return;
		this.#callHook('before:stop', this.id);
		this.#source.stop();
		this.isStarted = false;
		this.#callHook('stop', this.id);

	}

	destroy() {
		if (this.isDestroyed) return;
		this.#callHook('before:destroy', this.id);

		this.stop();
		this.#setTargetAttribute(this.attrOriginValue);
		this.isDestroyed = true;

		this.#callHook('destroy', this.id);

	}

	#ensureAlive() {
		if (this.isDestroyed === true) {
			throw new Error(`state ${this.id} destroyed and can not be used`);
		}
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

export function tryCall(method, _this, ...args) {
	if (typeof method !== 'function') return;
	method.apply(_this, args);
}

export function callHook(instance, hooks, proxy, methodName, hook, args) {
	tryCall(hooks[methodName], instance, ...args);
	tryCall(hooks.all, instance, hook, ...args);
	tryCall(proxy, instance, hook, ...args);
}