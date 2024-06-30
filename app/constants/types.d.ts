export type TTagStyle = {
	backgroundColor: string;
	borderColor: string;
	color: string;
};

export interface ITagStyle {
	beverage?: TTagStyle;
	negative?: TTagStyle;
	positive?: TTagStyle;
}
