import React from 'react';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(({ palette }) => ({
    container: {
        display: 'flex',
        flexDirection: 'column',
        padding: 10,
        borderRadius: 5,
        backgroundColor: ({ required }: FieldTypeProps) => required ? palette.primary.light : palette.secondary.light
    }
}));

interface FieldTypeProps {
    required: boolean;
    children: React.ReactElement
}

function FieldType(props: FieldTypeProps): React.ReactElement {
    const { children } = props;
    const classes = useStyles(props);

    return (
        <Box className={classes.container}>
            {children}
        </Box>
    );
}

export default FieldType;