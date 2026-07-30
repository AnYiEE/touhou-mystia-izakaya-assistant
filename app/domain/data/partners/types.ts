export type TPartners = typeof import('./records').PARTNER_LIST;
export type TPartnerName = TPartners[number]['name'];
