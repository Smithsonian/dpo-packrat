/**
 * Description
 *
 * This component renders description field used in photogrammetry metadata component.
 */
import { fade, makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { DebounceInput } from 'react-debounce-input';
import { FieldType } from '../../../../../components';

const useStyles = makeStyles(({ palette, typography }) => ({
    description: {
        height: '10vh',
        width: '80%',
        padding: 10,
        resize: 'none',
        overflow: 'scroll',
        border: `1px solid ${fade(palette.primary.contrastText, 0.4)}`,
        borderRadius: 5,
        fontWeight: typography.fontWeightRegular,
        fontFamily: typography.fontFamily
    }
}));

interface DescriptionProps {
    value: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    viewMode?: boolean;
    disabled?: boolean;
}

function Description(props: DescriptionProps): React.ReactElement {
    const { value, onChange, viewMode = false, disabled = false } = props;
    const classes = useStyles();

    const rowFieldProps = { alignItems: 'center', justifyContent: 'space-between' };

    return (
        <FieldType
            required
            label='Description'
            direction='row'
            containerProps={rowFieldProps}
            width={viewMode ? 'auto' : undefined}
        >
            <DebounceInput
                element='textarea'
                className={classes.description}
                name='description'
                disabled={disabled}
                value={value}
                onChange={onChange}
                forceNotifyByEnter={false}
                debounceTimeout={400}
            />
        </FieldType>
    );
}

export default Description;