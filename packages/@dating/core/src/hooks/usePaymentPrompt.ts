export interface UsePaymentPromptOptions {
  workerUrl: string;
  amount: number;
  purpose: string;
  onSuccess?: () => void;
}

export function usePaymentPrompt({ workerUrl, amount, purpose, onSuccess }: UsePaymentPromptOptions) {
  const promptPayment = async () => {
    // ... implementation from old hooks.ts ...
  };
  return { promptPayment };
}
