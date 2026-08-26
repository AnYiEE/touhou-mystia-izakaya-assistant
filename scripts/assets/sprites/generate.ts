import lodash from 'lodash';
import minimist from 'minimist';
import { access, readFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import sharp from 'sharp';

import { BADGE_LIST } from '@/domain/data/badges/records';
import { BEVERAGE_LIST } from '@/domain/data/beverages/records';
import { CLOTHES_LIST } from '@/domain/data/clothes/records';
import { COOKER_LIST } from '@/domain/data/cookers/records';
import { CURRENCY_ITEM_LIST } from '@/domain/data/currencyItems/records';
import { DECORATION_LIST } from '@/domain/data/decorations/records';
import { FOOD_LIST } from '@/domain/data/foods/records';
import { FISHING_COLLECTIBLE_LIST } from '@/domain/data/fishingCollectibles/records';
import { GENERAL_ITEM_LIST } from '@/domain/data/generalItems/records';
import { NORMAL_GUEST_LIST } from '@/domain/data/guests/normal/records';
import { SPECIAL_GUEST_LIST } from '@/domain/data/guests/special/records';
import { INGREDIENT_LIST } from '@/domain/data/ingredients/records';
import { PARTNER_LIST } from '@/domain/data/partners/records';
import { RECORD_LIST } from '@/domain/data/records/records';
import {
	BADGE_SPRITE_CONFIG,
	BEVERAGE_SPRITE_CONFIG,
	CLOTHES_SPRITE_CONFIG,
	COOKER_SPRITE_CONFIG,
	CURRENCY_ITEM_SPRITE_CONFIG,
	DECORATION_SPRITE_CONFIG,
	FISHING_COLLECTIBLE_SPRITE_CONFIG,
	FOOD_SPRITE_CONFIG,
	GENERAL_ITEM_SPRITE_CONFIG,
	INGREDIENT_SPRITE_CONFIG,
	NORMAL_GUEST_SPRITE_CONFIG,
	PARTNER_SPRITE_CONFIG,
	RECORD_SPRITE_CONFIG,
	SPECIAL_GUEST_SPRITE_CONFIG,
} from '@/domain/data/sprites/configs';
import type { ISpriteConfig, TSpriteTarget } from '@/domain/data/sprites/types';

const ID_FORMAT_THRESHOLD = 9000;
const PNG_COMPRESSION_LEVEL = 9;

const projectPath = resolve(import.meta.dirname, '../../..');
const publicAssetsPath = resolve(projectPath, 'public/assets/sprites');
const spriteInputPath = resolve(import.meta.dirname, 'input');

interface ISpriteCategory {
	config: ISpriteConfig;
	list: Array<{ id: number }>;
	name: string;
	outputName: `${TSpriteTarget}.png`;
	preserveOriginalSize?: boolean;
}

interface ISpriteItem {
	id: number;
	path: string;
}

interface IGenerationStats {
	category: string;
	missingFileIds: number[];
	missingFiles: number;
	totalItems: number;
}

async function compositeSprites(
	sprites: ISpriteItem[],
	config: ISpriteConfig,
	outputPath: string,
	preserveOriginalSize = false
) {
	const {
		col,
		row,
		size: { height, width },
	} = config;
	const missingFileIds: number[] = [];

	const compositeOperations = await Promise.all(
		lodash.chunk(sprites, col).flatMap((row, rowIndex) =>
			row.map(async (sprite, colIndex) => {
				let buffer: Buffer;

				try {
					buffer = await readFile(sprite.path);
				} catch {
					missingFileIds.push(sprite.id);
					buffer = await sharp({
						create: {
							background: { alpha: 0, b: 0, g: 0, r: 0 },
							channels: 4,
							height,
							width,
						},
					})
						.png()
						.toBuffer();
				}

				const image = sharp(buffer);
				const metadata = await image.metadata();
				const sourceHeight = metadata.height;
				const sourceWidth = metadata.width;

				if (
					preserveOriginalSize &&
					(sourceHeight > height || sourceWidth > width)
				) {
					throw new Error(
						`Sprite ${sprite.id} has invalid dimensions ${sourceWidth}×${sourceHeight} for its ${width}×${height} cell.`
					);
				}

				const needsResize =
					metadata.width !== width || metadata.height !== height;
				const processedBuffer = needsResize
					? preserveOriginalSize
						? await image
								.extend({
									background: { alpha: 0, b: 0, g: 0, r: 0 },
									bottom:
										height -
										sourceHeight -
										Math.floor((height - sourceHeight) / 2),
									left: Math.floor((width - sourceWidth) / 2),
									right:
										width -
										sourceWidth -
										Math.floor((width - sourceWidth) / 2),
									top: Math.floor(
										(height - sourceHeight) / 2
									),
								})
								.toBuffer()
						: await image
								.resize({ height, kernel: 'nearest', width })
								.toBuffer()
					: buffer;

				return {
					input: processedBuffer,
					left: colIndex * width,
					top: rowIndex * height,
				};
			})
		)
	);

	const composited = sharp({
		create: {
			background: { alpha: 0, b: 0, g: 0, r: 0 },
			channels: 4,
			height: height * row,
			width: width * col,
		},
	})
		.composite(compositeOperations)
		.png({ compressionLevel: PNG_COMPRESSION_LEVEL });

	await composited.toFile(outputPath);

	return { missingCount: missingFileIds.length, missingFileIds };
}

function formatId(id: number) {
	if (id >= 0 && id < ID_FORMAT_THRESHOLD) {
		return id.toString().padStart(4, '0');
	}
	return id.toString();
}

function generateSpriteData(list: Array<{ id: number }>, categoryName: string) {
	return list.map<ISpriteItem>((item) => ({
		id: item.id,
		path: resolve(
			spriteInputPath,
			`${categoryName}/${formatId(item.id)}.png`
		),
	}));
}

async function generateSingleCategory(
	category: ISpriteCategory
): Promise<IGenerationStats> {
	try {
		const spriteData = generateSpriteData(category.list, category.name);
		const outputPath = resolve(publicAssetsPath, category.outputName);

		const result = await compositeSprites(
			spriteData,
			category.config,
			outputPath,
			category.preserveOriginalSize ?? false
		);

		return {
			category: category.outputName,
			missingFileIds: result.missingFileIds,
			missingFiles: result.missingCount,
			totalItems: category.list.length,
		};
	} catch (error) {
		console.error(`✗ ${category.outputName} 生成失败:`, error);
		throw error;
	}
}

function normalizePath(path: string) {
	return path.replaceAll('\\', '/');
}

export async function generateSprites(
	categoriesToGenerate?: string[],
	isDryRun = false
) {
	const allCategories: ISpriteCategory[] = [
		{
			config: BADGE_SPRITE_CONFIG,
			list: BADGE_LIST,
			name: 'badges',
			outputName: 'badge.png',
			preserveOriginalSize: true,
		},
		{
			config: BEVERAGE_SPRITE_CONFIG,
			list: BEVERAGE_LIST,
			name: 'beverages',
			outputName: 'beverage.png',
		},
		{
			config: CLOTHES_SPRITE_CONFIG,
			list: CLOTHES_LIST,
			name: 'clothes',
			outputName: 'clothes.png',
		},
		{
			config: COOKER_SPRITE_CONFIG,
			list: COOKER_LIST,
			name: 'cookers',
			outputName: 'cooker.png',
		},
		{
			config: CURRENCY_ITEM_SPRITE_CONFIG,
			list: CURRENCY_ITEM_LIST,
			name: 'currency_items',
			outputName: 'currency_item.png',
		},
		{
			config: DECORATION_SPRITE_CONFIG,
			list: DECORATION_LIST,
			name: 'decorations',
			outputName: 'decoration.png',
		},
		{
			config: FOOD_SPRITE_CONFIG,
			list: FOOD_LIST,
			name: 'foods',
			outputName: 'food.png',
		},
		{
			config: INGREDIENT_SPRITE_CONFIG,
			list: INGREDIENT_LIST,
			name: 'ingredients',
			outputName: 'ingredient.png',
		},
		{
			config: GENERAL_ITEM_SPRITE_CONFIG,
			list: GENERAL_ITEM_LIST,
			name: 'items',
			outputName: 'item.png',
		},
		{
			config: NORMAL_GUEST_SPRITE_CONFIG,
			list: NORMAL_GUEST_LIST,
			name: 'normal_guests',
			outputName: 'normal_guest.png',
		},
		{
			config: PARTNER_SPRITE_CONFIG,
			list: PARTNER_LIST,
			name: 'partners',
			outputName: 'partner.png',
		},
		{
			config: RECORD_SPRITE_CONFIG,
			list: RECORD_LIST,
			name: 'records',
			outputName: 'record.png',
		},
		{
			config: SPECIAL_GUEST_SPRITE_CONFIG,
			list: SPECIAL_GUEST_LIST,
			name: 'special_guests',
			outputName: 'special_guest.png',
		},
		{
			config: FISHING_COLLECTIBLE_SPRITE_CONFIG,
			list: FISHING_COLLECTIBLE_LIST,
			name: 'trophies',
			outputName: 'trophy.png',
		},
	];

	const categories = categoriesToGenerate
		? allCategories.filter((category) =>
				categoriesToGenerate.includes(category.name)
			)
		: allCategories;

	if (categories.length === 0) {
		console.error('错误：未找到匹配的类别');
		return;
	}

	if (isDryRun) {
		await access(publicAssetsPath);
		for (const category of categories) {
			const inputPath = resolve(spriteInputPath, category.name);
			const outputPath = resolve(publicAssetsPath, category.outputName);
			await access(inputPath);
			console.log(
				`${category.name}: ${normalizePath(relative(projectPath, inputPath))} -> ${normalizePath(relative(projectPath, outputPath))}`
			);
		}
		return;
	}

	console.log(`开始生成 ${categories.length} 个类别的精灵图...\n`);

	const results = await Promise.all(
		categories.map(async (category) => {
			try {
				return await generateSingleCategory(category);
			} catch (error) {
				return { error } as const;
			}
		})
	);

	const stats: IGenerationStats[] = [];
	let failureCount = 0;
	let successCount = 0;

	for (const result of results) {
		if ('error' in result) {
			failureCount++;
		} else {
			successCount++;
			stats.push(result);
			const { category, missingFileIds, missingFiles, totalItems } =
				result;
			if (missingFiles > 0) {
				console.log(
					`✓ ${category} 已生成 (缺失 ${missingFiles}/${totalItems})`
				);
				console.log(`    缺失文件ID: ${missingFileIds.join(', ')}`);
			} else {
				console.log(`✓ ${category} 已生成`);
			}
		}
	}

	const totalMissing = stats.reduce(
		(sum, stat) => sum + stat.missingFiles,
		0
	);

	console.log(`\n${'='.repeat(50)}`);
	console.log(`生成完成: ${successCount} 成功, ${failureCount} 失败`);
	if (totalMissing > 0) {
		console.log(`总计缺失文件: ${totalMissing}`);
	}
	console.log('='.repeat(50));
}

const cliArguments = process.argv.slice(2);
const argv = minimist<{
	categories?: string;
	'dry-run'?: boolean;
	help?: boolean;
}>(cliArguments[0] === '--' ? cliArguments.slice(1) : cliArguments);
const categoriesToGenerate = argv.categories
	? argv.categories
			.split(/[,\s]+/u)
			.map((category) => category.trim())
			.filter(Boolean)
	: undefined;

if (argv.help) {
	console.log(`使用方法:
  1. 更新对应的 app/domain/data/**/records.ts 中的数据
  2. 将需要更新的精灵图片放入 scripts/assets/sprites/input/<category>/ 目录，按 records.ts 中对应的 ID 命名（不足四位前面补零）
  3. 运行以下命令：
     pnpm sprites -- [选项]

选项:
  --categories <名称>  仅生成指定的类别（逗号或空格分隔）
                       可用类别: badges, beverages, clothes, cookers,
                                 currency_items, decorations, foods, ingredients,
                                 items, normal_guests, partners, records,
                                 special_guests, trophies
  --dry-run            仅验证并显示输入/输出路径，不写入精灵图
  --help               显示此帮助信息

示例:
pnpm sprites
pnpm sprites -- --categories beverages,clothes
pnpm sprites -- --dry-run`);
} else {
	await generateSprites(categoriesToGenerate, argv['dry-run']);
}
