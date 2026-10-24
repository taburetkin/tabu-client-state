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

export function withStorages(fn) {
	const prevLocal = snapshot('localStorage');
	const prevSession = snapshot('sessionStorage');
	Object.defineProperty(globalThis, 'localStorage', {
		configurable: true,
		value: memoryStorage(),
	});
	Object.defineProperty(globalThis, 'sessionStorage', {
		configurable: true,
		value: memoryStorage(),
	});
	try {
		return fn(globalThis.localStorage, globalThis.sessionStorage);
	} finally {
		restore('localStorage', prevLocal);
		restore('sessionStorage', prevSession);
	}
}

export function fakeTarget(extra = {}) {
	const added = [];
	const removed = [];
	return {
		added,
		removed,
		addEventListener(name, fn) { added.push([name, fn]); },
		removeEventListener(name, fn) { removed.push([name, fn]); },
		...extra,
	};
}

export function fakeMedia(matches = false) {
	return fakeTarget({ matches, media: '' });
}

export function installDom(overrides = {}) {
	const prev = {
		document: snapshot('document'),
		window: snapshot('window'),
		ResizeObserver: snapshot('ResizeObserver'),
	};

	class FakeResizeObserver {
		constructor(cb) { this.cb = cb; }
		observe(target) { this.target = target; }
		disconnect() { this.disconnected = true; }
	}

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
