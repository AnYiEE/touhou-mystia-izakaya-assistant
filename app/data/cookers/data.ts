/* eslint-disable sort-keys */
import type {ICooker} from './types';
import {DARK_MATTER_NAME, TAG_POPULAR_POSITIVE} from '@/data/constant';

export const COOKER_LIST = [
	{
		name: '煮锅',
		type: '煮锅',
		category: '初始',
		dlc: 0,
		effect: null,
		from: {
			buy: '【人间之里】香霖堂',
			self: true,
		},
	},
	{
		name: '烤架',
		type: '烤架',
		category: '初始',
		dlc: 0,
		effect: null,
		from: {
			buy: '【人间之里】香霖堂',
			self: true,
		},
	},
	{
		name: '油锅',
		type: '油锅',
		category: '初始',
		dlc: 0,
		effect: null,
		from: {
			buy: '【人间之里】香霖堂',
			self: true,
		},
	},
	{
		name: '蒸锅',
		type: '蒸锅',
		category: '初始',
		dlc: 0,
		effect: null,
		from: {
			buy: '【人间之里】香霖堂',
			self: true,
		},
	},
	{
		name: '料理台',
		type: '料理台',
		category: '初始',
		dlc: 0,
		effect: null,
		from: {
			buy: '【人间之里】香霖堂',
			self: true,
		},
	},
	{
		name: '夜雀煮锅',
		type: '煮锅',
		category: '夜雀',
		dlc: 0,
		effect: [
			'额外消耗25%料理时间。在完美完成“夜雀之歌”或在“热火朝天”状态下制作出的料理，可以无视顾客本轮点单需求，只通过喜好标签评级。',
			true,
		],
		from: {
			buy: '【人间之里】香霖堂',
		},
	},
	{
		name: '夜雀烤架',
		type: '烤架',
		category: '夜雀',
		dlc: 0,
		effect: [
			'额外消耗25%料理时间。在完美完成“夜雀之歌”或在“热火朝天”状态下制作出的料理，可以无视顾客本轮点单需求，只通过喜好标签评级。',
			true,
		],
		from: {
			buy: '【人间之里】香霖堂',
		},
	},
	{
		name: '夜雀油锅',
		type: '油锅',
		category: '夜雀',
		dlc: 0,
		effect: [
			'额外消耗25%料理时间。在完美完成“夜雀之歌”或在“热火朝天”状态下制作出的料理，可以无视顾客本轮点单需求，只通过喜好标签评级。',
			true,
		],
		from: {
			buy: '【人间之里】香霖堂',
		},
	},
	{
		name: '夜雀蒸锅',
		type: '蒸锅',
		category: '夜雀',
		dlc: 0,
		effect: [
			'额外消耗25%料理时间。在完美完成“夜雀之歌”或在“热火朝天”状态下制作出的料理，可以无视顾客本轮点单需求，只通过喜好标签评级。',
			true,
		],
		from: {
			buy: '【人间之里】香霖堂',
		},
	},
	{
		name: '夜雀料理台',
		type: '料理台',
		category: '夜雀',
		dlc: 0,
		effect: [
			'额外消耗25%料理时间。在完美完成“夜雀之歌”或在“热火朝天”状态下制作出的料理，可以无视顾客本轮点单需求，只通过喜好标签评级。',
			true,
		],
		from: {
			buy: '【人间之里】香霖堂',
		},
	},
	{
		name: '超煮锅',
		type: '煮锅',
		category: '超',
		dlc: 0,
		effect: '减少5%料理时间，增加3%续单概率。',
		from: {
			buy: '【人间之里】香霖堂',
		},
	},
	{
		name: '超烤架',
		type: '烤架',
		category: '超',
		dlc: 0,
		effect: '减少5%料理时间，增加3%续单概率。',
		from: {
			buy: '【人间之里】香霖堂',
		},
	},
	{
		name: '超油锅',
		type: '油锅',
		category: '超',
		dlc: 0,
		effect: '减少5%料理时间，增加3%续单概率。',
		from: {
			buy: '【人间之里】香霖堂',
		},
	},
	{
		name: '超蒸锅',
		type: '蒸锅',
		category: '超',
		dlc: 0,
		effect: '减少5%料理时间，增加3%续单概率。',
		from: {
			buy: '【人间之里】香霖堂',
		},
	},
	{
		name: '超料理台',
		type: '料理台',
		category: '超',
		dlc: 0,
		effect: '减少5%料理时间，增加3%续单概率。',
		from: {
			buy: '【人间之里】香霖堂',
		},
	},
	{
		name: '极煮锅',
		type: '煮锅',
		category: '极',
		dlc: 0,
		effect: '减少10%料理时间，增加8%续单概率。',
		from: {
			buy: '【人间之里】香霖堂',
		},
	},
	{
		name: '极烤架',
		type: '烤架',
		category: '极',
		dlc: 0,
		effect: '减少10%料理时间，增加8%续单概率。',
		from: {
			buy: '【人间之里】香霖堂',
		},
	},
	{
		name: '极油锅',
		type: '油锅',
		category: '极',
		dlc: 0,
		effect: '减少10%料理时间，增加8%续单概率。',
		from: {
			buy: '【人间之里】香霖堂',
		},
	},
	{
		name: '极蒸锅',
		type: '蒸锅',
		category: '极',
		dlc: 0,
		effect: '减少10%料理时间，增加8%续单概率。',
		from: {
			buy: '【人间之里】香霖堂',
		},
	},
	{
		name: '极料理台',
		type: '料理台',
		category: '极',
		dlc: 0,
		effect: '减少10%料理时间，增加8%续单概率。',
		from: {
			buy: '【人间之里】香霖堂',
		},
	},
	{
		name: '核能煮锅',
		type: '煮锅',
		category: '核能',
		dlc: 0,
		effect: [`减少50%料理时间。有40%的概率制作出“${DARK_MATTER_NAME}”，但如果完美歌唱会使此概率降低至5%。`, true],
		from: {
			buy: '【人间之里】香霖堂',
		},
	},
	{
		name: '核能烤架',
		type: '烤架',
		category: '核能',
		dlc: 0,
		effect: [`减少50%料理时间。有40%的概率制作出“${DARK_MATTER_NAME}”，但如果完美歌唱会使此概率降低至5%。`, true],
		from: {
			buy: '【人间之里】香霖堂',
		},
	},
	{
		name: '核能油锅',
		type: '油锅',
		category: '核能',
		dlc: 0,
		effect: [`减少50%料理时间。有40%的概率制作出“${DARK_MATTER_NAME}”，但如果完美歌唱会使此概率降低至5%。`, true],
		from: {
			buy: '【人间之里】香霖堂',
		},
	},
	{
		name: '核能蒸锅',
		type: '蒸锅',
		category: '核能',
		dlc: 0,
		effect: [`减少50%料理时间。有40%的概率制作出“${DARK_MATTER_NAME}”，但如果完美歌唱会使此概率降低至5%。`, true],
		from: {
			buy: '【人间之里】香霖堂',
		},
	},
	{
		name: '核能料理台',
		type: '料理台',
		category: '核能',
		dlc: 0,
		effect: [`减少50%料理时间。有40%的概率制作出“${DARK_MATTER_NAME}”，但如果完美歌唱会使此概率降低至5%。`, true],
		from: {
			buy: '【人间之里】香霖堂',
		},
	},
	{
		name: '可疑煮锅',
		type: '煮锅',
		category: '可疑',
		dlc: 0,
		effect: ['额外消耗10%料理时间，增加30%续单概率。', true],
		from: {
			buy: '【人间之里】香霖堂',
		},
	},
	{
		name: '可疑烤架',
		type: '烤架',
		category: '可疑',
		dlc: 0,
		effect: ['额外消耗10%料理时间，增加30%续单概率。', true],
		from: {
			buy: '【人间之里】香霖堂',
		},
	},
	{
		name: '可疑油锅',
		type: '油锅',
		category: '可疑',
		dlc: 0,
		effect: ['额外消耗10%料理时间，增加30%续单概率。', true],
		from: {
			buy: '【人间之里】香霖堂',
		},
	},
	{
		name: '可疑蒸锅',
		type: '蒸锅',
		category: '可疑',
		dlc: 0,
		effect: ['额外消耗10%料理时间，增加30%续单概率。', true],
		from: {
			buy: '【人间之里】香霖堂',
		},
	},
	{
		name: '可疑料理台',
		type: '料理台',
		category: '可疑',
		dlc: 0,
		effect: ['额外消耗10%料理时间，增加30%续单概率。', true],
		from: {
			buy: '【人间之里】香霖堂',
		},
	},
	{
		name: '月见煮锅',
		type: '煮锅',
		category: '月见',
		dlc: 0,
		effect: ['每次烹饪有40%的概率生成一只小兔子，每只小兔子额外提升5%的可叠加小费倍率，持续20秒。', true],
		from: {
			buy: '【人间之里】香霖堂',
		},
	},
	{
		name: '月见烤架',
		type: '烤架',
		category: '月见',
		dlc: 0,
		effect: ['每次烹饪有40%的概率生成一只小兔子，每只小兔子额外提升5%的可叠加小费倍率，持续20秒。', true],
		from: {
			buy: '【人间之里】香霖堂',
		},
	},
	{
		name: '月见油锅',
		type: '油锅',
		category: '月见',
		dlc: 0,
		effect: ['每次烹饪有40%的概率生成一只小兔子，每只小兔子额外提升5%的可叠加小费倍率，持续20秒。', true],
		from: {
			buy: '【人间之里】香霖堂',
		},
	},
	{
		name: '月见蒸锅',
		type: '蒸锅',
		category: '月见',
		dlc: 0,
		effect: ['每次烹饪有40%的概率生成一只小兔子，每只小兔子额外提升5%的可叠加小费倍率，持续20秒。', true],
		from: {
			buy: '【人间之里】香霖堂',
		},
	},
	{
		name: '月见料理台',
		type: '料理台',
		category: '月见',
		dlc: 0,
		effect: ['每次烹饪有40%的概率生成一只小兔子，每只小兔子额外提升5%的可叠加小费倍率，持续20秒。', true],
		from: {
			buy: '【人间之里】香霖堂',
		},
	},
	{
		name: '星尘鼎沸',
		type: '煮锅',
		category: 'DLC',
		dlc: 1,
		effect: [
			'额外消耗40%料理时间，使用此厨具累计60秒后，改为减少80%料理时间，同时料理后可以生成一个以下食材：最贵的、最便宜的、最多的、最少的、蘑菇或松露。',
			true,
		],
		from: '【DLC1】支线任务',
	},
	{
		name: '纯粹炼狱',
		type: '油锅',
		category: 'DLC',
		dlc: 2,
		effect: [
			'减少20%料理时间。烹饪结束后，此厨具会自动开始制作上一次制作的料理（包含额外添加的食材），自动制作不消耗食材且可以随时打断。',
			true,
		],
		from: '完成“怪诞料理大赛”后自动获得',
	},
	{
		name: '紫薇天火',
		type: '烤架',
		category: 'DLC',
		dlc: 3,
		effect: ['减少15%料理时间，瞬间完成带有“肉”标签的料理，有30%的概率返还料理食材。', true],
		from: {
			bond: '物部布都',
		},
	},
	{
		name: '冯风渡御',
		type: '蒸锅',
		category: 'DLC',
		dlc: 4,
		effect: [
			`减少20%料理时间；如果没有添加任何额外食材，则减少70%料理时间，否则增加30%续单率。如果料理带有“${TAG_POPULAR_POSITIVE}”标签则二者同时触发。`,
			true,
		],
		from: {
			bond: '射命丸文',
		},
	},
	{
		name: '魔人经板',
		type: '料理台',
		category: 'DLC',
		dlc: 5,
		effect: [
			'如果制作的料理不带有“肉”标签，则减少50%料理时间，否则增加30%料理时间。此厨具制作出的料理被顾客食用并给出评价后，接下来给任何顾客由此厨具制作的相同料理必然会得到相同评价。',
			true,
		],
		from: {
			buy: '【魔界】蓬松松爱莲♡魔法店',
		},
	},
	{
		name: '三位一体',
		type: ['煮锅', '油锅', '蒸锅'],
		category: 'DLC',
		dlc: 5,
		effect: ['减少33%料理时间。可以同时作为煮锅、油锅和蒸锅使用。', true],
		from: {
			buy: '【魔界】蓬松松爱莲♡魔法店',
		},
	},
] as const satisfies ICooker[];
