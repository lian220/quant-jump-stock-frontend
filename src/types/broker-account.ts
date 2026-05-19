export type Broker = 'KIS' | 'TOSS';
export type AccountType = 'MOCK' | 'REAL';

export interface BrokerAccountRegisterRequest {
  broker: Broker;
  accountType: AccountType;
  accountNumber: string;
  accountProductCode?: string | null;
  accountAlias?: string | null;
  appKey: string;
  appSecret: string;
  enabled?: boolean;
}

export interface BrokerAccountUpdateRequest {
  accountNumber?: string;
  accountProductCode?: string | null;
  accountAlias?: string | null;
  appKey?: string;
  appSecret?: string;
  enabled?: boolean;
}

export interface BrokerAccount {
  id: number;
  broker: Broker;
  accountType: AccountType;
  accountNumber: string; // masked by BE
  accountProductCode: string | null;
  accountAlias: string | null;
  displayName: string;
  appKey: string; // masked by BE
  enabled: boolean;
  lastUsedAt: string | null;
  createdAt: string;
  deletedAt: string | null;
}

export interface BrokerAccountList {
  active: BrokerAccount[];
  trashed: BrokerAccount[];
}

/** broker 메타 — UI 라벨, 활성 여부 (Toss 는 disabled). */
export const BROKER_META: Record<
  Broker,
  { label: string; shortLabel: string; supported: boolean; description?: string }
> = {
  KIS: {
    label: '한국투자증권',
    shortLabel: 'KIS',
    supported: true,
  },
  TOSS: {
    label: '토스증권',
    shortLabel: 'TOSS',
    supported: false,
    description: '지원 예정',
  },
};

export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  MOCK: '모의',
  REAL: '실전',
};
