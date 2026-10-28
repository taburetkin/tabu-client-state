import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as pkg from '../index.js';
import {
	State,
	StateManager,
	listen,
	unlisten,
	viewport,
	workspace,
	hover,
	colorScheme,
	orientation,
} from '../index.js';

describe('index', () => {
	it('re-exports the host and named presets', () => {
		assert.equal(typeof State, 'function');
		assert.equal(typeof StateManager, 'function');
		assert.equal(typeof listen, 'function');
		assert.equal(typeof unlisten, 'function');
		assert.equal(typeof viewport, 'function');
		assert.equal(typeof workspace, 'function');
		assert.equal(typeof hover, 'function');
		assert.equal(typeof colorScheme, 'function');
		assert.equal(typeof orientation, 'function');
		assert.equal(viewport().id, 'vp');
		assert.equal(viewport().attrName, 'data-vp');
		assert.equal(workspace().id, 'ws');
		assert.equal(workspace().attrName, 'data-ws');
		assert.equal(hover().id, 'hover');
		assert.equal(hover().attrName, 'data-hover');
		assert.equal(colorScheme().id, 'dark');
		assert.equal(colorScheme().attrName, 'data-color-scheme');
		assert.equal(orientation().id, 'portrait');
		assert.equal(orientation().attrName, 'data-orientation');
		assert.equal('DEFAULT_STORAGE_KEY_PREFIX' in pkg, false);
		assert.equal('getStoragesSingleton' in pkg, false);
		assert.equal('captureStorages' in pkg, false);
		assert.equal('State' in pkg, true);
		assert.equal('listen' in pkg, true);
		assert.equal('unlisten' in pkg, true);
		assert.equal('ensureState' in pkg, false);
		assert.equal('requireId' in pkg, false);
	});
});
