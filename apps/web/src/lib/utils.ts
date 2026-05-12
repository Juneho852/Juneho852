import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatHkd(cents: number) {
  return `HKD ${(cents / 100).toLocaleString('en-HK', { minimumFractionDigits: 0 })}`;
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-HK', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}
