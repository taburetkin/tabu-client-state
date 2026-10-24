export class Storages {

	#prefix;
	#local;
	#session;

	constructor(prefix) {
		this.#prefix = prefix;
		this.#local = this.#ensureStorage('localStorage');
		this.#session = this.#ensureStorage('sessionStorage');
	}

	read(id, session) {
		return this.#readStorage(id, session ? this.#session : this.#local);
	}

	write(id, value, session) {
		this.#writeStorage(id, value, session ? this.#session : this.#local);
	}

	#readStorage(id, storage) {
		const raw = storage?.getItem(this.#prefix + String(id));
		if (raw == null) return;
		return parseStored(raw);
	}

	#writeStorage(id, value, storage) {
		if (!storage) return;
		let key = this.#prefix + String(id);
		if (value === undefined) storage.removeItem(key);
		else storage.setItem(key, stringifyStored(value));
	}

	#ensureStorage(name) {
		try {
			let storage = globalThis[name];
			if (!storage) return;
			let probe = this.#prefix + '__probe';
			storage.setItem(probe, '1');
			storage.getItem(probe);
			storage.removeItem(probe);
			return storage;
		} catch {
			return;
		}
	}

}

function stringifyStored(value) {
	return JSON.stringify(value);
}

function parseStored(raw) {
	try {
		return JSON.parse(raw);
	} catch {
		console.warn(`parse failed trying to parse value ${raw}`);
		return;
	}
}
