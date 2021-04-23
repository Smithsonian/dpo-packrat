/**
 * UploadList
 *
 * This component renders upload list for pending files only.
 */
import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { FieldType } from '../../../../components';
import { useUploadStore } from '../../../../store';
import { scrollBarProperties } from '../../../../utils/shared';
import FileList from './FileList';
import UploadListHeader from './UploadListHeader';
import UploadFilesPicker from './UploadFilesPicker';

export const useUploadListStyles = makeStyles(({ palette, breakpoints }) => ({
    container: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        marginTop: 20,
        maxHeight: 'auto',
        width: '52vw',
        border: `1px dashed ${palette.primary.main}`
    },
    list: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '16vh',
        maxHeight: '16vh',
        'overflow-y': 'auto',
        'overflow-x': 'hidden',
        width: '100%',
        ...scrollBarProperties(true, false, palette.text.disabled),
        [breakpoints.down('lg')]: {
            minHeight: '20vh',
            maxHeight: '20vh'
        }
    },
    listDetail: {
        textAlign: 'center',
        color: palette.grey[500],
        fontStyle: 'italic',
        marginTop: '8%'
    }
}));

function UploadList(): React.ReactElement {
    const classes = useUploadListStyles();
    const { pending } = useUploadStore();

    return (
        <Box className={classes.container}>
            <FieldType required align='center' label='Upload Files' labelProps={{ style: { fontSize: '1em', fontWeight: 500, margin: '1% 0px', color: 'black' } }}>
                <UploadListHeader />
                <Box className={classes.list}>
                    {!pending.length && (
                        <Typography className={classes.listDetail} variant='body1'>
                            Add files to upload
                        </Typography>
                    )}
                    <FileList files={pending} />
                </Box>
            </FieldType>
            <UploadFilesPicker />
        </Box>
    );
}

export default UploadList;
