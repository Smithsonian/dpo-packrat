import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';

const useStyles = makeStyles(({ palette, typography }) => ({
    header: {
        display: 'flex',
        alignItems: 'center',
        height: 50,
        width: '100%',
        borderRadius: 5,
        background: palette.background.paper,
    },
    fileDetails: {
        display: 'flex',
        flex: 2,
        paddingLeft: 20
    },
    size: {
        display: 'flex',
        flex: 1,
    },
    assetType: {
        display: 'flex',
        flex: 2
    },
    title: {
        textAlign: 'center',
        marginTop: 5,
        marginBottom: 10,
        color: palette.primary.dark,
        fontWeight: typography.fontWeightRegular
    },
    label: {
        color: palette.primary.contrastText,
        fontWeight: typography.fontWeightRegular
    },
}));

interface UploadListHeaderProps {
    title: string;
}

function UploadListHeader(props: UploadListHeaderProps): React.ReactElement {
    const classes = useStyles();
    const { title } = props;

    return (
        <>
            <Typography className={classes.title} variant='caption'>{title}</Typography>
            <Box className={classes.header}>
                <Box className={classes.fileDetails}>
                    <Typography className={classes.label} variant='body1'>Filename</Typography>
                </Box>
                <Box className={classes.size}>
                    <Typography className={classes.label} variant='body1'>Size</Typography>
                </Box>
                <Box className={classes.assetType}>
                    <Typography className={classes.label} variant='body1'>Asset Type</Typography>
                </Box>
            </Box>
        </>

    );
}

export default UploadListHeader;