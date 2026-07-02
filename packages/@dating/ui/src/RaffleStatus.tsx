import React from 'react';

export type RaffleState = 'none' | 'active' | 'drawing' | 'ended';

export interface RaffleStatusProps {
  state: RaffleState;
  prize?: 'invisible' | 'filters';
  ticketsSold?: number;
  targetTickets?: number;
  onBuyTicket?: () => void;
  isAdmin?: boolean;
  onAdminStart?: () => void;
  className?: string;
}

export function RaffleStatus({
  state,
  prize = 'invisible',
  ticketsSold,
  targetTickets,
  onBuyTicket,
  isAdmin = false,
  onAdminStart,
  className = '',
}: RaffleStatusProps) {
  const getMessage = () => {
    if (state === 'none') return 'No raffle active';
    if (state === 'active') {
      const prizeText = prize === 'invisible' ? '1 month Invisible' : '1 month Filters';
      const progress = ticketsSold !== undefined && targetTickets
        ? ` • ${ticketsSold}/${targetTickets}p`
        : '';
      return `Prize: ${prizeText}${progress}`;
    }
    if (state === 'drawing') return 'Drawing winner...';
    return 'Winner selected • Next raffle soon';
  };

  const isDisabled = state === 'none' && !isAdmin;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={state === 'none' && isAdmin ? onAdminStart : onBuyTicket}
        disabled={isDisabled}
        className={`px-3 py-1 text-xs rounded transition font-medium ${
          isDisabled
            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
            : 'bg-red-600 hover:bg-red-700 text-white'
        }`}
      >
        {state === 'none' && isAdmin ? 'Start Raffle' : 'Buy Ticket'}
      </button>
      <div className="w-[140px] h-6 overflow-hidden bg-[#1a0000] border border-red-900 rounded-sm font-mono text-[9px] text-red-500 flex items-center">
        <div className="whitespace-nowrap px-2 animate-[marquee_6s_linear_infinite]">
          {getMessage()}
        </div>
      </div>
    </div>
  );
}
