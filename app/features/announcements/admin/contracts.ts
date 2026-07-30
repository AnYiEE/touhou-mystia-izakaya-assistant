import type { IAdminMeData } from '@/features/account/contracts';
import {
	type IAdminAnnouncementListData,
	type IAdminAnnouncementProfile,
	type IAdminAnnouncementVersionListData,
} from '@/features/announcements/contracts';

export interface IAdminAnnouncementsInitialData {
	admin: IAdminMeData | null;
	announcements: IAdminAnnouncementListData | null;
	isAuthLoading: boolean;
	message: string | null;
	renderedAt: number;
}

export interface IAdminAnnouncementFormInitialData {
	admin: IAdminMeData | null;
	announcement: IAdminAnnouncementProfile | null;
	isAnnouncementServerLoaded: boolean;
	isAuthLoading: boolean;
	loadError: string | null;
	message: string | null;
	versions: IAdminAnnouncementVersionListData | null;
}
