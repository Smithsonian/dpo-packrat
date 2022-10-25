/**
 * UploadListHeader
 *
 * This component renders upload list header for FileList component.
 */
import { Box, Typography } from '@material-ui/core';
import { makeStyles, createStyles } from '@material-ui/core/styles';
import React from 'react';

const useStyles = makeStyles(({ palette, breakpoints }) => createStyles({
    header: {
        display: 'flex',
        alignItems: 'center',
        height: 50,
        width: '100%',
        borderRadius: 5,
        background: palette.background.paper,
        [breakpoints.down('lg')]: {
            height: 35
        }
    },
    fileDetails: {
        display: 'flex',
        flex: 4,
        paddingLeft: 20,
        [breakpoints.down('md')]: {
            flex: 2.5
        }
    },
    size: {
        display: 'flex',
        flex: 1
    },
    assetType: {
        display: 'flex',
        flex: 1.5
    },
    title: {
        textAlign: 'center',
        marginTop: 5,
        marginBottom: 10,
        color: palette.primary.dark,
        fontWeight: 400
    },
    label: {
        color: palette.primary.dark,
        fontWeight: 400
    }
}));

function UploadListHeader(): React.ReactElement {
    const classes = useStyles();

    return (
        <Box className={classes.header}>
            <Box className={classes.fileDetails}>
                <Typography className={classes.label} variant='caption'>
                    File Name
                </Typography>
            </Box>
            <Box className={classes.size}>
                <Typography className={classes.label} variant='caption'>
                    Size
                </Typography>
            </Box>
            <Box className={classes.assetType}>
                <Typography className={classes.label} variant='caption'>
                    Asset Type
                </Typography>
            </Box>
        </Box>
    );
}

export default UploadListHeader;
