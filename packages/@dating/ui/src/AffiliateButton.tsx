import React from 'react';

export interface AffiliateButtonProps {
  affiliateUrl?: string;
  onClick?: () => void;
  className?: string;
  label?: string;
  description?: string;
  commission?: string;
}

export function AffiliateButton({
  affiliateUrl,
  onClick,
  className = '',
  label = 'Affiliate Program',
  description = 'Earn lifetime commission',
  commission = '5%',
}: AffiliateButtonProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (affiliateUrl) {
      const tg = (window as any).Telegram?.WebApp;
      if (tg?.openTelegramLink) {
        tg.openTelegramLink(affiliateUrl);
      } else {
        window.open(affiliateUrl, '_blank');
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`flex w-full items-center justify-between rounded-2xl bg-[#1F1F23] p-4 active:bg-[#2C2C2E] transition ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="text-2xl">🤝</div>
        <div className="text-left">
          <div className="font-semibold">{label}</div>
          <div className="text-xs text-[#8E8E93]">{description}</div>
        </div>
      </div>
      <div className="text-sm font-bold text-green-400">{commission} →</div>
    </button>
  );
}
