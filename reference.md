# tabu-client-state

Reference for the public API. The tour is in [README.md](README.md).

The package exports [`State`](#State), [`StateManager`](#StateManager), and named presets. A preset is a factory for [`StateOptions`](#StateOptions).

# content

- [State](#State)
	- [constructor(options)](#State-constructor)
	- [properties](#State-properties)
	- [methods](#State-methods)
		- [set(value[, where])](#State-set)
		- [setTarget(target[, dontStart])](#State-setTarget)
		- [hasOverrides()](#State-hasOverrides)
		- [getOverrides()](#State-getOverrides)
		- [start()](#State-start)
		- [stop()](#State-stop)
		- [destroy()](#State-destroy)
- [StateManager](#StateManager)
	- [constructor([options])](#constructor)
	- [properties](#properties)
	- [methods](#methods)
		- [add(stateOrOptions[, addOptions])](#add)
		- [get(id)](#get)
		- [set(stateId, value[, where])](#set)
		- [setTarget(stateId, target[, dontStart])](#setTarget)
		- [hasOverrides(stateId)](#hasOverrides)
		- [getOverrides(stateId)](#getOverrides)
		- [start()](#start)
		- [start(stateId)](#start-stateId)
		- [stop()](#stop)
		- [stop(stateId)](#stop-stateId)
		- [remove()](#remove)
		- [remove(stateId[, options])](#remove-stateId)
- [Hooks](#hooks)
	- [StateHooks](#StateHooks)
	- [ManagerHooks](#ManagerHooks)
- [StateManagerOptions](#StateManagerOptions)
- [AddOptions](#AddOptions)
- [RemoveOptions](#RemoveOptions)
- [StateOptions](#StateOptions)
- [SourceOptions](#SourceOptions)
	- [SourceCtx](#SourceCtx)
- [Presets](#presets)
	- [viewport([options])](#viewport)
	- [workspace([options])](#workspace)
	- [hover([options])](#hover)
	- [colorScheme([options])](#colorScheme)
	- [orientation([options])](#orientation)
- [ViewportOptions](#ViewportOptions)
- [WorkspaceOptions](#WorkspaceOptions)
- [MediaPresetOptions](#MediaPresetOptions)
- [Types](#types)
	- [SourceCtx\<T\>](#SourceCtxT)
	- [StateOverrides](#StateOverrides)
	- [StateSetOptions](#StateSetOptions)
	- [StateSetWhere](#StateSetWhere)

<a id="State"></a>

# State

```js
import { State, viewport } from 'tabu-client-state'

const vp = new State(viewport())
vp.start()
vp.value // 'lg' — also <html data-vp="lg">
```

One state. It writes one token as an HTML attribute. Use it alone, or pass the instance to a [`StateManager`](#StateManager).

After [`destroy`](#State-destroy), every method that runs the state throws `state ${id} destroyed and can not be used`.

<a id="State-constructor"></a>

## constructor(options)

Creates a stopped state. Does not write the attribute. Captures [`attrOriginValue`](#State-properties) from `attrTarget` at this moment.

### parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `options` | [`StateOptions`](#StateOptions) | yes | `id` is required. `undefined`, `null`, and `''` throw `missing state id` |

**Returns**

[`State`](#State)

<a id="State-properties"></a>

## properties

| Name | Type | Description |
| --- | --- | --- |
| `id` | `string` | Storage key. `String` of the constructor `id` |
| `attrName` | `string` | HTML attribute. Default: `id` |
| `attrTarget` | `{ getAttribute, setAttribute?, removeAttribute? }` | Node that receives the attribute. Default: `document.documentElement` |
| `attrOriginValue` | `string \| null` | Attribute as it was at construct time. [`destroy`](#State-destroy) writes it back |
| `value` | `unknown` | Live JS value. `undefined` until the first [`start`](#State-start) or [`set`](#State-set). Assignment is [`set`](#State-set)`(newValue)` — memory layer |
| `isStarted` | `boolean` | `true` after [`start`](#State-start). `false` after [`stop`](#State-stop). Unset before the first start |
| `isDestroyed` | `boolean` | `true` after [`destroy`](#State-destroy) |

`state.value` is the JS value, not the attribute string. For a media preset that value is boolean (`true` → `data-hover="yes"`).

<a id="State-methods"></a>

## methods

[set](#State-set), [setTarget](#State-setTarget), [hasOverrides](#State-hasOverrides), [getOverrides](#State-getOverrides), [start](#State-start), [stop](#State-stop), [destroy](#State-destroy)

<a id="State-set"></a>

### [⬆️](#State-methods) set(value[, where])

Writes or clears override layers. Detect pauses while any layer is set. Read order: memory → session → local → live `value()`. The published value is the highest remaining layer, not the argument you just wrote.

Omitted `where` is memory. `true` / `'session'` is session. `false` / `'local'` is local. An object `{ memory, session, local }` names any combination. `undefined` clears the named layers — it is not a write of `undefined` into the value. Clear every layer to restore the live function, the constant, or `undefined` for `{ id }`.

A persisted value is stored as JSON and comes back as the same JS value. A raw string that is not JSON is warned about and used as the stored value. A write that cannot persist (quota, missing API, a value JSON cannot serialize) is logged. If every storage you asked for failed, the value is kept in memory for this runtime. Clearing a layer does not fall back. Value, attribute, and [`change`](#StateHooks): [README table](README.md#value-attribute-change).

**Parameters**

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `value` | `unknown` | yes | JS value to pin. `undefined` clears the named layers |
| `where` | [`StateSetWhere`](#StateSetWhere) | no | Omitted — memory. `false` / `'local'` — `localStorage`. `true` / `'session'` — `sessionStorage`. Object — any mix |

**Returns**

`void`

<a id="State-setTarget"></a>

### [⬆️](#State-methods) setTarget(target[, dontStart])

Stops the state, sets a new source target, rebuilds the source. Starts again unless `dontStart` is true.

**Parameters**

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `target` | `unknown \| (() => unknown)` | yes | New `ctx.target`. A function is called when the source is set up |
| `dontStart` | `boolean` | no | Leave the state stopped after the rebuild |

**Returns**

`void`

<a id="State-hasOverrides"></a>

### [⬆️](#State-methods) hasOverrides()

`true` if any override layer is set.

**Returns**

`boolean`

<a id="State-getOverrides"></a>

### [⬆️](#State-methods) getOverrides()

Which layers are set. Omitted when none are.

**Returns**

[`StateOverrides`](#StateOverrides) `| undefined`

<a id="State-start"></a>

### [⬆️](#State-methods) start()

Starts the state. Writes the attribute. A second start is a no-op. On start (after `bind`): memory, then session, then local, then the live function or constant.

**Returns**

`void`

<a id="State-stop"></a>

### [⬆️](#State-methods) stop()

Stops listeners. The attribute stays. A stop when not started is a no-op.

**Returns**

`void`

<a id="State-destroy"></a>

### [⬆️](#State-methods) destroy()

Stops the state and restores [`attrOriginValue`](#State-properties). Storage is not cleared. A second destroy is a no-op.

**Returns**

`void`


<small><a href="#content">to content</a></small>

<a id="StateManager"></a>

# StateManager

```js
import { StateManager, viewport } from 'tabu-client-state'

const cs = new StateManager({
	states: [viewport()],
})
cs.start()
cs.values.vp // 'lg'
```

An orchestrator of states and overrides. It is not a started or stopped entity. [`start`](#start) / [`stop`](#stop) talk to states. [`autoStartStates`](#properties) decides whether [`add`](#add) starts a new state — [`start`](#start)`()` does not flip that flag.

Most methods take a state id or a [`State`](#State) instance. [`get`](#get) is the exception: id only.

<a id="constructor"></a>

## constructor([options])

Creates a manager and registers states from `options`. Starts them only when [`autoStartStates`](#properties) is true.

### parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `options` | [`StateManagerOptions`](#StateManagerOptions) | no | Constructor argument. Omitted — an empty manager |

**Returns**

[`StateManager`](#StateManager)

<a id="properties"></a>

## properties

| Name | Type | Description |
| --- | --- | --- |
| `autoStartStates` | `boolean` | When `true`, [`add`](#add) starts the new state unless `dontStart` is set. Default: `false`. Writable. [`start`](#start)`()` does not change it |
| `values` | `Record<string, unknown>` | Live JS values. Keys are stringified ids. Assignment writes the memory layer |

`cs.values.vp` is the JS value, not the attribute string. For a media preset that value is boolean (`true` → `data-hover="yes"`).

| | |
| --- | --- |
| `cs.values.vp` | current value, or `undefined` if the id is missing |
| `'vp' in cs.values` | whether that state exists |
| `{ ...cs.values }` | snapshot of every current value |
| `cs.values.vp = 'xs'` | [`set('vp', 'xs')`](#set) — memory layer, beats session and local |
| `cs.values.vp = undefined` | clear memory only. If session or local remain, that winner is published. If none remain, one live default |

A missing id on assignment throws `unknown state ${id}`. Delete is a no-op.

<a id="methods"></a>

## methods

[add](#add), [get](#get), [set](#set), [setTarget](#setTarget), [hasOverrides](#hasOverrides), [getOverrides](#getOverrides), [start](#start), [stop](#stop), [remove](#remove)

A missing id: [`set`](#set) / [`setTarget`](#setTarget) throw `unknown state ${id}`. [`hasOverrides`](#hasOverrides) is `false`. [`getOverrides`](#getOverrides) is `undefined`. [`get`](#get) is `undefined`. [`start`](#start) / [`stop`](#stop) / [`remove`](#remove) are no-ops.

A [`State`](#State) instance that is not in the map: [`set`](#set) / [`setTarget`](#setTarget) / [`start`](#start) / [`stop`](#stop) / override queries run on that instance. [`remove`](#remove) only unlistens it — the occupant of that id is left alone.

<a id="add"></a>

### [⬆️](#methods) add(stateOrOptions[, addOptions])

Registers a state and returns it. Accepts [`StateOptions`](#StateOptions) or a ready [`State`](#State). A ready instance is taken as-is.

`id` is required. `undefined`, `null`, and `''` throw `missing state id`.

The same instance already in that slot is a no-op: the instance is returned, hooks are not fired again.

A different occupant with the same id throws unless `replace` is true. `replace` without `detach: true` [destroys](#State-destroy) the old state. `replace` with `detach: true` [stops](#State-stop) it, drops it from the map, and fires [`detach`](#ManagerHooks).

When [`autoStartStates`](#properties) is true and `dontStart` is not set, the new state is started.

**Parameters**

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `stateOrOptions` | [`State`](#State) \| [`StateOptions`](#StateOptions) | yes | Ready instance, or options to build one |
| `addOptions` | [`AddOptions`](#AddOptions) | no | `replace`, `dontStart`, `detach` |

**Returns**

[`State`](#State)

<a id="get"></a>

### [⬆️](#methods) get(id)

The state in that slot. Id only — not a [`State`](#State) instance. A missing id is `undefined`.

**Parameters**

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | `string \| number \| symbol` | yes | Slot key. Looked up as `String(id)` |

**Returns**

[`State`](#State) `| undefined`

<a id="set"></a>

### [⬆️](#methods) set(stateId, value[, where])

[`State.set`](#State-set) on that state. A missing id throws `unknown state ${id}`.

**Parameters**

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `stateId` | `any \| `[`State`](#State) | yes | Id or instance |
| `value` | `unknown` | yes | JS value to pin. `undefined` clears the named layers |
| `where` | [`StateSetWhere`](#StateSetWhere) | no | Same as [`State.set`](#State-set) |

**Returns**

`void`

<a id="setTarget"></a>

### [⬆️](#methods) setTarget(stateId, target[, dontStart])

[`State.setTarget`](#State-setTarget) on that state. A missing id throws `unknown state ${id}`.

**Parameters**

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `stateId` | `any \| `[`State`](#State) | yes | Id or instance |
| `target` | `unknown \| (() => unknown)` | yes | New `ctx.target`. A function is called when the source is set up |
| `dontStart` | `boolean` | no | Leave the state stopped after the rebuild |

**Returns**

`void`

<a id="hasOverrides"></a>

### [⬆️](#methods) hasOverrides(stateId)

[`State.hasOverrides`](#State-hasOverrides) on that state. A missing id is `false`.

**Parameters**

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `stateId` | `any \| `[`State`](#State) | yes | Id or instance |

**Returns**

`boolean`

<a id="getOverrides"></a>

### [⬆️](#methods) getOverrides(stateId)

[`State.getOverrides`](#State-getOverrides) on that state. A missing id is `undefined`.

**Parameters**

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `stateId` | `any \| `[`State`](#State) | yes | Id or instance |

**Returns**

[`StateOverrides`](#StateOverrides) `| undefined`

<a id="start"></a>

### [⬆️](#methods) start()

Starts every registered state.

**Returns**

`void`

<a id="start-stateId"></a>

### [⬆️](#methods) start(stateId)

Starts that state. A missing id is ignored.

**Parameters**

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `stateId` | `string \| number \| symbol \| `[`State`](#State) | yes | Id or instance |

**Returns**

`void`

<a id="stop"></a>

### [⬆️](#methods) stop()

Stops every registered state. Listeners stop; attributes stay.

**Returns**

`void`

<a id="stop-stateId"></a>

### [⬆️](#methods) stop(stateId)

Stops that state. A missing id is ignored.

**Parameters**

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `stateId` | `string \| number \| symbol \| `[`State`](#State) | yes | Id or instance |

**Returns**

`void`

<a id="remove"></a>

### [⬆️](#methods) remove()

Destroys every registered state.

**Returns**

`void`

<a id="remove-stateId"></a>

### [⬆️](#methods) remove(stateId[, options])

Drops that state from the map. Default: [`destroy`](#State-destroy) — stop and restore the original attribute. Storage is not cleared. `{ detach: true }`: [stop](#State-stop), unhook, leave the instance alive, fire [`detach`](#ManagerHooks).

A missing id is ignored. An instance that is not the occupant of its id is unhooked only — the occupant is not touched.

**Parameters**

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `stateId` | `any \| `[`State`](#State) | yes | Id or instance |
| `options` | [`RemoveOptions`](#RemoveOptions) | no | `detach: true` — unhook instead of destroy |

**Returns**

`void`


<small><a href="#content">to content</a></small>

<a id="hooks"></a>

# Hooks

Optional slots. The package is not an event bus. Omit `hooks` and CSS still works.

Need only a value flip — [`change`](#StateHooks), or [`all`](#StateHooks) and look at the name. Need `on` / `off` / `once` — put manager [`all`](#ManagerHooks) on the bus you already have.

```js
const cs = new StateManager({
	hooks: {
		all(hook, state, ...args) {
			events.emit(hook, state, ...args)
		},
	},
	stateOptions: {
		hooks: {
			change(value) {
				console.log(this.id, value)
			},
		},
	},
})
```

A named hook runs, then `all`. On a managed state the manager wire runs after that. [`StateHooks`](#StateHooks) named slots: `this` is the state, no `id` argument, empty or `value`. [`StateHooks`](#StateHooks)`all` and every [`ManagerHooks`](#ManagerHooks) slot: `(hook, state, ...args)`, `this` is the state or the manager. State names reach the manager with a prefix (`state:change`, `before:state:start`).

[`before:add`](#ManagerHooks) is `(hook, stateOptions, addOptions)` — the incoming bag or instance, not necessarily a built [`State`](#State).

[`hooks`](#StateOptions) on [`add`](#add) replaces the whole bag from [`stateOptions`](#StateManagerOptions). Names are not merged. A ready [`State`](#State) keeps the hooks it was built with.

When [`change`](#StateHooks) fires — [README table](README.md#value-attribute-change). `start` receives `(value)`. `before*` is a notice, not a veto.

A throw in a hook you passed stops the call and the method that invoked it. The library does not catch it. If you need a callback to isolate its own errors, wrap it yourself — for example with `tabu-js-res`.

One slot per name. A second `change` on the same bag replaces the first. Many listeners belong on the bus behind `all`.

[StateHooks](#StateHooks), [ManagerHooks](#ManagerHooks)

<a id="StateHooks"></a>

# [⬆️](#hooks) StateHooks

`hooks` on [`StateOptions`](#StateOptions) and on `stateOptions`. `this` is the state.

| Name | Type | Description |
| --- | --- | --- |
| `all` | `(hook: `[`StateHookName`](#StateHookName)`, state: `[`State`](#State)`, value?: unknown) => void` | Every state hook. First argument is the colon name |
| `beforeStart` | `() => void` | Before start work. Not a veto |
| `start` | `(value: unknown) => void` | After start |
| `beforeStop` | `() => void` | Before stop |
| `stop` | `() => void` | After stop |
| `beforeDestroy` | `() => void` | Before destroy |
| `destroy` | `() => void` | After destroy |
| `change` | `(value: unknown) => void` | Started state, new JS value different from the current one |

<a id="ManagerHooks"></a>

# [⬆️](#hooks) ManagerHooks

`hooks` on [`StateManagerOptions`](#StateManagerOptions). `this` is the manager. State names are prefixed with `state:` (`before:start` → `before:state:start`). Every slot is `(hook, …)`.

| Name | Type | Description |
| --- | --- | --- |
| `all` | `(hook: `[`ManagerHookName`](#ManagerHookName)`, ...args) => void` | Every manager hook. First argument is the colon name |
| `beforeAdd` | `(hook: 'before:add', stateOptions: `[`State`](#State)` \| `[`StateOptions`](#StateOptions)`, addOptions?: `[`AddOptions`](#AddOptions)`) => void` | Before [`add`](#add). The incoming bag or instance |
| `add` | `(hook: 'add', state: `[`State`](#State)`) => void` | After the state is registered |
| `beforeDetach` | `(hook: 'before:detach', state: `[`State`](#State)`) => void` | Before a detach ([`remove`](#remove-stateId) / replace with `detach: true`) |
| `detach` | `(hook: 'detach', state: `[`State`](#State)`) => void` | After detach. The instance is alive and unhooked |
| `beforeStateStart` | `(hook: 'before:state:start', state: `[`State`](#State)`) => void` | State `before:start` |
| `stateStart` | `(hook: 'state:start', state: `[`State`](#State)`, value: unknown) => void` | State `start` |
| `beforeStateStop` | `(hook: 'before:state:stop', state: `[`State`](#State)`) => void` | State `before:stop` |
| `stateStop` | `(hook: 'state:stop', state: `[`State`](#State)`) => void` | State `stop` |
| `beforeStateDestroy` | `(hook: 'before:state:destroy', state: `[`State`](#State)`) => void` | State `before:destroy` |
| `stateDestroy` | `(hook: 'state:destroy', state: `[`State`](#State)`) => void` | State `destroy`. The manager then drops the slot |
| `stateChange` | `(hook: 'state:change', state: `[`State`](#State)`, value: unknown) => void` | State `change` |


<small><a href="#content">to content</a></small>

<a id="StateManagerOptions"></a>

# StateManagerOptions

```js
new StateManager({
	attrTarget: document.body,
})
```

Constructor argument of [`StateManager`](#StateManager).

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `states` | [`State`](#State)`[] \| `[`StateOptions`](#StateOptions)`[] \| Record<string, `[`State`](#State)` \| (Omit<`[`StateOptions`](#StateOptions)`, 'id'> & { id?: any })>` | no | List, or a map whose key is a fallback `id` for an options bag. A ready [`State`](#State) is taken as-is — an object key does not rewrite `state.id`. Each entry goes to [`add`](#add) |
| `attrTarget` | `Element` | no | DOM element for attributes of states this manager builds. Default: `document.documentElement`. A state may pass its own. A ready [`State`](#State) keeps the target it already has |
| `storageKeyPrefix` | `string` | no | Default prefix for states this manager builds. Default: `'tabu.clientstate.'`. A state may pass its own. A ready [`State`](#State) keeps the prefix it already has |
| `hooks` | [`ManagerHooks`](#ManagerHooks) | no | Manager slots. Omit them and nothing is called |
| `stateOptions` | `Omit<`[`StateOptions`](#StateOptions)`, 'id'>` | no | Defaults merged into every state this manager builds. A later [`hooks`](#StateOptions) object replaces this bag as a whole. Not applied to a ready [`State`](#State) |
| `autoStartStates` | `boolean` | no | Start constructor states and later [`add`](#add)s. Default: `false`. Only `true` turns it on |

<a id="AddOptions"></a>

# AddOptions

Second argument of [`add`](#add).

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `replace` | `boolean` | no | Allow replacing an occupant. Without it, a taken id throws |
| `detach` | `boolean` | no | With `replace`: unhook the old state instead of destroying it |
| `dontStart` | `boolean` | no | Do not start the new state, even when [`autoStartStates`](#properties) is true |

<a id="RemoveOptions"></a>

# RemoveOptions

Second argument of [`remove(stateId)`](#remove-stateId).

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `detach` | `boolean` | no | Unhook instead of destroy |


<small><a href="#content">to content</a></small>

<a id="StateOptions"></a>

# StateOptions

```js
new State({
	id: 'vp',
	attrName: 'data-vp',
	value: ({ target }) => target.innerWidth < 768 ? 'xs' : 'lg',
	source: {
		target: window,
		bind(ctx) {
			ctx.target.addEventListener('resize', ctx.callback)
		},
		unbind(ctx) {
			ctx.target.removeEventListener('resize', ctx.callback)
		},
	},
})
```

Argument of [`State`](#State) and of [`add`](#add). `id` is required except in a constructor map (the key is the fallback) and in `stateOptions`. A preset is a function that returns this object.

Three shapes: `{ id }` — manual, pin only; with no layers left, [`set`](#State-set)`(undefined)` goes to `undefined`. `{ id, value }` — manual with a default; `value` is a function or a constant. `{ id, value, source: { bind, unbind } }` — autodetect (`target` optional). `bind` and `unbind` are a pair: both omitted, or both functions. One without the other throws `bind must be a function` / `unbind must be a function`. Autodetect without a function `value` throws `value must be a function`.

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | `any` | yes | Storage key, `values` key. Stored as `String(id)`. `undefined`, `null`, and `''` throw `missing state id`. Required on [`State`](#State) and [`add`](#add) |
| `attrName` | `string` | no | HTML attribute. Default: the stringified `id`. No naming rules — any string. Not an HTML boolean attribute: always `name="value"`, or remove. Prefer `data-*` for custom names. Presets use a short `id` and `data-${id}` (or a literal like `data-color-scheme`). Override `id` and/or `attrName` |
| `attrTarget` | `Element` | no | DOM element that receives the attribute. Default: `document.documentElement`, or the manager’s `attrTarget` when the manager builds the state |
| `storageKeyPrefix` | `string` | no | Prepended to the storage key. Default: `'tabu.clientstate.'`, or the manager’s prefix when the manager builds the state |
| `value` | `((ctx: `[`SourceCtx`](#SourceCtx)`) => unknown) \| string \| boolean \| number` | no | JS value. Required as a function for autodetect. A function is called with the same [`SourceCtx`](#SourceCtx) the source built. A constant is the default: start publishes it, last-layer clear restores it. Omitted (`{ id }`) — no layers left goes to `undefined`. A return of `undefined` is a normal write — empty value, attribute removed if there is no [`attrValue`](#StateOptions) mapping. On start (after `bind`): memory, then session, then local, then this function or constant. Also on a source tick and when no override remains. Return a discrete token or a boolean — not `innerWidth` |
| `attrValue` | `(jsValue: unknown) => unknown` | no | Maps the JS value onto the attribute. Omitted, the JS value is written as-is. `undefined` and `null` remove the attribute. `''` writes `attr=""` |
| `source` | [`SourceOptions`](#SourceOptions) \| `() => `[`SourceOptions`](#SourceOptions) | no | When to run `value` again. [`bind` / `unbind`](#SourceOptions) are a pair; [`target`](#SourceOptions) is optional. A function is called once. Omitted: manual state |
| `hooks` | [`StateHooks`](#StateHooks) | no | Per-state slots. The object replaces `stateOptions.hooks` as a whole — names are not merged |


<small><a href="#content">to content</a></small>

<a id="source"></a>
<a id="SourceOptions"></a>

# SourceOptions

```js
{
	target: window,
	bind(ctx) {
		ctx.target.addEventListener('resize', ctx.callback)
	},
	unbind(ctx) {
		ctx.target.removeEventListener('resize', ctx.callback)
	},
}
```

When to run `value` again. `bind` and `unbind` are a pair: both omitted, or both functions. One without the other throws. `target` is optional.

`bind`, `unbind`, and `value` share one [`SourceCtx`](#SourceCtx). Before `bind` it already has `target` and `callback` (call it to re-run `value` and publish). `bind` may put more on it — `value` and `unbind` see those fields.

On [`start`](#State-start), `bind` runs. If any override layer is set, that winner is published and detect stays paused. Else `value` runs once. Later, the listener should call `ctx.callback()`. On [`stop`](#State-stop), `ctx.callback.cancel?.()` then `unbind`. The return of `bind` is ignored.

A function `target` is called when the source is set up ([`State`](#State) / [`add`](#add) / [`setTarget`](#State-setTarget)), not on `start`. [`setTarget`](#State-setTarget) replaces `target` and rebuilds the source.

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `target` | `T \| (() => T)` | no | Becomes `ctx.target`. A function is called; anything else is used as-is. `T` is inferred on [`State`](#State) / [`add`](#add) |
| `bind` | `(ctx: `[`SourceCtx`](#SourceCtx)`) => void` | pair | Attach the listener. Required together with `unbind` |
| `unbind` | `(ctx: `[`SourceCtx`](#SourceCtx)`) => void` | pair | Detach. Runs after `ctx.callback.cancel?.()`. Required together with `bind` |

Omitted `source` is a manual state. `{ id }` with no layers left goes to `undefined`. `{ id, value }` runs the function, or restores the constant, on start / when no override remains. If either listener is present, `bind`, `unbind`, and `value` must all be functions (`bind must be a function`, `unbind must be a function`, `value must be a function`).

<a id="ctx"></a>
<a id="SourceCtx"></a>

# SourceCtx

```js
value(ctx) {
	return ctx.target.innerWidth < 768 ? 'xs' : 'lg'
}
```

One object, shared by `bind`, `unbind`, and `value`.

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `callback` | `() => void` | yes | Re-run `value` and publish. Set before `bind`. `bind` may replace it. `stop` calls `cancel` on whatever function sits here, if that function has one |
| `target` | `T` (default `unknown`) | no | From `source.target`. Set before `bind`. On [`State`](#State) / [`add`](#add), `T` is inferred from that field — `window` makes `ctx.target.innerWidth` type-check. A function target is unwrapped. Without `source.target`, `unknown` |
| *(any other)* | `unknown` | no | Whatever `bind` stores: `observer`, `timerId`, … Still there for `value` and `unbind` |

On start with no override, and when no layer remains, `value` runs immediately — not through a wrapper you put on `ctx.callback`. Listener ticks use whatever sits on `ctx.callback` at that moment.


<small><a href="#content">to content</a></small>

<a id="presets"></a>

# Presets

```js
import {
	State,
	StateManager,
	viewport,
	workspace,
	hover,
	colorScheme,
	orientation,
} from 'tabu-client-state'

const cs = new StateManager({
	states: [viewport(), workspace(), hover(), colorScheme(), orientation()],
})
cs.start()

const vp = new State(viewport())
vp.start()
```

Each factory returns [`StateOptions`](#StateOptions) for [`State`](#State) or [`add`](#add). Omit options for the defaults. Pass only the knobs below; anything else — mutate the object they return, or skip the preset. They call browser APIs (`matchMedia`, `ResizeObserver`). A test environment stubs those — [README: Where it runs](README.md#where-it-runs).

| Preset | `id` | Attribute | JS value | Attribute tokens |
| --- | --- | --- | --- | --- |
| [`viewport`](#viewport) | `vp` | `data-vp` | size token | `xs` `<768`, `sm` `<900`, `md` `<1200`, `lg` `<1400`, `xl` |
| [`workspace`](#workspace) | `ws` | `data-ws` | size token | `xs` `<300`, `sm` `<450`, `md` `<600`, `lg` `<750`, `xl` |
| [`hover`](#hover) | `hover` | `data-hover` | boolean | `yes` / `no` |
| [`colorScheme`](#colorScheme) | `dark` | `data-color-scheme` | boolean | `dark` / `light` |
| [`orientation`](#orientation) | `portrait` | `data-orientation` | boolean | `portrait` / `landscape` |

Size and hover derive `attrName` as `data-${id}`. `colorScheme` and `orientation` set a literal attribute that is meant to differ from the id.

[viewport](#viewport), [workspace](#workspace), [hover](#hover), [colorScheme](#colorScheme), [orientation](#orientation)

<a id="viewport"></a>

# [⬆️](#presets) viewport([options])

```js
new State(viewport())
// or
cs.add(viewport())
```

Window width as a size token. Overlapping `min-width` queries; the token is the last match. Changes are coalesced on a microtask so several queries flipping together become one update.

No `limit`, no `target`. Reads `window.matchMedia`. A test environment without that API supplies a mock — the preset does not.

A bound is inclusive on the next token (`768` is `sm`, not `xs`). Custom `sizes` follow the same rule: first token is `all`, each later name is `(min-width: ${previousBound}px)`.

`value()` returns the token. The attribute is that token.

| Width | Token | Query |
| --- | --- | --- |
| `< 768` | `xs` | `all` |
| `≥ 768` | `sm` | `(min-width: 768px)` |
| `≥ 900` | `md` | `(min-width: 900px)` |
| `≥ 1200` | `lg` | `(min-width: 1200px)` |
| `≥ 1400` | `xl` | `(min-width: 1400px)` |

**Parameters**

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `options` | [`ViewportOptions`](#ViewportOptions) | no | Omit for the defaults |

**Returns**

[`StateOptions`](#StateOptions)

<a id="ViewportOptions"></a>

# ViewportOptions

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | `any` | no | Default: `'vp'` |
| `attrName` | `string` | no | Default: `data-${id}` |
| `sizes` | [`Threshold`](#Threshold)`[]` | no | Default: `xs <768`, `sm <900`, `md <1200`, `lg <1400`, `xl`. The last number (`1600`) is unused as an upper bound |


<small><a href="#content">to content</a></small>

<a id="workspace"></a>

# [⬆️](#presets) workspace([options])

```js
cs.add(workspace())
```

An element’s `clientWidth` as a size token, via `ResizeObserver`.

Without a target, `bind` is a no-op. `value()` maps `clientWidth` onto `sizes`: the first token whose bound is above the width, or the last token if the width reaches every bound. Without a node, `undefined`.

**Parameters**

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `options` | [`WorkspaceOptions`](#WorkspaceOptions) | no | Omit for the defaults |

**Returns**

[`StateOptions`](#StateOptions)

<a id="WorkspaceOptions"></a>

# WorkspaceOptions

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | `any` | no | Default: `'ws'` |
| `attrName` | `string` | no | Default: `data-${id}` |
| `sizes` | [`Threshold`](#Threshold)`[]` | no | Default: `xs <300`, `sm <450`, `md <600`, `lg <750`, `xl`. The last number (`900`) is unused as an upper bound |
| `limit` | [`LimitFn`](#LimitFn) | no | Wraps the observer callback, not the first `start()` sync |
| `target` | `unknown \| (() => unknown)` | no | Element to observe. Omit it and call [`setTarget`](#State-setTarget) later |


<small><a href="#content">to content</a></small>

<a id="hover"></a>

# [⬆️](#presets) hover([options])

```js
cs.add(hover())
```

`(hover: hover)` as a boolean — the primary pointing device, not “a mouse exists somewhere”.

Defaults: `id` `'hover'`, `attrName` `data-${id}`, `query` `'(hover: hover)'`, `true` / `false` `'yes'` / `'no'`. Override `id` and `attrName` follows, unless you pass `attrName`.

**Parameters**

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `options` | [`MediaPresetOptions`](#MediaPresetOptions) | no | Omit for the defaults |

**Returns**

[`StateOptions`](#StateOptions)


<small><a href="#content">to content</a></small>

<a id="colorScheme"></a>

# [⬆️](#presets) colorScheme([options])

```js
cs.add(colorScheme())
```

`prefers-color-scheme: dark` as a boolean.

Defaults: `id` `'dark'`, `attrName` `'data-color-scheme'` (a literal, not `data-${id}`), `query` `'(prefers-color-scheme: dark)'`, `true` / `false` `'dark'` / `'light'`. Overriding `id` does not change `attrName` unless you pass it.

**Parameters**

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `options` | [`MediaPresetOptions`](#MediaPresetOptions) | no | Omit for the defaults |

**Returns**

[`StateOptions`](#StateOptions)


<small><a href="#content">to content</a></small>

<a id="orientation"></a>

# [⬆️](#presets) orientation([options])

```js
cs.add(orientation())
```

`(orientation: portrait)` as a boolean.

Defaults: `id` `'portrait'`, `attrName` `'data-orientation'` (a literal, not `data-${id}`), `query` `'(orientation: portrait)'`, `true` / `false` `'portrait'` / `'landscape'`. Same `id` / `attrName` split as [`colorScheme`](#colorScheme).

**Parameters**

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `options` | [`MediaPresetOptions`](#MediaPresetOptions) | no | Omit for the defaults |

**Returns**

[`StateOptions`](#StateOptions)


<small><a href="#content">to content</a></small>

<a id="MediaPresetOptions"></a>

# MediaPresetOptions

```js
orientation({
	id: 'portrait',
	attrName: 'data-orientation',
})
```

Argument of [`hover`](#hover), [`colorScheme`](#colorScheme), and [`orientation`](#orientation). Every field is optional; omitted keys keep that factory’s defaults.

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | `any` | no | Storage key, `values` key |
| `attrName` | `string` | no | HTML attribute |
| `query` | `string` | no | Media query string |
| `true` | `string` | no | Written on the attribute when the JS value is `true` |
| `false` | `string` | no | Written on the attribute when the JS value is `false` |


<small><a href="#content">to content</a></small>

<a id="types"></a>

# Types

<a id="LimitFn"></a>

**LimitFn.** `(fn: () => void) => `[`LimitedFn`](#LimitedFn).

<a id="LimitedFn"></a>

**LimitedFn.** `(() => void) & { cancel?: () => void }`.

<a id="Threshold"></a>

**Threshold.** `[token: string, bound: number]`.

<a id="SourceCtxT"></a>

**SourceCtx\<T\>.** Shared by `bind` / `unbind` / `value`. Default `T = unknown` — `target` optional, as before. On [`State`](#State) / [`add`](#add), `T` is what `source.target` resolves to. [`setTarget`](#State-setTarget) does not change `T`. Constructor `states` stay `unknown`.

<a id="StateOverrides"></a>

**StateOverrides.** `{ memory: boolean, session: boolean, local: boolean }`. Return of `getOverrides()`. Omitted when no layer is set.

<a id="StateSetOptions"></a>

**StateSetOptions.** `{ memory?: boolean, session?: boolean, local?: boolean }`. Named layers for [`set`](#State-set). Empty object is treated as memory.

<a id="StateSetWhere"></a>

**StateSetWhere.** `boolean \| 'session' \| 'local' \| 'true' \| `[`StateSetOptions`](#StateSetOptions). Omitted — memory. `true` / `'session'` — session. `false` / `'local'` — local.

<a id="StateHookName"></a>

**StateHookName.** `'before:start' \| 'start' \| 'before:stop' \| 'stop' \| 'before:destroy' \| 'destroy' \| 'change'`.

<a id="ManagerHookName"></a>

**ManagerHookName.** `'before:add' \| 'add' \| 'before:detach' \| 'detach' \| 'before:state:start' \| 'state:start' \| 'before:state:stop' \| 'state:stop' \| 'before:state:destroy' \| 'state:destroy' \| 'state:change'`.

<a id="StateHookHost"></a>

**StateHookHost.** `{ id: string, value: unknown, isStarted?: boolean, isDestroyed?: boolean }`. `this` inside [`StateHooks`](#StateHooks).


<small><a href="#content">to content</a></small>
