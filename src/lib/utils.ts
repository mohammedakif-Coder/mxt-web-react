import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a status string for display: title-case each word, with hyphens treated
 * as word separators. e.g. "opted-out" -> "Opted Out", "delivered" -> "Delivered".
 */
export function formatStatus(status?: string | null): string {
  if (!status) return "";
  return status
    .toString()
    .replace(/[-_]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
