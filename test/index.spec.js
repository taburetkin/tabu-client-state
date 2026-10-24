import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
	StateManager,
	viewport,
	workspace,
	hover,
	colorScheme,
	orientation,
} from '../index.js';

describe('index', () => {
	it('re-exports the host and named presets', () => {
		assert.equal(typeof StateManager, 'function');
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
	});
});
