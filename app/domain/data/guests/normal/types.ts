export type TNormalGuests = typeof import('./records').NORMAL_GUEST_LIST;
export type TNormalGuestId = TNormalGuests[number]['id'];
export type TNormalGuestName = TNormalGuests[number]['name'];
