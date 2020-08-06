import React from 'react';
import { Box, Typography, PropTypes } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(({ palette, spacing }) => ({
    container: {
        display: 'flex',
        flexDirection: 'column',
        padding: 10,
        borderRadius: 5,
        marginTop: ({ marginTop }: FieldTypeProps) => spacing(marginTop || 0),
        backgroundColor: ({ required }: FieldTypeProps) => required ? palette.primary.light : palette.secondary.light
    },
    label: {
        margin: '5px 0px 10px 0px',
        color: palette.primary.dark
    }
}));

interface FieldTypeProps {
    required: boolean;
    label: string;
    align?: PropTypes.Alignment;
    marginTop?: number;
    children: React.ReactElement | React.ReactElement[]
}

function FieldType(props: FieldTypeProps): React.ReactElement {
    const { label, children, align = 'left' } = props;
    const classes = useStyles(props);

    return (
        <Box className={classes.container}>
            <Typography align={align} className={classes.label} variant='caption'>{label}</Typography>
            {children}
        </Box>
    );
}

export default FieldType;