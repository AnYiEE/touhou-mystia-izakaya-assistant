'use client';

import { memo } from 'react';

import LabeledDivider from '@/design/ui/components/labeledDivider';
import Link from '@/design/ui/components/link';

import { getDlcLabel } from '@/domain/availability/localizedLabels';
import type { TDlc } from '@/domain/data/shared/types';

import { catalogSharedMessages } from '@/features/catalog/shared/client/messages';
import { META_MYSTIA_PAGE_PATH } from '@/features/metaMystia/links';

import { useI18n } from '@/shared/i18n/useI18n';

const LINK_CLASS_NAMES = {
	base: 'text-small text-foreground-400',
	underline: 'bottom-0',
} as const;

interface IProps {
	className?: string;
	count?: number;
	dlc: TDlc;
}

export default memo<IProps>(function ContentDlcDivider({
	className,
	count,
	dlc,
}) {
	const { t } = useI18n(catalogSharedMessages);

	const label = t('catalog.modContentDivider', { dlc: getDlcLabel(dlc) });

	return (
		<LabeledDivider className={className} count={count}>
			{dlc === 9 ? (
				<Link
					isExternal
					showAnchorIcon
					href={META_MYSTIA_PAGE_PATH}
					classNames={LINK_CLASS_NAMES}
				>
					{label}
				</Link>
			) : (
				label
			)}
		</LabeledDivider>
	);
});
