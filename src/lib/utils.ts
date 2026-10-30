import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Joins class names and resolves Tailwind conflicts. Components copied from 21st.dev import this. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
