/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * ReadOnlyRow
 *
 * */
import React from 'react';
import { Typography, Box } from '@material-ui/core/';
import { ViewableProps } from '../../types/repository';
import FieldType from '../shared/FieldType';

interface ReadOnlyRowProps extends ViewableProps {
    label: string;
    value?: number | string | null;
    padding?: number;
    gridTemplate?: string;
    width?: string;
    labelProps?: any;
}

function ReadOnlyRow(props: ReadOnlyRowProps): React.ReactElement {
    const { label, value, padding, gridTemplate, width, labelProps } = props;

    const rowFieldProps = { alignItems: 'center', justifyContent: 'space-between', style: { borderRadius: 0 } };
    if (width) {
        rowFieldProps['style']['width'] = width;
    }
    if (gridTemplate) {
        rowFieldProps['style']['display'] = 'grid';
        rowFieldProps['style']['gridTemplateColumns'] = gridTemplate;
    }

    return (
        <FieldType required={false} label={label} direction='row' containerProps={rowFieldProps} labelProps={labelProps}>
            <Box width='fit-content' textAlign='right'>
                <Typography variant='caption' style={{ fontFamily: 'Roboto, Helvetical, Arial, sans-serif', color: '#2C405A', overflowWrap: 'break-word', padding }}>
                    {value}
                </Typography>
            </Box>
        </FieldType>
    );
}

export default ReadOnlyRow;
