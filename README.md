# tabu-client-state

![dependencies](https://img.shields.io/badge/dependencies-none-2ea44f)
![tested](https://img.shields.io/badge/tested-node%3Atest%20%2B%20tsc-2ea44f)
![vanilla](https://img.shields.io/badge/vanilla-JavaScript-f7df1e?logo=javascript&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-declarations-3178c6?logo=typescript&logoColor=white)

This package is for **HTML applications**. Discrete tokens (`xs`, `dark`, `yes`) on a DOM node — CSS skips `@media`, the app reads the same states in JS. Anything else is at your own risk.

The library writes those tokens after the application starts.

## Minuses

**No first frame, no SSR.** That follows from what this package is for. An HTML application starts, then this library writes the tokens. The first HTML frame is not its job. A site, a landing, SSR — you already accepted the risk.

**No built-in throttle or debounce.** Those helpers already live in every app. Shipping another pair would be a second wheel. Pass the limiter the application already uses.

**No HTML boolean attributes.** CSS does not key off presence-only flags as cleanly as off `name="value"`. A token on the attribute is what this product writes. `<html hidden>` is the wrong shape for that, and it is not needed here.

**A throw in a hook is not caught.** The error stops the call. That surfaces in tests. Swallowing it would hide a broken hook and leave you staring at the wrong attribute.

## Contents

- [Reference](https://github.com/taburetkin/tabu-client-state/blob/master/reference.md)
- [Minuses](#minuses)
- [Why](#why)
	- [What it is good at](#what-it-is-good-at)
	- [Why this beats `@media`](#why-this-beats-media)
	- [What it will not do](#what-it-will-not-do)
- [How to](#how-to)
	- [Install and import](#install-and-import)
	- [Where it runs](#where-it-runs)
	- [A state](#a-state)
	- [Value, attribute, change](#value-attribute-change)
	- [Source](#source)
	- [Limit](#limit)
	- [Read, pin, persist](#read-pin-persist)
	- [Hooks](#hooks)
	- [Presets](#presets)
	- [App wrapper](#app-wrapper)
	- [More CSS](#more-css)

## Why

You decide what to watch. A state is `{ id, value, source }`. `id` names it, `value` returns the token JS branches on, `source` says when to run it again. The runtime writes that token as an HTML attribute. Viewport, workspace, color scheme, hover, and orientation ship as presets if you do not want to write the object yourself — they are the same object `State` and `add` take.

```js
import { State, viewport } from 'tabu-client-state'

const vp = new State(viewport())
vp.start()
vp.value // 'lg' — also <html data-vp="lg">
```

Several states, one vitrine — a `StateManager`:

```js
import { StateManager, viewport, colorScheme } from 'tabu-client-state'

const cs = new StateManager({
	states: [viewport(), colorScheme()],
})
cs.start()
cs.values.vp   // 'lg'
cs.values.dark // true — <html data-vp="lg" data-color-scheme="dark">
```

```css
html[data-vp="xl"] .sidebar { display: block; }
html[data-vp="xs"] .sidebar { display: none; }
```

JS reads the value to pick a view, skip a subtree, change density. A size state stays a token; a media state can stay a boolean, with `attrValue` mapping it onto the attribute:

```js
if (cs.values.vp === 'xs') {
	renderMobileNav()
}

if (cs.values.dark) {
	useDarkTheme()
}
```

Detect is the default. The app can always pin a token and ignore the sensor — a phone can render as desktop, a light OS can stay dark.

```js
cs.values.vp = 'lg' // desktop layout on a narrow screen
```

The runtime watches the environment, picks a value, and writes an attribute on `<html>` — or any host you pass. The stylesheet selects on those attributes. `state.value` / `cs.values` is what the app branches on.

Instead of this:

```css
.sidebar { display: block; }

@media (max-width: 767px) {
	.sidebar { display: none; }
}

@media (prefers-color-scheme: dark) {
	:root {
		color-scheme: dark;
		background: #111;
		color: #eee;
	}
}
```

you write this. The stylesheet does not know how wide the window is.

```css
html[data-vp="lg"] .sidebar { display: block; }
html[data-vp="xs"] .sidebar { display: none; }

html[data-color-scheme="light"] {
	color-scheme: light;
	background: #fff;
	color: #111;
}

html[data-color-scheme="dark"] {
	color-scheme: dark;
	background: #111;
	color: #eee;
}
```

The runtime writes the attributes:

```html
<html data-vp="xs" data-color-scheme="dark">
```

This is not a reactive store, not a CSS framework, and not an event bus. A `State` writes nothing until `start()`. A manager tracks nothing until you give it states and start them.

Every public name, with signatures, is in the [reference](https://github.com/taburetkin/tabu-client-state/blob/master/reference.md).

### What it is good at

- One token, two readers: CSS keys off the attribute, JS keys off the value.
- Overrides are first-class. Pin in memory, or persist to `localStorage` / `sessionStorage`. Detect pauses while any layer is set.
- Tests pin `vp.value = 'xs'` or `cs.values.vp = 'xs'` and get the `xs` rules. The stylesheet does not need a resize.
- A state is a `State`. Presets are factories for the options it takes. Mutate what they return, or skip them.
- `hooks` are optional slots. `listen` / `unlisten` add observers without replacing a slot. Plug in the bus you already have. The library does not import one.
- ESM, adjacent `.d.ts`, zero runtime dependencies. Throttle and debounce are not in the package.

### Why this beats `@media`

The stylesheet keys off attributes. A test does not resize the window and hope layout catches up.

```js
cs.values.vp = 'xs'
cs.values.dark = true
```

```html
<html data-vp="xs" data-color-scheme="dark">
```

The `xs` + `dark` rules apply on a 1440px desktop window. A test pins the token and asserts layout. You do not resize the window to test the CSS. You still need a browser — or mocks of the APIs the presets you add actually call. See [Where it runs](#where-it-runs).

`@media (max-width: 767px)` and `prefers-color-scheme` are read-only. A person cannot say “compact layout on my ultrawide” or “dark, even if the OS is light”.

```js
cs.set('dark', true, false)   // persist dark
cs.values.vp = 'xs'           // compact, live detect paused
cs.values.dark = undefined    // back to detect
```

The CSS does not change. Persist theme and density; leave viewport live if pinning `lg` on a phone would break the layout. That choice is the app’s.

### What it will not do

- It is for HTML applications. A site, a landing, SSR, a store — at your own risk.
- It writes named tokens as HTML attributes. That is the product. It is not a store, a CSS framework, an event bus, a polyfill, or a test kit.
- It does not auto-start. `autoStartStates` is off unless you turn it on.
- It does not replace every media query (print, raw pointer capability — keep those if they are device facts, not user choices).
- It is not a place to stash measurements (`innerWidth`).
- It does not ship throttle / debounce, source factories, or token helpers. Five named presets; anything else is `{ id, value, source }`.
- It does not polyfill `matchMedia`, `ResizeObserver`, or storage. A test environment that lacks them supplies mocks.
- It does not clear storage for you.
- It does not own the first HTML frame. No SSR renderer, no attributes until `start()`. A page that must look finished before the application runs should keep `@media`. An HTML app starts, then this library writes the tokens.
- It does not catch errors from hooks you passed.
- It does not write HTML boolean attributes (presence-only). Always `name="value"`, or the attribute is removed.

## How to

### Install and import

```bash
npm install tabu-client-state
```

```js
import { State, StateManager, viewport } from 'tabu-client-state'
```

TypeScript uses adjacent `.d.ts` files. There is no compile step.

`State` is the unit. `StateManager` holds several and mirrors `set` / `setTarget` / overrides onto an id or a state. `listen` / `unlisten` add observers without replacing a hook slot. Named presets (`viewport`, `workspace`, `hover`, `colorScheme`, `orientation`) are optional factories for the same options object.

### Where it runs

A browser page. The library calls browser objects. It does not invent them, and it does not soften their absence.

Default `attrTarget` is `document.documentElement`. That node needs `getAttribute`, `setAttribute`, and `removeAttribute`.

Storage uses `localStorage` and `sessionStorage`. A missing or blocked API is swallowed. That is the only environment hole the library covers.

Named presets use these APIs. If you construct the preset, they must exist — a test runner stubs them.

| You use | Needs |
| --- | --- |
| `viewport` | `window.matchMedia` to read and bind (throws without it) |
| `hover`, `colorScheme`, `orientation` | `window.matchMedia` when the `State` is built |
| `workspace` | `ResizeObserver` when there is a target, and `clientWidth` on that node. No node — deaf, no observer |

A custom `bind` uses whatever you call.

The package is ESM. A page loads it with a bundler or `<script type="module">`. `require()` does not load it. The syntax floor is private fields (`#value`) plus `?.` and `??`.

### A state

Three shapes. Optional on all of them: `attrName`, `attrTarget`, `attrValue`, `hooks`, `storageKeyPrefix`.

| Shape | What it is | Required |
| --- | --- | --- |
| `{ id }` | Manual state. Only a pin. No layers left goes to `undefined` | `id` |
| `{ id, value }` | Manual with a default. `value` is a function or a constant | `id`, `value` |
| `{ id, value, source: { bind, unbind } }` | Autodetect. `target` is optional | `id`, `value`, `bind`, `unbind` |

If either `bind` or `unbind` is present, both must be functions, and `value` must be a function. Otherwise the runtime throws `bind must be a function`, `unbind must be a function`, or `value must be a function`. A manual state omits the pair. A function `value` runs on start and when no override remains (`value = undefined` / `values.id = undefined` only clears memory). A constant `value` is that default. `{ id }` with no layers left goes to `undefined`.

`new State(options)` **builds** a stopped state. It does not write the attribute. `start()` does. A manager constructor **registers** states the same way — still stopped, unless you set `autoStartStates: true`. `start()` on the manager starts every registered state; `start(id)` / `start(state)` starts one.

`id` names the state (`state.id`, `values[id]`, storage key). Required: anything except `null`, `undefined`, and `""`. The runtime stores `String(id)`.

`value` reads `ctx` and returns what JS should branch on — a token, a boolean, or `undefined` if detect found nothing. That return is a normal value write. `source` says when to run `value` again. `attrName` is the HTML attribute (`id` if omitted). `attrValue` maps the JS value onto that attribute. `attrTarget` is the node that receives it (`<html>` by default; a manager-built state takes the manager’s target). `undefined` and `null` from `attrValue` (or the JS value, if there is no mapping) remove the attribute; `''` writes `attr=""`.

The library does not restrict `attrName` — any string goes to `setAttribute`. It does not write HTML boolean attributes (`<html hidden>`): the attribute is always `name="value"`, or it is removed. A JS boolean without `attrValue` becomes `attr="true"` / `attr="false"`. Custom names should use the `data-` prefix. Presets do that: `id` is `vp` (`cs.values.vp`), `attrName` is `data-vp`. Pass `id` and/or `attrName` to override.

Values are discrete: size tokens (`'xs'`) or booleans. Putting `innerWidth` on the attribute so JS can `cs.values.width > 1000` is the antipattern this library exists to avoid.

```js
const vp = new State(viewport())
// or
cs.add(viewport())
```

`add` returns the `State`. `cs.get('vp')` is the same instance. `get` takes an id, not a state.

A media query. JS keeps a boolean; the attribute gets the token:

```js
cs.add(colorScheme())
cs.values.dark // true — <html data-color-scheme="dark">
```

An element that does not exist yet. Pass `target` on the preset or call `setTarget` when the node is there.

```js
cs.add(workspace())
cs.start()                    // started; no node yet, no token
cs.setTarget('ws', columnEl)  // observes, writes data-ws
```

The same attribute can sit on `<html>` and `<body>` — two states, one `attrName`:

```js
cs.add(viewport({ id: 'html.vp', attrName: 'vp' }))
cs.add({
	...viewport({ id: 'body.vp', attrName: 'vp' }),
	attrTarget: document.body,
})
```

```css
html[vp="xl"] .sidebar { display: block; }
body[vp="xs"] .drawer { display: none; }
```

`id` is the `values` key and the storage key. `attrName` is the HTML attribute (`id` if omitted). Default `viewport()`: `cs.values.vp`, attribute `data-vp`.

The manager is not a started entity. `start()` / `stop()` talk to states. `start()` does not turn `autoStartStates` on. `remove` is the dangerous one: default is `destroy` (restore the original attribute). `{ detach: true }` unhooks the instance and leaves it alive. Signatures are in the [reference](https://github.com/taburetkin/tabu-client-state/blob/master/reference.md#StateManager).

### Value, attribute, change

Pin is `state.value = x`, `state.set(x)`, `cs.values.id = x`, or `cs.set(id, x)`. `undefined` clears the layers you name — not a write of `undefined` into the value. If any layer remains, that winner is published. If none remain, one live `value()`. `change` only when the state is started and the new value differs.

| | Value | Attribute | `change` |
| --- | --- | --- | --- |
| construct / `add` without `start` | empty | — | no |
| `start`, live detect | `value()` | write | if ≠ |
| `start`, memory pin | keep pin | write | if ≠ |
| `start`, session / local hit | stored | write | if ≠ |
| pin, started | winner of the layers | write | if ≠ |
| pin, stopped | winner of the layers | write | no |
| `start` after that pin | keep winner | write | if ≠ |
| last layer cleared, started | live / constant / `undefined` | write | if ≠ |
| last layer cleared, stopped | live / constant / `undefined` | write | no |
| source tick, live | `value()` | write | if ≠ |
| source tick, any override | — | leave | no |
| `stop` | keep | leave | no |
| `destroy` / `remove` | gone | restore origin | no |
| `remove(..., { detach: true })` | keep | leave | no |

### Source

When to run `value` again on an autodetect state. `bind` and `unbind` come as a pair: both omitted (manual state), or both present as functions. One without the other throws. `target` is optional. Named presets fill those in.

```js
new State({
	id: 'vp',
	attrName: 'data-vp',
	value(ctx) {
		return ctx.target.innerWidth < 768 ? 'xs' : 'lg'
	},
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

`bind`, `unbind`, and `value` share one `ctx`. It already has `target` (from `source.target`) and `callback` (call it to re-run `value` and publish). `bind` may store more on it — `value` sees those fields.

On start, `bind` runs. If any override layer is set, that winner is published and detect stays paused. Else `value` runs once. The listener should call `ctx.callback()`. On stop, `ctx.callback.cancel?.()` then `unbind`. The return of `bind` is ignored.

A function `target` is called when the source is set up (`State` / `add` / `setTarget`), not on `start`.

Fields and `ctx` are in the [reference](https://github.com/taburetkin/tabu-client-state/blob/master/reference.md#SourceOptions).

### Limit

Need fewer ticks — wrap `ctx.callback` in `bind`. `stop` calls `callback.cancel()` if it exists. The wrapper is yours: throttle, debounce, rAF.

```js
function limit(fn) {
	let t
	const wrapped = () => {
		clearTimeout(t)
		t = setTimeout(fn, 100)
	}
	wrapped.cancel = () => clearTimeout(t)
	return wrapped
}

new State({
	id: 'vp',
	attrName: 'data-vp',
	value: ({ target }) => target.innerWidth < 768 ? 'xs' : 'lg',
	source: {
		target: () => window,
		bind(ctx) {
			ctx.callback = limit(ctx.callback)
			ctx.target.addEventListener('resize', ctx.callback)
		},
		unbind(ctx) {
			ctx.target.removeEventListener('resize', ctx.callback)
		},
	},
})
```

The wrapper is yours — not a package export. `workspace({ limit })` takes the same `(fn) => wrapped`. It covers listener ticks, not the first `start()` sync.

### Read, pin, persist

Three independent layers. Read order: **memory → session → local → live `value()`**. The published value is always the highest layer that is set.

`state.value = 'dark'` and `cs.values.theme = 'dark'` write memory only. `set(value, where)` picks the layers. Omitted `where` is memory. `true` / `'session'` is session. `false` / `'local'` is local. An object names any combination.

```js
cs.values.theme = 'dark'                                 // memory
cs.set('theme', 'dark')                                  // same
cs.set('theme', 'dark', false)                           // localStorage
cs.set('theme', 'night', true)                           // sessionStorage
cs.set('theme', 'dark', { memory: true, local: true })   // this runtime and every new one
cs.values.theme = undefined                              // clear memory only
cs.set('theme', undefined, { session: true })            // clear session; memory / local stay
cs.set('theme', undefined, { memory: true, session: true, local: true })
cs.set('hover', false, false)                            // stores boolean false; attribute stays "no"
```

A write that cannot persist (quota, missing API, a value JSON cannot serialize) is logged. If every storage you asked for failed, the value is kept in memory for this runtime. Clearing a layer does not fall back.

Key: `storageKeyPrefix + id` (default `tabu.clientstate.theme`). What you store is what you read: the JS value, as JSON. A token stays a string; `true` stays a boolean. Not the attribute string. A raw string that is not JSON is warned about and used as the stored value. Value, attribute, and `change` for pin / unlock / start: [the table](#value-attribute-change).

Unavailable storage is swallowed on probe. `destroy` / `remove` do **not** clear storage. A later state with the same `id` has no memory layer; on `start` it picks session, then local.

`{ ...cs.values }` copies a snapshot. An unknown id reads as `undefined`; assigning to one throws `unknown state`.

### Hooks

The package is not an event bus. `hooks` are optional slots. Skip them and CSS still works.

Need only a value flip — `hooks.change`, or `hooks.all` and look at the name. Need many observers without replacing that slot — `listen` / `unlisten`. Need `on` / `off` / `once` — put manager `all` or `listen` on the bus you already have. The library does not import one.

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

A named slot runs, then `all`, then `listen` observers, then the manager wire. Named state slots: `this` is the state, no `id` argument — `change(value)`, `start(value)`, the rest empty. State `all`, `listen`, and every manager slot: `(hook, state, ...args)`. Manager `this` is the manager. Manager names are prefixed: `state:change`, `before:state:start`.

`listen` / `unlisten` are utilities, not methods on `State`. They do not replace `hooks`. The same function is stored once. A non-function is ignored.

```js
import { listen, unlisten } from 'tabu-client-state'

function onStoreChange(hook) {
	if (hook === 'change') rerender()
}

listen(cs.get('vp'), onStoreChange)
unlisten(cs.get('vp'), onStoreChange)
```

`hooks` on `add` replaces the whole bag from `stateOptions`. Names are not merged. Put every slot you still want on that object. A ready `State` keeps the hooks it was built with.

`before*` is a notice, not a veto. When `change` fires — [the table](#value-attribute-change).

A throw in a hook you passed stops the call and the method that invoked it. The library does not catch it. If you need a callback to isolate its own errors, wrap it yourself — for example with `tabu-js-res`.

### Presets

Factories for the same object `State` and `add` take. Skip them and write the object; or start from a preset and mutate what it returns.

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

| Preset | `id` | Attribute | JS value | Attribute tokens |
| --- | --- | --- | --- | --- |
| `viewport` | `vp` | `data-vp` | size token | `xs` `<768`, `sm` `<900`, `md` `<1200`, `lg` `<1400`, `xl` — window, `matchMedia` ranges |
| `workspace` | `ws` | `data-ws` | size token | `xs` `<300`, `sm` `<450`, `md` `<600`, `lg` `<750`, `xl` — element `clientWidth`. Pass `target`, or `setTarget` later |
| `hover` | `hover` | `data-hover` | boolean | `yes` / `no` from `(hover: hover)` |
| `colorScheme` | `dark` | `data-color-scheme` | boolean | `dark` / `light` from `prefers-color-scheme` |
| `orientation` | `portrait` | `data-orientation` | boolean | `portrait` / `landscape` from `(orientation: portrait)` |

Each pair on a size list is “this token while width is below that bound”. The next token starts at that exact number (`value < 1400` → `lg`, `value >= 1400` → `xl`). The last number (`1600` / `900`) is unused as an upper bound.

Default viewport sizes become overlapping `min-width` queries. The token is the last match — the bound itself, never `bound - 1`.

| Width | Token | Media query |
| --- | --- | --- |
| `< 768` | `xs` | `all` |
| `≥ 768` | `sm` | `(min-width: 768px)` |
| `≥ 900` | `md` | `(min-width: 900px)` |
| `≥ 1200` | `lg` | `(min-width: 1200px)` |
| `≥ 1400` | `xl` | `(min-width: 1400px)` |

Factories take the knobs a developer actually changes: `viewport({ id, attrName, sizes })`, `workspace({ id, attrName, sizes, limit, target })`, media presets `{ id, attrName, query, true, false }`. The JS value of a media preset is always boolean. `true` / `false` are the strings written on the attribute.

`colorScheme` writes `data-color-scheme` on purpose (id is `dark`). `orientation` writes `data-orientation` (id is `portrait`). Size and hover derive `data-${id}`. That split is a convention, not a lock: `viewport({ id: 'screen', attrName: 'data-screen' })`, or `attrName: 'vp'`, is yours.

### App wrapper

Domain lives in the subclass. Runtime stays in the base.

```js
import {
	StateManager,
	viewport,
	workspace,
	hover,
	colorScheme,
	orientation,
} from 'tabu-client-state'

export class AppStateManager extends StateManager {
	constructor() {
		super({
			states: [viewport(), workspace(), hover(), colorScheme(), orientation()],
		})
	}

	toggleTheme() {
		this.set('dark', !this.values.dark, false)
	}
}

export const clientState = new AppStateManager()
clientState.start()
```

One manager per page is the usual pattern. One `State` imported around the app is enough when you only have one token. Bind workspace nodes when they exist (`ref` / `onMounted` / `ngAfterViewInit`). Do not tear the schema down when a view leaves: the next `setTarget` is enough. `remove()` belongs on a full schema reset, not a view leaving.

### More CSS

Tokens as custom properties:

```css
html[data-vp="xs"] { --pad: 8px; --nav: 0px; }
html[data-vp="md"] { --pad: 16px; --nav: 200px; }
html[data-vp="lg"] { --pad: 24px; --nav: 240px; }

.page {
	padding: var(--pad);
	grid-template-columns: var(--nav) 1fr;
}
```

Media queries see the viewport. A workspace token sees a column.

```css
html[data-ws="xl"] .rail { display: flex; }
html[data-ws="xs"] .rail { display: none; }
```

```js
cs.setTarget('ws', columnEl)
```

`(hover: hover)` is the primary pointing device, not “a mouse exists somewhere”.

```css
html[data-hover="yes"] .hint { display: none; }
html[data-hover="yes"] .field:hover .hint { display: block; }

html[data-hover="no"] .hint { display: none; }
html[data-hover="no"] .field:focus-within .hint { display: block; }
```

Combine tokens. The cascade stays ordinary CSS.

```css
html[data-vp="xs"][data-color-scheme="dark"] .tooltip {
	max-width: 100%;
	background: #000;
}

html[data-vp="lg"][data-ws="xs"] .rail {
	position: absolute;
}
```

## Development

```bash
npm test
npm run test:types
npm run coverage
```

Tests use `node:test`. The `test/` tree mirrors sources (`State.js` → `test/State.spec.js`).
