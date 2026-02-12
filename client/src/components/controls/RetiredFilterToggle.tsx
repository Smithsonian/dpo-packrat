import { Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';

const useStyles = makeStyles({
    btn: {
        height: 30,
        width: 'fit-content',
        fontSize: '0.8em',
        whiteSpace: 'nowrap',
        color: 'white'
    }
});

interface RetiredFilterToggleProps {
    showRetired: boolean;
    onToggle: () => void;
    disabled?: boolean;
}

function RetiredFilterToggle(props: RetiredFilterToggleProps): React.ReactElement {
    const { showRetired, onToggle, disabled = false } = props;
    const classes = useStyles();

    return (
        <Button
            className={classes.btn}
            disableElevation
            variant='contained'
            color='primary'
            onClick={onToggle}
            disabled={disabled}
        >
            {showRetired ? 'Hide Retired' : 'Show Retired'}
        </Button>
    );
}

export default RetiredFilterToggle;

interface UseRetiredFilterResult {
    showRetired: boolean;
    toggleShowRetired: () => void;
}

export function useRetiredFilter(parentRetired: boolean = false): UseRetiredFilterResult {
    const [showRetired, setShowRetired] = React.useState<boolean>(parentRetired);

    const toggleShowRetired = React.useCallback(() => {
        setShowRetired(prev => !prev);
    }, []);

    React.useEffect(() => {
        setShowRetired(parentRetired);
    }, [parentRetired]);

    return { showRetired, toggleShowRetired };
}

export const retiredItemStyles = {
    retiredText: {
        fontStyle: 'italic' as const,
        color: '#888888'
    },
    retiredSuffix: ' (retired)'
};
