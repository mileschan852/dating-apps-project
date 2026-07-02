import React, { useState, useRef } from 'react';
import { Send } from 'lucide-react';

export interface FlyingMessageInputProps {
  onSend: (text: string) => Promise<void> | void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Fixed-position text input + Send button that sits just above the BottomNav.
 * The parent must ensure the grid content has enough bottom padding (pb-28 or similar)
 * so the input doesn't overlap content.
 */
export function FlyingMessageInput({
  onSend,
  disabled = false,
  placeholder = 'Send a flying message…',
}: FlyingMessageInputProps) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending || disabled) return;
    setSending(true);
    try {
      await onSend(trimmed);
      setText('');
      inputRef.current?.blur();
    } catch (err) {
      console.warn('FlyingMessageInput send error:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    // Sits above the bottom nav (bottom-14 = 56px = h-14 nav height)
    <div className="fixed bottom-14 left-0 right-0 z-40 px-3 py-2 bg-[#0A0A0A]/95 backdrop-blur-sm border-t border-[#1C1C1E]">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={120}
          disabled={disabled || sending}
          className="flex-1 bg-[#1C1C1E] text-white text-sm rounded-full px-4 py-2 placeholder-[#48484A] border border-[#2C2C2E] focus:border-[var(--app-primary)] transition-colors outline-none"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending || disabled}
          className="w-9 h-9 rounded-full gradient-btn flex items-center justify-center flex-shrink-0 nav-press disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Send flying message"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}
