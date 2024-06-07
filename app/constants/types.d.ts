type TagStyle = {
	backgroundColor: string;
	borderColor: string;
	color: string;
};

interface ITagStyle {
	beverages?: TagStyle;
	positive?: TagStyle;
	negative?: TagStyle;
}

export type {ITagStyle};
