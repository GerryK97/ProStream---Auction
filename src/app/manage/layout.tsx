'use client';

import StepsProgress from '@/components/shared/StepsProgress';
import { usePathname } from 'next/navigation';

export default function ManageLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const currentStep = pathname.startsWith('/manage/tournaments') ? 1
    : pathname.startsWith('/manage/teams') ? 2
    : 3;

  return (
    <div>
      <div className="px-3 sm:px-6 pt-6 pb-2">
        <StepsProgress currentStep={currentStep} />
      </div>
      <div className="px-3 sm:px-6 pb-8">{children}</div>
    </div>
  );
}
