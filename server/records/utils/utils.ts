/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
import * as fs from 'fs';
import * as util from 'util';

// string manipulation
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

// object manipulation
export const getErrorString = (error: any): string => {
    return error instanceof Error ? error.message : String(error);
};
export const stripErrors = (obj: unknown): unknown => {
    // remove error objects from an object replacing with a message
    // useful for when wanting a simple error and not a stack trace
    // with console.error().

    if (obj instanceof Error) return obj.message;
    if (Array.isArray(obj)) return obj.map(stripErrors);

    if (typeof obj === 'object' && obj !== null) {
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
            result[key] = value instanceof Error
                ? value.message
                : typeof value === 'object'
                    ? stripErrors(value)
                    : value;
        }
        return result;
    }

    return obj;
};
export const flattenObject = (obj: Record<string, unknown>, prefix = ''): Record<string, string> => {
    // returns a key/value pair of the object flattened
    // useful for representing a data object as a flatten string

    return Object.keys(obj).reduce((acc, key) => {
        const newKey = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];

        if (
            typeof value === 'object' &&
            value !== null &&
            !Array.isArray(value)
        ) {
            Object.assign(acc, flattenObject(value as Record<string, unknown>, newKey));
        } else {
            acc[newKey] = value !== undefined && value !== null
                ? value.toString()
                : newKey === 'error'
                    ? 'undefined error'
                    : '';
        }

        return acc;
    }, {} as Record<string, string>);
};
export const safeFlattenObject = (data: unknown): Record<string, string> => {
    // wrapper to work with return types of stripErrors

    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
        return flattenObject(data as Record<string, unknown>);
    }
    return { value: data?.toString?.() ?? '' };
};
export const stripCircular = <T>(obj: T): T => {
    // remove circular dependencies from submitted data to be logged
    const seen = new WeakSet();
    return JSON.parse(JSON.stringify(obj, (_key, value) => {
        if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) return '[Circular]';
            seen.add(value);
        }
        return value;
    }));
};
export const safeInspect = (data: any) => {
    // safely inspect an object and output to the native console
    console.log(util.inspect(data, { depth: 4, colors: true }));
};

// timing
export const delay = async (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

// file/directory routines
export const createPath = (path: string): { success: boolean, message: string } => {
    // creates a folder if it doesn't exist.

    try {
        if (!fs.existsSync(path))
            fs.mkdirSync(path, { recursive: true });
        return { success: true, message: 'created path' };

    } catch(err) {
        return { success: false, message: getErrorString(err) };
    }
};
export const waitUntilFileExists = (path: string, timeoutMs = 10000): Promise<void> => {
    // wait until a file exists
    const start = Date.now();
    return new Promise((resolve, reject) => {
        const interval = setInterval(() => {
            if (fs.existsSync(path)) {
                clearInterval(interval);
                resolve();
            } else if (Date.now() - start > timeoutMs) {
                clearInterval(interval);
                reject(new Error('file was not created in time'));
            }
        }, 100);
    });
};
export const renameFile = (path: string, newPath: string): { success: boolean, message: string } => {
    try {
        fs.renameSync(path, newPath);
        return { success: true, message: `renamed '${path}' to '${newPath}'` };
    } catch(err) {
        return { success: false, message: `rename error: ${getErrorString(err)}` };
    }
};
