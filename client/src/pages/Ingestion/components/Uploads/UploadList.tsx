/* eslint-disable react/jsx-max-props-per-line */
/* eslint-disable react-hooks/exhaustive-deps */

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
import { eIngestionMode } from '../../../../constants';

export const useUploadListStyles = makeStyles(({ palette, typography, spacing }) => ({
    container: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        //marginTop: 20,
        //marginBottom: 40,
        //border: `1px dashed ${palette.primary.main}`
        padding: '0',
    },
    list: {
        display: 'flex',
        //flexDirection: 'column',
        alignItems: 'center',
        //minHeight: '16vh',
        //height: '25vh',
        'overflow-y': 'auto',
        'overflow-x': 'hidden',
        border: '2px dashed #58AFFF',
        padding: '.5em',
        margin: '1em 0',
        //width: 'calc(100% - 20px)',
        ...scrollBarProperties(true, false, palette.text.disabled),
        '&:hover': {
            backgroundColor: '##fffead'
        },
    },
    listDetail: {
        textAlign: 'center',
        color: palette.grey[500],
        fontStyle: 'italic',
        marginTop: '8%'
    },
    icon: {
        color: palette.primary.main,
        paddingRight: '1em'
    },
    button: {
        width: 120,
        fontSize: typography.caption.fontSize,
        marginTop: spacing(1),
        color: Colors.defaults.white,
        '&:focus': {
            outline: '2px solid #8DABC4',
        },
        outline: '2px hidden #8DABC4'
    },
    title: {
        //margin: '1% 0px',
        fontSize: '.8em',
    },
    subtitle: {
        //margin: '1% 0px',
        fontSize: '.8em',
        color: '#878585',
        //marginBottom: '2.5em'
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
        <div>
            <Box className={classes.container}>
                <FieldType
                    required
                    align='left'
                    label='1. Upload Files.'
                    labelProps={{ style: { fontSize: '1em', fontWeight: 500, margin: '1% 0px', color: Colors.defaults.dark, backgroundColor: 'none' } }}
                    //width={'calc(100% - 20px)'}
                    //padding='10px'
                >
                    <Box className={classes.list}>
                        <BsCloudUpload className={classes.icon} size='75px' />
                        {/* <Button className={classes.button} color='primary' variant='contained' onClick={open} disabled={loading} disableElevation>
                            Browse files
                        </Button> */}
                        <div>
                            <Typography className='classes.title'>Drag and drop files here or <span onClick={open} style={{ color: '#2C6EEF', fontWeight: 'bold', textDecoration: 'underline', cursor: 'pointer' }}>choose</span> file.</Typography>
                            <Typography className='classes.subtitle'>Supported Formats:  Model Type: obj, ply, stl, x3d, wrl, dae, or fbx*. Textures: jpg, png, tif, tga, bmp</Typography>
                        </div>
                    </Box>
                </FieldType>
            </Box>
            <UploadListHeader />
            <FileList files={pending} uploadPendingList uploadType={eIngestionMode.eIngest} />
        </div>
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
