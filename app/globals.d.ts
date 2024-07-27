interface Map<K, V> {
	has<P extends K>(key: P): this is {get(key: P): V} & this;
}

type ReactNodeWithoutBoolean = Exclude<React.ReactNode, boolean>;
type SelectionSet = Exclude<import('@nextui-org/react').Selection, 'all'>;
