import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { FieldType } from '../../../../components';
import { useUpload } from '../../../../store';
import FileList from './FileList';
import UploadListHeader from './UploadListHeader';

export const useUploadListStyles = makeStyles(({ palette, breakpoints }) => ({
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
        minHeight: '16vh',
        maxHeight: '16vh',
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
        },
        [breakpoints.down('lg')]: {
            minHeight: '20vh',
            maxHeight: '20vh',
        }
    },
    listDetail: {
        textAlign: 'center',
        color: palette.grey[500],
        fontStyle: 'italic',
        marginTop: '8%',
        [breakpoints.down('lg')]: {
            marginTop: '10%',
        }
    },
}));

function UploadList(): React.ReactElement {
    const classes = useUploadListStyles();
    const { pending } = useUpload();

    return (
        <Box className={classes.container}>
            <FieldType required align='center' label='Upload files'>
                <UploadListHeader />
                <Box className={classes.list}>
                    {!pending.length && <Typography className={classes.listDetail} variant='body1'>Add files to upload</Typography>}
                    <FileList files={pending} />
                </Box>
            </FieldType>
        </Box>

    );
}

export default UploadList;