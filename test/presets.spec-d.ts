import type { StateOptions } from '../State.js';
import {
	tokenByThresholds,
	matchMediaState,
	mediaQueriesFromSizes,
	event,
	resizeElement,
	timer,
	mediaQuery,
	viewport,
	workspace,
	hover,
	colorScheme,
	orientation,
} from '../presets.js';
import type { SourceOptions } from '../source.js';

const _token: string | undefined = tokenByThresholds([['xs', 768]], 100);
const _viewport: StateOptions = viewport();
const _workspace: StateOptions = workspace();
const _hover: StateOptions = hover();
const _colorScheme: StateOptions = colorScheme();
const _orientation: StateOptions = orientation();
const _fromQuery: StateOptions = matchMediaState({
	id: 'theme',
	query: '(prefers-color-scheme: dark)',
	true: 'dark',
	false: 'light',
});
const _namedHover: StateOptions = hover({ id: 'html.hover' });
const _namedScheme: StateOptions = colorScheme({
	id: 'html.dark',
	attrName: 'color-scheme',
});
const _customVp: StateOptions = viewport({
	id: 'html.vp',
	attrName: 'vp',
	sizes: [['xs', 768], ['xl', 1600]],
});
const _customWs: StateOptions = workspace({
	id: 'pane',
	sizes: [['xs', 300], ['xl', 900]],
	target: {} as Element,
});
const _limitedWs: StateOptions = workspace({
	limit: fn => Object.assign(fn, { cancel() {} }),
});
const _queries: Array<[string, string]> = mediaQueriesFromSizes([['xs', 768], ['xl', 1600]]);
void _token;
void _limitedWs;
void _queries;
void _namedHover;
void _namedScheme;
void _viewport;
void _workspace;
void _hover;
void _colorScheme;
void _orientation;
void _fromQuery;
void _customVp;
void _customWs;

const _timer: SourceOptions = timer({ delay: 25 });
const _event: SourceOptions = event({ event: 'click' });
const _resize: SourceOptions = resizeElement({ limit: fn => fn });
const _media: SourceOptions = mediaQuery({ query: '(hover: hover)' });
void _timer;
void _event;
void _resize;
void _media;

// @ts-expect-error query is required
matchMediaState({ id: 'x', true: 'yes', false: 'no' });

// @ts-expect-error delay is not a factory option; close it over in limit
workspace({ delay: 80 });

// @ts-expect-error viewport does not take limit
viewport({ limit: (fn: () => void) => fn });
