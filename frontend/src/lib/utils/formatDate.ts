import { format, formatDistance, formatDistanceToNow } from 'date-fns';

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
}

/**
 * Format date to short format (e.g., "Jan 1, 2024")
 */
export function formatShortDate(date: Date | string): string {
    return format(new Date(date), 'MMM d, yyyy');
}

/**
 * Format date to long format (e.g., "January 1, 2024 at 12:00 PM")
 */
export function formatLongDate(date: Date | string): string {
    return format(new Date(date), 'MMMM d, yyyy \'at\' h:mm a');
}

/**
 * Format date distance between two dates
 */
export function formatDateDistance(startDate: Date | string, endDate: Date | string): string {
    return formatDistance(new Date(startDate), new Date(endDate));
}
