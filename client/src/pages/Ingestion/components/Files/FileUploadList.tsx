import React, { useContext } from 'react';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { colorWithOpacity } from '../../../../theme/colors';
import { AppContext, TRANSFER_ACTIONS, INGESTION_TRANSFER_STATUS, FileId, IngestionFile } from '../../../../context';
import FileUploadListItem from './FileUploadListItem';
import { toast } from 'react-toastify';

const useStyles = makeStyles(({ palette, breakpoints }) => ({
    container: {
        display: 'flex',
        flexDirection: 'column',
        marginTop: 20,
        flex: 1,
        maxHeight: '40vh',
        width: '40vw',
        overflow: 'scroll',
        [breakpoints.up('lg')]: {
            maxHeight: '50vh',
        }
    },
    item: {
        display: 'flex',
        padding: '0px 20px',
        minHeight: 50,
        alignItems: 'center',
        backgroundColor: colorWithOpacity(palette.primary.light, 66),
        marginBottom: 10,
        borderRadius: 5,
    },
    itemName: {
        display: 'flex',
        flex: 2,
    },
    itemSize: {
        display: 'flex',
        flex: 1,
        color: palette.grey[600]
    },
    itemOptions: {
        display: 'flex',
        flex: 1,
        justifyContent: 'flex-end',
        color: palette.error.main
    },
}));

function FileUploadList(): React.ReactElement {
    const classes = useStyles();
    const { ingestion, ingestionDispatch } = useContext(AppContext);
    const { transfer } = ingestion;
    const { files, current, uploaded, failed, status } = transfer;

    return (
        <Box className={classes.container}>
            {files.map(({ id, data: { name, size } }, index) => {
                const uploading = current?.id === id ?? false;
                const complete = uploaded.has(id);
                const failure = failed.has(id);
                const progress = transfer.progress.get(id) || 0;

                const onRemove = (id: number): void => {
                    if (status !== INGESTION_TRANSFER_STATUS.PROCESSING) {
                        const failedUploads = new Map<FileId, IngestionFile>(failed);
                        if (failedUploads.has(id)) {
                            failedUploads.delete(id);
                        }

                        ingestionDispatch({ type: TRANSFER_ACTIONS.REMOVE_FILE, id, failed: failedUploads });
                    } else {
                        toast.info('Please wait for current uploads to be finished');
                    }
                };

                return (
                    <FileUploadListItem
                        key={index}
                        name={name}
                        size={size}
                        uploading={uploading}
                        complete={complete}
                        failure={failure}
                        progress={progress}
                        onRemove={onRemove}
                    />
                );
            })}
        </Box>
    );
}

export default FileUploadList;