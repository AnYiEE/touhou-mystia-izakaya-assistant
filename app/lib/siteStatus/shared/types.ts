export interface IDeploymentMaintenancePublicState {
	expires_at: number;
	id: string;
	level: 'warning';
	message: string;
	started_at: number;
}

export interface ISiteStatusData {
	maintenance: IDeploymentMaintenancePublicState | null;
	maintenance_available: boolean;
	visitors: number | null;
}
