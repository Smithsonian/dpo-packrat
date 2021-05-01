/* eslint-disable react/jsx-max-props-per-line */

/**
 * UploadList
 *
 * This component renders upload list for pending files only.
 */
import { Box, Typography, Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import Dropzone from 'react-dropzone';
import { BsCloudUpload } from 'react-icons/bs';
import { useUploadStore } from '../../../../store';
import { Colors } from '../../../../theme';
import { FieldType } from '../../../../components';
import { scrollBarProperties } from '../../../../utils/shared';
import FileList from './FileList';
import UploadListHeader from './UploadListHeader';

export const useUploadListStyles = makeStyles(({ palette, typography, spacing /*, breakpoints*/ }) => ({
    container: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        marginTop: 20,
        marginBottom: 40,
        border: `1px dashed ${palette.primary.main}`
    },
    list: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '16vh',
        height: '30vh',
        'overflow-y': 'auto',
        'overflow-x': 'hidden',
        width: '100%',
        ...scrollBarProperties(true, false, palette.text.disabled)
        // [breakpoints.down('lg')]: {
        //     minHeight: '20vh',
        //     maxHeight: '20vh'
        // }
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
    button: {
        width: 120,
        fontSize: typography.caption.fontSize,
        marginTop: spacing(1),
        color: Colors.defaults.white
    },
    title: {
        margin: '1% 0px',
        fontSize: '1em',
        fontWeight: typography.fontWeightMedium
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

    return (
        <Box className={classes.container}>
            <FieldType
                required
                align='center'
                label='Upload Files'
                labelProps={{ style: { fontSize: '1em', fontWeight: 500, margin: '1% 0px', color: 'black' } }}
                width={'calc(100% - 20px)'}
            >
                <UploadListHeader />
                <Box className={classes.list}>
                    <FileList files={pending} />
                    <Typography className={classes.title}>Drag and drop files here or click the button</Typography>
                    <BsCloudUpload className={classes.icon} size='50px' />
                    <Button className={classes.button} color='primary' variant='contained' onClick={open} disabled={loading} disableElevation>
                        Browse files
                    </Button>
                </Box>
            </FieldType>
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
                    <input {...getInputProps()} />
                </div>
            )}
        </Dropzone>
    );
}

export default UploadFilesPicker;
