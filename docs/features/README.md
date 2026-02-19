# Frontend Features

사용자용 웹 애플리케이션 기능 정의

## Status

| Feature | Status | Priority |
|---------|--------|----------|
| [Dashboard](./대시보드.md) | Draft | P0 |
| [Stock Analysis](./종목_분석.md) | Draft | P0 |
| [Auto Trading](./자동_트레이딩.md) | Draft | P1 |
| [Account](./계정.md) | Draft | P1 |
| [Trades](./거래.md) | Draft | P2 |
| [Settings](./설정.md) | Draft | P2 |

## Page Structure

```
/                    # Landing page
/auth                # Login/Sign up ✅ Done
/payment             # Payment ✅ Done
/dashboard           # Main dashboard
/stocks              # Stock list & analysis
/stocks/[symbol]     # Stock detail
/trading             # Auto trading config
/account             # KIS account management
/trades              # Trade history
/settings            # User settings
```

## Tech Stack

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- Shadcn/ui
- Supabase Auth
