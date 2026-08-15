export type TClothes = typeof import('./records').CLOTHES_LIST;
export type TClothesId = TClothes[number]['id'];
export type TClothesName = TClothes[number]['name'];
