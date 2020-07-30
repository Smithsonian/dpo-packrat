import React, { useCallback, useContext } from 'react';
import { Button, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { UPLOAD_FILE_TYPES } from '../../../../constants';

import Dropzone from 'react-dropzone';
import { BsCloudUpload } from 'react-icons/bs';
import { Colors } from '../../../../theme';
import useFilesUpload from '../../hooks/useFilesUpload';
import { toast } from 'react-toastify';
import { AppContext } from '../../../../context';

const useStyles = makeStyles(({ palette, typography, spacing }) => ({
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '32vh',
        width: '40vw',
        border: `1px dashed ${palette.primary.main}`,
        borderRadius: 10,
        backgroundColor: palette.primary.light
    },
    icon: {
        color: palette.primary.main
    },
    title: {
        margin: '2% 0px',
        fontSize: '1.2em',
        fontWeight: typography.fontWeightMedium
    },
    button: {
        width: 120,
        fontSize: typography.caption.fontSize,
        marginTop: spacing(1),
        color: Colors.defaults.white
    },
}));

function IngestionFilesPicker(): React.ReactElement {
    const classes = useStyles();
    const { ingestion } = useContext(AppContext);
    const { transfer: { uploading, failed } } = ingestion;

    const { onChange, onSubmit } = useFilesUpload();

    const onDrop = useCallback((acceptedFiles: File[]) => {
        let filesAllowed: boolean = true;

        acceptedFiles.forEach((acceptedFile: File) => {
            const { type } = acceptedFile;
            const [ext] = type.split('/').splice(-1);

            if (!UPLOAD_FILE_TYPES.includes(ext)) {
                filesAllowed = false;
                toast.error(`*.${ext} file type is not allowed`);
            }
        });

        if (filesAllowed) {
            onChange(acceptedFiles);
        }
    }, [onChange]);

    const hasError = !!failed.size;

    return (
        <Dropzone noClick noDrag={uploading} onDrop={onDrop}>
            {({ getRootProps, getInputProps, open }) => (
                <div className={classes.container} {...getRootProps()}>
                    <BsCloudUpload className={classes.icon} size='25%' />
                    <input {...getInputProps()} />
                    <Typography className={classes.title}>Drag and drop files here</Typography>
                    <Typography>or</Typography>
                    <Button
                        className={classes.button}
                        color='primary'
                        variant='contained'
                        onClick={open}
                        disabled={uploading}
                        disableElevation
                    >
                        Browse files
                    </Button>
                    <Button
                        className={classes.button}
                        color='primary'
                        variant='contained'
                        onClick={onSubmit}
                        disableElevation
                    >
                        {uploading ? 'Uploading...' : hasError ? 'Retry' : 'Upload'}
                    </Button>
                </div>
            )}
        </Dropzone>
    );
}


export default IngestionFilesPicker;