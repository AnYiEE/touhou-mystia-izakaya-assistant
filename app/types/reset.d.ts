interface ArrayConstructor {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	isArray(arg: any): arg is unknown[];
}

interface JSON {
	/**
	 * Converts a JavaScript Object Notation (JSON) string into an object.
	 * @param text A valid JSON string.
	 * @param reviver A function that transforms the results. This function is called for each member of the object.
	 * If a member contains nested objects, the nested objects are transformed before the parent object is.
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	parse(text: string, reviver?: (this: any, key: string, value: any) => any): unknown;
}
