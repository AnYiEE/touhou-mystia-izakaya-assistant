import lodash from 'lodash';
import minimist from 'minimist';
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import {
	BEVERAGE_LIST,
	BEVERAGE_SPRITE_CONFIG,
	CLOTHES_LIST,
	CLOTHES_SPRITE_CONFIG,
	COOKER_LIST,
	COOKER_SPRITE_CONFIG,
	CURRENCY_LIST,
	CURRENCY_SPRITE_CONFIG,
	CUSTOMER_NORMAL_LIST,
	CUSTOMER_NORMAL_SPRITE_CONFIG,
	CUSTOMER_RARE_LIST,
	CUSTOMER_RARE_SPRITE_CONFIG,
	INGREDIENT_LIST,
	INGREDIENT_SPRITE_CONFIG,
	ORNAMENT_LIST,
	ORNAMENT_SPRITE_CONFIG,
	PARTNER_LIST,
	PARTNER_SPRITE_CONFIG,
	RECIPE_LIST,
	RECIPE_SPRITE_CONFIG,
} from '@/data';
import type { ISpriteConfig, TSpriteTarget } from '@/utils/sprite/types';

const ID_FORMAT_THRESHOLD = 9000;
const PNG_COMPRESSION_LEVEL = 9;

const publicAssetsPath = resolve(
	import.meta.dirname,
	'../public/assets/sprites'
);

interface ISpriteCategory {
	config: ISpriteConfig;
	list: Array<{ id: number }>;
	name: string;
	outputName: `${TSpriteTarget}.png`;
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
	outputPath: string
) {
	const {
		col,
		row,
		size: { height, width },
	} = config;
	const missingFileIds: number[] = [];

	const compositeOperations = await Promise.all(
		lodash.chunk(sprites, col).flatMap((rowSprites, rowIndex) =>
			rowSprites.map(async (sprite, colIndex) => {
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

				const needsResize =
					metadata.width !== width || metadata.height !== height;
				const processedBuffer = needsResize
					? await image
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
			import.meta.dirname,
			`sprites/${categoryName}/${formatId(item.id)}.png`
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
			outputPath
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

export async function generateSprites(categoriesToGenerate?: string[]) {
	const allCategories: ISpriteCategory[] = [
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
			config: CURRENCY_SPRITE_CONFIG,
			list: CURRENCY_LIST,
			name: 'currencies',
			outputName: 'currency.png',
		},
		{
			config: CUSTOMER_NORMAL_SPRITE_CONFIG,
			list: CUSTOMER_NORMAL_LIST,
			name: 'customer_normal',
			outputName: 'customer_normal.png',
		},
		{
			config: CUSTOMER_RARE_SPRITE_CONFIG,
			list: CUSTOMER_RARE_LIST,
			name: 'customer_rare',
			outputName: 'customer_rare.png',
		},
		{
			config: INGREDIENT_SPRITE_CONFIG,
			list: INGREDIENT_LIST,
			name: 'ingredients',
			outputName: 'ingredient.png',
		},
		{
			config: ORNAMENT_SPRITE_CONFIG,
			list: ORNAMENT_LIST,
			name: 'ornaments',
			outputName: 'ornament.png',
		},
		{
			config: PARTNER_SPRITE_CONFIG,
			list: PARTNER_LIST,
			name: 'partners',
			outputName: 'partner.png',
		},
		{
			config: RECIPE_SPRITE_CONFIG,
			list: RECIPE_LIST,
			name: 'recipes',
			outputName: 'recipe.png',
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

const argv = minimist<{ categories?: string; help?: boolean }>(
	process.argv.slice(2)
);
const categoriesToGenerate = argv.categories
	? argv.categories
			.split(/[,\s]+/u)
			.map((category) => category.trim())
			.filter(Boolean)
	: undefined;

if (argv.help) {
	console.log(`使用方法:
  1. 更新 app/data/<category>/data.ts 中的数据
  2. 将需要更新的精灵图片放入 scripts/sprites/<category>/ 目录，按 data.ts 中对应的 ID 命名（不足四位前面补零）
  3. 运行以下命令：
     pnpm tsx scripts/generateSprites.ts [选项]

选项:
  --categories <名称>  仅生成指定的类别（逗号或空格分隔）
                       可用类别: beverages, clothes, cookers, currencies,
                                 customer_normal, customer_rare, ingredients,
                                 ornaments, partners, recipes
  --help               显示此帮助信息

示例:
pnpm tsx scripts/generateSprites.ts
pnpm tsx scripts/generateSprites.ts --categories beverages,clothes`);
} else {
	await generateSprites(categoriesToGenerate);
}
