export const DEFAULT_STORAGE_KEY_PREFIX: string;

export function captureStorages(): void;

export class Storages {
	constructor(prefix: string);
	read(id: unknown, session: boolean): unknown;
	write(id: unknown, value: unknown, session: boolean): boolean | void;
	hasValue(id: unknown, session: boolean): boolean;
}

export function getStoragesSingleton(prefix?: string): Storages;
