export function hasAsciiControlCharacter(value: string) {
	for (let index = 0; index < value.length; index++) {
		const codePoint = value.codePointAt(index);
		if (
			codePoint !== undefined &&
			((codePoint >= 0 && codePoint <= 0x1f) || codePoint === 0x7f)
		) {
			return true;
		}
	}

	return false;
}
