export const getDurationString = (startDate: Date, endDate: Date): string => {
    // Calculate the difference in milliseconds
    const diffMs = Math.abs(endDate.getTime() - startDate.getTime());

    // Convert milliseconds to total seconds
    const diffSeconds = Math.floor(diffMs / 1000);

    // Calculate hours, minutes, and remaining seconds
    const hours = Math.floor(diffSeconds / 3600);
    const minutes = Math.floor((diffSeconds % 3600) / 60);
    const seconds = diffSeconds % 60;

    // Build the result string
    let result = '';
    if (hours > 0) {
        result += `${hours}h `;
    }
    if (minutes > 0) {
        result += `${minutes}min `;
    }
    if (hours === 0 && minutes === 0) {
        result += `${seconds}s`;
    }

    return result.trim();
};
export const getFormattedDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
    const day = date.getDate().toString().padStart(2, '0');

    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';

    hours = hours % 12;
    hours = hours ? hours : 12; // The hour '0' should be '12'

    return `${year}-${month}-${day} @ ${hours}:${minutes}${ampm}`;
};
export const getRandomWhitespace = (): string => {
    return ' '.repeat(Math.floor(Math.random() * 30));
};
export const toCamelCase = (str: string): string => {
    return str
        .toLowerCase()          // Convert the entire string to lowercase
        .split(/[\s-_]+/)       // Split by space, dash, or underscore
        .map((word, index) => {
            if (index === 0) {
                return word;    // Keep the first word lowercase
            }
            return word.charAt(0).toUpperCase() + word.slice(1); // Capitalize the first letter of each subsequent word
        })
        .join('');  // Join the words back into a single string
};
export const toTitleCase = (str: string): string => {
    return str
        .toLowerCase()      // Convert the entire string to lowercase first
        .split(/[\s-_]+/)   // Split by spaces, dashes, or underscores
        .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize the first letter of each word
        .join(' ');         // Join the words with a space
};
export const truncateString = (str: string, maxLength = 32): string => {
    if (str.length > maxLength) {
        return str.slice(0, maxLength - 3) + '...';
    }
    return str;
};

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
export const getErrorString = (error: any): string => {
    return error instanceof Error ? error.message : String(error);
};