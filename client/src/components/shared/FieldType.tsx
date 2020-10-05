import React from 'react';
import { Box, Typography, PropTypes, BoxProps } from '@material-ui/core';
import { makeStyles, fade } from '@material-ui/core/styles';

const useStyles = makeStyles(({ palette, spacing }) => ({
    container: {
        display: 'flex',
        padding: 10,
        borderRadius: 5,
        width: ({ width }: FieldTypeProps) => width || '100%',
        marginTop: ({ marginTop }: FieldTypeProps) => spacing(marginTop || 0),
        backgroundColor: ({ required, error }: FieldTypeProps) => error ? fade(palette.error.light, 0.3) : required ? palette.primary.light : palette.secondary.light
    },
    label: {
        margin: '5px 0px 10px 0px',
        color: palette.primary.dark
    }
}));

interface FieldTypeProps {
    required: boolean;
    renderLabel?: boolean;
    label?: string;
    width?: string;
    direction?: string;
    containerProps?: BoxProps;
    align?: PropTypes.Alignment;
    marginTop?: number;
    error?: boolean;
    children: React.ReactNode
}

function FieldType(props: FieldTypeProps): React.ReactElement {
    const { label, renderLabel, children, align = 'left', direction, containerProps } = props;
    const classes = useStyles(props);

    let content: React.ReactNode = <Typography align={align} className={classes.label} variant='caption'>{label}</Typography>;

    if (renderLabel === false) {
        content = null;
    }

    return (
        <Box className={classes.container} flexDirection={direction || 'column'} {...containerProps}>
            {content}
            {children}
        </Box>
    );
}

export default FieldType;