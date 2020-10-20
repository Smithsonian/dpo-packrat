import { CSSProperties } from '@material-ui/core/styles/withStyles';

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
