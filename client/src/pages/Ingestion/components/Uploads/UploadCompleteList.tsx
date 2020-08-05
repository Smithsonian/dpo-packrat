import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useContext } from 'react';
import { FieldType } from '../../../../components';
import { AppContext, FileUploadStatus, IngestionDispatchAction, UPLOAD_ACTIONS } from '../../../../context';
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

function UploadListComplete(): React.ReactElement {
    const classes = useStyles();
    const { ingestion: { uploads }, ingestionDispatch } = useContext(AppContext);
    const { files, loading } = uploads;

    React.useEffect(() => {
        setTimeout(() => {
            // fetch from server, and process here with FETCH_FAILED
            const fetchSuccessAction: IngestionDispatchAction = {
                type: UPLOAD_ACTIONS.FETCH_COMPLETE,
                files: []
            };

            ingestionDispatch(fetchSuccessAction);
        }, 2000);
    }, [ingestionDispatch]);

    const uploadedFiles = files.filter(({ status }) => status === FileUploadStatus.COMPLETE);

    return (
        <Box className={classes.container}>
            <FieldType required>
                <>
                    <UploadListHeader title='Uploaded Files: Select assets to ingest which belong to the same Subject &amp; Item' />
                    <Box className={classes.list}>
                        {loading ?
                            <Typography className={classes.listDetail} variant='body1'>Fetching available files...</Typography>
                            :
                            <>
                                {!uploadedFiles.length && <Typography className={classes.listDetail} variant='body1'>No files available</Typography>}
                                <FileList files={uploadedFiles} />
                            </>
                        }
                    </Box>
                </>
            </FieldType>
        </Box>

    );
}

export default UploadListComplete;