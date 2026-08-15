export type TDecorations = typeof import('./records').DECORATION_LIST;
export type TDecorationId = TDecorations[number]['id'];
export type TDecorationName = TDecorations[number]['name'];
