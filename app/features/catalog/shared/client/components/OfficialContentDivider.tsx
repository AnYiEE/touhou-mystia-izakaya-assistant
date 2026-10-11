'use client';

import LabeledDivider from '@/design/ui/components/labeledDivider';

import { catalogSharedMessages } from '@/features/catalog/shared/client/messages';

import { useI18n } from '@/shared/i18n/useI18n';

interface IProps {
	className?: string;
	count?: number;
}

export default function OfficialContentDivider({ className, count }: IProps) {
	const { t } = useI18n(catalogSharedMessages);

	return (
		<LabeledDivider className={className} count={count}>
			{t('catalog.officialContentDivider')}
		</LabeledDivider>
	);
}
