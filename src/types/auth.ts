// 애플리케이션에서 사용하는 사용자 타입
export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    provider?: string;
  };
  app_metadata?: {
    provider?: string;
    providers?: string[];
  };
}

// 인증 컨텍스트 타입
export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (userId: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    userId: string,
    email: string,
    password: string,
    name?: string,
  ) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signInWithNaver: () => Promise<{ error?: string }>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
}

// 로그인/회원가입 폼 타입
export interface AuthFormData {
  userId?: string;
  email?: string;
  password: string;
  confirmPassword?: string;
  name?: string;
}

// 인증 에러 타입
export interface AuthError {
  message: string;
  status?: number;
}

// API 응답 타입
export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: AuthUser;
  message?: string;
  error?: string;
}

export interface SignUpResponse {
  success: boolean;
  message?: string;
  error?: string;
}
