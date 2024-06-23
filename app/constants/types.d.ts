export type TagStyle = {
	backgroundColor: string;
	borderColor: string;
	color: string;
};

export interface ITagStyle {
	beverage?: TagStyle;
	positive?: TagStyle;
	negative?: TagStyle;
}
