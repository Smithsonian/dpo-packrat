/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/**
 * Shared utilities
 *
 * Shared utilities for components, functionality.
 */
import { CSSProperties } from '@material-ui/core/styles/withStyles';
import { Colors, palette } from '../theme';

export const withDefaultValueBoolean = (value: boolean | undefined | null, defaultValue: boolean): boolean => value || defaultValue;

export const withDefaultValueNumber = (value: number | undefined | null, defaultValue: number | null): number => {
    if (value) {
        return value;
    }

    if (defaultValue === null) throw new Error('Default value is null');

    return defaultValue;
};

export const withDefaultValueString = (value: string | undefined, defaultValue: string): string => {
    // console.log('withDefaultValueString: ', value+':'+defaultValue);
    if(value && typeof(value).toLowerCase()==='string')
        return value;

    return defaultValue;
};

export function nonNullValue<T>(name: string, value: T | null | undefined): T {
    if (value === null || value === undefined) throw new Error(`Provided ${name} is null`);

    return value;
}

export const actionOnKeyPress = (key: string, actionKey: string, func: () => void): void => {
    if (key === actionKey) {
        func();
    }
};

export const multiIncludes = (text: string, values: string[]): boolean => {
    const expression = new RegExp(values.join('|'));
    return expression.test(text);
};

export const scrollBarProperties = (vertical: boolean, horizontal: boolean, backgroundColor: string): CSSProperties => ({
    scrollBehavior: 'smooth',
    '&::-webkit-scrollbar': {
        '-webkit-appearance': 'none',
        maxWidth: 8
    },
    '&::-webkit-scrollbar:vertical': vertical ? { width: 12 } : null,
    '&::-webkit-scrollbar:horizontal': horizontal ? { height: 12 } : null,
    '&::-webkit-scrollbar-thumb': {
        borderRadius: 10,
        backgroundColor
    }
});

export const sharedButtonProps: CSSProperties = {
    height: 30,
    width: 80,
    fontSize: '0.8em',
    color: Colors.defaults.white
};

export const sharedLabelProps: CSSProperties = {
    fontSize: '0.8em',
    color: palette.primary.dark
};

export function safeDate(value: any): Date | null {
    if (value == null)
        return null;
    if (!isNaN(value) && value instanceof Date)
        return value;
    if (typeof(value) !== 'string')
        return null;
    const timestamp: number = Date.parse(value);
    return isNaN(timestamp) ? null : new Date(timestamp);
}

export function convertLocalDateToUTC(date: Date): Date {
    // const UTC: number = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
    // return new Date(UTC);
    return new Date(date.getTime() + date.getTimezoneOffset() * 60000);
}

export function formatDate(value: any): string {
    const date: Date | null = safeDate(value);
    if (!date)
        return '';
    return date.toLocaleDateString();
}

export function formatDateAndTime(value: any): string {
    const date: Date | null = safeDate(value);
    if (!date)
        return '';
    return date.toLocaleString();
}

export const getErrorString = (error: any) => {
    // Check if the error is an instance of Error and has a message
    if (error instanceof Error) {
        // check if has code too and append to message
        if('code' in error && error.code === 'ENOENT')
            return `${error.code}: ${error.message}`;
        return error.message;
    }

    // Handle common GraphQL error format
    if (error?.errors && Array.isArray(error.errors)) {
        // Return the first error message in the GraphQL errors array, or join all messages
        return error.errors.map((e: any) => e.message || 'Unknown error').join('; ');
    }

    // Handle Prisma errors (e.g., PrismaClientKnownRequestError)
    if (error?.meta && error?.message) {
        return `Prisma error: ${error.message}`;
    }

    // Handle Solr errors (Solr may have nested messages under responseHeader or error)
    if (error?.responseHeader || error?.error) {
        return error?.error?.msg || error?.error?.message || 'Unknown Solr error';
    }

    // Fallback to a string representation of the error
    return String(error);
};