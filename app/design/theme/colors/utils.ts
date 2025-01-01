import type {TColorScale} from './types';

export function createShiftedColorScale(colors: TColorScale) {
	// eslint-disable-next-line compat/compat
	return Object.fromEntries(
		Object.keys(colors).map((key, index) => {
			const newValue = Object.values(colors)[index + 1];
			return [key, newValue ?? '#0a0600'];
		})
	) as TColorScale;
}
