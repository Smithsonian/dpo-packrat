/**
 * VocabularyToggle
 *
 * A compact segmented toggle group for a multi-select vocabulary field. Shows all
 * options inline (no dropdown), toggles in one click, and keeps a fixed height so it
 * never shifts the surrounding layout. The value is a sorted array of idVocabulary;
 * onChange returns the new sorted array.
 */
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import { fade, makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { VocabularyOption } from '../../store';

interface VocabularyToggleProps {
    value: number[];                        // selected idVocabulary values
    entries: VocabularyOption[];            // available options (from getEntries)
    onChange: (ids: number[]) => void;      // receives the new, sorted selection
    disabled?: boolean;
    error?: boolean;                        // required/invalid styling
    updated?: boolean;                      // dirty/updated styling
}

const useStyles = makeStyles(({ palette, typography }) => ({
    group: {
        flexWrap: 'wrap',
        gap: 4,
        border: ({ error, updated }: VocabularyToggleProps) =>
            error ? `1px solid ${palette.error.main}` : (updated ? `1px solid ${fade(palette.secondary.main, 0.4)}` : 'none'),
        borderRadius: 5,
        backgroundColor: ({ updated }: VocabularyToggleProps) => (updated ? palette.secondary.light : 'transparent'),
        padding: ({ error, updated }: VocabularyToggleProps) => (error || updated ? 2 : 0)
    },
    button: {
        textTransform: 'none',
        fontSize: '0.8em',
        fontFamily: typography.fontFamily,
        padding: '2px 10px',
        lineHeight: 1.4,
        border: `1px solid ${fade(palette.primary.contrastText, 0.4)}`,
        borderRadius: '4px !important',
        color: palette.primary.dark,
        backgroundColor: palette.background.paper,
        '&.Mui-selected': {
            backgroundColor: palette.primary.main,
            color: palette.background.paper,
            '&:hover': { backgroundColor: palette.primary.main }
        }
    }
}));

function VocabularyToggle(props: VocabularyToggleProps): React.ReactElement {
    const { value, entries, onChange, disabled = false } = props;
    const classes = useStyles(props);

    const handleChange = (_event: React.MouseEvent<HTMLElement>, newValue: number[]): void => {
        onChange([...newValue].sort());
    };

    return (
        <ToggleButtonGroup size='small' value={value} onChange={handleChange} className={classes.group}>
            {entries.map(({ idVocabulary, Term }) => (
                <ToggleButton key={idVocabulary} value={idVocabulary} disabled={disabled} className={classes.button}>
                    {Term}
                </ToggleButton>
            ))}
        </ToggleButtonGroup>
    );
}

export default VocabularyToggle;
