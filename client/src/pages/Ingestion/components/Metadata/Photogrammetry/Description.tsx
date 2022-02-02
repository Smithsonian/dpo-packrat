/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Description
 *
 * This component renders description field used in photogrammetry metadata component.
 */
import { fade, makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { DebounceInput } from 'react-debounce-input';
import { FieldType } from '../../../../../components';
import { ViewableProps } from '../../../../../types/repository';

const useStyles = makeStyles(({ palette, typography }) => ({
    description: {
        height: '10vh',
        width: '80%',
        padding: 10,
        resize: 'none',
        border: (updated: boolean) => `1px solid ${fade(updated ? palette.secondary.main : palette.primary.contrastText, 0.4)}`,
        backgroundColor: (updated: boolean) => updated ? palette.secondary.light : palette.background.paper,
        borderRadius: 5,
        fontWeight: typography.fontWeightRegular,
        fontFamily: typography.fontFamily
    }
}));

interface DescriptionProps extends ViewableProps {
    value: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    containerProps?: any;
    descriptionStyle?: any;
}

function Description(props: DescriptionProps): React.ReactElement {
    const { value, onChange, viewMode = false, disabled = false, updated = false, containerProps, descriptionStyle } = props;
    const classes = useStyles(updated);

    const rowFieldProps = { alignItems: 'center', justifyContent: 'space-between' };

    return (
        <FieldType
            required
            label='Description'
            direction='row'
            containerProps={{ ...rowFieldProps, ...containerProps }}
            width={viewMode ? 'auto' : undefined}
            padding='10px'
        >
            <label htmlFor='description' style={{ display: 'none' }}>Description</label>
            <DebounceInput
                id='description'
                element='textarea'
                className={classes.description}
                name='description'
                disabled={disabled}
                value={value}
                onChange={onChange}
                forceNotifyByEnter={false}
                debounceTimeout={400}
                style={{ ...descriptionStyle }}
            />
        </FieldType>
    );
}

export default Description;