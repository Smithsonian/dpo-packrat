/**
 * Shared utilities
 *
 * Shared utilities for components, functionality.
 */
import { CSSProperties } from '@material-ui/core/styles/withStyles';

export const withDefaultValueBoolean = (value: boolean | null, defaultValue: boolean): boolean => value || defaultValue;

export const withDefaultValueNumber = (value: number | null, defaultValue: number | null): number => {
    if (value) {
        return value;
    }

    if (defaultValue === null) throw new Error('Default value is null');

    return defaultValue;
};

export const actionOnKeyPress = (key: string, actionKey: string, func: () => void): void => {
    if (key === actionKey) {
        func();
    }
};

export const scrollBarProperties = (vertical: boolean, horizontal: boolean, backgroundColor: string): CSSProperties => ({
    scrollBehavior: 'smooth',
    '&::-webkit-scrollbar': {
        '-webkit-appearance': 'none'
    },
    '&::-webkit-scrollbar:vertical': vertical ? { width: 12 } : null,
    '&::-webkit-scrollbar:horizontal': horizontal ? { height: 12 } : null,
    '&::-webkit-scrollbar-thumb': {
        borderRadius: 8,
        border: '2px solid white',
        backgroundColor
    }
});
