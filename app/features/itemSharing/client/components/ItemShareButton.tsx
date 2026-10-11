'use client';

import { faLink, faShare } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { memo, useCallback, useMemo } from 'react';

import FontAwesomeIconButton from '@/design/ui/components/fontAwesomeIconButton';
import Popover, {
	PopoverContent,
	PopoverTrigger,
} from '@/design/ui/components/popover';
import SiteInfo from '@/design/ui/components/siteInfo';
import Snippet from '@/design/ui/components/snippet';
import Tooltip from '@/design/ui/components/tooltip';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import { useParams } from '@/features/appShell/client/navigation/useParams';
import { itemSharingMessages } from '@/features/itemSharing/client/messages';
import {
	type TShareableItemId,
	type TShareableItemName,
} from '@/features/itemSharing/contracts';
import {
	createItemShareData,
	createItemShareUrl,
} from '@/features/itemSharing/shareUrl';

import { PUBLIC_RUNTIME_CONFIG } from '@/infrastructure/environment/publicRuntimeConfig';

import { useI18n } from '@/shared/i18n/useI18n';
import { siteMessages } from '@/shared/site/messages';

const SHARE_SNIPPET_CLASS_NAMES = {
	pre: 'flex max-w-screen-p-60 items-center whitespace-normal break-all',
} as const;

interface IItemShareButtonProps {
	name: TShareableItemName;
	recordId: TShareableItemId;
}

export const ItemShareButton = memo<IItemShareButtonProps>(
	function ItemShareButton({ name, recordId }) {
		const { t } = useI18n(itemSharingMessages);
		const { t: tSite } = useI18n(siteMessages);
		const { params } = useParams();

		const generatedUrl = useMemo(
			() =>
				createItemShareUrl({
					params,
					pathname: location.pathname,
					recordId,
				}),
			[params, recordId]
		);

		const shareObject = useMemo<ShareData>(
			() =>
				createItemShareData(
					t('itemSharing.shareText', {
						name,
						site: tSite('site.name'),
					}),
					generatedUrl
				),
			[generatedUrl, name, t, tSite]
		);

		const isCanShare = useMemo(() => {
			try {
				// For checking if the browser supports the share API.
				return navigator.canShare(shareObject);
			} catch {
				return false;
			}
		}, [shareObject]);

		const handlePress = useCallback(() => {
			if (isCanShare) {
				navigator.share(shareObject).catch(() => {});
			}
			trackEvent(trackEvent.category.click, 'Share Button', name);
		}, [isCanShare, name, shareObject]);

		const label = t('itemSharing.shareLabel');

		return (
			<>
				<SiteInfo
					baseUrl={PUBLIC_RUNTIME_CONFIG.baseURL}
					fontSize={7}
					className="absolute bottom-1 right-6 text-right [text-shadow:0px_0.5px_0.75px_rgba(0,0,0,0.15)]"
				/>
				<Popover showArrow>
					<Tooltip
						showArrow
						content={label}
						offset={5}
						placement="left"
						size="sm"
					>
						<div className="absolute bottom-1 right-1 z-20 flex">
							<PopoverTrigger>
								<FontAwesomeIconButton
									icon={faShare}
									variant="light"
									onPress={handlePress}
									aria-label={label}
									className="h-4 w-4 min-w-0 transform-gpu text-default-400 data-[hover=true]:bg-transparent data-[pressed=true]:bg-transparent data-[hover=true]:opacity-hover data-[pressed=true]:opacity-hover data-[hover=true]:backdrop-blur-none data-[pressed=true]:backdrop-blur-none"
								/>
							</PopoverTrigger>
						</div>
					</Tooltip>
					<PopoverContent>
						<p className="mr-4 cursor-default select-none self-end text-right text-tiny text-default-500">
							{t('itemSharing.copyHint')}
						</p>
						<Snippet
							disableTooltip
							size="sm"
							symbol={
								<FontAwesomeIcon
									icon={faLink}
									className="mr-1 !align-middle text-default-700"
								/>
							}
							classNames={SHARE_SNIPPET_CLASS_NAMES}
						>
							{generatedUrl}
						</Snippet>
					</PopoverContent>
				</Popover>
			</>
		);
	}
);
