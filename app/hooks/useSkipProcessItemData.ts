import {useParams} from '@/hooks';
import {openedPopoverParam} from '@/hooks/useOpenedItemPopover';
import {inNewWindowParam} from '@/hooks/useViewInNewWindow';

export function useSkipProcessItemData() {
	const [params] = useParams();

	const isInNewWindow = params.has(inNewWindowParam);
	const isSpecified = params.has(openedPopoverParam);

	const shouldSkipProcessData = isInNewWindow || isSpecified;

	return shouldSkipProcessData;
}
