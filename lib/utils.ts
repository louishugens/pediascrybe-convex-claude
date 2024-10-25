import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function numberToOrdinal(num: number): string {
  const ordinals = ['At birth', 'First', 'Second', 'Third', 'Fourth', 'Fifth'];
  
  if (num >= 0 && num <= 5) {
    return ordinals[num];
  } else {
    return 'Number out of range';
  }
}