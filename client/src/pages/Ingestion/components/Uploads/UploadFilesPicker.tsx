import { Button, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useContext } from 'react';
import Dropzone from 'react-dropzone';
import { BsCloudUpload } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { UPLOAD_FILE_TYPES } from '../../../../constants';
import { Colors } from '../../../../theme';
import useFilesUpload from '../../hooks/useFilesUpload';
import { AppContext } from '../../../../context';

const useStyles = makeStyles(({ palette, typography, spacing }) => ({
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '20vh',
        width: '50vw',
        border: `1px dashed ${palette.primary.main}`,
        borderRadius: 10,
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
        color: Colors.defaults.white
    },
}));

function UploadFilesPicker(): React.ReactElement {
    const classes = useStyles();
    const { ingestion: { uploads: { loading } } } = useContext(AppContext);
    const { loadFiles } = useFilesUpload();

    const onDrop = (acceptedFiles: File[]) => {
        const checkedFiles: File[] = acceptedFiles.filter((acceptedFile: File) => {
            const { type } = acceptedFile;
            const [ext] = type.split('/').splice(-1);

            const isAllowed = UPLOAD_FILE_TYPES.includes(ext);

            if (!isAllowed) {
                toast.error(`*.${ext} file type is not allowed`);
                return false;
            }

            return true;
        });

        loadFiles(checkedFiles);
    };

    return (
        <Dropzone noClick noDrag={loading} onDrop={onDrop}>
            {({ getRootProps, getInputProps, open }) => (
                <div className={classes.container} {...getRootProps()}>
                    <BsCloudUpload className={classes.icon} size='25%' />
                    <input {...getInputProps()} />
                    <Typography className={classes.title}>Drag and drop files here</Typography>
                    <Typography variant='caption'>or</Typography>
                    <Button
                        className={classes.button}
                        color='primary'
                        variant='contained'
                        onClick={open}
                        disabled={loading}
                        disableElevation
                    >
                        Browse files
                    </Button>
                </div>
            )}
        </Dropzone>
    );
}


export default UploadFilesPicker;