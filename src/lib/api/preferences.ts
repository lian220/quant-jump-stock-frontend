import { clientApi } from '@/lib/api-client';

export interface PreferencesData {
  investmentCategories: string[];
  markets: string[];
  riskTolerance: string | null;
  onboardingCompleted: boolean;
}

interface PreferencesResponse {
  success: boolean;
  preferences: PreferencesData | null;
  message?: string;
}

/**
 * 사용자 투자 성향 조회
 */
export async function getPreferences(): Promise<PreferencesData | null> {
  try {
    const response = await clientApi.get<PreferencesResponse>('/api/user/preferences');
    if (response.data.success && response.data.preferences) {
      return response.data.preferences;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 사용자 투자 성향 저장
 */
export async function savePreferences(prefs: {
  investmentCategories: string[];
  markets: string[];
  riskTolerance: string | null;
}): Promise<boolean> {
  try {
    const response = await clientApi.put<PreferencesResponse>('/api/user/preferences', prefs);
    return response.data.success === true;
  } catch {
    return false;
  }
}
