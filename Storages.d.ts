export class Storages {
	constructor(prefix: string);
	read(id: unknown, session: boolean): string | boolean | undefined;
	write(id: unknown, value: unknown, session: boolean): void;
}
