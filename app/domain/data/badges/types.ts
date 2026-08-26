export type TBadges = typeof import('./records').BADGE_RECORDS;
export type TBadgeId = TBadges[number]['id'];
export type TBadgeName = TBadges[number]['name'];
