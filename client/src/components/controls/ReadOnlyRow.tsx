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
    valueLeftAligned?: boolean;
    gridValue?: number;
    gridLabel?: number;
    paddingString?: string;
    containerStyle?: any;
    required?: boolean;
}

function ReadOnlyRow(props: ReadOnlyRowProps): React.ReactElement {
    const { label, value, padding, gridTemplate, width, labelProps, valueLeftAligned, gridValue, gridLabel, paddingString, containerStyle, required = false } = props;

    const rowFieldProps = { alignItems: 'baseline', justifyContent: 'space-between', style: { borderRadius: 0, ...containerStyle } };
    if (width) {
        rowFieldProps['style']['width'] = width;
    }
    if (gridTemplate) {
        rowFieldProps['style']['display'] = 'grid';
        rowFieldProps['style']['gridTemplateColumns'] = gridTemplate;
    }

    return (
        <FieldType label={label} direction='row' containerProps={rowFieldProps} labelProps={{ ...labelProps, style: { wordBreak: 'keep-all' } }} valueLeftAligned={valueLeftAligned} gridValue={gridValue} gridLabel={gridLabel} padding={paddingString} required={required}>
            <Box width='fit-content' textAlign='right'>
                <Typography variant='caption' style={{ fontFamily: 'Roboto, Helvetical, Arial, sans-serif', overflowWrap: 'break-word', wordBreak: 'break-all', padding }}>
                    {value}
                </Typography>
            </Box>
        </FieldType>
    );
}

export default ReadOnlyRow;
