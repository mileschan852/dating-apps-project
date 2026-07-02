import { useState, useCallback } from 'react';
import { DEFAULT_PRODUCT_PRICES, type ProductKey } from '../constants/products';

// ─── Telegram Stars purchase hook ─────────────────────────────────────
// Handles opening a Telegram Stars invoice for any product key.
// Apps can override prices by passing a custom priceMap.

export interface UsePurchaseOptions {
  priceMap?: Partial<Record<ProductKey, number>>;
  adminUsernames?: string[];
  onSuccess?: (productKey: ProductKey, finalPrice: number) => void;
  onError?: (error: unknown) => void;
}

export function usePurchase(options: UsePurchaseOptions = {}) {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const { priceMap, onSuccess, onError } = options;

  const purchase = useCallback(async (productKey: ProductKey, penaltyMultiplier = 0) => {
    if (isPurchasing) return { success: false };
    setIsPurchasing(true);
    try {
      const basePrice = (priceMap?.[productKey] ?? DEFAULT_PRODUCT_PRICES[productKey]) as number;
      const finalPrice = Math.round(basePrice * (1 + penaltyMultiplier));

      const tg = (window as any).Telegram?.WebApp;
      if (tg?.openInvoice) {
        // Real Telegram Stars invoice — bot must pre-create the invoice link
        // and pass it here. For now we log and call onSuccess as a stub.
        console.log(`[usePurchase] Would open invoice for ${productKey} at ${finalPrice} stars`);
      }

      onSuccess?.(productKey, finalPrice);
      return { success: true, finalPrice };
    } catch (error) {
      onError?.(error);
      return { success: false, error };
    } finally {
      setIsPurchasing(false);
    }
  }, [isPurchasing, priceMap, onSuccess, onError]);

  return { purchase, isPurchasing };
}
