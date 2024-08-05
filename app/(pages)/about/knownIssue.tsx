import {memo} from 'react';

import {Link} from '@nextui-org/react';

import H1 from '@/components/h1';
import Ul from '@/components/ul';

import {siteConfig} from '@/configs';

const {shortName} = siteConfig;

export default memo(function KnownIssue() {
	return (
		<>
			<H1>已知问题</H1>
			<Ul>
				<li>
					表格无法排序多个列：见
					<Link isExternal showAnchorIcon href="https://github.com/nextui-org/nextui/issues/2282">
						issue#2282
					</Link>
					。
				</li>
				<li>
					表格点击排序后默认升序：NextUI的
					<Link isExternal showAnchorIcon href="https://nextui.org/docs/components/table#api">
						Table组件
					</Link>
					尚未提供相关设置项。
				</li>
				<li className="text-justify">
					长按时意外地触发文本选择或弹出菜单：{shortName}
					通过为目标元素（如：顾客卡片中的料理和酒水标签）追加和文本选择相关的
					<Link isExternal showAnchorIcon href="https://drafts.csswg.org/css-ui/#content-selection">
						标准CSS属性
					</Link>
					，以及额外处理和弹出菜单相关的
					<Link isExternal showAnchorIcon href="https://w3c.github.io/uievents/#event-type-contextmenu">
						标准UI事件
					</Link>
					来禁用文本选择和弹出菜单。{shortName}
					的做法完全符合相关通用性标准，在遵守这些标准的浏览器下（如：Chrome、Edge和Firefox），目标元素的表现应如预期。
					如仍出现意外情况，请检查您所使用的浏览器是否遵守相关通用性标准或其本身是否魔改了部分机制（如：移动端的夸克浏览器、QQ浏览器和UC浏览器会强制文本可以选中并在选中后弹出它们自己的菜单），或是否开启了某些相关功能、插件、扩展或脚本。前述做法不属于通用性标准的一部分，
					{shortName}不会也无法为其做任何特殊处理。
				</li>
			</Ul>
		</>
	);
});
