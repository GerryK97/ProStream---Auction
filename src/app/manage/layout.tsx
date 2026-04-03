'use client';

import StepsProgress from '@/components/shared/StepsProgress';
import { usePathname } from 'next/navigation';

export default function ManageLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Mobile auction page gets no wrapper padding or step progress
  if (pathname === '/manage/auction-mobile') {
    return <>{children}</>;
  }

  const currentStep = pathname.startsWith('/manage/tournaments') ? 1
    : pathname.startsWith('/manage/teams') ? 2
    : 3;

  return (
    <div>
      <div className="px-6 pt-6 pb-2">
        <StepsProgress currentStep={currentStep} />
      </div>
      <div className="px-6 pb-8">{children}</div>
    </div>
  );
}
