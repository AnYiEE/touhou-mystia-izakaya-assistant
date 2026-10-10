import { faCircleQuestion, faGear } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Button from '@/design/ui/components/button';
import FontAwesomeIconButton from '@/design/ui/components/fontAwesomeIconButton';
import Popover, {
	type IPopoverProps,
	PopoverContent,
	PopoverTrigger,
} from '@/design/ui/components/popover';

import { specialGuestPlansMessages } from '@/features/specialGuestPlans/client/messages';

import { useI18n } from '@/shared/i18n/useI18n';

export default function SpecialGuestPlanHelpPopover({
	isOpen,
	onOpenChange,
	onOpenHiddenItemsSettings,
	onOpenRatingSettings,
	portalContainerProps,
	shouldCloseOnInteractOutside,
}: {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	onOpenHiddenItemsSettings: () => void;
	onOpenRatingSettings: () => void;
	portalContainerProps: Pick<IPopoverProps, 'portalContainer'>;
	shouldCloseOnInteractOutside: () => boolean;
}) {
	const { t } = useI18n(specialGuestPlansMessages);

	return (
		<Popover
			shouldBlockScroll
			showArrow
			isOpen={isOpen}
			shouldCloseOnInteractOutside={shouldCloseOnInteractOutside}
			onOpenChange={onOpenChange}
			{...portalContainerProps}
		>
			<PopoverTrigger>
				<FontAwesomeIconButton
					icon={faCircleQuestion}
					variant="light"
					aria-label={t('plans.help.aria')}
				/>
			</PopoverTrigger>
			<PopoverContent>
				<div className="max-w-80 space-y-2 p-1 text-tiny leading-5 text-foreground-500">
					<p className="font-medium text-foreground-700">
						{t('plans.help.intro')}
					</p>
					<div className="space-y-2">
						<div>
							<p className="font-medium text-foreground-600">
								{t('plans.help.selectTitle')}
							</p>
							<p>{t('plans.help.selectDesc')}</p>
						</div>
						<div>
							<p className="font-medium text-foreground-600">
								{t('plans.help.sourceTitle')}
							</p>
							<div className="mt-1 space-y-1 rounded-small border border-default-200/60 bg-default-50/30 px-2 py-1.5 dark:border-white/10 dark:bg-white/[0.07] dark:shadow-[inset_0_1px_0_rgb(255_255_255_/_0.06),0_8px_20px_rgb(0_0_0_/_0.14)]">
								<p>
									<span className="font-medium text-foreground-600">
										{t('plans.help.source.saved')}
									</span>
									{t('plans.help.source.savedDesc')}
								</p>
								<p>
									<span className="font-medium text-foreground-600">
										{t('plans.help.source.recommended')}
									</span>
									{t('plans.help.source.recommendedDesc')}
								</p>
							</div>
						</div>
					</div>
					<div className="rounded-small border border-default-200/60 bg-default-50/30 px-2 py-1.5 text-foreground-500 dark:border-white/10 dark:bg-white/[0.07] dark:shadow-[inset_0_1px_0_rgb(255_255_255_/_0.06),0_8px_20px_rgb(0_0_0_/_0.14)]">
						<p className="font-medium text-foreground-600">
							{t('plans.help.settingsTitle')}
						</p>
						<p>{t('plans.help.settingsDesc')}</p>
						<p>{t('plans.help.trendDesc')}</p>
						<div className="mt-1 grid grid-cols-1 gap-1 sm:grid-cols-2">
							<Button
								fullWidth
								size="sm"
								variant="flat"
								startContent={<FontAwesomeIcon icon={faGear} />}
								onClick={onOpenHiddenItemsSettings}
							>
								{t('plans.help.hiddenItems')}
							</Button>
							<Button
								fullWidth
								size="sm"
								variant="flat"
								startContent={<FontAwesomeIcon icon={faGear} />}
								onClick={onOpenRatingSettings}
							>
								{t('plans.help.trend')}
							</Button>
						</div>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
