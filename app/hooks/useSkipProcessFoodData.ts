import {useParams} from '@/hooks';
import {openedPopoverParam} from '@/hooks/useOpenedFoodPopover';
import {inNewWindowParam} from '@/hooks/useViewInNewWindow';

export function useSkipProcessFoodData() {
	const [params] = useParams();

	const isInNewWindow = params.has(inNewWindowParam);
	const isSpecified = params.has(openedPopoverParam);

	const shouldSkipProcessData = isInNewWindow || isSpecified;

	return shouldSkipProcessData;
}
