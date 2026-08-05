import { AccordionItem } from '@heroui/accordion';

import Avatar from '@/design/ui/components/avatar';
import Ol from '@/design/ui/components/ol';

import {
	CUSTOMER_RATING_KEY,
	CUSTOMER_RATING_MAP,
} from '@/domain/evaluation/labels';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import { customerNormalStore } from '@/features/catalog/customers/normal/client/state/store';
import InfoButtonBase, {
	InfoSectionTitle,
} from '@/features/catalog/customers/shared/client/components/infoButtonBase';
import Price from '@/features/catalog/shared/client/components/Price';

import { checkLengthEmpty } from '@/shared/utilities/collections/check';

export default function InfoButton() {
	const currentCustomerName = customerNormalStore.shared.customer.name.use();

	const instance_customer = customerNormalStore.instances.customer.get();

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
			overlayId="customer-normal.info"
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
				aria-label={`${currentCustomerName}介绍`}
				textValue={currentCustomerName}
				title={<InfoSectionTitle title={currentCustomerName} />}
				classNames={{
					content:
						'space-y-1 break-all pt-2 text-justify text-default-900',
				}}
			>
				<div className="flex items-center gap-4">
					<p>
						<span className="font-semibold">名字：</span>
						{currentCustomerName}
					</p>
					<p>
						<span className="font-semibold">ID：</span>
						<Price showSymbol={false}>{currentCustomerId}</Price>
					</p>
				</div>
				<p className="text-small">{currentCustomerDescription}</p>
			</AccordionItem>
			{checkLengthEmpty(currentCustomerChat) ? null : (
				<AccordionItem
					key="chat"
					aria-label="闲聊对话"
					title="闲聊对话"
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
				aria-label="评级图例"
				title="评级图例"
				classNames={{
					content:
						'grid grid-cols-3 content-start break-all pt-2 text-justify text-small text-default-900',
				}}
			>
				{CUSTOMER_RATING_KEY.filter((key) =>
					['exbad', 'norm', 'good'].includes(key)
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
				aria-label="特别说明"
				title="特别说明"
				classNames={{
					content:
						'space-y-1 break-all pt-2 text-justify text-default-900',
				}}
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
