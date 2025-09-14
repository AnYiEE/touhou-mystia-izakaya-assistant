import { useParams } from '@/hooks';
import { PARAM_SPECIFY } from '@/hooks/useOpenedItemPopover';
import { PARAM_PREVIEW } from '@/hooks/useViewInNewWindow';

export function useSkipProcessItemData() {
	const { params } = useParams();

	const isPreviewMode = params.has(PARAM_PREVIEW);
	const isSpecifyMode = params.has(PARAM_SPECIFY);

	const shouldSkipProcessData = isPreviewMode || isSpecifyMode;

	return shouldSkipProcessData;
}
