# tabu-client-state

![dependencies](https://img.shields.io/badge/dependencies-none-2ea44f)
![tested](https://img.shields.io/badge/tested-node%3Atest%20%2B%20tsc-2ea44f)
![vanilla](https://img.shields.io/badge/vanilla-JavaScript-f7df1e?logo=javascript&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-declarations-3178c6?logo=typescript&logoColor=white)

A client-state manager for **styles and rendering** in an HTML UI application — not a site, not a landing page. Discrete tokens (`xs`, `dark`, `yes`) on `<html>` — CSS skips `@media`. The app reads the same states: a size token, or a boolean for a media query.

The library does that, after the application starts. It does not own the first HTML frame.

## Contents

- [Reference](reference.md)
- [Why](#why)
	- [What it is good at](#what-it-is-good-at)
	- [Why this beats `@media`](#why-this-beats-media)
	- [What it will not do](#what-it-will-not-do)
- [How to](#how-to)
	- [Install and import](#install-and-import)
	- [Where it runs](#where-it-runs)
	- [Add a state](#add-a-state)
	- [Slot, attribute, change](#slot-attribute-change)
	- [Source](#source)
	- [Limit](#limit)
	- [Read, pin, persist](#read-pin-persist)
	- [Hooks](#hooks)
	- [Presets](#presets)
	- [App wrapper](#app-wrapper)
	- [More CSS](#more-css)

## Why

You decide what to watch. A state is `{ id, value, source }`. `id` names it, `value` returns the token JS branches on, `source` says when to run it again. The runtime writes that token as an HTML attribute. Viewport, workspace, color scheme, hover, and orientation ship as presets if you do not want to write the object yourself — they are the same object `add` takes.

```js
import { StateManager, viewport } from 'tabu-client-state'

const cs = new StateManager()
cs.add(viewport())
cs.start()
cs.values.vp // 'lg' — also <html data-vp="lg">
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

The runtime watches the environment, picks a value, and writes an attribute on `<html>` — or any host you pass. The stylesheet selects on those attributes. `cs.values` is what the app branches on.

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

This is not a reactive store, not a CSS framework, and not an event bus. `new StateManager()` tracks nothing until you `add` states and `start()`.

Every public name, with signatures, is in [reference.md](reference.md).

### What it is good at

- One token, two readers: CSS keys off the attribute, JS keys off `values`.
- Overrides are first-class. Pin in memory, or persist to `localStorage` / `sessionStorage`. Detect pauses until you unlock.
- Tests pin `cs.values.vp = 'xs'` and get the `xs` rules on a 1440px window. No resize, no `matchMedia` mock for the stylesheet.
- A state is an ordinary object. Presets are factories for that object. Mutate what they return, or skip them.
- `hooks` are optional slots. Plug in the bus you already have. The library does not import one.
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

The `xs` + `dark` rules apply on a 1440px desktop window. Screenshots, jsdom, and component tests pin a token and assert layout. You can still unit-test `value`; you do not need `value` to test the CSS.

`@media (max-width: 767px)` and `prefers-color-scheme` are read-only. A person cannot say “compact layout on my ultrawide” or “dark, even if the OS is light”.

```js
cs.storeValue('dark', true, false)   // persist dark
cs.values.vp = 'xs'                  // compact, live detect paused
cs.values.dark = undefined           // back to detect
```

The CSS does not change. Persist theme and density; leave viewport live if pinning `lg` on a phone would break the layout. That choice is the app’s.

### What it will not do

- It does not auto-start in the constructor.
- It does not replace every media query (print, raw pointer capability — keep those if they are device facts, not user choices).
- It is not a reactive store (`hooks` are optional slots; `values` is the read).
- It is not a place to stash measurements (`innerWidth`).
- It does not ship throttle / debounce.
- It does not clear storage for you.
- It does not own the first HTML frame. No SSR renderer, no attributes until `start()`. A page that must look finished before the application runs should keep `@media`. An HTML UI app starts, then this library writes the tokens.
- It does not catch errors from hooks you passed.
- It does not write HTML boolean attributes (presence-only). Always `name="value"`, or the attribute is removed.

## How to

### Install and import

```bash
npm install tabu-client-state
```

```js
import { StateManager } from 'tabu-client-state'
```

TypeScript uses adjacent `.d.ts` files. There is no compile step.

You add states. Named presets (`viewport`, `workspace`, `hover`, `colorScheme`, `orientation`) are optional factories for the same object.

### Where it runs

Browser-only. The constructor reads `document.documentElement` unless you pass `attrTarget`. Sources may use `window`, `matchMedia`, `ResizeObserver`, or your own `bind`. Storage uses `localStorage` / `sessionStorage` and swallows a missing API.

The package is ESM. A page loads it with a bundler or `<script type="module">`. `require()` does not load it. The syntax floor is private fields (`#states`) plus `?.` and `??`.

### Add a state

Three shapes. Optional on all of them: `attrName`, `attrTarget`, `attrValue`, `hooks`, `proxyHooks`.

| Shape | What it is | Required |
| --- | --- | --- |
| `{ id }` | Manual state. Only a pin. Unlock goes to `undefined` | `id` |
| `{ id, value }` | Manual with a default. `value` is a function or a constant | `id`, `value` |
| `{ id, value, source: { bind, unbind } }` | Autodetect. `target` is optional | `id`, `value`, `bind`, `unbind` |

If either `bind` or `unbind` is present, both must be functions, and `value` must be a function. Otherwise the runtime throws `bind must be a function`, `unbind must be a function`, or `value must be a function`. A manual state omits the pair. A function `value` runs on start and on `set(undefined)`. A constant `value` is that default: start publishes it, `set(undefined)` restores it. `{ id }` unlocks to `undefined`.

Constructor **registers** states. It does not start them, does not write attributes, does not set values. `start()` does.

`id` names the state (`values[id]`, storage key). Required: anything except `undefined` and `""`. The runtime stores `String(id)`.

`value` reads `ctx` and returns what JS should branch on — a token, a boolean, or `undefined` if detect found nothing. That return is a normal slot write. `source` says when to run `value` again. `attrName` is the HTML attribute (`id` if omitted). `attrValue` maps the JS value onto that attribute. `attrTarget` is the node that receives it (the manager’s `attrTarget`, default `<html>`). `undefined` and `null` from `attrValue` (or the JS value, if there is no mapping) remove the attribute; `''` writes `attr=""`. The other `undefined` is `values.id = undefined`: unlock, wipe storage, run live `value()` once.

The library does not restrict `attrName` — any string goes to `setAttribute`. It does not write HTML boolean attributes (`<html hidden>`): the attribute is always `name="value"`, or it is removed. A JS boolean without `attrValue` becomes `attr="true"` / `attr="false"`. Custom names should use the `data-` prefix. Presets do that: `id` is `vp` (`cs.values.vp`), `attrName` is `data-vp`. Pass `id` and/or `attrName` to override.

Values are discrete: size tokens (`'xs'`) or booleans. Putting `innerWidth` on the attribute so JS can `cs.values.width > 1000` is the antipattern this library exists to avoid.

```js
cs.add(viewport())
```

A media query. JS keeps a boolean; the attribute gets the token:

```js
cs.add(colorScheme())
cs.values.dark // true — <html data-color-scheme="dark">
```

An element that does not exist yet. `bind` fails until there is a node; pass `target` on the preset or call `setTarget`.

```js
cs.add(workspace())
cs.start()                    // bind fails until there is a node
cs.setTarget('ws', columnEl)  // starts, writes data-ws
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

Any state start starts the manager. Stopping states does not stop the manager. `start()` is `start(true)`. `stop()` is `stop(true)`. Overloads are in the [reference](reference.md#start).

### Slot, attribute, change

Pin is `cs.values.id = x` or `storeValue`. Unlock is `= undefined`: wipe storage, one live `value()` — not a write of `undefined` into the slot. `change` only when the state is started and the new slot differs.

| | Slot | Attribute | `change` |
| --- | --- | --- | --- |
| `add` without `start` | empty | — | no |
| `start`, live detect | `value()` | write | if ≠ |
| `start`, memory pin | keep pin | write | if ≠ |
| `start`, storage hit | stored, then lock | write | if ≠ |
| `start`, `bind` false | unchanged | — | no |
| pin, started | pin, lock | write | if ≠ |
| pin, stopped | pin, lock | leave | no |
| `start` after that pin | keep pin | write | if ≠ |
| unlock, started | live / constant / `undefined` | write | if ≠ pin |
| unlock, stopped | live / constant / `undefined` | leave | no |
| source tick, live | `value()` | write | if ≠ |
| source tick, locked | — | leave | no |
| `stop` | keep | leave | no |
| `remove` | gone | restore origin | no |

### Source

When to run `value` again on an autodetect state. `bind` and `unbind` come as a pair: both omitted (manual state), or both present as functions. One without the other throws. `target` is optional. Named presets fill those in.

```js
cs.add({
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

On start, `bind` runs. If the state is already locked in memory, that slot is published and detect stays paused. Else a stored override is published and the state locks. Else `value` runs once. The listener should call `ctx.callback()`. On stop, `ctx.callback.cancel?.()` then `unbind`. `bind` returning `false` aborts start: no attribute, `unbind` is not called.

A function `target` is called on `add` / `setTarget`, not on `start`.

Fields and `ctx` are in the [reference](reference.md#SourceOptions).

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

cs.add({
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

Read order on `start`: **memory lock → session → local → live `value()`**. A memory pin wins over anything in storage.

`values.theme = 'dark'` locks in memory: the slot is written, detect pauses, storage is not touched. `storeValue(id, value, where)` does the same when `where` is omitted, and also writes storage when it is `true` / `false`:

```js
cs.values.theme = 'dark'                 // memory lock — beats storage on the next start
cs.storeValue('theme', 'dark')           // same, memory
cs.storeValue('theme', 'dark', false)    // localStorage
cs.storeValue('theme', 'night', true)    // sessionStorage
cs.values.theme = undefined              // unlock, wipe storage, one live value()
cs.storeValue('hover', false, false)     // stores boolean false; attribute stays "no"
```

Key: `storageKeyPrefix + id` (default `tabu.clientstate.theme`). What you store is what you read: the JS value, as JSON. A token stays a string; `true` stays a boolean. Not the attribute string. A raw string that is not JSON is warned about and treated as missing — start then uses live `value()` unless a memory lock is already on. Slot, attribute, and `change` for pin / unlock / start: [the table](#slot-attribute-change).

Unavailable storage is swallowed. `remove` does **not** clear storage. A later `add` with the same `id` is not locked; on `start` it picks session, then local.

`{ ...cs.values }` copies a snapshot. An unknown id reads as `undefined`; assigning to one throws `unknown state`.

### Hooks

The package is not an event bus. `hooks` are optional slots. Skip them and CSS still works.

Need only a value flip — `hooks.change`, or `hooks.all` and look at the name. Need `on` / `off` / `once` — put manager `all` on the bus you already have. The library does not import one.

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

A named slot runs, then `all`, then the manager wire. `this` is the state for state slots and the manager for manager slots. The manager never receives the state instance. Manager names are prefixed: `state:change`, `before:state:start`.

`hooks` on `add` replaces the whole bag from `stateOptions`. Names are not merged. Put every slot you still want on that object.

Overwrite `proxyHooks` with `false` to turn the manager wire off — on `stateOptions` for every state, or on one `add`. Prefer `false`. A function in that slot is at your own risk.

`start` receives `(id, value)`. `start:fail` fires when `bind` returns `false` and receives `id`. `before*` is a notice, not a veto. When `change` fires — [the table](#slot-attribute-change).

A throw in a hook you passed stops the call and the method that invoked it. The library does not catch it. If you need a callback to isolate its own errors, wrap it yourself — for example with `tabu-js-res`.

### Presets

Factories for the same object `add` takes. Skip them and write the object; or start from a preset and mutate what it returns.

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
		this.storeValue('dark', !this.values.dark, false)
	}
}

export const clientState = new AppStateManager()
clientState.start()
```

One instance per page is the usual pattern. Bind workspace nodes when they exist (`ref` / `onMounted` / `ngAfterViewInit`). Do not tear the schema down when a view leaves: the next `setTarget` is enough. `remove()` belongs on a full schema reset, not a view leaving.

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

Tests use `node:test`. The `test/` tree mirrors sources (`StateManager.js` → `test/StateManager.spec.js`).
