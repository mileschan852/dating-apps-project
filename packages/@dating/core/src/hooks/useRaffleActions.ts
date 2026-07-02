export interface UseRaffleActionsOptions {
  tableName: string;
  workerUrl: string;
  isAdmin: boolean;
  raffle: any;
  setRaffle: (r: any) => void;
}

export function useRaffleActions({ tableName, workerUrl, isAdmin, raffle, setRaffle }: UseRaffleActionsOptions) {
  // ... full implementation from old hooks.ts ...
  const handleBuyRaffleTicket = async () => {};
  const handleStartNextRaffle = async () => {};
  return { handleBuyRaffleTicket, handleStartNextRaffle };
}
