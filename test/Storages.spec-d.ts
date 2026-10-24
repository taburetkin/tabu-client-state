import { Storages } from '../Storages.js';

const storages = new Storages('t.');
storages.write('theme', 'dark', false);
storages.write(1, true, true);
void storages.read('theme', false);
void storages.read(1, true);
storages.write('theme', undefined, false);

// @ts-expect-error prefix is required
new Storages();
