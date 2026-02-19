import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900">
      <div className="text-center space-y-4 p-8">
        <h2 className="text-4xl font-bold text-white">404</h2>
        <p className="text-xl text-slate-300">페이지를 찾을 수 없습니다</p>
        <p className="text-slate-400">요청하신 페이지가 존재하지 않거나 이동되었습니다.</p>
        <Link href="/">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
            홈으로 돌아가기
          </Button>
        </Link>
      </div>
    </div>
  );
}
