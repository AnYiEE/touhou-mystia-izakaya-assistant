import { useParams } from '@/hooks';
import { PARAM_PREVIEW } from '@/hooks/useViewInNewWindow';

import { ITEM_SHARE_PARAM_NAME } from '@/lib/itemShare';

export function useSkipProcessItemData() {
	const { params } = useParams();

	const isPreviewMode = params.has(PARAM_PREVIEW);
	const isSpecifyMode = params.has(ITEM_SHARE_PARAM_NAME);

	const shouldSkipProcessData = isPreviewMode || isSpecifyMode;

	return shouldSkipProcessData;
}
