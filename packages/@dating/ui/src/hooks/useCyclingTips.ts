import { useState, useEffect } from 'react';

interface UseCyclingTipsOptions {
  extraTips?: string[];
  intervalMs?: number;
}

const BASE_TIPS = [
  "Green dot = Currently online",
  "Star = Charges for messages",
  "Eye = Invisible mode is active",
];

export function useCyclingTips({ extraTips = [], intervalMs = 4000 }: UseCyclingTipsOptions) {
  const allTips = [...BASE_TIPS, ...extraTips];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (allTips.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % allTips.length);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [allTips.length, intervalMs]);

  return {
    currentTip: allTips[currentIndex] || '',
    currentIndex,
  };
}
