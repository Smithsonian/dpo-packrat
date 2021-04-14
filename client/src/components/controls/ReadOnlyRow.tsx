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
}

function ReadOnlyRow(props: ReadOnlyRowProps): React.ReactElement {
    const { label, value } = props;

    const rowFieldProps = { alignItems: 'center', justifyContent: 'space-between', style: { borderRadius: 0 } };

    return (
        <FieldType required={false} label={label} direction='row' containerProps={rowFieldProps} width='auto'>
            <Box width='70%' textAlign='right'>
                <Typography style={{ fontFamily: 'Roboto, Helvetical, Arial, sans-serif', color: '#2C405A', fontSize: '12px', overflowWrap: 'break-word' }}>{value}</Typography>
            </Box>
        </FieldType>
    );
}

export default ReadOnlyRow;
