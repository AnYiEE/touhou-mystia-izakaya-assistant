import { useParams } from '@/features/appShell/client/navigation/useParams';
import {
	ITEM_PREVIEW_PARAM_NAME,
	ITEM_SHARE_PARAM_NAME,
} from '@/features/itemSharing/contracts';

export function useSkipProcessItemData() {
	const { params } = useParams();

	const isPreviewMode = params.has(ITEM_PREVIEW_PARAM_NAME);
	const isSpecifyMode = params.has(ITEM_SHARE_PARAM_NAME);

	const shouldSkipProcessData = isPreviewMode || isSpecifyMode;

	return shouldSkipProcessData;
}
