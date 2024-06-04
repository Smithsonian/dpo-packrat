/* eslint-disable react/jsx-max-props-per-line */
/* eslint-disable react-hooks/exhaustive-deps */

/**
 * UploadList
 *
 * This component renders upload list for pending files only.
 */
import { Box, Typography, Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useState, useEffect } from 'react';
import Dropzone from 'react-dropzone';
import { BsCloudUpload } from 'react-icons/bs';
import { useUploadStore } from '../../../../store';
import { Colors } from '../../../../theme';
import { FieldType } from '../../../../components';
import { scrollBarProperties } from '../../../../utils/shared';
import FileList from './FileList';
import UploadListHeader from './UploadListHeader';
import { eIngestionMode } from '../../../../constants';

export const useUploadListStyles = makeStyles(({ palette, typography }) => ({
    container: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        background: '0',
        overflow: 'hidden'
    },
    list: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '16vh',
        maxHeight: '25vh',
        'overflow-y': 'auto',
        'overflow-x': 'hidden',
        // width: '100%',
        padding: '0px 10px',
        ...scrollBarProperties(true, false, palette.text.disabled)
    },
    listEmpty: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '16vh',
        maxHeight: '25vh',
        padding: '10px 10px',
    },
    listDetail: {
        textAlign: 'center',
        color: palette.grey[500],
        fontStyle: 'italic',
        marginTop: '8%'
    },
    icon: {
        color: palette.primary.main
    },
    listFooter: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-end'
    },
    button: {
        width: 120,
        fontSize: typography.caption.fontSize,
        margin: '0.5rem',
        color: Colors.defaults.white,
        '&:focus': {
            outline: '2px solid #8DABC4',
        },
        outline: '2px hidden #8DABC4'
    },
    title: {
        margin: '1rem 0px',
        fontSize: '0.75rem',
        fontWeight: 500
    },
    uploadNotice: {
        padding: 2,
        textAlign: 'center',
        color: palette.secondary.contrastText,
        backgroundColor: palette.secondary.main,
        borderRadius: '2rem 2rem 0px 0px',
        border: `1px solid ${palette.secondary.dark}`,
        borderBottom: '0'
    }
}));

type UploadListProps = {
    loading: boolean;
    open: () => void;
};

function UploadList(props: UploadListProps): React.ReactElement {
    const classes = useUploadListStyles();
    const { pending } = useUploadStore();
    const { loading, open } = props;

    const [showUploadNotice, setShowUploadNotice] = useState<boolean>(true);
    const [isListEmpty, setIsListEmpty] = useState<boolean>(true);

    useEffect(() => {
        // if an empty array return false ('every' returns true if empty)
        // otherwise check for any item to be either processing or uploading
        const hasPending: boolean = (pending.length > 0) && pending.some(
            (item) => item.status === 'PROCESSING' || item.status === 'UPLOADING'
        );
        // console.log(`UploadList.pending (state: ${hasPending} [${pending.length}] | ${JSON.stringify(pending)})`);
        setShowUploadNotice(hasPending);

        // mark whether the list is empty or not
        setIsListEmpty(pending.length<=0);
    }, [pending, loading]);

    return (
        <Box className={classes.container}>
            <FieldType
                required
                align='center'
                label='Upload Files'
                labelProps={{ style: { fontSize: '1em', fontWeight: 500, margin: '1% 0px', color: Colors.defaults.dark } }}
                width={'calc(100% - 20px)'}
            >
                <UploadListHeader />
                {isListEmpty ? (
                    <Box className={classes.listEmpty}>
                        <BsCloudUpload className={classes.icon} size='50px' />
                        <Typography className={classes.title}><u>DRAG AND DROP</u> files here or click the <u>BROWSE</u> button below.</Typography>
                    </Box>
                ): (
                    <Box className={classes.list}>
                        <FileList files={pending} uploadPendingList uploadType={eIngestionMode.eIngest} />
                    </Box>
                )}
                <Box className={classes.listFooter}>
                    <Button className={classes.button} color='primary' variant='contained' onClick={open} disabled={loading} disableElevation>
                        Browse files
                    </Button>
                </Box>
            </FieldType>
            {showUploadNotice && (
                <Box className={classes.uploadNotice}>
                    <Typography><strong>NOTE:</strong> Please do not leave this page until your file(s) finish uploading and they show in the box below.</Typography>
                </Box>
            )}
        </Box>
    );
}

function UploadFilesPicker(): React.ReactElement {
    const { loading, loadPending } = useUploadStore();

    const onDrop = (acceptedFiles: File[]) => {
        loadPending(acceptedFiles);
    };

    return (
        <Dropzone noClick noDrag={loading} onDrop={onDrop}>
            {({ getRootProps, getInputProps, open }) => (
                <div {...getRootProps()}>
                    <UploadList loading={loading} open={open} />
                    <input title='File Uploader' {...getInputProps()} />
                </div>
            )}
        </Dropzone>
    );
}

export default UploadFilesPicker;
