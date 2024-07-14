import {memo} from 'react';

import {Link} from '@nextui-org/react';

import H1 from './h1';

export default memo(function KnownIssue() {
	return (
		<>
			<H1>已知问题</H1>
			<ul className="flex list-inside list-decimal flex-col gap-2">
				<li>
					表格无法排序多个列：见
					<Link isExternal href="https://github.com/nextui-org/nextui/issues/2282">
						issue#2282
					</Link>
					。
				</li>
				<li>
					表格点击排序后默认升序：NextUI的
					<Link isExternal href="https://nextui.org/docs/components/table#api">
						Table组件
					</Link>
					尚未提供相关设置项。
				</li>
			</ul>
		</>
	);
});
