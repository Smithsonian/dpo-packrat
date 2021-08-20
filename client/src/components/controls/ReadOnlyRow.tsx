/* eslint-disable @typescript-eslint/ban-ts-comment */
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
}

function ReadOnlyRow(props: ReadOnlyRowProps): React.ReactElement {
    const { label, value, padding, gridTemplate } = props;

    const rowFieldProps = { alignItems: 'center', justifyContent: 'space-between', style: { borderRadius: 0 } };
    if (gridTemplate) {
        rowFieldProps['style']['display'] = 'grid';
        rowFieldProps['style']['gridTemplateColumns'] = gridTemplate;
    }

    return (
        <FieldType required={false} label={label} direction='row' containerProps={rowFieldProps} width='100%'>
            <Box width='fit-content' textAlign='right'>
                <Typography variant='caption' style={{ fontFamily: 'Roboto, Helvetical, Arial, sans-serif', color: '#2C405A', overflowWrap: 'break-word', padding }}>
                    {value}
                </Typography>
            </Box>
        </FieldType>
    );
}

export default ReadOnlyRow;
