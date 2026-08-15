import { AccordionItem } from '@heroui/accordion';
import { useCallback } from 'react';

import Avatar from '@/design/ui/components/avatar';
import Ol from '@/design/ui/components/ol';

import { GUEST_RATING_KEY, GUEST_RATING_MAP } from '@/domain/evaluation/labels';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import { normalGuestStore } from '@/features/catalog/guests/normal/client/state/store';
import InfoButtonBase, {
	InfoSectionTitle,
} from '@/features/catalog/guests/shared/client/components/infoButtonBase';
import Price from '@/features/catalog/shared/client/components/Price';

import { checkLengthEmpty } from '@/shared/utilities/collections/check';

const DEFAULT_EXPANDED_KEYS = ['description', 'rating'] as const;
const DEFAULT_EXPANDED_KEYS_WITH_CHAT = [
	...DEFAULT_EXPANDED_KEYS,
	'chat',
] as const;
const DESCRIPTION_CLASS_NAMES = {
	content: 'space-y-1 break-all pt-2 text-justify text-default-900',
} as const;
const CHAT_CLASS_NAMES = {
	content: 'break-all pt-2 text-justify text-small text-default-900',
} as const;
const RATING_CLASS_NAMES = {
	content:
		'grid grid-cols-3 content-start break-all pt-2 text-justify text-small text-default-900',
} as const;
const RATING_AVATAR_CLASS_NAMES = { base: 'h-6 w-2 ring-offset-0' } as const;

export default function InfoButton() {
	const currentNormalGuest = normalGuestStore.shared.guest.id.use();

	const normalGuestCatalog = normalGuestStore.instances.guest.get();
	const handleButtonPress = useCallback(() => {
		if (currentNormalGuest === null) {
			return;
		}

		trackEvent(
			trackEvent.category.click,
			'Info Button',
			normalGuestCatalog.getPropsById(currentNormalGuest, 'name')
		);
	}, [currentNormalGuest, normalGuestCatalog]);

	if (currentNormalGuest === null) {
		return null;
	}

	const {
		chat: currentGuestChat,
		description: currentGuestDescription,
		name: currentGuestName,
	} = normalGuestCatalog.getPropsById(currentNormalGuest);

	const defaultExpandedKeys = checkLengthEmpty(currentGuestChat)
		? DEFAULT_EXPANDED_KEYS
		: DEFAULT_EXPANDED_KEYS_WITH_CHAT;

	return (
		<InfoButtonBase
			defaultExpandedKeys={defaultExpandedKeys}
			overlayId="normal-guest.info"
			onButtonPress={handleButtonPress}
		>
			<AccordionItem
				key="description"
				aria-label={`${currentGuestName}介绍`}
				textValue={currentGuestName}
				title={<InfoSectionTitle title={currentGuestName} />}
				classNames={DESCRIPTION_CLASS_NAMES}
			>
				<div className="flex items-center gap-4">
					<p>
						<span className="font-semibold">名字：</span>
						{currentGuestName}
					</p>
					<p>
						<span className="font-semibold">ID：</span>
						<Price showSymbol={false}>{currentNormalGuest}</Price>
					</p>
				</div>
				<p className="text-small">{currentGuestDescription}</p>
			</AccordionItem>
			{checkLengthEmpty(currentGuestChat) ? null : (
				<AccordionItem
					key="chat"
					aria-label="闲聊对话"
					title="闲聊对话"
					classNames={CHAT_CLASS_NAMES}
				>
					<Ol>
						{currentGuestChat.map((chat, index) => (
							<li key={index}>{chat}</li>
						))}
					</Ol>
				</AccordionItem>
			)}
			<AccordionItem
				key="rating"
				aria-label="评级图例"
				title="评级图例"
				classNames={RATING_CLASS_NAMES}
			>
				{GUEST_RATING_KEY.filter((key) =>
					['exbad', 'norm', 'good'].includes(key)
				).map((ratingKey, index) => (
					<div key={index} className="flex items-center gap-3 px-1">
						<Avatar
							isBordered
							showFallback
							color={ratingKey}
							fallback={<div />}
							radius="sm"
							classNames={RATING_AVATAR_CLASS_NAMES}
						/>
						{GUEST_RATING_MAP[ratingKey]}
					</div>
				))}
			</AccordionItem>
			<AccordionItem
				key="help"
				aria-label="特别说明"
				title="特别说明"
				classNames={DESCRIPTION_CLASS_NAMES}
			>
				<div>
					<p className="font-semibold">搭配套餐</p>
					<Ol className="text-small">
						<li>
							套餐评级按一般营业情景计算。任务中的临时效果、符卡改判等特殊情况可能不会反映在结果中。
						</li>
						<li>
							点击顾客卡片中的料理或酒水标签，可以用该标签筛选对应表格；再次点击即可取消筛选。
						</li>
						<li>
							选择料理后即可评级并保存套餐，酒水可选。评级默认您已正确端上这位普客点单的料理和酒水。
						</li>
						<li>
							已保存套餐会按当前的流行趋势和明星店设置重新评级；隐藏或未拥有的内容不会显示。
						</li>
					</Ol>
				</div>
				<div>
					<p className="font-semibold">快捷功能</p>
					<Ol className="text-small">
						<li>
							<span className="hidden md:inline">
								从顶部进入“设置”
							</span>
							<span className="md:hidden">
								使用页面右下角的“设置”按钮，或从右上角菜单进入“设置”
							</span>
							，可以调整流行趋势、明星店、内容显示和数据管理等选项。
						</li>
						<li>
							点击导航栏的搜索按钮可查找资料、设置或直接应用筛选。名称搜索支持中文、拼音全拼和首字母。
						</li>
					</Ol>
				</div>
			</AccordionItem>
		</InfoButtonBase>
	);
}
