import { BEVERAGE_LIST } from '../../app/domain/data/beverages/records';
import { FOOD_LIST } from '../../app/domain/data/foods/records';
import { NORMAL_GUEST_LIST } from '../../app/domain/data/guests/normal/records';
import { SPECIAL_GUEST_LIST } from '../../app/domain/data/guests/special/records';
import { INGREDIENT_LIST } from '../../app/domain/data/ingredients/records';

const RECORD_TAG_FIELDS = [
	'beverageTags',
	'negativeTags',
	'positiveTags',
	'tags',
] as const;

type TRecordTagField = (typeof RECORD_TAG_FIELDS)[number];
type TRecordWithTags = { id: number; name: string } & Partial<
	Record<TRecordTagField, ReadonlyArray<number>>
>;

function validateTagFields(
	category: string,
	records: ReadonlyArray<TRecordWithTags>,
	issues: string[]
): void {
	for (const record of records) {
		for (const field of RECORD_TAG_FIELDS) {
			const tags = record[field];
			if (tags === undefined) {
				continue;
			}

			let previous: number | undefined;
			for (const [index, current] of tags.entries()) {
				if (previous !== undefined && previous > current) {
					issues.push(
						`${category} ${record.id}:${record.name} ${field}[${index}] ${previous},${current}`
					);
					break;
				}
				previous = current;
			}
		}
	}
}

export function validateRecordTagOrder(): void {
	const issues: string[] = [];

	validateTagFields('beverage', BEVERAGE_LIST, issues);
	validateTagFields('food', FOOD_LIST, issues);
	validateTagFields('ingredient', INGREDIENT_LIST, issues);
	validateTagFields('normalGuest', NORMAL_GUEST_LIST, issues);
	validateTagFields('specialGuest', SPECIAL_GUEST_LIST, issues);

	if (issues.length > 0) {
		const MAX_REPORTED_ISSUES = 25;
		const reportedIssues = issues.slice(0, MAX_REPORTED_ISSUES);
		const omittedCount = issues.length - reportedIssues.length;

		throw new Error(
			[
				`Record tag IDs must be in ascending numeric order (${issues.length} arrays).`,
				...reportedIssues,
				...(omittedCount > 0
					? [`... ${omittedCount} additional arrays omitted.`]
					: []),
			].join('\n')
		);
	}
}
