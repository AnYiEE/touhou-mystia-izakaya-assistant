export type TSpecialGuests = typeof import('./records').SPECIAL_GUEST_LIST;
export type TSpecialGuestId = TSpecialGuests[number]['id'];
export type TSpecialGuestName = TSpecialGuests[number]['name'];
