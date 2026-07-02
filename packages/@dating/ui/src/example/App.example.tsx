import { RaffleStatus, AffiliateButton, BottomNav } from '../index';
import { usePurchase } from '@dating/core';

export default function ExampleApp() {
  const { purchase } = usePurchase();

  return (
    <div>
      <h1>Example Dating App</h1>

      <RaffleStatus
        state="active"
        onBuyTicket={() => purchase('raffle_ticket', 100)}
      />

      <AffiliateButton />

      <BottomNav />
    </div>
  );
}
