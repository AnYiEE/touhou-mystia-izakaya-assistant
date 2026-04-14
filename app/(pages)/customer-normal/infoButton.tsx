import { type ReactElement } from 'react';

import { AccordionItem } from '@heroui/accordion';

import { Avatar } from '@/design/ui/components';

import InfoButtonBase, {
	SiteInfo,
} from '@/(pages)/customer-rare/infoButtonBase';
import { trackEvent } from '@/components/analytics';
import Ol from '@/components/ol';
import Price from '@/components/price';

import { CUSTOMER_RATING_KEY, CUSTOMER_RATING_MAP } from '@/data';
import { t, tUI, tUIf } from '@/i18n';
import { customerNormalStore as store } from '@/stores';
import { checkLengthEmpty } from '@/utilities';

export default function InfoButton() {
	const currentCustomerName = store.shared.customer.name.use();

	const instance_customer = store.instances.customer.get();

	if (currentCustomerName === null) {
		return null;
	}

	const {
		chat: currentCustomerChat,
		description: currentCustomerDescription,
		id: currentCustomerId,
	} = instance_customer.getPropsByName(currentCustomerName);

	const getDefaultExpandedKeys = () => {
		const defaultExpandedKeys = ['description', 'rating'];

		if (!checkLengthEmpty(currentCustomerChat)) {
			defaultExpandedKeys.push('chat');
		}

		return defaultExpandedKeys;
	};

	return (
		<InfoButtonBase
			defaultExpandedKeys={getDefaultExpandedKeys()}
			onButtonPress={() => {
				trackEvent(
					trackEvent.category.click,
					'Info Button',
					currentCustomerName
				);
			}}
		>
			<AccordionItem
				key="description"
				aria-label={tUIf('{name}介绍', { name: t(currentCustomerName) })}
				textValue={currentCustomerName}
				title={
					<div className="flex items-center justify-between">
						<span>{currentCustomerName}</span>
						<SiteInfo />
					</div>
				}
				classNames={{
					content:
						'space-y-1 break-all pt-2 text-justify text-default-900',
				}}
			>
				<div className="flex items-center gap-4">
					<p>
						<span className="font-semibold">{tUI('名字：')}</span>
						{currentCustomerName}
					</p>
					<p>
						<span className="font-semibold">ID：</span>
						<Price showSymbol={false}>{currentCustomerId}</Price>
					</p>
				</div>
				<p className="text-small">{currentCustomerDescription}</p>
			</AccordionItem>
			{checkLengthEmpty(currentCustomerChat) ? (
				(null as unknown as ReactElement)
			) : (
				<AccordionItem
					key="chat"
					aria-label={tUI('闲聊对话')}
					title={tUI('闲聊对话')}
					classNames={{
						content:
							'break-all pt-2 text-justify text-small text-default-900',
					}}
				>
					<Ol>
						{currentCustomerChat.map((chat, index) => (
							<li key={index}>{chat}</li>
						))}
					</Ol>
				</AccordionItem>
			)}
			<AccordionItem
				key="rating"
				aria-label={tUI('评级图例')}
				title={tUI('评级图例')}
				classNames={{
					content:
						'grid grid-cols-3 content-start break-all pt-2 text-justify text-small text-default-900',
				}}
			>
				{CUSTOMER_RATING_KEY.filter(
					(key) => key === 'exbad' || key === 'norm' || key === 'good'
				).map((ratingKey, index) => (
					<div key={index} className="flex items-center gap-3 px-1">
						<Avatar
							isBordered
							showFallback
							color={ratingKey}
							fallback={<div />}
							radius="sm"
							classNames={{ base: 'h-6 w-2 ring-offset-0' }}
						/>
						{CUSTOMER_RATING_MAP[ratingKey]}
					</div>
				))}
			</AccordionItem>
			<AccordionItem
				key="help"
				aria-label={tUI('特别说明')}
				title={tUI('特别说明')}
				classNames={{
					content:
						'space-y-1 break-all pt-2 text-justify text-default-900',
				}}
			>
				<div>
					<p className="font-semibold">{tUI('选单时')}</p>
					<Ol className="text-small">
						<li>
							{tUI('最终的套餐评级只适合一般情景，如果有提供改判效果的符卡生效，此时的套餐评级可能会不够准确。')}
						</li>
						<li>
							{tUI('点击顾客卡片中的标签可以将该标签添加至表格筛选列表或从中移除。')}
						</li>
						<li>
							{tUI('点击套餐卡片中的厨具可以为当前套餐标记是否使用\u201c夜雀\u201d系列厨具，厨具类别是套餐评级时的参考维度之一。')}
						</li>
						<li>{tUI('\u201c保存套餐\u201d按钮仅会在选择了料理和酒水时被启用。')}</li>
						<li>
							{tUI('评级时，默认您正确选择了该普客所点单的料理和酒水。')}
						</li>
					</Ol>
				</div>
				<div>
					<p className="font-semibold">{tUI('交互时')}</p>
					<Ol className="text-small">
						<li>
							<span className="hidden md:inline">
								{tUI('点击顶部的\u201c设置\u201d按钮')}
							</span>
							<span className="md:hidden">
								{tUI('点击右上角的按钮打开菜单。再点击\u201c设置\u201d按钮')}
							</span>
							{tUI('，可以更改设置或使用数据管理功能。')}
						</li>
						<li>
							{/* cSpell:ignore haixian */}
							{tUI('所有的搜索框都支持模糊搜索，如使用\u201c海鲜\u201d、\u201chaixian\u201d或\u201chx\u201d均可搜索到\u201c海鲜味噌汤\u201d。')}
						</li>
					</Ol>
				</div>
			</AccordionItem>
		</InfoButtonBase>
	);
}
