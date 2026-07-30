import type { TSession } from '@/infrastructure/database/schema';

export type TAuthenticatedSessionIdentity = Pick<TSession, 'id' | 'token_hash'>;
