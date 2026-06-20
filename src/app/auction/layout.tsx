import StepsProgress from '@/components/shared/StepsProgress';

export default function AuctionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-w-0 overflow-x-hidden">
      <div className="px-3 sm:px-4 lg:px-6 pt-4 sm:pt-6 pb-2">
        <StepsProgress currentStep={5} />
      </div>
      <div className="px-3 sm:px-4 lg:px-6 pb-6 sm:pb-8">{children}</div>
    </div>
  );
}
