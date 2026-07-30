import { checkEnvironmentFlag } from '../../app/infrastructure/environment/flags';

export const IS_OFFLINE = checkEnvironmentFlag(process.env.OFFLINE);
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const IS_SELF_HOSTED = checkEnvironmentFlag(process.env.SELF_HOSTED);
export const IS_SKIP_LINT =
	IS_OFFLINE ||
	(IS_PRODUCTION && checkEnvironmentFlag(process.env.SKIP_LINT));
export const IS_VERCEL = checkEnvironmentFlag(process.env.VERCEL);

export const CDN_URL = IS_OFFLINE ? '' : (process.env.CDN_URL ?? '');
