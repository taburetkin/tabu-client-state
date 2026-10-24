class Source {
	#start;
	#stop;
	#started = false;

	sync;

	get isStarted() { return this.#started; }

	constructor({ start, stop, sync }) {
		this.sync = sync;
		this.#start = start;
		this.#stop = stop;
	}

	start() {
		if (this.isStarted) return;
		if (this.#start() === false) return false;
		this.#started = true;
	}

	stop() {
		if (!this.isStarted) return;
		this.#stop();
		this.#started = false;
	}
}

function invoke(arg) {
	return typeof arg === 'function' ? arg() : arg;
}



export function createSource(source, value, update) {
	const ctx = {};
	let { target, bind, unbind } = source;

	let hasBind, hasUnbind;
	if (bind != null || unbind != null) {
		hasBind = ensureFunc(bind, 'bind');
		hasUnbind = ensureFunc(unbind, 'unbind');
		ensureFunc(value, 'value');
	} else if (typeof value !== 'function') {
		let arg = value;
		value = () => arg;
	}

	const sync = ctx.callback = () => {
		update(value(ctx));
	};



	ctx.target = invoke(target);
	const start = () => hasBind ? bind(ctx) : undefined;
	const stop = () => {
		cancelCallback(ctx.callback);
		hasUnbind && unbind(ctx);
	};

	return new Source({ start, stop, sync });
}

function cancelCallback(fn) {
	if (typeof fn?.cancel === 'function') fn.cancel();
}

export function normalizeSource(source) {
	source = invoke(source ?? {});
	source = Object.assign({}, source);
	if ('target' in source) source.target = invoke(source.target);
	return source;
}


function ensureFunc(fn, name) {
	if (typeof fn !== 'function')
		throw new Error(`${name} must be a function`);
	return true;
}