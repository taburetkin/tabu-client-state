function applyLimit(fn, limit) {
	return typeof limit === 'function' ? limit(fn) : fn;
}

function listen(name) {
	return {
		bind(ctx) {
			if (!ctx.target) return;
			ctx.target.addEventListener(name, ctx.callback);
		},
		unbind(ctx) {
			if (!ctx.target) return;
			ctx.target.removeEventListener(name, ctx.callback);
		}
	};
}

export function event({ target, event: name } = {}) {
	return { target, ...listen(name) };
}

export function resizeWindow({ target } = {}) {
	return { target: target ?? window, ...listen('resize') };
}

export function resizeElement({ target, limit } = {}) {
	return {
		target,
		bind(ctx) {
			if (!ctx.target) return;
			ctx.callback = applyLimit(ctx.callback, limit);
			ctx.observer = new ResizeObserver(() => ctx.callback());
			ctx.observer.observe(ctx.target);
		},
		unbind(ctx) {
			ctx.observer?.disconnect();
		}
	};
}

export function timer({ delay } = {}) {
	return {
		bind: (ctx) => { ctx.timerId = setInterval(ctx.callback, delay); },
		unbind: (ctx) => clearInterval(ctx.timerId)
	};
}

export function mediaQuery({ target, query } = {}) {
	return { target: target ?? (() => window.matchMedia(query)), ...listen('change') };
}

const VIEWPORT_SIZES = [
	['xs', 768],
	['sm', 900],
	['md', 1200],
	['lg', 1400],
	['xl', 1600],
];

const WORKSPACE_SIZES = [
	['xs', 300],
	['sm', 450],
	['md', 600],
	['lg', 750],
	['xl', 900],
];

export function tokenByThresholds(thresholds, value) {
	let token;
	for (const [name, limit] of thresholds) {
		if (value < limit) return name;
		token = name;
	}
	return token;
}

export function mediaQueriesFromSizes(sizes) {
	return sizes.map(([name], i) => {
		if (i === 0) return [name, 'all'];
		return [name, `(min-width: ${sizes[i - 1][1]}px)`];
	});
}

function dataAttr(id) {
	return `data-${id}`;
}

export function matchMediaState({
	id,
	attrName = dataAttr(id),
	query,
	true: trueToken = 'true',
	false: falseToken = 'false',
} = {}) {
	return {
		id,
		attrName,
		value({ target } = {}) {
			if (!target) return;
			return target.matches;
		},
		attrValue(value) {
			return value ? trueToken : falseToken;
		},
		source: mediaQuery({ query })
	};
}

export function viewport({ id = 'vp', attrName = dataAttr(id), sizes = VIEWPORT_SIZES } = {}) {
	const queries = mediaQueriesFromSizes(sizes);
	return {
		id,
		attrName,
		value() {
			for (let i = queries.length - 1; i >= 0; i--) {
				const [name, query] = queries[i];
				if (window.matchMedia(query).matches) return name;
			}
		},
		source: {
			bind(ctx) {
				ctx.onMedia = () => {
					if (ctx.scheduled) return;
					ctx.scheduled = true;
					queueMicrotask(() => {
						ctx.scheduled = false;
						if (ctx.onMedia) ctx.callback();
					});
				};
				ctx.mqls = [];
				for (const [, query] of queries) {
					if (query === 'all') continue;
					const mql = window.matchMedia(query);
					mql.addEventListener('change', ctx.onMedia);
					ctx.mqls.push(mql);
				}
			},
			unbind(ctx) {
				const onMedia = ctx.onMedia;
				ctx.onMedia = undefined;
				for (const mql of ctx.mqls ?? []) {
					mql.removeEventListener('change', onMedia);
				}
			}
		}
	};
}

export function workspace({ id = 'ws', attrName = dataAttr(id), sizes = WORKSPACE_SIZES, limit, target } = {}) {
	return {
		id,
		attrName,
		value({ target } = {}) {
			if (!target) return;
			return tokenByThresholds(sizes, target.clientWidth);
		},
		source: resizeElement({ limit, target })
	};
}

const hoverDefs = {
	id: 'hover',
	query: '(hover: hover)',
	true: 'yes',
	false: 'no',
};
export function hover(options) {
	return matchMediaState(Object.assign({}, hoverDefs, options));
}

const colorSchemeDefs = {
	id: 'dark',
	attrName: 'data-color-scheme',
	query: '(prefers-color-scheme: dark)',
	true: 'dark',
	false: 'light',
};
export function colorScheme(options) {
	return matchMediaState(Object.assign({}, colorSchemeDefs, options));
}

const orientationDefs = {
	id: 'portrait',
	attrName: 'data-orientation',
	query: '(orientation: portrait)',
	true: 'portrait',
	false: 'landscape',
};
export function orientation(options) {
	return matchMediaState(Object.assign({}, orientationDefs, options));
}