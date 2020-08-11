import React from 'react';
import { Box, Typography, PropTypes, BoxProps } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { colorWithOpacity } from '../../theme/colors';

const useStyles = makeStyles(({ palette, spacing }) => ({
    container: {
        display: 'flex',
        padding: 10,
        borderRadius: 5,
        width: ({ width }: FieldTypeProps) => width || '100%',
        marginTop: ({ marginTop }: FieldTypeProps) => spacing(marginTop || 0),
        backgroundColor: ({ required, error }: FieldTypeProps) => error ? colorWithOpacity(palette.error.light, 66) : required ? palette.primary.light : palette.secondary.light
    },
    label: {
        margin: '5px 0px 10px 0px',
        color: palette.primary.dark
    }
}));

interface FieldTypeProps {
    required: boolean;
    label: string;
    width?: string;
    direction?: string;
    containerProps?: BoxProps;
    align?: PropTypes.Alignment;
    marginTop?: number;
    error?: boolean;
    children: React.ReactElement | React.ReactElement[]
}

function FieldType(props: FieldTypeProps): React.ReactElement {
    const { label, children, align = 'left', direction, containerProps } = props;
    const classes = useStyles(props);

    return (
        <Box className={classes.container} flexDirection={direction || 'column'} {...containerProps}>
            <Typography align={align} className={classes.label} variant='caption'>{label}</Typography>
            {children}
        </Box>
    );
}

export default FieldType;