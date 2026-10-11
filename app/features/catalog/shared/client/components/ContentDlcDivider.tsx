'use client';

import LabeledDivider from '@/design/ui/components/labeledDivider';

import { getDlcLabel } from '@/domain/availability/localizedLabels';
import type { TDlc } from '@/domain/data/shared/types';

import { catalogSharedMessages } from '@/features/catalog/shared/client/messages';

import { useI18n } from '@/shared/i18n/useI18n';

interface IProps {
	className?: string;
	count?: number;
	dlc: TDlc;
}

export default function ContentDlcDivider({ className, count, dlc }: IProps) {
	const { t } = useI18n(catalogSharedMessages);

	return (
		<LabeledDivider className={className} count={count}>
			{t('catalog.modContentDivider', { dlc: getDlcLabel(dlc) })}
		</LabeledDivider>
	);
}
