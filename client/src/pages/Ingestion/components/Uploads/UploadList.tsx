import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useContext } from 'react';
import { FieldType } from '../../../../components';
import { AppContext, FileUploadStatus } from '../../../../context';
import FileList from './FileList';
import UploadListHeader from './UploadListHeader';

const useStyles = makeStyles(({ palette, spacing }) => ({
    container: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        marginTop: 20,
        maxHeight: 'auto',
        width: '50vw',
    },
    list: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: 80,
        maxHeight: '20vh',
        'overflow-y': 'auto',
        'overflow-x': 'hidden',
        width: '100%',
        '&::-webkit-scrollbar': {
            '-webkit-appearance': 'none'
        },
        '&::-webkit-scrollbar:vertical': {
            width: 12
        },
        '&::-webkit-scrollbar-thumb': {
            borderRadius: 8,
            border: '2px solid white',
            backgroundColor: palette.text.disabled
        }
    },
    listDetail: {
        textAlign: 'center',
        color: palette.grey[500],
        fontStyle: 'italic',
        marginTop: spacing(4)
    },
}));

function UploadList(): React.ReactElement {
    const classes = useStyles();
    const { ingestion: { uploads } } = useContext(AppContext);
    const { files } = uploads;

    const uploadingFiles = [...files].filter(({ status }) => status !== FileUploadStatus.COMPLETE);

    return (
        <Box className={classes.container}>
            <FieldType required align='center' label='Uploading files'>
                <UploadListHeader />
                <Box className={classes.list}>
                    {!uploadingFiles.length && <Typography className={classes.listDetail} variant='body1'>Add files to upload</Typography>}
                    <FileList files={uploadingFiles} />
                </Box>
            </FieldType>
        </Box>

    );
}

export default UploadList;