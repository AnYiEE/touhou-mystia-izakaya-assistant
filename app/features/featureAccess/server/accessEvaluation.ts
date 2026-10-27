import {
	type IEffectiveFeatureAccess,
	type IFeatureAccessDefinition,
	type TFeatureAccessDirectOverride,
	type TFeatureAccessLevel,
	type TFeatureAccessReason,
	type TFeatureAccessSource,
	type TFeatureModuleKey,
} from '@/domain/featureAccess/contracts';

export interface IFeatureAccessEvaluationInput<
	TKey extends string = TFeatureModuleKey,
> {
	definitions: ReadonlyArray<IFeatureAccessDefinition<TKey>>;
	groupGrants: Readonly<Partial<Record<TKey, ReadonlyArray<string>>>>;
	isAuthenticated: boolean;
	moduleOverrides: Readonly<
		Partial<Record<TKey, Exclude<TFeatureAccessDirectOverride, null>>>
	>;
	policies: Readonly<Partial<Record<TKey, TFeatureAccessLevel>>>;
}

interface IFeatureAccessBaseResult<TKey extends string> {
	directOverride: TFeatureAccessDirectOverride;
	groupIds: string[];
	key: TKey;
	policy: TFeatureAccessLevel;
	reason: TFeatureAccessReason;
	sources: TFeatureAccessSource[];
}

function createAllowedSources(
	directOverride: TFeatureAccessDirectOverride,
	groupIds: ReadonlyArray<string>,
	isAuthenticated: boolean,
	policy: TFeatureAccessLevel
) {
	const sources: TFeatureAccessSource[] = [];
	if (directOverride === 'allow') {
		sources.push('direct-allow');
	}
	if (groupIds.length > 0) {
		sources.push('group-allow');
	}
	if (policy === 'public') {
		sources.push('public');
	}
	if (isAuthenticated && policy === 'authenticated') {
		sources.push('authenticated');
	}

	return sources;
}

function createBaseResult<TKey extends string>(
	definition: IFeatureAccessDefinition<TKey>,
	input: IFeatureAccessEvaluationInput<TKey>
): IFeatureAccessBaseResult<TKey> {
	const directOverride = input.moduleOverrides[definition.key] ?? null;
	const grantedGroupIds = input.groupGrants[definition.key];
	const groupIds =
		grantedGroupIds === undefined ? [] : [...new Set(grantedGroupIds)];
	const policy = input.policies[definition.key] ?? definition.defaultAccess;

	if (!definition.isAvailable) {
		return {
			directOverride,
			groupIds,
			key: definition.key,
			policy,
			reason: 'unavailable',
			sources: [],
		};
	}
	if (directOverride === 'deny') {
		return {
			directOverride,
			groupIds,
			key: definition.key,
			policy,
			reason: 'denied',
			sources: ['override-deny'],
		};
	}
	if (directOverride === 'allow') {
		return {
			directOverride,
			groupIds,
			key: definition.key,
			policy,
			reason: 'allowed',
			sources: createAllowedSources(
				directOverride,
				groupIds,
				input.isAuthenticated,
				policy
			),
		};
	}
	if (groupIds.length > 0) {
		return {
			directOverride,
			groupIds,
			key: definition.key,
			policy,
			reason: 'allowed',
			sources: createAllowedSources(
				directOverride,
				groupIds,
				input.isAuthenticated,
				policy
			),
		};
	}
	if (policy === 'public') {
		return {
			directOverride,
			groupIds,
			key: definition.key,
			policy,
			reason: 'allowed',
			sources: createAllowedSources(
				directOverride,
				groupIds,
				input.isAuthenticated,
				policy
			),
		};
	}
	if (input.isAuthenticated && policy === 'authenticated') {
		return {
			directOverride,
			groupIds,
			key: definition.key,
			policy,
			reason: 'allowed',
			sources: createAllowedSources(
				directOverride,
				groupIds,
				input.isAuthenticated,
				policy
			),
		};
	}

	return {
		directOverride,
		groupIds,
		key: definition.key,
		policy,
		reason: input.isAuthenticated ? 'grant-required' : 'login-required',
		sources: [],
	};
}

export function evaluateFeatureAccessMap<TKey extends string>(
	input: IFeatureAccessEvaluationInput<TKey>
): Readonly<Record<TKey, IEffectiveFeatureAccess<TKey>>> {
	const definitionMap = new Map<TKey, IFeatureAccessDefinition<TKey>>();
	for (const definition of input.definitions) {
		if (definitionMap.has(definition.key)) {
			throw new Error(`duplicate-feature-module:${definition.key}`);
		}
		definitionMap.set(definition.key, definition);
	}

	const results = new Map<TKey, IEffectiveFeatureAccess<TKey>>();
	for (const definition of input.definitions) {
		const base = createBaseResult(definition, input);
		const { key, ...result } = base;
		results.set(definition.key, {
			...result,
			allowed: base.reason === 'allowed',
			moduleKey: key,
		});
	}

	for (const definition of input.definitions) {
		const result = results.get(definition.key);
		if (result === undefined) {
			continue;
		}

		const deniedImpliedKey = definition.implies?.find((key) => {
			const impliedDefinition = definitionMap.get(key);
			return (
				input.moduleOverrides[key] === 'deny' ||
				!impliedDefinition?.isAvailable
			);
		});
		if (deniedImpliedKey === undefined) {
			continue;
		}

		const impliedDefinition = definitionMap.get(deniedImpliedKey);
		const isUnavailable = !impliedDefinition?.isAvailable;
		results.set(definition.key, {
			...result,
			allowed: false,
			reason: isUnavailable ? 'unavailable' : 'denied',
			sources: isUnavailable ? [] : ['override-deny'],
		});
	}

	for (const definition of input.definitions) {
		const result = results.get(definition.key);
		if (result?.allowed !== true || definition.implies === undefined) {
			continue;
		}

		for (const impliedKey of definition.implies) {
			const impliedDefinition = definitionMap.get(impliedKey);
			const impliedResult = results.get(impliedKey);
			if (
				impliedDefinition === undefined ||
				impliedResult === undefined ||
				impliedResult.allowed ||
				!impliedDefinition.isAvailable ||
				input.moduleOverrides[impliedKey] === 'deny'
			) {
				continue;
			}

			results.set(impliedKey, {
				...impliedResult,
				allowed: true,
				reason: 'allowed',
				sources: ['implied'],
			});
		}
	}

	return Object.fromEntries(results) as Readonly<
		Record<TKey, IEffectiveFeatureAccess<TKey>>
	>;
}
