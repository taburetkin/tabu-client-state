export const DEFAULT_STORAGE_KEY_PREFIX = 'tabu.clientstate.';

let local;
let session;
let captured = false;

function ensureStorage(name) {
	try {
		let storage = globalThis[name];
		if (!storage) return;
		let probe = DEFAULT_STORAGE_KEY_PREFIX + '__probe';
		storage.setItem(probe, '1');
		storage.getItem(probe);
		storage.removeItem(probe);
		return storage;
	} catch {
		return;
	}
}

export function captureStorages() {
	local = ensureStorage('localStorage');
	session = ensureStorage('sessionStorage');
	captured = true;
}

function ensureCaptured() {
	if (!captured) captureStorages();
}

export class Storages {

	#prefix;

	constructor(prefix) {
		ensureCaptured();
		this.#prefix = prefix;
	}

	#key(id) { return this.#prefix + String(id); }

	read(id, sessionFlag) {
		return this.#readStorage(id, sessionFlag ? session : local);
	}

	write(id, value, sessionFlag) {
		return this.#writeStorage(id, value, sessionFlag ? session : local);
	}

	hasValue(id, sessionFlag) {
		return this.#hasValue(id, sessionFlag ? session : local);
	}

	#hasValue(id, storage) {
		return this.#getItem(id, storage) != null;
	}

	#getItem(id, storage) {
		return storage?.getItem(this.#key(id));
	}

	#readStorage(id, storage) {
		const raw = this.#getItem(id, storage);
		if (raw == null) return;

		try {
			return JSON.parse(raw);
		} catch {
			console.warn(`read storage failed trying to parse value ${raw}`);
			return raw;
		}
	}

	#writeStorage(id, value, storage) {
		if (!storage) return false;
		let key = this.#key(id);
		if (value === undefined) storage.removeItem(key);
		else {
			try {
				const jsonString = JSON.stringify(value);
				storage.setItem(key, jsonString);
				return true;
			} catch (exc) {
				console.error(exc);
				return false;
			}
		}
	}

}

const STORAGES = new Map();

export function getStoragesSingleton(prefix) {
	prefix = prefix ?? DEFAULT_STORAGE_KEY_PREFIX;
	let exist = STORAGES.get(prefix);
	if (exist == null) {
		exist = new Storages(prefix);
		STORAGES.set(prefix, exist);
	}
	return exist;
}
