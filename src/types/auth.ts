// 애플리케이션에서 사용하는 사용자 타입 (백엔드 UserInfo 응답과 매칭)
export interface AuthUser {
  userId: string;
  name?: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
}

// 인증 컨텍스트 타입
export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  signIn: (userId: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    userId: string,
    email: string,
    password: string,
    name?: string,
    phone?: string,
  ) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  // signInWithGoogle: () => Promise<{ error?: string }>; // 구글 로그인 비활성화
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
  phone?: string;
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
  token?: string;
  user?: AuthUser;
  error?: string;
}
