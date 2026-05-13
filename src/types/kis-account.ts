export type KisAccountType = 'MOCK' | 'REAL';

export interface KisAccountRegisterRequest {
  appKey: string;
  appSecret: string;
  accountNumber: string;
  accountProductCode: string;
  accountType: KisAccountType;
  enabled: boolean;
}

export interface KisAccount {
  appKey: string;
  accountNumber: string;
  accountProductCode: string;
  accountType: KisAccountType;
  enabled: boolean;
  lastUsedAt: string | null;
  createdAt: string;
  deletedAt: string | null;
}
