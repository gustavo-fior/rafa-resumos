import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
export function stripLeadingEmoji(raw) {
    const trimmed = raw.trim();
    const spaceIdx = trimmed.indexOf(" ");
    if (spaceIdx === -1)
        return trimmed;
    const first = trimmed.slice(0, spaceIdx);
    const rest = trimmed.slice(spaceIdx + 1).trim();
    if (!rest || /[\p{L}\p{N}]/u.test(first))
        return trimmed;
    return rest;
}
