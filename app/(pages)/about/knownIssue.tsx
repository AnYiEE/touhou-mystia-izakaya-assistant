import {memo} from 'react';

import {Link} from '@nextui-org/react';

import H1 from '@/components/h1';
import Ul from '@/components/ul';

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
			</Ul>
		</>
	);
});
