/* eslint-disable react/jsx-max-props-per-line */

/**
 * UploadFilesPicker
 *
 * This component renders file picker with drag and drop functionality.
 */
import { Button, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import Dropzone from 'react-dropzone';
import { BsCloudUpload } from 'react-icons/bs';
import { useUploadStore } from '../../../../store';
import { Colors } from '../../../../theme';

const useStyles = makeStyles(({ palette, typography, spacing }) => ({
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '20vh',
        width: '52vw',
        borderRadius: 10,
        padding: 10,
        backgroundColor: palette.primary.light
    },
    icon: {
        color: palette.primary.main
    },
    title: {
        margin: '1% 0px',
        fontSize: '1em',
        fontWeight: typography.fontWeightMedium
    },
    button: {
        width: 120,
        fontSize: typography.caption.fontSize,
        marginTop: spacing(1),
        color: Colors.defaults.white,
        outline: '2px hidden #8DABC4',
        '& :focus': {
            outline: '2px solid #8DABC4',
        }
    }
}));

function UploadFilesPicker(): React.ReactElement {
    const classes = useStyles();
    const { loading, loadPending } = useUploadStore();

    const onDrop = (acceptedFiles: File[]) => {
        loadPending(acceptedFiles);
    };

    return (
        <Dropzone noClick noDrag={loading} onDrop={onDrop}>
            {({ getRootProps, getInputProps, open }) => (
                <div className={classes.container} {...getRootProps()}>
                    <BsCloudUpload className={classes.icon} size='25%' />
                    <input {...getInputProps()} />
                    <Typography className={classes.title}>Drag and drop files here</Typography>
                    <Typography variant='caption'>or</Typography>
                    <Button className={classes.button} color='primary' variant='contained' onClick={open} disabled={loading} disableElevation>
                        Browse files
                    </Button>
                </div>
            )}
        </Dropzone>
    );
}

export default UploadFilesPicker;