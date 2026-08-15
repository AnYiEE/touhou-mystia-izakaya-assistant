export type TPartners = typeof import('./records').PARTNER_LIST;
export type TPartnerId = TPartners[number]['id'];
export type TPartnerName = TPartners[number]['name'];
