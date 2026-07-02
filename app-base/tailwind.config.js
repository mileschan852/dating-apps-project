/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./shared/dating-core/ui/src/**/*.{js,ts,jsx,tsx}",
    "./shared/dating-core/core/src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'grid-cols-5', 'aspect-square', 'gap-1.5',
    'whitespace-nowrap', 'flex-col', 'items-center',
    'justify-center', 'justify-around', 'text-[10px]',
    'text-[#FF6B35]', 'bg-[#1A1A1A]', 'bg-[#FF6B35]',
    'bg-[#0A0A0A]', 'border-[#2C2C2E]', 'backdrop-blur-xl',
    'fixed', 'bottom-0', 'left-0', 'right-0', 'z-50',
    'h-14', 'w-5', 'min-w-[60px]', 'flex-1', 'flex',
    'hidden', 'select-none', 'rounded-full', 'shrink-0',
  ],
  theme: { extend: {} },
  plugins: [],
}
