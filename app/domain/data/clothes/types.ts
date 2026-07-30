export type TClothes = typeof import('./records').CLOTHES_LIST;
export type TClothesName = TClothes[number]['name'];
