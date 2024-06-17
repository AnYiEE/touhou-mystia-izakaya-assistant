export function generateArray<T extends []>(...args: (T | T[])[]): T[];
export function generateArray<T = unknown>(...args: (T | T[])[]): T[];
export function generateArray<T>(...args: (T | T[])[]): T[] {
	return args.flatMap((arg) => {
		if (Array.isArray(arg)) {
			return arg;
		}

		return [arg];
	});
}
