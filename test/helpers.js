import { captureStorages } from '../Storages.js';

export class FakeElement {
	constructor(initial) {
		this.attrs = new Map();
		if (initial) {
			for (const [name, value] of Object.entries(initial)) {
				this.attrs.set(name, String(value));
			}
		}
	}
	getAttribute(name) {
		return this.attrs.has(name) ? this.attrs.get(name) : null;
	}
	setAttribute(name, value) {
		this.attrs.set(name, String(value));
	}
	removeAttribute(name) {
		this.attrs.delete(name);
	}
}

export function stored(value) {
	return JSON.stringify(value);
}

export function memoryStorage() {
	const data = new Map();
	return {
		getItem(key) { return data.has(key) ? data.get(key) : null; },
		setItem(key, value) { data.set(String(key), String(value)); },
		removeItem(key) { data.delete(key); },
	};
}

function snapshot(name) {
	return Object.getOwnPropertyDescriptor(globalThis, name);
}

function restore(name, descriptor) {
	if (descriptor) Object.defineProperty(globalThis, name, descriptor);
	else delete globalThis[name];
}

export function failingStorage(error = new Error('quota')) {
	const data = new Map();
	let probed = false;
	return {
		getItem(key) { return data.has(key) ? data.get(key) : null; },
		setItem(key, value) {
			if (probed) throw error;
			probed = true;
			data.set(String(key), String(value));
		},
		removeItem(key) { data.delete(key); },
	};
}

export function withStorages(fn, spec = {}) {
	const prevLocal = snapshot('localStorage');
	const prevSession = snapshot('sessionStorage');
	const local = 'local' in spec ? spec.local : memoryStorage();
	const session = 'session' in spec ? spec.session : memoryStorage();
	Object.defineProperty(globalThis, 'localStorage', {
		configurable: true,
		value: local,
	});
	Object.defineProperty(globalThis, 'sessionStorage', {
		configurable: true,
		value: session,
	});
	captureStorages();
	try {
		return fn(globalThis.localStorage, globalThis.sessionStorage);
	} finally {
		restore('localStorage', prevLocal);
		restore('sessionStorage', prevSession);
		captureStorages();
	}
}

export function fakeTarget(extra = {}) {
	const added = [];
	const removed = [];
	const current = new Map();
	return {
		added,
		removed,
		addEventListener(name, fn) {
			added.push([name, fn]);
			if (!current.has(name)) current.set(name, new Set());
			current.get(name).add(fn);
		},
		removeEventListener(name, fn) {
			removed.push([name, fn]);
			current.get(name)?.delete(fn);
		},
		listenerCount(name) {
			if (name != null) return current.get(name)?.size ?? 0;
			let n = 0;
			for (const set of current.values()) n += set.size;
			return n;
		},
		listenersFor(name) {
			return [...(current.get(name) ?? [])];
		},
		...extra,
	};
}

export function fakeMedia(matches = false) {
	return fakeTarget({ matches, media: '' });
}

export class FakeResizeObserver {
	static instances = [];
	constructor(cb) {
		this.cb = cb;
		this.disconnected = false;
		FakeResizeObserver.instances.push(this);
	}
	observe(target) { this.target = target; }
	disconnect() {
		this.disconnected = true;
		this.target = undefined;
	}
	resize() {
		if (!this.disconnected) this.cb();
	}
	static live() {
		return this.instances.filter(observer => !observer.disconnected);
	}
	static reset() {
		this.instances = [];
	}
}

export function installDom(overrides = {}) {
	const prev = {
		document: snapshot('document'),
		window: snapshot('window'),
		ResizeObserver: snapshot('ResizeObserver'),
	};

	const documentElement = overrides.documentElement ?? new FakeElement();
	const windowObj = overrides.window ?? {
		innerWidth: 1024,
		addEventListener() {},
		removeEventListener() {},
		matchMedia(query) {
			return fakeTarget({ matches: false, media: query });
		},
	};

	Object.defineProperty(globalThis, 'document', {
		configurable: true,
		value: { documentElement },
	});
	Object.defineProperty(globalThis, 'window', {
		configurable: true,
		value: windowObj,
	});
	Object.defineProperty(globalThis, 'ResizeObserver', {
		configurable: true,
		value: overrides.ResizeObserver ?? FakeResizeObserver,
	});

	return {
		documentElement,
		window: windowObj,
		ResizeObserver: globalThis.ResizeObserver,
		restore() {
			restore('document', prev.document);
			restore('window', prev.window);
			restore('ResizeObserver', prev.ResizeObserver);
		}
	};
}

export function withFakeTimers(fn) {
	const prevSet = globalThis.setInterval;
	const prevClear = globalThis.clearInterval;
	let nextId = 0;
	const timers = new Map();
	globalThis.setInterval = (cb) => {
		const id = ++nextId;
		timers.set(id, cb);
		return id;
	};
	globalThis.clearInterval = (id) => { timers.delete(id); };
	try {
		return fn({
			tick() {
				for (const cb of [...timers.values()]) cb();
			}
		});
	} finally {
		globalThis.setInterval = prevSet;
		globalThis.clearInterval = prevClear;
	}
}
