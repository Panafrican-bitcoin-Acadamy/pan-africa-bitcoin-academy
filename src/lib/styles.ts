/**
 * Centralized style utilities and class combinations
 * This file contains commonly used Tailwind CSS class combinations
 * to ensure consistency across the application
 */

/**
 * Form Input Styles
 */
export const inputStyles = {
  base: "w-full rounded-lg border border-cyan-400/30 bg-zinc-950 px-3 py-2.5 text-base sm:text-sm text-zinc-50 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 cursor-text",
  phone: "flex-1 min-w-0 rounded-lg border border-cyan-400/30 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 cursor-text",
  date: "w-full rounded-lg border border-cyan-400/30 bg-zinc-950 px-3 py-2.5 pr-10 text-base sm:text-sm text-zinc-50 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 cursor-text",
  select: "w-full rounded-lg border border-cyan-400/30 bg-zinc-950 px-3 py-2.5 text-base sm:text-sm text-zinc-50 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 appearance-none cursor-pointer",
  selectSmall: "flex-shrink-0 rounded-lg border border-cyan-400/30 bg-zinc-950 px-2 py-2 text-sm text-zinc-50 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 appearance-none cursor-pointer",
  optional: "w-full rounded-lg border border-cyan-400/20 bg-zinc-900/50 px-3 py-2.5 text-base sm:text-sm text-zinc-50 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 cursor-text",
  selectWithValue: (hasValue: boolean) => 
    `w-full rounded-lg border border-cyan-400/30 bg-zinc-950 px-3 py-2.5 text-base sm:text-sm focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 appearance-none cursor-pointer ${
      hasValue ? 'text-green-400' : 'text-zinc-50'
    }`,
};

/**
 * Form Label Styles
 */
export const labelStyles = {
  base: "mb-2 block text-sm font-medium text-zinc-300",
  required: "mb-2 block text-sm font-medium text-zinc-300",
  requiredStar: "text-red-400",
};

/**
 * Form Layout Styles
 */
export const formStyles = {
  grid: "grid gap-3 sm:gap-4 sm:grid-cols-2",
  gridSingle: "grid gap-3 sm:gap-4",
  container: "space-y-4 sm:space-y-6",
};

/**
 * Button Styles - Mobile-First: Touch-friendly with min 44x44px targets
 */
export const buttonStyles = {
  primary: "inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-orange-400 to-cyan-400 px-4 sm:px-6 py-3 min-h-[48px] text-base font-semibold text-black transition active:from-orange-500 active:to-cyan-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed touch-target",
  secondary: "inline-flex items-center justify-center rounded-lg border border-cyan-400/30 bg-zinc-900/50 px-4 py-3 min-h-[44px] text-base font-medium text-cyan-300 transition active:bg-cyan-400/20 active:scale-95 touch-target",
  success: "mt-4 w-full rounded-lg bg-orange-400 px-4 py-3 min-h-[48px] text-base font-semibold text-black transition active:bg-orange-500 active:scale-95 touch-target",
  outline: "mt-4 w-full rounded-lg bg-cyan-400/20 px-4 py-3 min-h-[48px] text-base font-semibold text-cyan-300 transition active:bg-cyan-400/30 active:scale-95 touch-target",
  selected: "mt-4 w-full rounded-lg bg-orange-400 px-4 py-3 min-h-[48px] text-base font-semibold text-black transition active:scale-95 touch-target",
  small: "rounded-lg border border-zinc-700 bg-zinc-900/50 p-2.5 min-h-[44px] min-w-[44px] text-sm transition active:bg-zinc-800 active:scale-95 text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed touch-target",
  danger: "rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 min-h-[44px] text-base font-medium text-red-300 transition active:bg-red-500/20 active:scale-95 touch-target",
};

/**
 * Card Styles
 */
export const cardStyles = {
  base: "rounded-xl border border-cyan-400/25 bg-black/80 shadow-[0_0_20px_rgba(34,211,238,0.1)] p-6 transition",
  selected: "rounded-xl border border-orange-400/50 bg-orange-500/10 shadow-[0_0_30px_rgba(249,115,22,0.3)] p-6 transition",
  info: "rounded-lg border border-cyan-400/20 bg-zinc-900/50 p-2",
  highlight: "rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-5",
  badge: "rounded-lg border border-cyan-500/50 bg-cyan-500/10 px-4 py-2 text-cyan-300",
};

/**
 * Page Container Styles - Mobile-First: Full width on mobile, max-width only on larger screens
 */
export const pageStyles = {
  container: "relative min-h-screen w-full overflow-x-hidden",
  content: "relative z-10 w-full bg-black/95",
  wrapper: "w-full px-4 py-12 sm:px-6 sm:py-16 sm:max-w-7xl sm:mx-auto lg:px-8 lg:py-20",
  section: "space-y-8 sm:space-y-12",
  heading: "text-lg sm:text-xl font-semibold text-zinc-50",
  headingLarge: "text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-zinc-50 leading-tight",
  subtitle: "w-full mt-4 sm:mt-6 sm:max-w-3xl sm:mx-auto text-base sm:text-lg text-zinc-400 leading-relaxed",
};

/**
 * Alert/Message Styles
 */
export const alertStyles = {
  error: "rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200",
  success: "rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-200",
  warning: "rounded-lg border border-orange-500/30 bg-orange-500/10 p-3 text-sm text-orange-200",
  info: "rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-3 text-sm text-cyan-200",
};

/**
 * Badge/Pill Styles
 */
export const badgeStyles = {
  beginner: "rounded-full px-2 py-1 text-xs font-medium bg-blue-500/20 text-blue-300",
  intermediate: "rounded-full px-2 py-1 text-xs font-medium bg-orange-500/20 text-orange-300",
  advanced: "rounded-full px-2 py-1 text-xs font-medium bg-purple-500/20 text-purple-300",
  default: "rounded-full px-2 py-1 text-xs font-medium bg-cyan-500/20 text-cyan-300",
  mentor: "rounded-full bg-cyan-500/20 px-3 py-1 text-xs text-cyan-300",
  type: "rounded-full bg-orange-500/20 px-3 py-1 text-xs text-orange-300",
};

/**
 * Utility function to combine class names
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
