import React from 'react';
import { Eye, EyeOff, Gift, RefreshCw, Globe } from 'lucide-react';

interface TopBarProps {
  logo?: React.ReactNode;
  appName?: string;
  isInvisible?: boolean;
  onInvisibleToggle?: () => void;
  onRaffleClick?: () => void;
  onRefresh?: () => void;
  onLanguageClick?: () => void;
  className?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  logo,
  appName = 'App',
  isInvisible = false,
  onInvisibleToggle,
  onRaffleClick,
  onRefresh,
  onLanguageClick,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-between px-3 py-2 border-b border-[#2C2C2E] bg-[#0A0A0A] ${className}`}>
      <div className="flex items-center gap-2">
        {logo}
        <span className="font-bold text-lg">{appName}</span>
      </div>

      <div className="flex items-center gap-1">
        {/* Raffle */}
        <button onClick={onRaffleClick} className="p-2 rounded-full hover:bg-[#2C2C2E]">
          <Gift className="w-5 h-5" />
        </button>

        {/* Invisible */}
        <button onClick={onInvisibleToggle} className="p-2 rounded-full hover:bg-[#2C2C2E]">
          {isInvisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>

        {/* Refresh */}
        <button onClick={onRefresh} className="p-2 rounded-full hover:bg-[#2C2C2E]">
          <RefreshCw className="w-5 h-5" />
        </button>

        {/* Language */}
        <button onClick={onLanguageClick} className="p-2 rounded-full hover:bg-[#2C2C2E]">
          <Globe className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
