'use client';

import { memo } from 'react';

import {
	type TFeatureAccessReason,
	type TFeatureModuleKey,
} from '@/domain/featureAccess/contracts';

interface IProps {
	className?: string;
	featureName?: string;
	isActionFullWidth?: boolean;
	moduleKey: TFeatureModuleKey;
	onLoginPress?: () => void;
	onRetry?: () => void;
	reasonOverride?: Exclude<TFeatureAccessReason, 'allowed'>;
	showBody?: boolean;
	showTitle?: boolean;
}

export default memo<IProps>(function FeatureAccessNotice() {
	return null;
});
