import { Box } from '@material-ui/core';
import { fade, makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { DebounceInput } from 'react-debounce-input';
import { FieldType } from '../../../../../components';
import { ModelFields } from '../../../../../store';

interface BoundingBoxInputProps {
    model: ModelFields;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

function BoundingBoxInput(props: BoundingBoxInputProps): React.ReactElement {
    const { model, onChange } = props;

    const rowFieldProps = { justifyContent: 'space-between' };

    return (
        <FieldType required={false} label='Bounding Box' direction='row' containerProps={rowFieldProps}>
            <Box display='flex' flex={1} flexDirection='column'>
                <Box display='flex' justifyContent='flex-end'>
                    <NumberDebounceInput value={model.boundingBoxP1X} name='boundingBoxP1X' onChange={onChange} />
                    <NumberDebounceInput value={model.boundingBoxP1Y} name='boundingBoxP1Y' onChange={onChange} />
                    <NumberDebounceInput value={model.boundingBoxP1Z} name='boundingBoxP1Z' onChange={onChange} />
                </Box>
                <Box display='flex' mt='5px' justifyContent='flex-end'>
                    <NumberDebounceInput value={model.boundingBoxP2X} name='boundingBoxP2X' onChange={onChange} />
                    <NumberDebounceInput value={model.boundingBoxP2Y} name='boundingBoxP2Y' onChange={onChange} />
                    <NumberDebounceInput value={model.boundingBoxP2Z} name='boundingBoxP2Z' onChange={onChange} />
                </Box>
            </Box>
        </FieldType>
    );
}


const useStyles = makeStyles(({ palette, typography, breakpoints }) => ({
    input: {
        width: '20%',
        outline: 'none',
        border: `1px solid ${fade(palette.primary.contrastText, 0.4)}`,
        padding: 8,
        borderRadius: 5,
        marginRight: 5,
        fontFamily: typography.fontFamily,
        [breakpoints.down('lg')]: {
            fontSize: '0.8em',
            minWidth: 50,
            maxWidth: 50,
        }
    }
}));

interface NumberDebounceInputProps {
    value: number | null;
    name: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

function NumberDebounceInput(props: NumberDebounceInputProps): React.ReactElement {
    const { value, name, onChange } = props;
    const classes = useStyles();

    return (
        <DebounceInput
            element='input'
            value={value || ''}
            className={classes.input}
            type='number'
            name={name}
            onChange={onChange}
            debounceTimeout={400}
        />
    );
}

export default BoundingBoxInput;