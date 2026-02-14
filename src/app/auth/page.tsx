export default function AuthPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(to bottom right, rgb(15, 23, 42), rgb(30, 41, 59), rgb(15, 23, 42))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1rem',
      }}
    >
      <div style={{ maxWidth: '28rem', width: '100%' }}>
        {/* Logo and Title */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 1rem',
              background: '#3b82f6',
              borderRadius: '1rem',
            }}
          />
          <h1
            style={{
              fontSize: '1.875rem',
              fontWeight: 'bold',
              background: 'linear-gradient(to right, rgb(52, 211, 153), rgb(34, 211, 238))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '0.5rem',
            }}
          >
            Alpha Foundry
          </h1>
          <p style={{ color: 'rgb(148, 163, 184)' }}>AI 기반 스마트 투자 플랫폼</p>
        </div>

        {/* Login Card */}
        <div
          style={{
            background: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid rgb(51, 65, 85)',
            borderRadius: '0.5rem',
            padding: '2rem',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: 'white',
                marginBottom: '0.5rem',
              }}
            >
              로그인
            </h2>
            <p style={{ color: 'rgb(148, 163, 184)', fontSize: '0.875rem' }}>
              계정에 로그인하여 투자 분석을 시작하세요
            </p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            {/* ID Input */}
            <div style={{ marginBottom: '1rem' }}>
              <label
                style={{
                  display: 'block',
                  color: 'rgb(203, 213, 225)',
                  fontSize: '0.875rem',
                  marginBottom: '0.5rem',
                }}
              >
                아이디
              </label>
              <input
                type="text"
                placeholder="아이디를 입력하세요"
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  background: 'rgba(51, 65, 85, 0.5)',
                  border: '1px solid rgb(71, 85, 105)',
                  borderRadius: '0.375rem',
                  color: 'white',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            {/* Password Input */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                style={{
                  display: 'block',
                  color: 'rgb(203, 213, 225)',
                  fontSize: '0.875rem',
                  marginBottom: '0.5rem',
                }}
              >
                비밀번호
              </label>
              <input
                type="password"
                placeholder="비밀번호를 입력하세요"
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  background: 'rgba(51, 65, 85, 0.5)',
                  border: '1px solid rgb(71, 85, 105)',
                  borderRadius: '0.375rem',
                  color: 'white',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            {/* Login Button */}
            <button
              style={{
                width: '100%',
                padding: '0.5rem 1rem',
                background: 'rgb(5, 150, 105)',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              로그인
            </button>
          </div>

          {/* Divider */}
          <div style={{ position: 'relative', margin: '1.5rem 0' }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '100%', borderTop: '1px solid rgb(71, 85, 105)' }} />
            </div>
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
              <span
                style={{
                  padding: '0 0.5rem',
                  background: 'rgb(30, 41, 59)',
                  color: 'rgb(100, 116, 139)',
                  fontSize: '0.875rem',
                }}
              >
                또는
              </span>
            </div>
          </div>

          {/* Naver Login Button */}
          <button
            style={{
              width: '100%',
              padding: '0.5rem 1rem',
              background: '#03C75A',
              color: 'white',
              border: '1px solid #03C75A',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <svg style={{ width: '1.25rem', height: '1.25rem' }} viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z"
              />
            </svg>
            네이버로 로그인
          </button>

          {/* Sign Up Link */}
          <p
            style={{
              textAlign: 'center',
              marginTop: '1rem',
              fontSize: '0.875rem',
              color: 'rgb(148, 163, 184)',
            }}
          >
            계정이 없으신가요?{' '}
            <a
              href="#"
              style={{ color: 'rgb(52, 211, 153)', fontWeight: '500', textDecoration: 'none' }}
            >
              회원가입
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
