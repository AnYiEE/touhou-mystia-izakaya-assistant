export const RECOMMENDATION_BRIDGE_PROTOCOL_VERSION = 1;

export function checkOwnProperty(value: object, key: PropertyKey) {
	return Object.hasOwn(value, key);
}

function checkJsonMemberNamesUnique(text: string) {
	const stack: Array<{
		expectingKey: boolean;
		keys: Set<string>;
		type: 'array' | 'object';
	}> = [];
	let isEscaped = false;
	let isInString = false;
	let stringStart = -1;

	for (let index = 0; index < text.length; index++) {
		const character = text[index];
		if (isInString) {
			if (isEscaped) {
				isEscaped = false;
			} else if (character === '\\') {
				isEscaped = true;
			} else if (character === '"') {
				isInString = false;
				const frame = stack.at(-1);
				if (frame?.type === 'object' && frame.expectingKey) {
					let key: unknown;
					try {
						key = JSON.parse(text.slice(stringStart, index + 1));
					} catch {
						return false;
					}
					if (typeof key !== 'string' || frame.keys.has(key)) {
						return false;
					}
					frame.keys.add(key);
					frame.expectingKey = false;
				}
			}
			continue;
		}

		switch (character) {
			case '"':
				isInString = true;
				stringStart = index;
				break;
			case '{':
				stack.push({
					expectingKey: true,
					keys: new Set(),
					type: 'object',
				});
				break;
			case '[':
				stack.push({
					expectingKey: false,
					keys: new Set(),
					type: 'array',
				});
				break;
			case '}':
			case ']':
				stack.pop();
				break;
			case ',': {
				const frame = stack.at(-1);
				if (frame?.type === 'object') {
					frame.expectingKey = true;
				}
				break;
			}
			// No default
		}
	}

	return !isInString;
}

export function parseJsonWithUniqueMembers(text: string): unknown {
	if (!checkJsonMemberNamesUnique(text)) {
		return null;
	}

	try {
		return JSON.parse(text);
	} catch {
		return null;
	}
}
