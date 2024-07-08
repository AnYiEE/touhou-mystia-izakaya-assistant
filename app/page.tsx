import {memo} from 'react';

import Loading from '@/loading';

import {siteConfig} from '@/configs';

const {shortName} = siteConfig;

export default memo(function Home() {
	return <Loading content={`欢迎使用${shortName}`} />;
});
