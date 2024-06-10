type TagStyle = {
	backgroundColor: string;
	borderColor: string;
	color: string;
};

interface ITagStyle {
	beverage?: TagStyle;
	positive?: TagStyle;
	negative?: TagStyle;
}

export type {ITagStyle};
