import { Storages, getStoragesSingleton, captureStorages, DEFAULT_STORAGE_KEY_PREFIX } from '../Storages.js';

captureStorages();
const prefix: string = DEFAULT_STORAGE_KEY_PREFIX;
void prefix;
const shared: Storages = getStoragesSingleton();
void shared;
void getStoragesSingleton('t.');
void getStoragesSingleton(DEFAULT_STORAGE_KEY_PREFIX);

const storages = new Storages('t.');
const wrote: boolean | void = storages.write('theme', 'dark', false);
void wrote;
storages.write(1, true, true);
void storages.read('theme', false);
void storages.read(1, true);
storages.write('theme', undefined, false);
const present: boolean = storages.hasValue('theme', false);
void present;

// @ts-expect-error prefix is required
new Storages();
