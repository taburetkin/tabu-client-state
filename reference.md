# tabu-client-state

Reference for the public API. The tour is in [README.md](README.md).

The package exports [`StateManager`](#StateManager). You add states: `{ id, value, source }`. Named presets are factories for that object.

# content

- [StateManager](#StateManager)
	- [constructor([options])](#constructor)
	- [properties](#properties)
	- [methods](#methods)
		- [add(stateOptions[, dontStart])](#add)
		- [storeValue(stateId, value[, where])](#storeValue)
		- [setTarget(stateId, target[, dontStart])](#setTarget)
		- [start()](#start)
		- [start(startAllStates)](#start-startAllStates)
		- [start(stateId)](#start-stateId)
		- [stop()](#stop)
		- [stop(stopManager)](#stop-stopManager)
		- [stop(stateId)](#stop-stateId)
		- [remove()](#remove)
		- [remove(stateId)](#remove-stateId)
- [Hooks](#hooks)
	- [StateHooks](#StateHooks)
	- [ManagerHooks](#ManagerHooks)
- [StateManagerOptions](#StateManagerOptions)
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

<a id="StateManager"></a>

# StateManager

```js
import { StateManager } from 'tabu-client-state'

const cs = new StateManager()
```

<a id="constructor"></a>

## constructor([options])

Creates a manager and registers states from `options`. Does not start them.

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
| `isStarted` | `boolean` | True after any [`start`](#start). New [`add`](#add)s then start unless `dontStart` is set. [`stop`](#stop)`(false)` leaves this true. [`stop`](#stop)`()` turns it off |
| `values` | `Record<string, unknown>` | Live JS values. Keys are stringified ids. Assignment is a memory lock |

`cs.values.vp` is the JS value, not the attribute string. For a media preset that value is boolean (`true` → `data-hover="yes"`).

| | |
| --- | --- |
| `cs.values.vp` | current value, or `undefined` if the id is missing |
| `'vp' in cs.values` | whether that state exists |
| `{ ...cs.values }` | snapshot of every current value |
| `cs.values.vp = 'xs'` | [`storeValue('vp', 'xs')`](#storeValue) — memory lock, beats storage on the next [`start`](#start) |
| `cs.values.vp = undefined` | unlock, wipe storage, restore the default (function / constant / `undefined`) — one `change` if that differs from the pin |

A missing id on assignment throws `unknown state ${id}`. Delete is a no-op.

<a id="methods"></a>

## methods

[add](#add), [storeValue](#storeValue), [setTarget](#setTarget), [start](#start), [stop](#stop), [remove](#remove)

<a id="add"></a>

### [⬆️](#methods) add(stateOptions[, dontStart])

Registers a new state. If a state with the same id already exists, the existing one is destroyed. If the manager is started, the new state is started immediately.

**Parameters**

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `stateOptions` | [`StateOptions`](#StateOptions) | yes | State to register |
| `dontStart` | `boolean` | no | Do not start the new state |

**Returns**

`void`

<a id="storeValue"></a>

### [⬆️](#methods) storeValue(stateId, value[, where])

Locks a JS value on the state. Detect pauses until unlock. Omitted `where` is memory only: the slot is written, storage is not. `false` / `true` also write `localStorage` / `sessionStorage`. On [`start`](#start) a memory lock beats storage. `undefined` unlocks, clears both storage keys, and syncs the default once — the live function, the constant, or `undefined` for `{ id }`. It does not write `undefined` into the slot first. Slot, attribute, and [`change`](#StateHooks) for pin / unlock / start: [README table](README.md#slot-attribute-change). A persisted value is stored as JSON and comes back as the same JS value. If the raw string is not JSON, the library warns and treats it as missing (`undefined`) — start then falls through to live `value()`, unless a memory lock is already on.

**Parameters**

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `stateId` | `any` | yes | State to lock |
| `value` | `unknown` | yes | JS value to pin. `undefined` unlocks |
| `where` | `boolean` | no | Omitted — memory only. `false` — `localStorage`. `true` — `sessionStorage` |

**Returns**

`boolean` — `true` if the state exists, `false` otherwise.

<a id="setTarget"></a>

### [⬆️](#methods) setTarget(stateId, target[, dontStart])

Stops the state, sets a new source target, rebuilds the source. If the manager is started, the state is started again.

**Parameters**

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `stateId` | `any` | yes | State to retarget |
| `target` | `unknown \| (() => unknown)` | yes | New `ctx.target`. A function is called when the source is set up |
| `dontStart` | `boolean` | no | Leave the state stopped after the rebuild |

**Returns**

`boolean` — `true` if the state exists, `false` otherwise.

<a id="start"></a>

### [⬆️](#methods) start()

Starts the manager and every registered state. Same as `start(true)`.

**Returns**

`void`

<a id="start-startAllStates"></a>

### [⬆️](#methods) start(startAllStates)

Starts the manager. `true` also starts every state; `false` starts none. A boolean is never treated as an id.

**Parameters**

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `startAllStates` | `boolean` | yes | `true` — every state. `false` — manager only |

**Returns**

`void`

<a id="start-stateId"></a>

### [⬆️](#methods) start(stateId)

Starts the manager and that state. A missing id is ignored. A state named `true` is `start('true')`.

**Parameters**

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `stateId` | `any` | yes | State to start |

**Returns**

`void`

<a id="stop"></a>

### [⬆️](#methods) stop()

Stops every state, then the manager. Same as `stop(true)`.

**Returns**

`void`

<a id="stop-stopManager"></a>

### [⬆️](#methods) stop(stopManager)

Stops every state. `true` also turns the manager off; `false` leaves it on. A boolean is never treated as an id.

**Parameters**

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `stopManager` | `boolean` | yes | `true` — manager off. `false` — manager stays on |

**Returns**

`void`

<a id="stop-stateId"></a>

### [⬆️](#methods) stop(stateId)

Stops that state. The manager stays on. A missing id is ignored. A state named `true` is `stop('true')`. Listeners stop; the attribute stays.

**Parameters**

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `stateId` | `any` | yes | State to stop |

**Returns**

`void`

<a id="remove"></a>

### [⬆️](#methods) remove()

Destroys every state. The manager stays as it is.

**Returns**

`void`

<a id="remove-stateId"></a>

### [⬆️](#methods) remove(stateId)

Destroys that state: stops it and restores the original attribute. Storage is not cleared. A missing id is ignored.

**Parameters**

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `stateId` | `any` | yes | State to destroy |

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
		all(name, ...args) {
			events.emit(name, ...args)
		},
	},
	stateOptions: {
		hooks: {
			change(id, value) {
				console.log(id, value)
			},
		},
	},
})
```

A named hook runs, then `all`, then the manager wire. `this` is the state for [`StateHooks`](#StateHooks) and the manager for [`ManagerHooks`](#ManagerHooks). The manager never receives the state instance. State names reach the manager with a prefix (`state:change`, `before:state:start`).

[`hooks`](#StateOptions) on [`add`](#add) replaces the whole bag from [`stateOptions`](#StateManagerOptions). Names are not merged.

Overwrite [`proxyHooks`](#StateOptions) with `false` to turn the manager wire off — on `stateOptions` for every state, or on one `add`. Prefer `false`. A function in that slot is at your own risk: it is called as a method of the state.

When [`change`](#StateHooks) fires — [README table](README.md#slot-attribute-change). `start` receives `(id, value)`. `start:fail` fires when `bind` returns `false` and receives `id`. `before*` is a notice, not a veto.

A throw in a hook you passed stops the call and the method that invoked it. The library does not catch it. If you need a callback to isolate its own errors, wrap it yourself — for example with `tabu-js-res`.

One slot per name. A second `change` on the same bag replaces the first. Many listeners belong on the bus behind `all`.

[StateHooks](#StateHooks), [ManagerHooks](#ManagerHooks)

<a id="StateHooks"></a>

# [⬆️](#hooks) StateHooks

`hooks` on [`StateOptions`](#StateOptions) and on `stateOptions`.

| Name | Type | Description |
| --- | --- | --- |
| `all` | `(hook: `[`StateHookName`](#StateHookName)`, ...args) => void` | Every state hook. First argument is the colon name |
| `beforeStart` | `(id: string) => void` | Before start work. Not a veto |
| `start` | `(id: string, value: unknown) => void` | After a successful start |
| `startFail` | `(id: string) => void` | `bind` returned `false` |
| `beforeStop` | `(id: string) => void` | Before stop |
| `stop` | `(id: string) => void` | After stop |
| `beforeDestroy` | `(id: string) => void` | Before destroy |
| `destroy` | `(id: string) => void` | After destroy |
| `change` | `(id: string, value: unknown) => void` | Started state, new JS value different from the current one |

<a id="ManagerHooks"></a>

# [⬆️](#hooks) ManagerHooks

`hooks` on [`StateManagerOptions`](#StateManagerOptions). State names are prefixed with `state:` (`before:start` → `before:state:start`).

| Name | Type | Description |
| --- | --- | --- |
| `all` | `(hook: `[`ManagerHookName`](#ManagerHookName)`, ...args) => void` | Every manager hook. First argument is the colon name |
| `beforeAdd` | `(stateOptions: `[`StateOptions`](#StateOptions)`, dontStart?: boolean) => void` | Before [`add`](#add). `dontStart` is the argument as passed |
| `add` | `(id: string) => void` | After the state is registered |
| `beforeStateStart` | `(id: string) => void` | State `before:start` |
| `stateStart` | `(id: string, value: unknown) => void` | State `start` |
| `stateStartFail` | `(id: string) => void` | State `start:fail` |
| `beforeStateStop` | `(id: string) => void` | State `before:stop` |
| `stateStop` | `(id: string) => void` | State `stop` |
| `beforeStateDestroy` | `(id: string) => void` | State `before:destroy` |
| `stateDestroy` | `(id: string) => void` | State `destroy` |
| `stateChange` | `(id: string, value: unknown) => void` | State `change` |


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
| `states` | [`StateOptions`](#StateOptions)`[]` \| `Record<string, Omit<`[`StateOptions`](#StateOptions)`, 'id'> & { id?: any }>` | no | List of state objects, or a map whose key is a fallback `id`. Registered stopped. Array items go to [`add`](#add) with `dontStart`. Map entries do the same after `{ id: key }` is merged under the object — an `id` already on the object wins |
| `attrTarget` | `Element` | no | DOM element for attributes. Default: `document.documentElement`. A state may pass its own |
| `storageKeyPrefix` | `string` | no | Prepended to every storage key. Default: `'tabu.clientstate.'` |
| `hooks` | [`ManagerHooks`](#ManagerHooks) | no | Manager slots. Omit them and nothing is called |
| `stateOptions` | `Omit<`[`StateOptions`](#StateOptions)`, 'id'>` | no | Defaults merged into every state. A later [`hooks`](#StateOptions) object replaces this bag as a whole. [`proxyHooks`](#StateOptions)`: false` here turns the manager wire off for every state |


<small><a href="#content">to content</a></small>

<a id="StateOptions"></a>

# StateOptions

```js
cs.add({
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

Argument of [`add`](#add). `id` is required except in a constructor map (the key is the fallback) and in `stateOptions`. A preset is a function that returns this object.

Three shapes: `{ id }` — manual, pin only; [`storeValue`](#storeValue)`(id, undefined)` goes to `undefined`. `{ id, value }` — manual with a default; `value` is a function or a constant. `{ id, value, source: { bind, unbind } }` — autodetect (`target` optional). `bind` and `unbind` are a pair: both omitted, or both functions. One without the other throws `bind must be a function` / `unbind must be a function`. Autodetect without a function `value` throws `value must be a function`.

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | `any` | yes | Storage key, `values` key. Stored as `String(id)`. `undefined` and `''` throw `missing state id`. Required on [`add`](#add) |
| `attrName` | `string` | no | HTML attribute. Default: the stringified `id`. No naming rules — any string. Not an HTML boolean attribute: always `name="value"`, or remove. Prefer `data-*` for custom names. Presets use a short `id` and `data-${id}` (or a literal like `data-color-scheme`). Override `id` and/or `attrName` |
| `attrTarget` | `Element` | no | DOM element that receives the attribute. Default: the manager’s `attrTarget` |
| `value` | `((ctx: `[`SourceCtx`](#SourceCtx)`) => unknown) \| string \| boolean \| number` | no | JS value. Required as a function for autodetect. A function is called with the same [`SourceCtx`](#SourceCtx) the source built. A constant is the default: start publishes it, [`storeValue`](#storeValue)`(id, undefined)` restores it. Omitted (`{ id }`) — unlock goes to `undefined`. A return of `undefined` is a normal write — empty slot, attribute removed if there is no [`attrValue`](#StateOptions) mapping. On start (after `bind`): memory lock, then session, then local, then this function or constant. A memory pin beats storage. A stored value locks the state only if it is not already locked in memory. Also on a source tick and after unlock. Return a discrete token or a boolean — not `innerWidth` |
| `attrValue` | `(jsValue: unknown) => unknown` | no | Maps the JS value onto the attribute. Omitted, the JS value is written as-is. `undefined` and `null` remove the attribute. `''` writes `attr=""` |
| `source` | [`SourceOptions`](#SourceOptions) \| `() => `[`SourceOptions`](#SourceOptions) | no | When to run `value` again. [`bind` / `unbind`](#SourceOptions) are a pair; [`target`](#SourceOptions) is optional. A function is called once. Omitted: manual state |
| `hooks` | [`StateHooks`](#StateHooks) | no | Per-state slots. The object replaces `stateOptions.hooks` as a whole — names are not merged |
| `proxyHooks` | [`StateProxyHooks`](#StateProxyHooks) | no | Manager wire. Omit it and state hooks also reach the manager under a `state:` prefix. `false` turns that off. A function is at your own risk |


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

On [`start`](#start), `bind` runs. If the state is already locked in memory, that slot is published and detect stays paused. Else a stored override is published and the state locks. Else `value` runs once. Later, the listener should call `ctx.callback()`. On [`stop`](#stop), `ctx.callback.cancel?.()` then `unbind`. `bind` returning `false` aborts start: no attribute, `unbind` is not called.

A function `target` is called when the source is set up ([`add`](#add) / [`setTarget`](#setTarget)), not on `start`. [`setTarget`](#setTarget) replaces `target` and rebuilds the source.

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `target` | `unknown \| (() => unknown)` | no | Becomes `ctx.target`. A function is called; anything else is used as-is |
| `bind` | `(ctx: `[`SourceCtx`](#SourceCtx)`) => unknown` | pair | Attach the listener. Return `false` to abort start. Required together with `unbind` |
| `unbind` | `(ctx: `[`SourceCtx`](#SourceCtx)`) => void` | pair | Detach. Runs after `ctx.callback.cancel?.()`. Required together with `bind` |

Omitted `source` is a manual state. `{ id }` unlocks to `undefined`. `{ id, value }` runs the function, or restores the constant, on start / unlock. If either listener is present, `bind`, `unbind`, and `value` must all be functions (`bind must be a function`, `unbind must be a function`, `value must be a function`).

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
| `target` | `unknown` | no | From `source.target`. Set before `bind` |
| *(any other)* | `unknown` | no | Whatever `bind` stores: `observer`, `timerId`, … Still there for `value` and `unbind` |

On start without a lock, and on unlock, `value` runs immediately — not through a wrapper you put on `ctx.callback`. Listener ticks use whatever sits on `ctx.callback` at that moment.


<small><a href="#content">to content</a></small>

<a id="presets"></a>

# Presets

```js
import {
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
```

Each factory returns [`StateOptions`](#StateOptions) for [`add`](#add). Omit options for the defaults. Pass only the knobs below; anything else — mutate the object they return, or skip the preset.

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
cs.add(viewport())
```

Window width as a size token. Overlapping `min-width` queries; the token is the last match. Changes are coalesced on a microtask so several queries flipping together become one update.

No `limit`, no `target`. Always reads `window.matchMedia`. Missing `matchMedia` → `value()` is `undefined` and `bind` returns `false`.

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

Without a target, `bind` returns `false`. `value()` maps `clientWidth` onto `sizes`: the first token whose bound is above the width, or the last token if the width reaches every bound. Without a node, `undefined`.

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
| `target` | `unknown \| (() => unknown)` | no | Element to observe. Omit it and call [`setTarget`](#setTarget) later |


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

<a id="StateHookName"></a>

**StateHookName.** `'before:start' \| 'start' \| 'start:fail' \| 'before:stop' \| 'stop' \| 'before:destroy' \| 'destroy' \| 'change'`.

<a id="ManagerHookName"></a>

**ManagerHookName.** `'before:add' \| 'add' \| 'before:state:start' \| 'state:start' \| 'state:start:fail' \| 'before:state:stop' \| 'state:stop' \| 'before:state:destroy' \| 'state:destroy' \| 'state:change'`.

<a id="StateHookHost"></a>

**StateHookHost.** `{ id: string, value: unknown, isStarted?: boolean, isDestroyed?: boolean }`. `this` inside [`StateHooks`](#StateHooks).

<a id="StateProxyHooks"></a>

**StateProxyHooks.** `false \| ((this: `[`StateHookHost`](#StateHookHost)`, hook: `[`StateHookName`](#StateHookName)`, ...args) => void)`. Manager wire on [`StateOptions`](#StateOptions). `false` turns it off. A function is at your own risk.


<small><a href="#content">to content</a></small>
