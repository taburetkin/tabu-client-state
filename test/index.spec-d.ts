import * as pkg from '../index.js';
import {
	State,
	StateManager,
	viewport,
	workspace,
	hover,
	colorScheme,
	orientation,
	type StateOptions,
	type StateOverrides,
	type StateSetOptions,
	type StateSetWhere,
	type StateManagerOptions,
	type StateHooks,
	type ManagerHooks,
	type StateHookName,
	type ManagerHookName,
	type AddOptions,
} from '../index.js';

void new StateManager({
	states: [viewport(), workspace(), hover(), colorScheme(), orientation()],
});

void State;
void pkg.State;
void pkg.StateManager;
void pkg.viewport;
void pkg.workspace;
void pkg.hover;
void pkg.colorScheme;
void pkg.orientation;

const _config: StateOptions = viewport();
const _where: StateSetWhere = { memory: true, session: true };
const _layers: StateSetOptions = { local: true };
const _flags: StateOverrides = { memory: true, session: false, local: false };
void _where;
void _layers;
void _flags;
const _hooks: StateHooks = { change() {} };
const _mgrHooks: ManagerHooks = { stateChange() {} };
const _addOpts: AddOptions = { replace: true, dontStart: true };
void _addOpts;
const _hookName: StateHookName = 'before:start';
const _mgrHookName: ManagerHookName = 'before:state:start';
const _opts: StateManagerOptions = {
	autoStartStates: true,
	states: [_config],
	attrTarget: document.body,
	hooks: _mgrHooks,
	stateOptions: { hooks: _hooks },
};
void _opts;
void _hookName;
void _mgrHookName;

// @ts-expect-error StateId is not a package export
pkg.StateId;
// @ts-expect-error StateInput is not a package export
pkg.StateInput;
// @ts-expect-error AttrTarget is not a package export
pkg.AttrTarget;
// @ts-expect-error SourceType is not a package export
pkg.SourceType;
// @ts-expect-error kitchen source factories are not package exports
pkg.event;
// @ts-expect-error kitchen source factories are not package exports
pkg.resizeWindow;
// @ts-expect-error kitchen source factories are not package exports
pkg.resizeElement;
// @ts-expect-error kitchen source factories are not package exports
pkg.mediaQuery;
// @ts-expect-error kitchen source factories are not package exports
pkg.timer;
// @ts-expect-error kitchen source factory options are not package exports
pkg.EventOptions;

// @ts-expect-error default size lists are not exported
pkg.VIEWPORT_SIZES;
// @ts-expect-error default size lists are not exported
pkg.WORKSPACE_SIZES;
// @ts-expect-error widthState is not exported
pkg.widthState;
// @ts-expect-error DEFAULT_STORAGE_KEY_PREFIX is not a package export
pkg.DEFAULT_STORAGE_KEY_PREFIX;
// @ts-expect-error getStoragesSingleton is not a package export
pkg.getStoragesSingleton;
// @ts-expect-error captureStorages is not a package export
pkg.captureStorages;
// @ts-expect-error Storages is not a package export
pkg.Storages;
// @ts-expect-error matchMediaState is not a package export
pkg.matchMediaState;
// @ts-expect-error createHooks is not a package export
pkg.createHooks;
// @ts-expect-error stateHookNames is not a package export
pkg.stateHookNames;
// @ts-expect-error toCamelCase is not a package export
pkg.toCamelCase;
// @ts-expect-error onChange is not a package export
pkg.onChange;
// @ts-expect-error tokenByThresholds is not a package export
pkg.tokenByThresholds;
// @ts-expect-error mediaQueriesFromSizes is not a package export
pkg.mediaQueriesFromSizes;
// @ts-expect-error listen is not a package export
pkg.listen;
// @ts-expect-error unlisten is not a package export
pkg.unlisten;
// @ts-expect-error ensureState is not a package export
pkg.ensureState;
// @ts-expect-error requireId is not a package export
pkg.requireId;
