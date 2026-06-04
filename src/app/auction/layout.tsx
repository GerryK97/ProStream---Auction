import StepsProgress from '@/components/shared/StepsProgress';

export default function AuctionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="px-6 pt-6 pb-2">
        <StepsProgress currentStep={4} />
      </div>
      <div className="px-6 py-8">{children}</div>
    </div>
  );
}
