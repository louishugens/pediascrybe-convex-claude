import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { ConvexError } from "convex/values";
import type { Doc } from "@/convex/_generated/dataModel";


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const isAuthError = (error: unknown) => {
  // This broadly matches potentially auth related errors, can be rewritten to
  // work with your app's own error handling.
  const message =
    (error instanceof ConvexError && error.data) ||
    (error instanceof Error && error.message) ||
    "";
  // Loose match for auth related errors
  return /auth/i.test(message);
};

export function numberToOrdinal(number: number) {
  const lastDigit = number % 10;
  const lastTwoDigits = number % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return `${number}th`;
  }

  switch (lastDigit) {
    case 1:
      return `${number}st`;
    case 2:
      return `${number}nd`;
    case 3:
      return `${number}rd`;
    default:
      return `${number}th`;
  }
}